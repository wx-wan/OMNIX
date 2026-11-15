import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { AuthLoading } from "./ProtectedRoute";

/** 已登录用户不应再看到登录/注册页，直接回主页。 */
export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
}
