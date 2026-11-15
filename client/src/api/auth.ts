/**
 * PMS 认证接口：浏览器一律走 Vite 同源反代 /api（cookie 由后端下发到 5173 域）。
 * 后端是 express-session + connect-pg-simple，无 JWT；/auth/me 401 表示未登录。
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string;
  createdAt?: string;
  presence?: PresenceStatus;
}

/** 在线状态：登录态 / 长时间无操作 / 用户手动请勿打扰 / 离线，均由后端维护。 */
export type PresenceStatus = "online" | "away" | "busy" | "offline";

/** 会话失效事件：任意受保护接口返回 401 时通知全局，统一退回登录页。 */
export const SESSION_EXPIRED_EVENT = "pms:session-expired";

export function notifyIfUnauthorized(res: Response): void {
  if (res.status === 401) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const message = body?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string" && message) return message;
  } catch {
    // 非 JSON 错误响应（例如代理 500）回落到状态码
  }
  return `Request failed (${res.status})`;
}

/** 登录/注册接口本身就会返回 401（密码错误），不能误判为会话过期。 */
const AUTH_PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/logout",
];

async function assertOk(res: Response, path: string): Promise<void> {
  if (res.ok) return;
  if (!AUTH_PUBLIC_PATHS.includes(path)) notifyIfUnauthorized(res);
  throw new Error(await readError(res));
}

async function jsonRequest<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  await assertOk(res, path);
  return (await res.json()) as T;
}

export const authApi = {
  /** 401 视为未登录；其它失败（后端未启动等）抛错。 */
  async me(): Promise<AuthUser | null> {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.status === 401) return null;
    await assertOk(res, "/api/auth/me");
    return (await res.json()) as AuthUser;
  },
  login: (email: string, password: string, remember: boolean) =>
    jsonRequest<AuthUser>("/api/auth/login", { email, password, remember }),
  register: (name: string, email: string, password: string) =>
    jsonRequest<AuthUser>("/api/auth/register", { name, email, password }),
  async updateProfile(patch: { name?: string; avatarUrl?: string }): Promise<AuthUser> {
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await assertOk(res, "/api/auth/me");
    return (await res.json()) as AuthUser;
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    await assertOk(res, "/api/auth/password");
  },
  logout: () => jsonRequest<{ ok: boolean }>("/api/auth/logout"),
};
