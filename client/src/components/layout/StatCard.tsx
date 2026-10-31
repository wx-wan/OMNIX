import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "flat";

/** 指标浮岛卡：标签 + 数值 + 涨跌 + 图标，仪表盘首屏标配。 */
export function StatCard({
  label,
  value,
  delta,
  trend = "flat",
  icon: Icon,
  children,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  trend?: Trend;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-5 text-card-foreground shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {delta && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend === "down"
                  ? "text-destructive"
                  : trend === "up"
                    ? "text-emerald-600"
                    : "text-muted-foreground",
              )}
            >
              {delta}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
