import { useEffect, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/context/AuthContext";

export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
    </div>
  );
}

/**
 * 登录墙：整个主应用（含 / 主页）都要求登录态，未登录一律重定向 /login。
 * 每次导航都向后端复核会话，避免 session 过期后仍停留在受保护页面。
 */
export default function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { user, loading, revalidate } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) void revalidate(true);
  }, [location.pathname, location.search, loading, user?.id, revalidate]);

  if (loading) return <AuthLoading />;

  // 按既定需求登录后固定回主页，不回跳来源页。
  if (!user) return <Navigate to="/login" replace />;

  // 传 children 时直接渲染布局（布局内部仍是 <Outlet />）；否则作为路径守卫渲染 Outlet。
  return children ? <>{children}</> : <Outlet />;
}
