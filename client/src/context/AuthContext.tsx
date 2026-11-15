import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  authApi,
  notifyIfUnauthorized,
  SESSION_EXPIRED_EVENT,
  type AuthUser,
  type PresenceStatus,
} from "@/api/auth";

interface PresenceEntry {
  id: string;
  status: PresenceStatus;
  lastActiveAt: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
  /** 重新向后端确认会话；失效时清空登录态，由登录墙统一送回 /login。 */
  revalidate: (force?: boolean) => Promise<void>;
  /** 所有成员的在线状态，由后端 SSE 广播，前端只读。 */
  presence: Record<string, PresenceStatus>;
  /** 当前用户自己的状态（登录默认 online）。 */
  myPresence: PresenceStatus;
  /** 用户手动切换自己的状态（如「请勿打扰」），写入后端并广播给所有端。 */
  setMyPresence: (status: PresenceStatus) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACTIVITY_EVENTS = ["pointermove", "keydown", "mousedown", "touchstart", "scroll"] as const;
/** 活动心跳最小间隔：避免每次鼠标移动都打接口。 */
const HEARTBEAT_THROTTLE_MS = 30 * 1000;
/** 会话复核最小间隔：避免每次导航都打接口。 */
const REVALIDATE_THROTTLE_MS = 20 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [presence, setPresence] = useState<Record<string, PresenceStatus>>({});
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastRevalidateRef = useRef(0);
  /** 仅最后一次复核的结果生效，避免并发响应把已失效的会话错误恢复。 */
  const revalidateSeqRef = useRef(0);

  const applyEntries = useCallback((entries: PresenceEntry[]) => {
    setPresence(
      Object.fromEntries(entries.map((entry) => [entry.id, entry.status])) as Record<
        string,
        PresenceStatus
      >,
    );
  }, []);

  /** 会话复核：后端 401 时清空登录态；后端不可达时保持现状，避免误踢。
   *  force 用于路由导航（必须确认登录态），窗口聚焦等后台校验走节流。 */
  const revalidate = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastRevalidateRef.current < REVALIDATE_THROTTLE_MS) return;
    lastRevalidateRef.current = now;
    const seq = ++revalidateSeqRef.current;
    try {
      const next = await authApi.me();
      if (seq !== revalidateSeqRef.current) return;
      setUser((current) => {
        // 会话已失效：清空登录态，登录墙随即送回 /login。
        if (!next) return null;
        // 仍有效但本地为空（如跨标签登录）：补上登录态。
        if (!current) return next;
        // 同一用户：保留原引用，避免每次导航触发全应用重渲染与 SSE 重连。
        return current.id === next.id ? current : next;
      });
    } catch {
      // 网络抖动或后端暂不可达：保留当前登录态，下次导航再复核。
    }
  }, []);

  /** 首次加载：向后端确认登录态，未登录则 user 保持 null。 */
  useEffect(() => {
    let alive = true;
    authApi
      .me()
      .then((next) => {
        if (alive) setUser(next);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) {
          lastRevalidateRef.current = Date.now();
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  /** 任意受保护接口返回 401：立即清空登录态，登录墙随即重定向。 */
  useEffect(() => {
    const onExpired = () => {
      revalidateSeqRef.current += 1;
      setUser(null);
      setPresence({});
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  /** 窗口重新可见 / 获得焦点时复核会话，覆盖休眠、跨标签登出等场景。 */
  useEffect(() => {
    if (!user) return;
    const check = () => {
      if (document.visibilityState === "visible") void revalidate();
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [user?.id, revalidate]);

  /** SSE：登录后订阅后端状态流，任一应用端的状态变化都会即时同步到本端。 */
  useEffect(() => {
    if (!user) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setPresence({});
      return;
    }

    const source = new EventSource("/api/presence/stream", { withCredentials: true });
    source.onmessage = (event) => {
      try {
        applyEntries(JSON.parse(event.data) as PresenceEntry[]);
      } catch {
        // 忽略偶发的非法帧，等待下一帧全量快照
      }
    };
    eventSourceRef.current = source;

    // 断线兜底：先拉一次快照，避免 SSE 建连前状态空白。
    void fetch("/api/presence", { credentials: "include" })
      .then((res) => {
        notifyIfUnauthorized(res);
        return res.ok ? res.json() : [];
      })
      .then((entries) => applyEntries(entries as PresenceEntry[]))
      .catch(() => undefined);

    return () => {
      source.close();
      if (eventSourceRef.current === source) eventSourceRef.current = null;
    };
  }, [user?.id, applyEntries]);

  /** 活动心跳：用户有操作时上报，后端据此判定「长时间没有操作」自动离开。 */
  useEffect(() => {
    if (!user) return;
    let lastSent = 0;

    const beat = () => {
      const now = Date.now();
      if (now - lastSent < HEARTBEAT_THROTTLE_MS) return;
      lastSent = now;
      void fetch("/api/presence/heartbeat", {
        method: "POST",
        credentials: "include",
      })
        .then(notifyIfUnauthorized)
        .catch(() => undefined);
    };

    // 登录完成立即上报一次，确保从离线/离开恢复为登录态。
    beat();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, beat, { passive: true }),
    );
    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, beat));
    };
  }, [user?.id]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const next = await authApi.login(email, password, remember);
    revalidateSeqRef.current += 1;
    lastRevalidateRef.current = Date.now();
    setUser(next);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const next = await authApi.register(name, email, password);
    revalidateSeqRef.current += 1;
    lastRevalidateRef.current = Date.now();
    setUser(next);
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      revalidateSeqRef.current += 1;
      setUser(null);
      setPresence({});
      lastRevalidateRef.current = Date.now();
    }
  }, []);

  const setMyPresence = useCallback(async (status: PresenceStatus) => {
    const res = await fetch("/api/presence/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    notifyIfUnauthorized(res);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    applyEntries((await res.json()) as PresenceEntry[]);
  }, [applyEntries]);

  const myPresence = user ? (presence[user.id] ?? "online") : "offline";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      register,
      updateUser,
      logout,
      revalidate,
      presence,
      myPresence,
      setMyPresence,
    }),
    [
      user,
      loading,
      login,
      register,
      updateUser,
      logout,
      revalidate,
      presence,
      myPresence,
      setMyPresence,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
