import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * 全站统一「大弹窗」：基于 shadcn Dialog，固定 1024×800（受视口钳制），
 * 三段式布局——标题头 / 可伸展内容区 / 底部操作栏。内容区默认撑满，
 * 表格类内容传 fill 即可铺满整个弹窗。以后所有大弹窗统一复用本组件。
 */
export function LargeDialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  triggerLabel,
  triggerClassName,
  footer,
  children,
  className,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** 触发器内容（如图标 + 数量角标）；不传则无触发器，由外部控制 open。 */
  trigger?: ReactNode;
  triggerLabel?: string;
  triggerClassName?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger !== undefined ? (
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={triggerLabel}
              title={triggerLabel}
              className={cn("relative size-7", triggerClassName)}
            />
          }
        >
          {trigger}
        </DialogTrigger>
      ) : null}
      <DialogContent
        className={cn(
          "flex h-[min(800px,calc(100vh-2rem))] w-[min(1024px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0!",
          className
        )}
        style={{
          // 皮肤 CSS 用 .style-vega .cn-dialog-content{display:grid;max-width:...}（0,2,0）
          // 覆盖工具类，这里用内联样式强制三段式 flex 列布局与大弹窗尺寸。
          display: "flex",
          flexDirection: "column",
          maxWidth: "min(1024px, calc(100vw - 2rem))",
        }}
      >
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">{children}</div>
        {footer ? (
          <DialogFooter className="mx-0! mb-0! shrink-0 flex-row justify-end gap-2 border-t border-border bg-muted/50 px-6 py-3">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
