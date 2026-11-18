import { cn } from "@/lib/utils";
import SpinnerBars from "@/components/shadcn-dashboard/spinner/spinner-06";

/**
 * 兼容导出：全站加载动画统一为 Spinner-06 - Bars。
 * 保留 ui/Spinner 名称，视觉委托给唯一实现，避免第二套 spinner。
 */
function Spinner({ className }: { className?: string }) {
  return (
    <span role="status" aria-label="Loading" className={cn("inline-flex", className)}>
      <SpinnerBars />
    </span>
  );
}

export { Spinner };
