import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** island 核心构件：白卡浮岛，带可选标题/描述/图标/操作头的区块容器。 */
export function Section({
  title,
  description,
  icon: Icon,
  action,
  noPadding = false,
  bodyClassName,
  className,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  noPadding?: boolean;
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  const hasHeader = title || description || action || Icon;
  return (
    <section
      className={cn(
        "rounded-2xl bg-card text-card-foreground shadow-card",
        className,
      )}
    >
      {hasHeader && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && <Icon className="size-5 shrink-0 text-muted-foreground" />}
            <div className="min-w-0">
              {title && (
                <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
              )}
              {description && (
                <p className="truncate text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(!noPadding && "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
