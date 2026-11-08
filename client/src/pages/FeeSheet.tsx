import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { PageMeta } from "@/components/layout/PageMeta";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AttachmentUpload,
  type Attachment,
} from "@/components/ui/attachment-upload";
import { Skeleton } from "@/components/ui/skeleton";
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
  voucherUrl?: string | null;
  attachments?: { name?: string | null; url: string }[] | null;
  paidAt?: string | null;
  fundAccount?: string | null;
  createdAt: string;
}

/** 费用类型（picker 选择，添加费用必选）。 */
const FEE_TYPES = ["样品费", "设计费", "定金30%", "尾款70%"] as const;

/** 资金账户预设（收汇/收款账户），picker 选择。 */
const FUND_ACCOUNTS = [
  "寿春阿里收汇",
  "微它阿里收汇",
  "微信",
  "支付宝账号",
  "景元 私账",
  "PAYPAL 样品费 账号",
  "锐峰对公RMB账户",
  "微它对公USD 账号",
  "微它对公RMB账号",
  "景元对公USD 账号",
  "景元对公RMB 账号",
  "寿春对公USD 账号",
  "寿春对公RMB 账号",
] as const;

const isImageName = (name: string) =>
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);

/** 费用类型标签配色（与看板阶段色同源：样品=violet 设计=indigo 定金=cyan 尾款=teal）。 */
const TYPE_CHIP_CLS: Record<string, string> = {
  样品费: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  设计费: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "定金30%": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "尾款70%": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

const typeChipCls = (type: string) =>
  TYPE_CHIP_CLS[type] ?? "bg-slate-500/10 text-slate-600 dark:text-slate-400";

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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [paidAt, setPaidAt] = useState("");
  const [fundAccount, setFundAccount] = useState("");
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
    setAttachments([]);
    setPaidAt("");
    setFundAccount("");
  };

  const startEdit = (f: FeeItem) => {
    setEditingId(f.id);
    setType(f.type);
    setAmount(String(f.amount));
    // 兼容历史单图凭证：无 attachments 时回退为单元素数组
    setAttachments(
      f.attachments?.length
        ? f.attachments.map((a) => ({ name: a.name ?? "", url: a.url }))
        : f.voucherUrl
          ? [{ name: f.type, url: f.voucherUrl }]
          : [],
    );
    setPaidAt(f.paidAt ? f.paidAt.slice(0, 10) : "");
    setFundAccount(f.fundAccount ?? "");
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (!type.trim()) {
      toast.error(t("crm.fees.typeRequired"));
      return;
    }
    const amt = Number(amount);
    if (amount.trim() === "" || !Number.isFinite(amt) || amt < 0) {
      toast.error(t("crm.fees.amountRequired"));
      return;
    }
    // 添加费用时必须上传回款凭证附件（编辑时可选，不强制重传）
    if (!editingId && attachments.length === 0) {
      toast.error(t("crm.fees.voucherRequired"));
      return;
    }
    // 添加费用时资金账户必选
    if (!editingId && !fundAccount) {
      toast.error(t("crm.fees.fundAccountRequired"));
      return;
    }
    // 添加费用时付款日期必填
    if (!editingId && !paidAt) {
      toast.error(t("crm.fees.paidAtRequired"));
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/fees/${editingId}`, {
          type: type.trim(),
          amount: amt,
          attachments,
          paidAt: paidAt ? new Date(paidAt).toISOString() : null,
          fundAccount: fundAccount || null,
        });
        toast.success(t("crm.fees.saveSuccess"));
      } else {
        await api.post("/fees", {
          dealId: id,
          type: type.trim(),
          amount: amt,
          attachments,
          paidAt: paidAt ? new Date(paidAt).toISOString() : null,
          fundAccount,
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
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* 卡片头：标题 + 笔数 | 常驻合计 */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {t("crm.fees.listTitle")}
                </h2>
                {!loading && items.length > 0 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {t("crm.fees.total")}
                </p>
                <p className="font-heading text-base font-semibold leading-tight tabular-nums text-foreground">
                  {formatMoney(total)}
                </p>
              </div>
            </div>

            {/* 列表体 */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
              {loading && (
                <div className="flex flex-col gap-2 py-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              )}

              {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
                  <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Wallet className="size-5" />
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {t("crm.fees.empty")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("crm.fees.emptyHint")}
                  </p>
                </div>
              )}

              {!loading &&
                items.map((f) => (
                  <div
                    key={f.id}
                    className="group -mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${typeChipCls(f.type)}`}
                      >
                        {f.type}
                      </span>
                      {(f.paidAt || f.fundAccount) && (
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {f.paidAt && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="size-3.5 shrink-0" />
                              {f.paidAt.slice(0, 10)}
                            </span>
                          )}
                          {f.fundAccount && (
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <Wallet className="size-3.5 shrink-0" />
                              <span className="truncate">{f.fundAccount}</span>
                            </span>
                          )}
                        </p>
                      )}
                      {f.note && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {f.note}
                        </p>
                      )}
                      {(f.attachments?.length || f.voucherUrl) && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {(f.attachments?.length
                            ? f.attachments
                            : [{ url: f.voucherUrl!, name: f.type }]
                          )
                            .slice(0, 3)
                            .map((a) => (
                              <a
                                key={a.url}
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                title={a.name ?? ""}
                                className="transition-opacity hover:opacity-80"
                              >
                                {isImageName(a.name ?? a.url) ? (
                                  <img
                                    src={a.url}
                                    alt={a.name ?? t("crm.fees.voucher")}
                                    className="size-10 rounded-md border border-border object-cover"
                                  />
                                ) : (
                                  <span className="flex size-10 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                                    <FileText className="size-4" />
                                  </span>
                                )}
                              </a>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="font-heading text-base font-semibold tabular-nums text-foreground">
                        {formatMoney(f.amount)}
                      </span>
                      <div className="flex items-center gap-0.5 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => startEdit(f)}
                          aria-label={t("crm.fees.edit")}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => setDeleteId(f.id)}
                          aria-label={t("crm.fees.delete")}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {/* 添加 / 编辑费用 */}
          <Card className="shrink-0">
            <div className="flex flex-col gap-4 p-5">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {editingId ? t("crm.fees.edit") : t("crm.fees.add")}
              </h2>

              {/* 基本信息：类型 / 金额 / 付款日期 / 资金账户 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>
                    {t("crm.fees.type")}
                    {!editingId && <span className="ml-0.5 text-destructive">*</span>}
                  </Label>
                  <Select
                    value={type || null}
                    onValueChange={(v) => setType(v ? String(v) : "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("crm.fees.typePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {FEE_TYPES.map((tp) => (
                        <SelectItem key={tp} value={tp}>
                          {tp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>
                    {t("crm.fees.amount")}
                    {!editingId && <span className="ml-0.5 text-destructive">*</span>}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>
                    {t("crm.fees.paidAt")}
                    {!editingId && <span className="ml-0.5 text-destructive">*</span>}
                  </Label>
                  <DatePicker
                    value={paidAt ? new Date(`${paidAt}T00:00:00`) : null}
                    onChange={(d) => setPaidAt(d ? d.toISOString().slice(0, 10) : "")}
                    placeholder={t("crm.fees.paidAtPlaceholder")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>
                    {t("crm.fees.fundAccount")}
                    {!editingId && <span className="ml-0.5 text-destructive">*</span>}
                  </Label>
                  <Select
                    value={fundAccount || null}
                    onValueChange={(v) => setFundAccount(v ? String(v) : "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("crm.fees.fundAccountPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {FUND_ACCOUNTS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 回款凭证附件：多文件（图片/PDF），点击 / 拖拽 / 粘贴上传 */}
              <div className="flex flex-col gap-1.5">
                <Label className="shrink-0">
                  {t("crm.fees.voucher")}
                  {!editingId && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
                <AttachmentUpload value={attachments} onChange={setAttachments} />
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
