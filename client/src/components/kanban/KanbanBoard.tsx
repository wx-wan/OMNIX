import { useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Layers, MoreHorizontal, ChevronRight, type LucideIcon } from "lucide-react";

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
  /** 金额原始数值（未格式化），用于列头阶段金额合计；可选。 */
  amountValue?: number;
  meta?: string;
  /** 来源（如 官网 / 转介绍 / 展会），CRM 交易卡展示用，可选。 */
  source?: string;
  /** 创建时间（ISO 字符串），CRM 交易卡展示用，可选。 */
  createdAt?: string;
  /** 往来单位 / 联系人（商机关联的 customer/contact），看板卡片展示用，可选。 */
  contact?: {
    name?: string | null;
    company?: string | null; // 旧版个人所属公司文本（兼容）
    parentName?: string | null; // 所属公司名（关联 parent，优先展示）
    type?: string | null;
  } | null;
  /** 按阶段定制的展示字段（控制顺序与显隐）。为空则使用默认完整布局。 */
  fields?: CardField[];
}

export interface KanbanStage {
  id: string;
  title: string;
  /** 阶段强调色（任意 tailwind 背景类，如 "bg-sky-500"）。缺省用品牌黄。 */
  accent?: string;
  /** 阶段图标，由调用方按业务阶段传入；缺省用通用 Layers。 */
  icon?: LucideIcon;
  items: KanbanItem[];
}

function formatDateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatAmount(n: number) {
  return `¥${n.toLocaleString("zh-CN")}`;
}

/** 是否由 MCP（Accio）创建：meta 以 "accio:" 开头代表 Accio 自动导入的商机。 */
function isMcpCreated(meta?: string): boolean {
  return !!meta && meta.startsWith("accio:");
}

/** 来源行：展示「来源 · {店铺}」，若为 MCP 创建则追加「概率同款AI」徽标。 */
function SourceLine({ source, meta }: { source?: string; meta?: string }) {
  const { t } = useTranslation();
  if (!source) return null;
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground/80">
      <span>来源 · {source}</span>
      {isMcpCreated(meta) && (
        <span
          className="flex items-center gap-0.5 text-[11px] font-medium text-foreground/80"
          title={t("kanban.aiSourceHint")}
        >
          {t("kanban.aiSourcePrefix")}
          {t("kanban.aiSourceMark") && (
            <span className="bg-gradient-to-r from-violet-500 to-amber-500 bg-clip-text text-[10px] font-bold text-transparent">
              {t("kanban.aiSourceMark")}
            </span>
          )}
        </span>
      )}
    </p>
  );
}

/** 往来单位 / 联系人行：统一显示「联系人姓名 · 公司（所属公司名）」，任一缺失时仅显示存在的那个。
 * 公司名优先取关联 parentName，缺失时回退旧文本 company。所有阶段卡片第二行均渲染此行，确保阶段间一致。 */
function ContactLine({ contact }: { contact?: KanbanItem["contact"] }) {
  if (!contact) return null;
  const name = contact.name?.trim();
  const company = (contact.parentName ?? contact.company)?.trim();
  if (!name && !company) return null;
  const Icon = company ? Building2 : User;
  return (
    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Icon className="size-3 shrink-0" />
      <span className="truncate">
        {name && company ? `${name} · ${company}` : name || company}
      </span>
    </p>
  );
}

/** 阶段列商机金额合计：优先用数值字段，缺失时从格式化字符串兜底解析。 */
function sumStageAmount(items: KanbanItem[]): number {
  return items.reduce((sum, it) => {
    if (typeof it.amountValue === "number") return sum + it.amountValue;
    if (it.amount) {
      const n = Number(it.amount.replace(/[^\d.]/g, ""));
      if (!Number.isNaN(n)) return sum + n;
    }
    return sum;
  }, 0);
}

/** 单字段渲染（按阶段定制的卡片布局复用）。 */
function FieldBlock({ field, item }: { field: CardField; item: KanbanItem }) {
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
      return <SourceLine source={item.source} meta={item.meta} />;
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

/** 阶段图标：调用方按业务阶段传入，缺省用通用 Layers。 */
function StageGlyph({ icon }: { icon?: LucideIcon }) {
  const Icon = icon ?? Layers;
  return <Icon className="size-3.5" />;
}

/** 阶段头：横向为窄胶囊（两行），纵向为整行横条（一行铺开，省下 11 段的垂直高度）。 */
function StageHeader({ stage, vertical }: { stage: KanbanStage; vertical: boolean }) {
  const { t } = useTranslation();
  const glyph = (
    <span
      className={cn(
        "relative flex size-6 shrink-0 items-center justify-center rounded-lg text-white",
        stage.accent ?? "bg-primary",
      )}
    >
      {/* 压暗 15%：让浅色阶段（amber/slate 等）上的白色细线图标仍清晰可辨 */}
      <span className="absolute inset-0 rounded-lg bg-black/15" aria-hidden />
      <span className="relative">
        <StageGlyph icon={stage.icon} />
      </span>
    </span>
  );
  const title = (
    <h3 className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground">
      {stage.title}
    </h3>
  );
  const count = (
    <span className="shrink-0 rounded-4xl bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
      {stage.items.length}
    </span>
  );
  const amount = (
    <>
      <span className="text-xs text-muted-foreground">{t("kanban.stageAmountShort")}</span>
      <span
        className="text-sm font-semibold tabular-nums text-foreground"
        title={t("kanban.stageAmount")}
      >
        {formatAmount(sumStageAmount(stage.items))}
      </span>
    </>
  );

  if (vertical) {
    // 参考阶段导航卡：紫描线图标 + 名称，第二行「N 个商机 ｜ 金额」，右侧圆形箭头；
    // 淡底仍与白卡区分。图标/数量/金额纵向独用，横向胶囊沿用上方 glyph/count/amount。
    const StageIcon = stage.icon ?? Layers;
    return (
      <div className="flex h-full flex-col gap-2 rounded-xl border border-border/60 bg-card/60 p-3 shadow-card">
        <div className="flex items-center gap-2">
          <StageIcon className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
          {title}
          <span
            className="ml-auto flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-hidden
          >
            <ChevronRight className="size-3.5" />
          </span>
        </div>
        <p className="flex items-baseline gap-1.5 text-xs text-muted-foreground">
          <span className="shrink-0 tabular-nums">
            {stage.items.length} {t("kanban.stageDealUnit")}
          </span>
          <span aria-hidden className="text-border">
            |
          </span>
          <span
            className="min-w-0 truncate font-semibold tabular-nums text-foreground/80"
            title={t("kanban.stageAmount")}
          >
            {formatAmount(sumStageAmount(stage.items))}
          </span>
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-card/60 px-3 py-3">
      <div className="flex items-center gap-2">
        {glyph}
        {title}
        {count}
        <MoreHorizontal
          className="ml-auto size-4 shrink-0 text-muted-foreground/60"
          aria-hidden
        />
      </div>
      <p className="mt-2 flex items-baseline gap-1.5">{amount}</p>
    </div>
  );
}

function KanbanCard({
  item,
  draggable,
  onDragStart,
  onClick,
  className,
}: {
  item: KanbanItem;
  draggable?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onClick?: () => void;
  className?: string;
}) {
  const fields = item.fields;
  return (
    <div
      className={cn(
        // 卡内紧组：标题↔联系人 4px，其余 8px，均小于卡间 12px
        "flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 shadow-card",
        "transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift",
        draggable && "cursor-grab active:cursor-grabbing",
        onClick && "cursor-pointer",
        className,
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{item.title}</p>
        <ContactLine contact={item.contact} />
      </div>
      {fields ? (
        <div className="flex flex-col gap-2">
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
            <p className="text-sm font-semibold tabular-nums text-foreground">{item.amount}</p>
          )}
          {item.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
          )}
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
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
            <p className="text-[11px] text-muted-foreground">{item.meta}</p>
          )}
          {item.source && <SourceLine source={item.source} meta={item.meta} />}
        </>
      )}
    </div>
  );
}

/** 看板 / 阶段流：阶段列承载事项卡片。
 *  - fill：列等分铺满容器（无横向滚动）；否则固定宽可横向滚动。
 *  - fillHeight：阶段列撑满父级可用高度（父级需有确定高度），列内轨道补满剩余空间。
 *  - orientation：horizontal 为横向阶段列（默认，展示型 / Showcase 使用）；
 *                 vertical 为纵向阶段区块——每阶段占整行、卡片网格化，无横向滚动。
 *  - draggable + onDealMove：开启拖拽流转（默认关闭，由调用方按配置传入）。展示型优先。 */
export function KanbanBoard({
  stages,
  fill = false,
  fillHeight = false,
  orientation = "horizontal",
  className,
  draggable = false,
  onDealMove,
  onDealClick,
}: {
  stages: KanbanStage[];
  fill?: boolean;
  fillHeight?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
  draggable?: boolean;
  onDealMove?: (dealId: string, toStageId: string) => void;
  onDealClick?: (dealId: string) => void;
}) {
  const { t } = useTranslation();
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const vertical = orientation === "vertical";

  return (
    <div
      className={cn(
        // 横向：阶段列并排 + 横向滚动；纵向：阶段区块自上而下，滚动交给 main
        vertical ? "flex flex-col gap-5" : "flex gap-5 overflow-x-auto pb-2",
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
            // 纵向整行：阶段头卡片固定在左 + 卡片横向滚动在右；横向固定列宽（头部胶囊在上、卡片纵向堆叠）
            vertical ? "flex w-full flex-row items-stretch gap-4" : "flex flex-col gap-4",
            !vertical && (fill ? "min-w-0 flex-1" : "w-72 shrink-0"),
            dragOverStage === stage.id && "rounded-2xl bg-primary/5 ring-2 ring-primary/40",
          )}
        >
          {/* 纵向：阶段头做成卡片固定在该行最前面（不随卡片横向滚动）；横向：独立窄胶囊置于卡片区上方 */}
          {vertical ? (
            // pb-2 与滚动区一致，抵消滚动条预留高度，保证头部卡片与内容卡片精确等高
            <div className="w-72 shrink-0 pb-2">
              <StageHeader stage={stage} vertical />
            </div>
          ) : (
            <StageHeader stage={stage} vertical={false} />
          )}

          {/* 纵向：卡片横向排成一行 + 横向滚动（不换行），占据头部卡片右侧剩余宽度；横向：卡片纵向堆叠 */}
          <div
            className={cn(
              vertical
                ? "flex min-w-0 flex-1 flex-row flex-nowrap items-stretch gap-3 overflow-x-auto pb-2"
                : "flex flex-col gap-3",
              !vertical && fillHeight && "flex-1 rounded-xl bg-card/40",
            )}
          >
            {stage.items.length === 0 ? (
              <p
                className={cn(
                  "text-center text-xs text-muted-foreground",
                  vertical ? "w-full h-56 flex items-center justify-center" : "py-8",
                )}
              >
                {t("kanban.empty")}
              </p>
            ) : (
              stage.items.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  className={cn(vertical && "w-72 shrink-0 h-56")}
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
