import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KanbanSquare } from "lucide-react";
import { api } from "@/lib/api";
import { KanbanBoard, type KanbanItem, type KanbanPriority, type KanbanStage } from "@/components/kanban/KanbanBoard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stack } from "@/components/layout/Stack";
import { Skeleton } from "@/components/ui/skeleton";
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

function formatAmount(n: number) {
  return `¥${n.toLocaleString("zh-CN")}`;
}

function toItem(d: RawDeal): KanbanItem {
  return {
    id: d.id,
    title: d.title,
    description: d.description ?? undefined,
    tag: d.tag ?? undefined,
    priority: d.priority as KanbanPriority,
    amount: d.amount != null ? formatAmount(d.amount) : undefined,
    assignee: d.assignee
      ? { name: d.assignee, initials: d.assignee.trim().slice(0, 1) }
      : undefined,
    meta: d.meta ?? undefined,
  };
}

export default function CrmBoard() {
  const { t } = useTranslation();
  const [stages, setStages] = useState<KanbanStage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get<RawStage[]>("/crm/board")
      .then((r) => {
        setStages(
          r.data.map((s) => ({
            id: s.id,
            title: s.title,
            accent: s.accent,
            items: s.deals.map(toItem),
          })),
        );
      })
      .catch(() => setStages([]))
      .finally(() => setLoading(false));
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
    <Stack gap={6}>
      <PageHeader
        title={t("crm.title")}
        description={t("crm.subtitle")}
        icon={KanbanSquare}
      />
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 11 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : (
        <KanbanBoard
          stages={stages}
          fill
          draggable={CRM_DRAG_ENABLED}
          onDealMove={handleMove}
        />
      )}
    </Stack>
  );
}
