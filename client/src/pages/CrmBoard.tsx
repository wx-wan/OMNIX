import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api";
import { PageMeta } from "@/components/layout/PageMeta";
import { KanbanBoard, type KanbanItem, type KanbanStage, type CardField } from "@/components/kanban/KanbanBoard";
import { Stack } from "@/components/layout/Stack";
import { Button } from "@/components/ui/button";
import { CRM_DRAG_ENABLED } from "@/config";

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
  contact: { name: string | null; company: string | null; type: string | null } | null;
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
// 其它阶段默认字段（与线索同布局：金额/备注/来源/创建时间 + 标签/备注），
// 负责人统一「仅头像、底部居右」，故不在列表中重复。
const DEFAULT_CARD_FIELDS: CardField[] = [
  "amount",
  "description",
  "source",
  "createdAt",
  "tag",
  "meta",
];

// 兜底阶段：接口无数据 / 失败时也完整展示 11 个阶段（加载成功后替换为服务端数据）
const FALLBACK_STAGES: KanbanStage[] = [
  { id: "lead", title: "线索到达", accent: "bg-slate-400", items: [] },
  { id: "qualify", title: "需求确认", accent: "bg-sky-500", items: [] },
  { id: "quote", title: "报价阶段", accent: "bg-indigo-500", items: [] },
  { id: "sample", title: "样品流程", accent: "bg-violet-500", items: [] },
  { id: "order", title: "正式订单", accent: "bg-blue-600", items: [] },
  { id: "payment", title: "订单支付", accent: "bg-cyan-500", items: [] },
  { id: "production", title: "生产阶段", accent: "bg-amber-500", items: [] },
  { id: "shipping", title: "物流运输", accent: "bg-orange-500", items: [] },
  { id: "balance", title: "尾款支付", accent: "bg-teal-500", items: [] },
  { id: "delivery", title: "客户收货", accent: "bg-emerald-500", items: [] },
  { id: "service", title: "售后服务", accent: "bg-rose-500", items: [] },
];

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
            ? r.data.map((s) => ({
                id: s.id,
                title: s.title,
                accent: s.accent,
                items: s.deals.map((d) => toItem(d, s.key)),
              }))
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

  return (
    <Stack gap={4}>
      <PageMeta
        title={t("nav.crm")}
        actions={
          <Button onClick={() => navigate("/crm/deals/new")}>
            {t("crm.newDeal")}
          </Button>
        }
      />

      <KanbanBoard
        stages={stages}
        draggable={CRM_DRAG_ENABLED}
        onDealMove={handleMove}
        onDealClick={(dealId) => navigate(`/crm/deals/${dealId}`)}
      />
    </Stack>
  );
}
