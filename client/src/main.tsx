import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import "./index.css";
import "./i18n";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        {/* 不开 closeButton：sonner 的关闭钮悬在 toast 左上角外沿，短消息下像游离的杂点；自动消失 + 滑动关闭已够用 */}
        <Toaster position="top-center" />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
