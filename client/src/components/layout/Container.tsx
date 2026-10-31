import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
} as const;

/** 内容容器：居中 + 响应式水平内边距。island 布局的页面宽度锚点。 */
export function Container({
  size = "lg",
  className,
  children,
}: {
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 md:px-6", SIZES[size], className)}>
      {children}
    </div>
  );
}
