import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * 页面元信息：portal 到顶栏左侧 #header-actions。
 * 渲染「返回(可选) + 标题 + 小副标题 + 主操作」，与右侧全局控件分居顶栏两侧。
 * 全站统一：每个页面的标题/主操作都走这里，不再散落在内容区。
 */
export function PageMeta({
  title,
  description,
  back,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: () => void;
  actions?: ReactNode;
  className?: string;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setContainer(document.getElementById("header-actions"));
  }, []);
  if (!container) return null;
  return createPortal(
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      {back && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={back}
          aria-label="back"
        >
          <ArrowLeft className="size-4" />
        </Button>
      )}
      <h1 className="shrink-0 truncate text-sm font-semibold leading-none tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="hidden truncate text-xs text-muted-foreground md:inline">{description}</p>
      )}
      {actions && (
        <div className="ml-2 flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>,
    container,
  );
}
