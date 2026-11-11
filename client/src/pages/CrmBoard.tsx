import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api";
import { PageMeta } from "@/components/layout/PageMeta";
import { KanbanBoard, type KanbanItem, type KanbanStage, type CardField } from "@/components/kanban/KanbanBoard";
import { Stack } from "@/components/layout/Stack";
import { Button } from "@/components/ui/button";
import { CRM_DRAG_ENABLED } from "@/config";
import {
  Sparkles,
  MessageCircle,
  FileText,
  Box,
  ClipboardCheck,
  CreditCard,
  Factory,
  Truck,
  Banknote,
  PackageCheck,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";

interface RawDeal {
  id: string;
  title: string;
  description: string | null;
  tag: string | null;
  priority: "low" | "medium" | "high";
  amount: number | null;
  assignee: string | null;
  meta: string | null;
  source: string | null;
  createdAt: string;
  contact: {
    name: string | null;
    company: string | null;
    parentName: string | null;
    type: string | null;
  } | null;
}

interface RawStage {
  id: string;
  key: string;
  title: string;
  accent: string;
  deals: RawDeal[];
}

// 各阶段卡片展示字段（按阶段 key 定制，控制顺序与显隐）。
// 所有阶段统一走 KanbanCard 的「fields 有序列表」渲染路径，确保卡片样式与线索对齐；
// 仅线索到达阶段用精简集，其余阶段在同样布局下保留标签/备注等更丰富信息。
const STAGE_CARD_FIELDS: Record<string, CardField[]> = {
  // 线索到达：商机金额 + 备注 + 来源 + 创建时间
  lead: ["amount", "description", "source", "createdAt"],
};
// 其它阶段默认字段（与线索同布局：金额/备注/来源/创建时间 + 标签），
// 负责人统一「仅头像、底部居右」，故不在列表中重复。
// 不渲染 meta：meta 存的是 Accio 导入标记（accio:ref=...），仅供「AI」来源徽标判定，不对用户展示。
const DEFAULT_CARD_FIELDS: CardField[] = [
  "amount",
  "description",
  "source",
  "createdAt",
  "tag",
];

/** 阶段图标：按服务端 stage.key 映射，与 accent 同为阶段识别信息，不写进通用看板组件。 */
const STAGE_ICONS: Record<string, LucideIcon> = {
  lead: Sparkles,
  qualify: MessageCircle,
  quote: FileText,
  sample: Box,
  order: ClipboardCheck,
  pay: CreditCard,
  produce: Factory,
  ship: Truck,
  finalpay: Banknote,
  receive: PackageCheck,
  aftersale: CircleCheck,
};

// 阶段头卡片渐变背景（移动端营销卡风格，糖果色渐变）。
const STAGE_GRADIENTS: Record<string, string> = {
  lead: "from-pink-200 to-purple-400",
  qualify: "from-lime-200 to-green-400",
  quote: "from-amber-200 to-yellow-400",
  sample: "from-sky-200 to-blue-400",
  order: "from-purple-200 to-violet-500",
  pay: "from-cyan-200 to-sky-500",
  produce: "from-orange-200 to-amber-500",
  ship: "from-rose-200 to-red-400",
  finalpay: "from-teal-200 to-emerald-400",
  receive: "from-emerald-200 to-green-500",
  aftersale: "from-indigo-200 to-blue-500",
};

// 阶段头卡片 3D 素材图（AI 生成，位于 public/art/stages，按 stage.key 命名）。
const STAGE_ART: Record<string, string> = {
  lead: "/art/stages/lead.png",
  qualify: "/art/stages/qualify.png",
  quote: "/art/stages/quote.png",
  sample: "/art/stages/sample.png",
  order: "/art/stages/order.png",
  pay: "/art/stages/pay.png",
  produce: "/art/stages/produce.png",
  ship: "/art/stages/ship.png",
  finalpay: "/art/stages/finalpay.png",
  receive: "/art/stages/receive.png",
  aftersale: "/art/stages/aftersale.png",
};

// 阶段头卡片右下操作按钮配色（与渐变主色呼应）
const STAGE_ACTIONS: Record<string, string> = {
  lead: "bg-pink-500",
  qualify: "bg-green-500",
  quote: "bg-amber-500",
  sample: "bg-blue-500",
  order: "bg-violet-500",
  pay: "bg-sky-500",
  produce: "bg-orange-500",
  ship: "bg-red-500",
  finalpay: "bg-emerald-500",
  receive: "bg-green-600",
  aftersale: "bg-blue-600",
};

function withStageMeta(stage: Omit<KanbanStage, "icon">, key: string): KanbanStage {
  return {
    ...stage,
    icon: STAGE_ICONS[key],
    gradient: STAGE_GRADIENTS[key],
    art: STAGE_ART[key],
    actionClass: STAGE_ACTIONS[key],
  };
}

// 兜底阶段：接口无数据 / 失败时也完整展示 11 个阶段（加载成功后替换为服务端数据）
const FALLBACK_STAGES: KanbanStage[] = [
  { id: "lead", title: "线索到达", accent: "bg-slate-400", items: [] },
  { id: "qualify", title: "需求确认", accent: "bg-sky-500", items: [] },
  { id: "quote", title: "报价阶段", accent: "bg-indigo-500", items: [] },
  { id: "sample", title: "样品流程", accent: "bg-violet-500", items: [] },
  { id: "order", title: "正式订单", accent: "bg-blue-600", items: [] },
  { id: "pay", title: "订单支付", accent: "bg-cyan-500", items: [] },
  { id: "produce", title: "生产阶段", accent: "bg-amber-500", items: [] },
  { id: "ship", title: "物流运输", accent: "bg-orange-500", items: [] },
  { id: "finalpay", title: "尾款支付", accent: "bg-teal-500", items: [] },
  { id: "receive", title: "客户收货", accent: "bg-emerald-500", items: [] },
  { id: "aftersale", title: "售后服务", accent: "bg-rose-500", items: [] },
].map((s) => withStageMeta(s, s.id));

function formatAmount(n: number) {
  return `¥${n.toLocaleString("zh-CN")}`;
}

function toItem(d: RawDeal, stageKey: string): KanbanItem {
  return {
    id: d.id,
    title: d.title,
    description: d.description ?? undefined,
    tag: d.tag ?? undefined,
    priority: d.priority as KanbanItem["priority"],
    amount: d.amount != null ? formatAmount(d.amount) : undefined,
    amountValue: d.amount ?? undefined,
    assignee: d.assignee
      ? { name: d.assignee, initials: d.assignee.trim().slice(0, 1) }
      : undefined,
    meta: d.meta ?? undefined,
    source: d.source ?? undefined,
    createdAt: d.createdAt,
    contact: d.contact ?? undefined,
    // 所有阶段统一走 fields 渲染路径（与线索同布局）；未配置阶段用默认字段集
    fields: STAGE_CARD_FIELDS[stageKey] ?? DEFAULT_CARD_FIELDS,
    // 负责人统一「仅头像、底部居右」，名称悬停显示（与线索卡片对齐）
    assigneeCompact: true,
  };
}

export default function CrmBoard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stages, setStages] = useState<KanbanStage[]>(FALLBACK_STAGES);

  const load = () => {
    api
      .get<RawStage[]>("/crm/board")
      .then((r) => {
        setStages(
          r.data.length
            ? r.data.map((s) =>
                withStageMeta(
                  {
                    id: s.id,
                    title: s.title,
                    accent: s.accent,
                    items: s.deals.map((d) => toItem(d, s.key)),
                  },
                  s.key,
                ),
              )
            : FALLBACK_STAGES,
        );
      })
      .catch(() => setStages(FALLBACK_STAGES));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 拖拽换列（默认关闭，仅当配置开启时传入）
  const handleMove = async (dealId: string, toStageId: string) => {
    try {
      await api.patch(`/crm/deals/${dealId}`, { stageId: toStageId });
      load();
    } catch {
      /* 失败保持原状，可加 toast */
    }
  };

  // PageMeta portal 到顶栏，不占内容流；水平 gutter 由 AppShell 的 main 统一提供。
  // 纵向阶段区块：页面按内容自然高度增长，由 main 承担纵向滚动；
  // shrink-0 避免在 flex 列容器里被压缩。
  return (
    <Stack gap={4} className="shrink-0">
      <PageMeta
        title={t("nav.crm")}
        actions={
          <Button onClick={() => navigate("/crm/deals/new")}>
            {t("crm.newDeal")}
          </Button>
        }
      />

      <KanbanBoard
        orientation="vertical"
        stages={stages}
        draggable={CRM_DRAG_ENABLED}
        onDealMove={handleMove}
        onDealClick={(dealId) => navigate(`/crm/deals/${dealId}`)}
      />
    </Stack>
  );
}
