import { Navigate, useLocation } from "react-router-dom";
import { type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

/** 受保护路由：未登录重定向到 /login（记住来源），登录态加载中显示全屏 spinner。 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center bg-canvas">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
