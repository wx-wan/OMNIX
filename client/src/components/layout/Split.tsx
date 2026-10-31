import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 双栏布局：主区 + 侧栏，桌面并排、移动端上下堆叠。 */
export function Split({
  main,
  aside,
  asideClassName,
  className,
}: {
  main: ReactNode;
  aside: ReactNode;
  asideClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6 lg:flex-row lg:items-start", className)}>
      <div className="min-w-0 flex-1">{main}</div>
      <aside className={cn("lg:w-80 lg:shrink-0", asideClassName)}>{aside}</aside>
    </div>
  );
}
