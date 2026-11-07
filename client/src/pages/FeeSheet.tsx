import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { PageMeta } from "@/components/layout/PageMeta";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Chatter, type ChatterMessage } from "@/components/chatter/Chatter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FeeItem {
  id: string;
  dealId: string;
  type: string;
  amount: number;
  note?: string | null;
  createdAt: string;
}

/** 费用类型预设（点击即填入类型输入框，也可手填自定义类型）。 */
const PRESET_TYPES = ["sample", "design", "logistics", "other"] as const;

function formatMoney(v: number): string {
  return `¥${v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FeeSheet() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeeItem[]>([]);

  // 表单态（新增 / 编辑共用）
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // 删除确认
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 商机讨论区（与商机详情页同一 Chatter 体系：机器人操作记录 + 人工评论）
  const [initialChatter, setInitialChatter] = useState<ChatterMessage[] | null>(null);
  const [chatterHasMore, setChatterHasMore] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await api.get<FeeItem[]>("/fees", { params: { dealId: id } });
      setItems(r.data);
    } catch {
      toast.error(t("crm.fees.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // 初始加载：费用明细 + 讨论区最新一屏
  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    api
      .get<FeeItem[]>("/fees", { params: { dealId: id } })
      .then((r) => {
        if (alive) setItems(r.data);
      })
      .catch(() => {
        if (alive) toast.error(t("crm.fees.loadFailed"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    api
      .get<{ messages: ChatterMessage[]; hasMore: boolean }>(
        `/crm/deals/${id}/chatter?limit=30`,
      )
      .then((r) => {
        if (!alive) return;
        setInitialChatter(
          r.data.messages.map((m) => ({
            ...m,
            sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
          })),
        );
        setChatterHasMore(r.data.hasMore);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const total = items.reduce((s, f) => s + (f.amount || 0), 0);

  const resetForm = () => {
    setEditingId(null);
    setType("");
    setAmount("");
    setNote("");
  };

  const startEdit = (f: FeeItem) => {
    setEditingId(f.id);
    setType(f.type);
    setAmount(String(f.amount));
    setNote(f.note ?? "");
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (!type.trim()) {
      toast.error(`${t("crm.fees.type")}${t("common.required")}`);
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      toast.error(`${t("crm.fees.amount")}${t("common.required")}`);
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/fees/${editingId}`, {
          type: type.trim(),
          amount: amt,
          note: note.trim() || null,
        });
        toast.success(t("crm.fees.saveSuccess"));
      } else {
        await api.post("/fees", {
          dealId: id,
          type: type.trim(),
          amount: amt,
          note: note.trim() || null,
        });
        toast.success(t("crm.fees.createSuccess"));
      }
      resetForm();
      await load();
      setRefreshToken((k) => k + 1); // 后端已把本次费用操作写入商机讨论区，增量拉取
    } catch (e) {
      console.error("[FeeSheet] save failed:", e);
      toast.error(t("crm.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/fees/${deleteId}`);
      toast.success(t("common.success"));
      setDeleteId(null);
      await load();
      setRefreshToken((k) => k + 1); // 同步讨论区里「删除费用」的系统记录
    } catch (e) {
      console.error("[FeeSheet] delete failed:", e);
      toast.error(t("crm.saveFailed"));
    }
  };

  // 讨论区：拉取更早一页（瀑布流），与商机详情页同一接口
  const loadOlderChatter = async (oldest: ChatterMessage) => {
    const r = await api.get<{ messages: ChatterMessage[]; hasMore: boolean }>(
      `/crm/deals/${id}/chatter?limit=30&before=${encodeURIComponent(oldest.createdAt ?? "")}`,
    );
    return {
      messages: r.data.messages.map((m) => ({
        ...m,
        sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
      })),
      hasMore: r.data.hasMore,
    };
  };

  // 讨论区：增量刷新最新一屏并合并
  const loadLatestChatter = async () => {
    const r = await api.get<{ messages: ChatterMessage[]; hasMore: boolean }>(
      `/crm/deals/${id}/chatter?limit=30`,
    );
    return {
      messages: r.data.messages.map((m) => ({
        ...m,
        sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
      })),
      hasMore: r.data.hasMore,
    };
  };

  // 在讨论区发布一条人工评论
  const handleChatterSend = async (text: string): Promise<ChatterMessage | void> => {
    if (!id) return;
    const r = await api.post<ChatterMessage>(`/crm/deals/${id}/chatter`, { text });
    return {
      ...r.data,
      sentAt: r.data.createdAt ? Date.parse(r.data.createdAt) : undefined,
    };
  };

  // 撤回一条本人发送、3 分钟内的评论（失败时抛出，组件回滚乐观更新）
  const handleChatterRecall = async (msgId: string) => {
    if (!id) return;
    try {
      await api.delete(`/crm/deals/${id}/chatter/${msgId}`);
    } catch (e) {
      console.error("[FeeSheet] recall chatter failed:", e);
      toast.error(t("chatter.recallFailed"));
      throw e;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageMeta
        title={t("crm.fees.title")}
        back={() => navigate(id ? `/crm/deals/${id}` : "/crm")}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-10">
        {/* 左：费用单主操作区（费用明细 + 添加/编辑费用） */}
        <div className="flex min-h-0 flex-col gap-4 lg:col-span-6">
          {/* 费用明细 */}
          <Card className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {t("crm.fees.listTitle")}
              </h2>
              {loading && (
                <p className="text-sm text-muted-foreground">{t("auth.loading")}</p>
              )}
              {!loading && items.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("crm.fees.empty")}</p>
              )}
              {!loading &&
                items.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {f.type}
                      </p>
                      {f.note && (
                        <p className="truncate text-xs text-muted-foreground">
                          {f.note}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-heading text-sm font-semibold tabular-nums text-foreground">
                        {formatMoney(f.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => startEdit(f)}
                        aria-label={t("crm.fees.edit")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDeleteId(f.id)}
                        aria-label={t("crm.fees.delete")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}

              {!loading && items.length > 0 && (
                <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">
                    {t("crm.fees.total")}
                  </span>
                  <span className="font-heading text-base font-semibold tabular-nums text-foreground">
                    {formatMoney(total)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* 添加 / 编辑费用 */}
          <Card className="shrink-0">
            <div className="flex flex-col gap-4 p-5">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {editingId ? t("crm.fees.edit") : t("crm.fees.add")}
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>{t("crm.fees.type")}</Label>
                  <Input
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder={t("crm.fees.typePlaceholder")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t("crm.fees.amount")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PRESET_TYPES.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(t(`crm.fees.preset.${key}`))}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50"
                  >
                    {t(`crm.fees.preset.${key}`)}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.fees.note")}</Label>
                <Textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder=""
                />
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => void handleSubmit()} disabled={saving}>
                  {saving ? (
                    t("common.loading")
                  ) : editingId ? (
                    t("common.save")
                  ) : (
                    <>
                      <Plus className="size-4" />
                      {t("crm.fees.add")}
                    </>
                  )}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={resetForm} disabled={saving}>
                    {t("common.cancel")}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* 右：商机讨论区（与商机详情页同一 Chatter 体系） */}
        <div className="min-h-0 lg:col-span-4">
          {initialChatter && id ? (
            <Chatter
              key={id}
              fill
              className="h-full"
              initialMessages={initialChatter}
              hasMore={chatterHasMore}
              currentUser={user?.name}
              onSend={handleChatterSend}
              onRecall={handleChatterRecall}
              onLoadOlder={loadOlderChatter}
              onLoadLatest={loadLatestChatter}
              refreshToken={refreshToken}
              pollMs={15000}
            />
          ) : null}
        </div>
      </div>

      {/* 删除确认 */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("crm.fees.delete")}</DialogTitle>
            <DialogDescription>
              {t("crm.fees.deleteConfirm", {
                type: items.find((f) => f.id === deleteId)?.type ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
