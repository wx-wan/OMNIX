import { cn } from "@/lib/utils";
import SpinnerBars from "./spinner-06";

/**
 * 全站统一加载态：Spinner-06 - Bars（三条跳动加载条）。
 * 页面内容区用默认（min-h-40）；路由 / 应用级 fallback 传 fullScreen。
 */
export default function Loading({
  fullScreen = false,
  className,
}: {
  fullScreen?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "flex items-center justify-center text-muted-foreground",
        fullScreen ? "min-h-screen" : "min-h-40",
        className,
      )}
    >
      <SpinnerBars />
    </div>
  );
}
