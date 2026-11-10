import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
} as const;

/** 内容容器：只定宽度上限（size="full" 时铺满）。
 *  水平 gutter 由 AppShell 的 main 统一提供，避免常规页面与全幅页面各自叠加内边距。 */
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
    <div className={cn("mx-auto w-full", SIZES[size], className)}>
      {children}
    </div>
  );
}
