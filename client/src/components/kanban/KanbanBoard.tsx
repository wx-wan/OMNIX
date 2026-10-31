import { useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

export type KanbanPriority = "low" | "medium" | "high";

export interface KanbanAssignee {
  name: string;
  initials: string;
}

export interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  tag?: string;
  priority?: KanbanPriority;
  assignee?: KanbanAssignee;
  /** 金额（如 "¥86,000"），CRM 交易卡展示用，可选。 */
  amount?: string;
  meta?: string;
}

export interface KanbanStage {
  id: string;
  title: string;
  /** 阶段强调色（任意 tailwind 背景类，如 "bg-sky-500"）。缺省用品牌黄。 */
  accent?: string;
  items: KanbanItem[];
}

const priorityClasses: Record<KanbanPriority, string> = {
  high: "bg-red-500/10 text-red-500",
  medium: "bg-amber-500/15 text-amber-600",
  low: "bg-emerald-500/10 text-emerald-600",
};

const priorityKey: Record<KanbanPriority, string> = {
  high: "kanban.priorityHigh",
  medium: "kanban.priorityMedium",
  low: "kanban.priorityLow",
};

function KanbanCard({
  item,
  draggable,
  onDragStart,
}: {
  item: KanbanItem;
  draggable?: boolean;
  onDragStart?: (e: DragEvent) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <p className="text-sm font-medium text-foreground">{item.title}</p>
      {item.amount && (
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{item.amount}</p>
      )}
      {item.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {item.priority && (
            <span
              className={cn(
                "rounded-4xl px-2 py-0.5 text-[11px] font-medium",
                priorityClasses[item.priority],
              )}
            >
              {t(priorityKey[item.priority])}
            </span>
          )}
          {item.tag && <Badge variant="secondary">{item.tag}</Badge>}
        </div>
        {item.assignee && (
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-medium text-primary"
            title={item.assignee.name}
          >
            {item.assignee.initials}
          </span>
        )}
      </div>
      {item.meta && (
        <p className="mt-2 text-[11px] text-muted-foreground">{item.meta}</p>
      )}
    </div>
  );
}

/** 看板 / 阶段流：阶段列承载事项卡片。
 *  - fill：列等分铺满容器（无横向滚动）；否则固定宽可横向滚动。
 *  - draggable + onDealMove：开启拖拽流转（默认关闭，由调用方按配置传入）。展示型优先。 */
export function KanbanBoard({
  stages,
  fill = false,
  className,
  draggable = false,
  onDealMove,
}: {
  stages: KanbanStage[];
  fill?: boolean;
  className?: string;
  draggable?: boolean;
  onDealMove?: (dealId: string, toStageId: string) => void;
}) {
  const { t } = useTranslation();
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-2", className)}>
      {stages.map((stage) => (
        <div
          key={stage.id}
          onDragOver={
            draggable
              ? (e) => {
                  e.preventDefault();
                  setDragOverStage(stage.id);
                }
              : undefined
          }
          onDragLeave={
            draggable ? () => setDragOverStage((s) => (s === stage.id ? null : s)) : undefined
          }
          onDrop={
            draggable
              ? (e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  setDragOverStage(null);
                  if (id) onDealMove?.(id, stage.id);
                }
              : undefined
          }
          className={cn(
            "flex flex-col rounded-2xl bg-card shadow-card",
            fill ? "min-w-0 flex-1" : "w-72 shrink-0",
            dragOverStage === stage.id && "ring-2 ring-primary",
          )}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", stage.accent ?? "bg-primary")} />
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {stage.title}
              </h3>
            </div>
            <span className="rounded-4xl bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {stage.items.length}
            </span>
          </div>
          <div className="flex flex-col gap-2 px-3 pb-3">
            {stage.items.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                {t("kanban.empty")}
              </p>
            ) : (
              stage.items.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  draggable={draggable}
                  onDragStart={
                    draggable
                      ? (e) => {
                          e.dataTransfer.setData("text/plain", item.id);
                          e.dataTransfer.effectAllowed = "move";
                        }
                      : undefined
                  }
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
