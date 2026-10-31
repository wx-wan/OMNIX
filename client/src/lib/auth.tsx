import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    api
      .get<AuthUser>("/auth/me")
      .then((r) => {
        setUser(r.data);
        setStatus("authenticated");
      })
      .catch(() => {
        setUser(null);
        setStatus("unauthenticated");
      });
  }, []);

  const login = async (email: string, password: string) => {
    const r = await api.post<AuthUser>("/auth/login", { email, password });
    setUser(r.data);
    setStatus("authenticated");
  };

  const register = async (email: string, name: string, password: string) => {
    const r = await api.post<AuthUser>("/auth/register", { email, name, password });
    setUser(r.data);
    setStatus("authenticated");
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    setStatus("unauthenticated");
  };

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function userInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // 中文取首字，拉丁文取名/姓首字母
  if (/[一-龥]/.test(trimmed[0])) return trimmed.slice(0, 1);
  const parts = trimmed.split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
