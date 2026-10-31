import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { HeaderAction } from "@/components/layout/AppShell";
import { KanbanBoard, type KanbanItem, type KanbanStage } from "@/components/kanban/KanbanBoard";
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
}

interface RawStage {
  id: string;
  title: string;
  accent: string;
  deals: RawDeal[];
}

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

function toItem(d: RawDeal): KanbanItem {
  return {
    id: d.id,
    title: d.title,
    description: d.description ?? undefined,
    tag: d.tag ?? undefined,
    priority: d.priority as KanbanItem["priority"],
    amount: d.amount != null ? formatAmount(d.amount) : undefined,
    assignee: d.assignee
      ? { name: d.assignee, initials: d.assignee.trim().slice(0, 1) }
      : undefined,
    meta: d.meta ?? undefined,
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
                items: s.deals.map(toItem),
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
      {/* 「新增」作为顶栏操作栏（portal 到顶栏右侧） */}
      <HeaderAction>
        <Button onClick={() => navigate("/crm/deals/new")}>
          <Plus />
          {t("crm.newDeal")}
        </Button>
      </HeaderAction>

      <KanbanBoard
        stages={stages}
        draggable={CRM_DRAG_ENABLED}
        onDealMove={handleMove}
        onDealClick={(dealId) => navigate(`/crm/deals/${dealId}`)}
      />
    </Stack>
  );
}
