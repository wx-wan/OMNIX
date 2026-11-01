import { useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

export type KanbanPriority = "low" | "medium" | "high";

export interface KanbanAssignee {
  name: string;
  initials: string;
}

/** 卡片可展示的字段（按阶段定制内容的原子单元）。 */
export type CardField =
  | "title"
  | "amount"
  | "description"
  | "source"
  | "createdAt"
  | "assignee"
  | "priority"
  | "tag"
  | "meta";

export interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  tag?: string;
  priority?: KanbanPriority;
  assignee?: KanbanAssignee;
  /** 紧凑展示负责人：仅显示头像（卡片底部居右），名称悬停显示。用于线索到达阶段。 */
  assigneeCompact?: boolean;
  /** 金额（如 "¥86,000"），CRM 交易卡展示用，可选。 */
  amount?: string;
  meta?: string;
  /** 来源（如 官网 / 转介绍 / 展会），CRM 交易卡展示用，可选。 */
  source?: string;
  /** 创建时间（ISO 字符串），CRM 交易卡展示用，可选。 */
  createdAt?: string;
  /** 按阶段定制的展示字段（控制顺序与显隐）。为空则使用默认完整布局。 */
  fields?: CardField[];
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

function formatDateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 单字段渲染（按阶段定制的卡片布局复用）。 */
function FieldBlock({ field, item }: { field: CardField; item: KanbanItem }) {
  const { t } = useTranslation();
  switch (field) {
    case "amount":
      return item.amount ? (
        <p className="text-sm font-semibold tabular-nums text-foreground">{item.amount}</p>
      ) : null;
    case "description":
      return item.description ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
      ) : null;
    case "source":
      return item.source ? (
        <p className="text-[11px] text-muted-foreground/80">来源 · {item.source}</p>
      ) : null;
    case "createdAt":
      return item.createdAt ? (
        <p className="text-[11px] text-muted-foreground/80">创建 · {formatDateTime(item.createdAt)}</p>
      ) : null;
    case "assignee":
      return item.assignee ? (
        <div className="flex items-center gap-1.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-medium text-primary">
            {item.assignee.initials}
          </span>
          <span className="text-xs text-muted-foreground">{item.assignee.name}</span>
        </div>
      ) : null;
    case "priority":
      return item.priority ? (
        <span
          className={cn(
            "rounded-4xl px-2 py-0.5 text-[11px] font-medium",
            priorityClasses[item.priority],
          )}
        >
          {t(priorityKey[item.priority])}
        </span>
      ) : null;
    case "tag":
      return item.tag ? <Badge variant="secondary">{item.tag}</Badge> : null;
    case "meta":
      return item.meta ? (
        <p className="text-[11px] text-muted-foreground">{item.meta}</p>
      ) : null;
    default:
      return null;
  }
}

function KanbanCard({
  item,
  draggable,
  onDragStart,
  onClick,
}: {
  item: KanbanItem;
  draggable?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const fields = item.fields;
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40",
        draggable && "cursor-grab active:cursor-grabbing",
        onClick && "cursor-pointer",
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <p className="text-sm font-medium text-foreground">{item.title}</p>
      {fields ? (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {fields
            .filter((f) => f !== "title")
            .map((f) => (
              <FieldBlock key={f} field={f} item={item} />
            ))}
          {/* 线索到达阶段：负责人仅头像，居右；名称悬停显示 */}
          {item.assignee && item.assigneeCompact && (
            <div className="flex justify-end">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-medium text-primary"
                title={item.assignee.name}
              >
                {item.assignee.initials}
              </span>
            </div>
          )}
        </div>
      ) : (
        <>
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
          {item.source && (
            <p className="mt-1 text-[11px] text-muted-foreground/80">来源 · {item.source}</p>
          )}
        </>
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
  onDealClick,
}: {
  stages: KanbanStage[];
  fill?: boolean;
  className?: string;
  draggable?: boolean;
  onDealMove?: (dealId: string, toStageId: string) => void;
  onDealClick?: (dealId: string) => void;
}) {
  const { t } = useTranslation();
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-2",
        className,
      )}
    >
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
            "flex flex-col overflow-hidden rounded-2xl bg-card shadow-card",
            fill ? "min-w-0 flex-1" : "w-72 shrink-0",
            dragOverStage === stage.id && "ring-2 ring-primary",
          )}
        >
          <span
            className={cn("h-1 w-full shrink-0", stage.accent ?? "bg-primary")}
            aria-hidden
          />
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
                  onClick={onDealClick ? () => onDealClick(item.id) : undefined}
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
