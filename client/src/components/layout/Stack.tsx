import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 4px 基数刻度：4 / 8 / 12 / 16 / 20 / 24 / 32。紧组用前半段，分组留白用后半段。 */
const GAP = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
} as const;

/** 纵向堆叠：等距垂直间距，island 页面的主干流。 */
export function Stack({
  gap = 4,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { gap?: keyof typeof GAP }) {
  return (
    <div className={cn("flex flex-col", GAP[gap], className)} {...props}>
      {children}
    </div>
  );
}
