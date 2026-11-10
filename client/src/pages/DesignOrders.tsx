import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Boxes, ChevronDown, Plus, Split, Trash2, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { PageMeta } from "@/components/layout/PageMeta";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Picker } from "@/components/common/Picker";
import type { SelectRecord } from "@/components/common/SearchableSelect";
import { Chatter, type ChatterMessage } from "@/components/chatter/Chatter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DesignOrderItem {
  id: string;
  dealId: string;
  productId: string;
  productName: string;
  product?: { id: string; name: string | null; image: string | null } | null;
  productType: string;
  responsibleId?: string | null;
  responsible?: { id: string; name: string } | null;
  assistantId?: string | null;
  assistant?: { id: string; name: string } | null;
  status: string;
  mainImage: Attachment[];
  threeViews: Attachment[];
  sampleFee: boolean;
  dueDate: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  samples?: { id: string; sampleType: string; status: string }[];
}

const DESIGN_STATUS_KEYS = [
  "draft",
  "designing",
  "pending_review",
  "approved",
  "rejected",
] as const;

// 设计单产品类型（编辑弹窗与拆解生成共用）
const DESIGN_TYPES = ["新品3D开发（设计）", "新品开发（设计）"] as const;

const STATUS_CHIP: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  designing: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  pending_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const toISODate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
const fromISODate = (s?: string | null) => (s ? new Date(s) : null);

export default function DesignOrders() {
  const { id: dealId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [items, setItems] = useState<DesignOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<
    {
      id: string;
      name: string | null;
      description?: string | null;
      image?: string | null;
      unit?: string | null;
      isRequirement?: boolean;
      parentId?: string | null;
    }[]
  >([]);
  // 本商机关联的产品 id（用于把「需求产品」收敛到当前商机）
  const [dealProductIds, setDealProductIds] = useState<Set<string>>(new Set());
  const [designers, setDesigners] = useState<{ id: string; name: string }[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // 左侧讨论区折叠
  const [chatterOpen, setChatterOpen] = useState(true);

  // 拆解（需求产品 → 设计单）与拆分（成套产品 → 多个子产品）
  const [decomposeOpen, setDecomposeOpen] = useState(false);
  const [decomposeType, setDecomposeType] = useState<string>(DESIGN_TYPES[1]);
  const [generating, setGenerating] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitParent, setSplitParent] = useState<{ id: string; name: string } | null>(null);
  const [splitRows, setSplitRows] = useState<{ name: string }[]>([]);

  // 自动拆解开关（全局设置，由 Settings 控制）：进入页面自动为本商机所有产品需求建草稿设计单
  const [autoDecompose, setAutoDecompose] = useState(false);
  // 顶栏标题用商机名称
  const [dealTitle, setDealTitle] = useState<string | null>(null);

  // 表单
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [sampleFee, setSampleFee] = useState(false);
  const [mainImage, setMainImage] = useState<Attachment[]>([]);
  const [threeViews, setThreeViews] = useState<Attachment[]>([]);

  // Chatter
  const [initialChatter, setInitialChatter] = useState<ChatterMessage[] | null>(null);
  const [chatterHasMore, setChatterHasMore] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  // 产品 Picker 选项（仿 Odoo many2one：名称/描述为主文案，带主图与单位）
  const productRecords = useMemo<SelectRecord[]>(
    () =>
      products.map((p) => ({
        id: p.id,
        label: p.name || p.description || p.id,
        sublabel: p.unit ?? undefined,
        image: p.image ?? undefined,
      })),
    [products],
  );

  // 产品类型 / 状态 / 协助负责人 Picker 选项（portal 下拉，避免被滚动容器裁剪）
  const productTypeRecords = useMemo<SelectRecord[]>(
    () => DESIGN_TYPES.map((tp) => ({ id: tp, label: tp })),
    [],
  );
  const statusRecords = useMemo<SelectRecord[]>(
    () =>
      DESIGN_STATUS_KEYS.map((s) => ({
        id: s,
        label: t(`crm.designOrders.${s}`),
      })),
    [t],
  );
  const assistantRecords = useMemo<SelectRecord[]>(
    () => designers.map((c) => ({ id: c.id, label: c.name })),
    [designers],
  );

  const load = async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const [list, prod, contacts, dealRes] = await Promise.all([
        api.get<DesignOrderItem[]>(`/design-orders?dealId=${dealId}`),
        api.get<{
          id: string;
          name: string | null;
          description?: string | null;
          image?: string | null;
          unit?: string | null;
          isRequirement?: boolean;
          parentId?: string | null;
        }[]>("/products"),
        api.get<{ id: string; name: string; position?: string | null }[]>(
          "/contacts?type=user",
        ),
        api.get<{
          title?: string | null;
          productId?: string | null;
          linesJson?: string | null;
        }>(`/crm/deals/${dealId}`),
      ]);
      setItems(list.data);
      // 三段布局：默认选中第一条；当前选中项被删除后清空选择
      if (selectedId && !list.data.find((x) => x.id === selectedId)) {
        setSelectedId(null);
        resetForm();
      } else if (!selectedId && list.data[0]) {
        setSelectedId(list.data[0].id);
        startEdit(list.data[0]);
      }
      setProducts(prod.data ?? []);
      // 协助负责人可选全部系统用户（type=user），不再限「设计」职位
      setDesigners(contacts.data ?? []);

      // 收敛「需求产品」到本商机：主产品 + 订单明细行引用的产品
      const d = dealRes.data;
      setDealTitle(d?.title ?? null);
      const ids = new Set<string>();
      if (d?.productId) ids.add(d.productId);
      if (d?.linesJson) {
        try {
          const lines = JSON.parse(d.linesJson);
          if (Array.isArray(lines)) {
            for (const l of lines) {
              if (l && typeof l.productId === "string") ids.add(l.productId);
            }
          }
        } catch {
          // 损坏的 linesJson 忽略
        }
      }
      setDealProductIds(ids);
      // 读取全局「自动拆解」偏好（由 Settings 控制）
      api
        .get<{ autoDecompose: boolean }>("/settings/design")
        .then((r) => setAutoDecompose(r.data.autoDecompose))
        .catch(() => {});
    } catch {
      toast.error(t("crm.designOrders.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    if (!dealId) return;
    api
      .get<{ messages: ChatterMessage[]; hasMore: boolean }>(
        `/crm/deals/${dealId}/chatter?limit=30`,
      )
      .then((r) => {
        setInitialChatter(
          r.data.messages.map((m) => ({
            ...m,
            sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
          })),
        );
        setChatterHasMore(r.data.hasMore);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  const resetForm = () => {
    setProductId("");
    setProductName("");
    setProductType("");
    setAssistantId(null);
    setStatus("draft");
    setDueDate(null);
    setSampleFee(false);
    setMainImage([]);
    setThreeViews([]);
    setSelectedId(null);
  };

  const startEdit = (d: DesignOrderItem) => {
    setSelectedId(d.id);
    setProductId(d.productId);
    setProductName(d.productName);
    setProductType(d.productType);
    setAssistantId(d.assistantId ?? null);
    setStatus(d.status);
    setDueDate(fromISODate(d.dueDate));
    setSampleFee(d.sampleFee ?? false);
    setMainImage(d.mainImage ?? []);
    setThreeViews(d.threeViews ?? []);
  };

  const submit = async () => {
    if (!productId) return toast.error(t("crm.designOrders.productRequired"));
    if (!productName.trim())
      return toast.error(t("crm.designOrders.productName") + t("common.required"));
    if (!productType)
      return toast.error(t("crm.designOrders.productTypeRequired"));
    setSaving(true);
    const body = {
      dealId: dealId!,
      productId,
      productName: productName.trim(),
      productType,
      assistantId: assistantId ?? undefined,
      status,
      dueDate: toISODate(dueDate),
      sampleFee,
      mainImage,
      threeViews,
    };
    if (!selectedId) {
      try {
        await api.post("/design-orders", body);
        toast.success(t("crm.designOrders.createSuccess"));
        resetForm();
        await load();
        setRefreshToken((k) => k + 1);
      } catch {
        toast.error(t("crm.saveFailed"));
      } finally {
        setSaving(false);
      }
      return;
    }
    try {
      await api.patch(`/design-orders/${selectedId}`, body);
      toast.success(t("crm.designOrders.saveSuccess"));
      resetForm();
      await load();
      setRefreshToken((k) => k + 1);
    } catch {
      toast.error(t("crm.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/design-orders/${deleteId}`);
      toast.success(t("common.success"));
      setDeleteId(null);
      await load();
      setRefreshToken((k) => k + 1);
    } catch {
      toast.error(t("crm.saveFailed"));
    }
  };

  // —— 拆解：商机产品需求 → 设计单 ——
  // 口径：本商机引用的全部产品（主产品 + 明细行产品），不限 isRequirement——
  // 商机里每条产品行（含库内选品）都是一条需求，都应能建设计单。
  const dealRequirementProducts = useMemo(
    () => products.filter((p) => dealProductIds.has(p.id)),
    [products, dealProductIds],
  );
  const decomposeCandidates = dealRequirementProducts;

  const existingProductIds = useMemo(
    () => new Set(items.map((i) => i.productId)),
    [items],
  );

  const generateForProduct = async (p: {
    id: string;
    name: string | null;
    description?: string | null;
  }) => {
    await api.post("/design-orders", {
      dealId: dealId!,
      productId: p.id,
      productName: p.name || p.description || p.id,
      productType: decomposeType,
      status: "draft",
    });
  };

  const generateAll = async () => {
    const targets = decomposeCandidates.filter(
      (p) => !existingProductIds.has(p.id),
    );
    if (targets.length === 0) {
      toast.info(t("crm.designOrders.generated"));
      return;
    }
    setGenerating(true);
    try {
      for (const p of targets) await generateForProduct(p);
      toast.success(
        t("crm.designOrders.generateSuccess", { count: targets.length }),
      );
      await load();
      setRefreshToken((k) => k + 1);
      setDecomposeOpen(false);
    } catch {
      toast.error(t("crm.saveFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const generateOne = async (p: {
    id: string;
    name: string | null;
    description?: string | null;
  }) => {
    setGenerating(true);
    try {
      await generateForProduct(p);
      toast.success(t("crm.designOrders.createSuccess"));
      await load();
      setRefreshToken((k) => k + 1);
    } catch {
      toast.error(t("crm.saveFailed"));
    } finally {
      setGenerating(false);
    }
  };

  // 开关开启时：进入页面即自动为本商机所有产品需求（尚未建设计单的）生成草稿设计单。
  // 幂等：只补建缺失项；创建后重载列表，缺失项归零即停止，不会重复建。
  useEffect(() => {
    if (!autoDecompose || loading || !dealRequirementProducts.length) return;
    const missing = dealRequirementProducts.filter(
      (p) => !existingProductIds.has(p.id),
    );
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const p of missing) {
        if (cancelled) return;
        try {
          await generateForProduct(p);
        } catch {
          // 单条失败不阻断其余产品
        }
      }
      if (!cancelled) {
        toast.success(
          t("crm.designOrders.generateSuccess", { count: missing.length }),
        );
        await load();
        setRefreshToken((k) => k + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDecompose, loading, items, dealRequirementProducts, existingProductIds]);

  // —— 拆分：成套 / 组合产品 → 多个子产品 ——
  const openSplit = (p: { id: string; name: string | null }) => {
    setSplitParent({ id: p.id, name: p.name || p.id });
    setSplitRows([{ name: "" }]);
    setSplitOpen(true);
  };
  const confirmSplit = async () => {
    const rows = splitRows.map((r) => r.name.trim()).filter(Boolean);
    if (!rows.length || !splitParent) return;
    setGenerating(true);
    try {
      for (const name of rows) {
        await api.post("/products", {
          description: name,
          parentId: splitParent.id,
          isRequirement: true,
        });
      }
      toast.success(
        t("crm.designOrders.splitSuccess", { count: rows.length }),
      );
      await load();
      setSplitOpen(false);
    } catch {
      toast.error(t("crm.saveFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const loadOlderChatter = async (oldest: ChatterMessage) => {
    const r = await api.get<{ messages: ChatterMessage[]; hasMore: boolean }>(
      `/crm/deals/${dealId}/chatter?limit=30&before=${encodeURIComponent(oldest.createdAt ?? "")}`,
    );
    return {
      messages: r.data.messages.map((m) => ({
        ...m,
        sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
      })),
      hasMore: r.data.hasMore,
    };
  };
  const loadLatestChatter = async () => {
    const r = await api.get<{ messages: ChatterMessage[]; hasMore: boolean }>(
      `/crm/deals/${dealId}/chatter?limit=30`,
    );
    return {
      messages: r.data.messages.map((m) => ({
        ...m,
        sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
      })),
      hasMore: r.data.hasMore,
    };
  };
  const handleChatterSend = async (text: string): Promise<ChatterMessage | void> => {
    const r = await api.post<ChatterMessage>(`/crm/deals/${dealId}/chatter`, { text });
    return {
      ...r.data,
      sentAt: r.data.createdAt ? Date.parse(r.data.createdAt) : undefined,
    };
  };
  const handleChatterRecall = async (msgId: string) => {
    await api.delete(`/crm/deals/${dealId}/chatter/${msgId}`);
  };

  const statusLabel = (s: string) =>
    (DESIGN_STATUS_KEYS as readonly string[]).includes(s)
      ? t(`crm.designOrders.${s}`)
      : s;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageMeta
        title={dealTitle ?? t("crm.designOrders.title")}
        description={dealTitle ? t("crm.designOrders.title") : undefined}
        back={() => navigate(`/crm/deals/${dealId}`)}
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-12">
        {/* 左：设计单列表 + 历史与评论 */}
        <div className="flex min-h-0 flex-col gap-4 lg:col-span-3">
          <Card className="flex h-[42%] shrink-0 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-1 pt-4">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base font-semibold text-foreground">
                  {t("crm.designOrders.listTitle")}
                </h2>
                {!loading && items.length > 0 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => {
                    resetForm();
                    setSelectedId(null);
                  }}
                  aria-label={t("crm.designOrders.add")}
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setDecomposeOpen(true)}
                  aria-label={t("crm.designOrders.decompose")}
                >
                  <Boxes className="size-4" />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
              {loading && (
                <div className="flex flex-col gap-2 py-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              )}
              {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
                  <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <UserRound className="size-5" />
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {t("crm.designOrders.empty")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("crm.designOrders.emptyHint")}
                  </p>
                </div>
              )}
              {!loading &&
                items.map((d) => (
                  <div
                    key={d.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => startEdit(d)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") startEdit(d);
                    }}
                    className={`group -mx-2 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                      selectedId === d.id
                        ? "bg-primary/10"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {d.productName}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            STATUS_CHIP[d.status] ??
                            "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {statusLabel(d.status)}
                        </span>
                        {d.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {d.dueDate.slice(0, 10)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(d.id);
                      }}
                      aria-label={t("crm.designOrders.delete")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
            </div>
          </Card>

          {/* 历史与评论 */}
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
                {initialChatter && dealId ? (
                  <Chatter
                    key={dealId}
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

        {/* 中：设计单流（竖向卡片） */}
        <div className="min-h-0 lg:col-span-5">
          <Card className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {t("crm.designOrders.feed")}
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </div>
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
                    <UserRound className="size-5" />
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {t("crm.designOrders.empty")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("crm.designOrders.emptyHint")}
                  </p>
                </div>
              )}
              {!loading &&
                items.map((d) => {
                  const feedImgs = [
                    ...(d.mainImage ?? []),
                    ...(d.threeViews ?? []),
                  ].slice(0, 6);
                  return (
                    <div
                      key={d.id}
                      onClick={() => startEdit(d)}
                      className={`mb-4 cursor-pointer rounded-xl bg-card p-4 shadow-card transition hover:shadow-md ${
                        selectedId === d.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-foreground">
                          {d.productName}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            STATUS_CHIP[d.status] ??
                            "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {statusLabel(d.status)}
                        </span>
                      </div>
                      {d.productType && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {d.productType}
                        </p>
                      )}
                      {feedImgs.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {feedImgs.map((a) => (
                            <a
                              key={a.url}
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img
                                src={a.url}
                                alt={a.name}
                                className="size-12 rounded-md border border-border object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex flex-col gap-1.5 text-sm">
                        {d.assistant && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {t("crm.designOrders.assistant")}
                            </span>
                            <span className="truncate text-foreground">
                              {d.assistant.name}
                            </span>
                          </div>
                        )}
                        {d.dueDate && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {t("crm.designOrders.dueDate")}
                            </span>
                            <span className="tabular-nums text-foreground">
                              {d.dueDate.slice(0, 10)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">
                            {t("crm.designOrders.sampleFee")}
                          </span>
                          <span
                            className={`font-medium ${d.sampleFee ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {d.sampleFee
                              ? t("crm.designOrders.sampleFeeYes")
                              : t("crm.designOrders.sampleFeeNo")}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(d.id);
                          }}
                          aria-label={t("crm.designOrders.delete")}
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

        {/* 右：设计单编辑面板（新增/编辑共用） */}
        <div className="min-h-0 lg:col-span-4">
          <Card className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="shrink-0 px-5 pb-2 pt-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {selectedId ? t("crm.designOrders.edit") : t("crm.designOrders.add")}
              </h2>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>
                    {t("crm.designOrders.product")}
                    <span className="ml-0.5 text-destructive">*</span>
                  </Label>
                  <Picker
                    records={productRecords}
                    value={productId || null}
                    searchMoreTitle={t("crm.designOrders.product")}
                    placeholder={t("crm.designOrders.productRequired")}
                    onChange={(rec) => {
                      setProductId(rec?.id ?? "");
                      // 产品与产品名称同义：选品即定名
                      if (rec) setProductName(rec.label);
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>
                    {t("crm.designOrders.productType")}
                    <span className="ml-0.5 text-destructive">*</span>
                  </Label>
                  <Picker
                    records={productTypeRecords}
                    value={productType || null}
                    searchMoreTitle={t("crm.designOrders.productType")}
                    placeholder={t("crm.designOrders.productTypePlaceholder")}
                    onChange={(rec) => setProductType(rec?.id ?? "")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t("crm.designOrders.assistant")}</Label>
                  <Picker
                    records={assistantRecords}
                    value={assistantId}
                    searchMoreTitle={t("crm.designOrders.assistant")}
                    placeholder={t("crm.designOrders.assistantPlaceholder")}
                    onChange={(rec) => setAssistantId(rec?.id ?? null)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t("crm.designOrders.status")}</Label>
                  <Picker
                    records={statusRecords}
                    value={status}
                    searchMoreTitle={t("crm.designOrders.status")}
                    onChange={(rec) => setStatus(rec?.id ?? "draft")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t("crm.designOrders.dueDate")}</Label>
                  <DatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder={t("crm.designOrders.dueDate")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t("crm.designOrders.sampleFee")}</Label>
                  <label className="flex h-9 cursor-pointer items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={sampleFee}
                      onCheckedChange={(v) => setSampleFee(v === true)}
                    />
                    {t("crm.designOrders.sampleFeeYes")}
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.designOrders.mainImage")}</Label>
                <AttachmentUpload value={mainImage} onChange={setMainImage} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.designOrders.threeViews")}</Label>
                <AttachmentUpload value={threeViews} onChange={setThreeViews} />
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 border-t border-border p-4">
              <Button onClick={submit} disabled={saving}>
                {saving ? (
                  t("common.loading")
                ) : selectedId ? (
                  t("common.save")
                ) : (
                  <>
                    <Plus className="size-4" />
                    {t("crm.designOrders.add")}
                  </>
                )}
              </Button>
              {selectedId && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    resetForm();
                    setSelectedId(null);
                  }}
                >
                  {t("crm.designOrders.add")}
                </Button>
              )}
              {selectedId && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const cur = items.find((x) => x.id === selectedId);
                    if (cur) startEdit(cur);
                  }}
                >
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 拆解：需求产品 → 设计单 */}
      <Dialog open={decomposeOpen} onOpenChange={setDecomposeOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("crm.designOrders.decomposeTitle")}</DialogTitle>
            <DialogDescription>{t("crm.designOrders.decomposeHint")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("crm.designOrders.decomposeType")}</Label>
              <Select
                value={decomposeType}
                onValueChange={(v) => setDecomposeType(String(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DESIGN_TYPES.map((tp) => (
                    <SelectItem key={tp} value={tp}>
                      {tp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              {decomposeCandidates.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("crm.designOrders.decomposeEmpty")}
                </p>
              )}
              {decomposeCandidates.map((p) => {
                const done = existingProductIds.has(p.id);
                const parent = p.parentId
                  ? products.find((x) => x.id === p.parentId)
                  : null;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {p.name || p.description || p.id}
                      </p>
                      {parent && (
                        <p className="truncate text-xs text-muted-foreground">
                          {t("crm.designOrders.split")} · {parent.name || parent.id}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {done ? (
                        <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {t("crm.designOrders.generated")}
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={generating}
                          onClick={() => generateOne(p)}
                        >
                          {t("crm.designOrders.add")}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title={t("crm.designOrders.split")}
                        onClick={() => openSplit(p)}
                        aria-label={t("crm.designOrders.split")}
                      >
                        <Split className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDecomposeOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={generateAll} disabled={generating}>
              <Boxes className="size-4" />
              {t("crm.designOrders.generateAll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拆分：成套 / 组合产品 → 多个子产品 */}
      <Dialog open={splitOpen} onOpenChange={setSplitOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("crm.designOrders.splitTitle")}</DialogTitle>
            <DialogDescription>
              {t("crm.designOrders.splitHint")}
              {splitParent ? `：${splitParent.name}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {splitRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={row.name}
                  onChange={(e) =>
                    setSplitRows((rs) =>
                      rs.map((r, i) =>
                        i === idx ? { name: e.target.value } : r,
                      ),
                    )
                  }
                  placeholder={t("crm.designOrders.splitName")}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  disabled={splitRows.length <= 1}
                  onClick={() =>
                    setSplitRows((rs) => rs.filter((_, i) => i !== idx))
                  }
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => setSplitRows((rs) => [...rs, { name: "" }])}
            >
              <Plus className="size-4" />
              {t("crm.designOrders.splitAddRow")}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSplitOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={confirmSplit} disabled={generating}>
              {t("crm.designOrders.splitConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("crm.designOrders.delete")}</DialogTitle>
            <DialogDescription>
              {t("crm.designOrders.deleteConfirm", {
                name: items.find((x) => x.id === deleteId)?.productName ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("common.ok")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
