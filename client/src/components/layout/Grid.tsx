import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 自适应网格：基于 auto-fill + minmax，列宽到最小阈值自动换行，天然响应式。 */
export function Grid({
  min = "16rem",
  gap = "1rem",
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  min?: string;
  gap?: string;
}) {
  return (
    <div
      className={cn("grid", className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}, 100%), 1fr))`,
        gap,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
