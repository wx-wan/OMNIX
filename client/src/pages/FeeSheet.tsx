import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Banknote,
  ChevronDown,
  FileText,
  FlaskConical,
  PenTool,
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

/** 费用类型图标（candis 式汇总行）。 */
const TYPE_ICON: Record<string, typeof Wallet> = {
  样品费: FlaskConical,
  设计费: PenTool,
  "定金30%": Banknote,
  "尾款70%": Wallet,
};

const typeIcon = (type: string) => TYPE_ICON[type] ?? FileText;

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

  // 列表筛选：费用类型 chip + 付款时间段
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  // 三栏详情布局：选中费用（目录定位 + 右栏编辑）/ 讨论区折叠
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chatterOpen, setChatterOpen] = useState(true);
  // 顶栏标题用商机名称
  const [dealTitle, setDealTitle] = useState<string | null>(null);

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
        if (!alive) return;
        setItems(r.data);
        // 三栏布局：默认选中第一条费用，中栏直接展示详情
        const first = r.data[0];
        if (first) {
          setSelectedId(first.id);
          startEdit(first);
        }
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
    // 顶栏标题用商机名称
    api
      .get<{ title?: string | null }>(`/crm/deals/${id}`)
      .then((r) => {
        if (alive) setDealTitle(r.data.title ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const total = items.reduce((s, f) => s + (f.amount || 0), 0);

  // 各费用类型的笔数（用于筛选 chip 角标）
  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of items) m.set(f.type, (m.get(f.type) ?? 0) + 1);
    return m;
  }, [items]);

  // 付款时间段筛选（按付款日）
  const now = Date.now();
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
  const periodMatch = (paidAt?: string | null) => {
    if (periodFilter === "all" || !paidAt) return periodFilter === "all";
    const t = Date.parse(paidAt);
    if (Number.isNaN(t)) return periodFilter === "all";
    switch (periodFilter) {
      case "last7":
        return t >= now - 7 * 864e5;
      case "last30":
        return t >= now - 30 * 864e5;
      case "last90":
        return t >= now - 90 * 864e5;
      case "thisYear":
        return t >= startOfYear;
      default:
        return true;
    }
  };

  const visibleItems = useMemo(
    () =>
      items.filter(
        (f) => (!typeFilter || f.type === typeFilter) && periodMatch(f.paidAt),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, typeFilter, periodFilter],
  );

  // 重复费用检测：同一商机内 同类型 + 同金额 + 同付款日
  const duplicateKeys = useMemo(() => {
    const cnt = new Map<string, number>();
    for (const f of items) {
      const key = `${f.type}|${f.amount}|${(f.paidAt ?? "").slice(0, 10)}`;
      cnt.set(key, (cnt.get(key) ?? 0) + 1);
    }
    const dup = new Set<string>();
    for (const [k, n] of cnt) if (n > 1) dup.add(k);
    return dup;
  }, [items]);

  // 疑似重复的费用组数（用于告警横幅）
  const duplicateGroups = useMemo(
    () =>
      Array.from(
        items.reduce((m, f) => {
          const key = `${f.type}|${f.amount}|${(f.paidAt ?? "").slice(0, 10)}`;
          m.set(key, (m.get(key) ?? 0) + 1);
          return m;
        }, new Map<string, number>()).values(),
      ).filter((n) => n > 1).length,
    [items],
  );

  // 中栏卡片引用：目录点击 → 定位滚动
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  // 三栏布局：点击左侧目录 → 中栏定位卡片 + 右栏进入编辑
  const selectFee = (f: FeeItem) => {
    setSelectedId(f.id);
    startEdit(f);
    // 目录点击 → 平滑滚动中栏对应卡片到视图中央
    requestAnimationFrame(() => {
      cardRefs.current[f.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  // 「+ 新增费用」：清空选中与表单，进入新增模式
  const startAdd = () => {
    resetForm();
    setSelectedId(null);
  };

  // 「取消」：回退到选中费用当前数据（未选中则清空）
  const cancelEdit = () => {
    const cur = selectedId ? items.find((f) => f.id === selectedId) : null;
    if (cur) {
      startEdit(cur);
    } else {
      resetForm();
    }
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
      if (deleteId === selectedId) {
        resetForm();
        setSelectedId(null);
        setPreviewUrl(null);
      }
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
        title={dealTitle ?? t("crm.fees.title")}
        description={dealTitle ? t("crm.fees.title") : undefined}
        back={() => navigate(id ? `/crm/deals/${id}` : "/crm")}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
        {/* 左：费用列表 + 历史与评论 */}
        <div className="flex min-h-0 flex-col gap-4 lg:col-span-3">
          {/* 费用明细（点选行 → 中栏看详情、右栏编辑） */}
          <Card className="flex h-[30%] shrink-0 flex-col overflow-hidden">
            {/* 卡片头：标题 + 笔数 */}
            <div className="flex shrink-0 items-center gap-2 px-4 pb-1 pt-4">
              <h2 className="font-heading text-base font-semibold text-foreground">
                {t("crm.fees.listTitle")}
              </h2>
              {!loading && items.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              )}
            </div>

            {/* 筛选条：费用类型 chip + 付款时间段 */}
            <div className="flex shrink-0 flex-col gap-2 px-4 pb-2 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTypeFilter(null)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${!typeFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >
                  {t("crm.fees.all")}
                  <span className="ml-1 tabular-nums opacity-70">{items.length}</span>
                </button>
                {[...typeCounts.entries()].map(([tp, n]) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setTypeFilter(tp)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${typeFilter === tp ? typeChipCls(tp) + " ring-1 ring-inset ring-current/30" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                  >
                    {tp}
                    <span className="tabular-nums opacity-70">{n}</span>
                  </button>
                ))}
              </div>
              <Select
                value={periodFilter}
                onValueChange={(v) => setPeriodFilter(v ?? "all")}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue placeholder={t("crm.fees.period")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("crm.fees.periodAll")}</SelectItem>
                  <SelectItem value="last7">{t("crm.fees.periodLast7")}</SelectItem>
                  <SelectItem value="last30">{t("crm.fees.periodLast30")}</SelectItem>
                  <SelectItem value="last90">{t("crm.fees.periodLast90")}</SelectItem>
                  <SelectItem value="thisYear">{t("crm.fees.periodThisYear")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 明细行：candis 式简略汇总（图标 + 类型 + 金额） */}
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
              {loading && (
                <div className="flex flex-col gap-2 py-2">
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-11 w-full rounded-lg" />
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

              {!loading && items.length > 0 && visibleItems.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {t("crm.fees.noMatch")}
                </div>
              )}

              {!loading && duplicateGroups > 0 && (
                <div className="mb-2 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  <span>{t("crm.fees.duplicateDesc", { count: duplicateGroups })}</span>
                </div>
              )}

              {!loading &&
                visibleItems.map((f) => {
                  const isDup = duplicateKeys.has(
                    `${f.type}|${f.amount}|${(f.paidAt ?? "").slice(0, 10)}`,
                  );
                  const TypeIcon = typeIcon(f.type);
                  return (
                  <div
                    key={f.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectFee(f)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") selectFee(f);
                    }}
                    className={`group -mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                      selectedId === f.id
                        ? "bg-primary/10"
                        : isDup
                          ? "bg-amber-500/5 hover:bg-amber-500/10"
                          : "hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${typeChipCls(f.type)}`}
                    >
                      <TypeIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <span className="truncate">{f.type}</span>
                        {isDup && (
                          <span className="shrink-0 rounded bg-amber-500/20 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                            {t("crm.fees.duplicateTag")}
                          </span>
                        )}
                      </p>
                      {f.paidAt && (
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {f.paidAt.slice(0, 10)}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {formatMoney(f.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-destructive transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(f.id);
                      }}
                      aria-label={t("crm.fees.delete")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  );
                })}
            </div>

            {/* 合计（Erstattung 式汇总行） */}
            <div className="flex shrink-0 items-center justify-between px-4 pb-4 pt-1">
              <span className="text-sm text-muted-foreground">{t("crm.fees.total")}</span>
              <span className="font-heading text-lg font-semibold tabular-nums text-foreground">
                {formatMoney(total)}
              </span>
            </div>
          </Card>

          {/* 历史与评论（商机讨论区，可折叠） */}
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <button
              type="button"
              onClick={() => setChatterOpen((o) => !o)}
              className="flex w-full shrink-0 items-center justify-between px-4 py-2.5 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {t("crm.fees.historyTitle")}
                {initialChatter && initialChatter.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {initialChatter.length}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${chatterOpen ? "" : "-rotate-90"}`}
              />
            </button>
            {chatterOpen && (
              <div className="min-h-0 flex-1">
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
            )}
          </Card>
        </div>

        {/* 中：费用流（目录定位 + 朋友圈式竖向卡片） */}
        <div className="min-h-0 lg:col-span-5">
          <Card className="flex h-full min-h-0 flex-col overflow-hidden">
            {/* 轻量头部 */}
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {t("crm.fees.feed")}
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {visibleItems.length}
              </span>
            </div>

            {/* 可上下滚动的卡片流 */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2">
              {loading && (
                <div className="flex flex-col gap-4 py-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-44 w-full rounded-xl" />
                  ))}
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

              {!loading && items.length > 0 && visibleItems.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {t("crm.fees.noMatch")}
                </div>
              )}

              {!loading &&
                visibleItems.map((f) => {
                  const fAtt = f.attachments?.length
                    ? f.attachments
                    : f.voucherUrl
                      ? [{ name: f.type, url: f.voucherUrl }]
                      : [];
                  const fImg =
                    fAtt.find((a) => isImageName(a.name || a.url))?.url ??
                    fAtt[0]?.url ??
                    null;
                  const isDup = duplicateKeys.has(
                    `${f.type}|${f.amount}|${(f.paidAt ?? "").slice(0, 10)}`,
                  );
                  return (
                    <div
                      key={f.id}
                      id={`fee-${f.id}`}
                      ref={(el) => {
                        cardRefs.current[f.id] = el;
                      }}
                      onClick={() => selectFee(f)}
                      className={`mb-4 cursor-pointer rounded-xl bg-card p-4 shadow-card transition hover:shadow-md ${
                        selectedId === f.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      {/* 头部：类型 + 金额 */}
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${typeChipCls(f.type)}`}
                        >
                          {f.type}
                          {isDup && (
                            <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                              {t("crm.fees.duplicateTag")}
                            </span>
                          )}
                        </span>
                        <span className="font-heading text-base font-semibold tabular-nums text-foreground">
                          {formatMoney(f.amount)}
                        </span>
                      </div>

                      {/* 凭证大图 */}
                      {fImg && (
                        <div className="mt-3 overflow-hidden rounded-lg bg-muted/30">
                          <a
                            href={fImg}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src={fImg}
                              alt={t("crm.fees.voucher")}
                              className="max-h-[320px] w-full object-cover"
                            />
                          </a>
                        </div>
                      )}

                      {/* 信息行 */}
                      <div className="mt-3 flex flex-col gap-1.5 text-sm">
                        {f.paidAt && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {t("crm.fees.paidAt")}
                            </span>
                            <span className="tabular-nums text-foreground">
                              {f.paidAt.slice(0, 10)}
                            </span>
                          </div>
                        )}
                        {f.fundAccount && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="shrink-0 text-muted-foreground">
                              {t("crm.fees.fundAccount")}
                            </span>
                            <span className="truncate text-foreground">
                              {f.fundAccount}
                            </span>
                          </div>
                        )}
                        {f.note && (
                          <p className="mt-1 whitespace-pre-wrap text-foreground">
                            {f.note}
                          </p>
                        )}
                      </div>

                      {/* 多附件缩略图 */}
                      {fAtt.length > 1 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {fAtt.map((a) => (
                            <a
                              key={a.url}
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title={a.name}
                              className="overflow-hidden rounded-md"
                            >
                              {isImageName(a.name || a.url) ? (
                                <img
                                  src={a.url}
                                  alt={a.name}
                                  className="size-12 object-cover"
                                />
                              ) : (
                                <span className="flex size-12 items-center justify-center bg-muted text-muted-foreground">
                                  <FileText className="size-4" />
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* 删除（悬停显示） */}
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(f.id);
                          }}
                          aria-label={t("crm.fees.delete")}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>

        {/* 右：费用编辑面板（新增/编辑共用） */}
        <div className="min-h-0 lg:col-span-4">
          <Card className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="shrink-0 px-5 pb-2 pt-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {editingId ? t("crm.fees.edit") : t("crm.fees.add")}
              </h2>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">

              {/* 基本信息：类型 / 金额 / 付款日期 / 资金账户 */}
              <div className="flex flex-col gap-4">
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
            </div>

            <div className="flex shrink-0 flex-col gap-2 p-4">
                {editingId && (
                  <Button variant="outline" onClick={startAdd} disabled={saving}>
                    <Plus className="size-4" />
                    {t("crm.fees.add")}
                  </Button>
                )}
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
                  <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                    {t("common.cancel")}
                  </Button>
                )}
              </div>
          </Card>
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
