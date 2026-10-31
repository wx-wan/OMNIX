import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { KanbanBoard, type KanbanItem, type KanbanPriority, type KanbanStage } from "@/components/kanban/KanbanBoard";
import { Stack } from "@/components/layout/Stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const EMPTY_FORM = {
  title: "",
  amount: "",
  assignee: "",
  priority: "medium" as KanbanPriority,
  description: "",
};

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
  const [stages, setStages] = useState<KanbanStage[]>(FALLBACK_STAGES);
  // 服务端「线索到达」真实 id；为空时新建商机由后端默认落第一阶段
  const [leadStageId, setLeadStageId] = useState<string | null>(null);

  // 新建商机弹窗
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => {
    api
      .get<RawStage[]>("/crm/board")
      .then((r) => {
        setStages(r.data.length ? r.data.map((s) => ({
          id: s.id,
          title: s.title,
          accent: s.accent,
          items: s.deals.map(toItem),
        })) : FALLBACK_STAGES);
        setLeadStageId(r.data[0]?.id ?? null);
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

  const handleCreate = async () => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      await api.post("/crm/deals", {
        title: form.title.trim(),
        amount: form.amount ? Number(form.amount) : undefined,
        assignee: form.assignee.trim() || undefined,
        priority: form.priority,
        description: form.description.trim() || undefined,
        stageId: leadStageId ?? undefined,
      });
      setOpen(false);
      setForm(EMPTY_FORM);
      setError(false);
      load();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={4} className="h-full min-h-0">
      <div className="flex items-center">
        <Button
          onClick={() => {
            setError(false);
            setOpen(true);
          }}
        >
          <Plus />
          {t("crm.newDeal")}
        </Button>
      </div>

      <KanbanBoard
        stages={stages}
        fullHeight
        draggable={CRM_DRAG_ENABLED}
        onDealMove={handleMove}
      />

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (v) setError(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("crm.formTitle")}</DialogTitle>
            <DialogDescription>{t("crm.formDesc")}</DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deal-title">{t("crm.fieldTitle")} *</Label>
              <Input
                id="deal-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                autoFocus
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="deal-amount">{t("crm.fieldAmount")}</Label>
                <Input
                  id="deal-amount"
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="deal-assignee">{t("crm.fieldAssignee")}</Label>
                <Input
                  id="deal-assignee"
                  value={form.assignee}
                  onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("crm.fieldPriority")}</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as KanbanPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{t("kanban.priorityHigh")}</SelectItem>
                  <SelectItem value="medium">{t("kanban.priorityMedium")}</SelectItem>
                  <SelectItem value="low">{t("kanban.priorityLow")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deal-desc">{t("crm.fieldDesc")}</Label>
              <Textarea
                id="deal-desc"
                rows={2}
                className="min-h-0 resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-red-500">{t("crm.createFailed")}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={!form.title.trim() || saving}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
