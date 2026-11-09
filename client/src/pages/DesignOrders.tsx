import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Boxes, Pencil, Plus, Split, Trash2, UserRound, Wallet } from "lucide-react";
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
  designFeeAmount: number | null;
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 拆解（需求产品 → 设计单）与拆分（成套产品 → 多个子产品）
  const [decomposeOpen, setDecomposeOpen] = useState(false);
  const [decomposeType, setDecomposeType] = useState<string>(DESIGN_TYPES[1]);
  const [generating, setGenerating] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitParent, setSplitParent] = useState<{ id: string; name: string } | null>(null);
  const [splitRows, setSplitRows] = useState<{ name: string }[]>([]);

  // 自动拆解开关（全局设置，由 Settings 控制）：进入页面自动为本商机所有产品需求建草稿设计单
  const [autoDecompose, setAutoDecompose] = useState(false);

  // 表单
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [designFeeAmount, setDesignFeeAmount] = useState("");
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
        api.get<{ productId?: string | null; linesJson?: string | null }>(
          `/crm/deals/${dealId}`,
        ),
      ]);
      setItems(list.data);
      setProducts(prod.data ?? []);
      setDesigners((contacts.data ?? []).filter((c) => c.position === "设计"));

      // 收敛「需求产品」到本商机：主产品 + 订单明细行引用的产品
      const d = dealRes.data;
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
    setDesignFeeAmount("");
    setMainImage([]);
    setThreeViews([]);
    setEditingId(null);
  };

  const startEdit = (d: DesignOrderItem) => {
    setEditingId(d.id);
    setProductId(d.productId);
    setProductName(d.productName);
    setProductType(d.productType);
    setAssistantId(d.assistantId ?? null);
    setStatus(d.status);
    setDueDate(fromISODate(d.dueDate));
    setDesignFeeAmount(d.designFeeAmount != null ? String(d.designFeeAmount) : "");
    setMainImage(d.mainImage ?? []);
    setThreeViews(d.threeViews ?? []);
    setDialogOpen(true);
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
      designFeeAmount: designFeeAmount.trim() === "" ? undefined : Number(designFeeAmount),
      mainImage,
      threeViews,
    };
    if (!editingId) {
      try {
        await api.post("/design-orders", body);
        toast.success(t("crm.designOrders.createSuccess"));
        setDialogOpen(false);
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
      await api.patch(`/design-orders/${editingId}`, body);
      toast.success(t("crm.designOrders.saveSuccess"));
      setDialogOpen(false);
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

  // —— 拆解：需求产品 → 设计单 ——
  const requirementProducts = useMemo(
    () => products.filter((p) => p.isRequirement),
    [products],
  );
  const dealRequirementProducts = useMemo(
    () => requirementProducts.filter((p) => dealProductIds.has(p.id)),
    [requirementProducts, dealProductIds],
  );
  // 严格只认「本商机里的产品需求」：需求产品 ∩ 本商机引用的产品
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
        title={t("crm.designOrders.title")}
        description={t("crm.designOrders.listTitle")}
      />
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/crm/deals/${dealId}`)}
          aria-label={t("common.back")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          {t("crm.designOrders.title")}
        </h1>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-10">
        <div className="flex min-h-0 flex-col gap-4 lg:col-span-6">
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {t("crm.designOrders.listTitle")}
                </h2>
                {!loading && items.length > 0 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  {t("crm.designOrders.add")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDecomposeOpen(true)}
                >
                  <Boxes className="size-4" />
                  {t("crm.designOrders.decompose")}
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
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
                    className="group -mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {d.productName}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            STATUS_CHIP[d.status] ??
                            "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {statusLabel(d.status)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {d.productType}
                        </span>
                        {d.assistant && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <UserRound className="size-3.5" />
                            {d.assistant.name}
                          </span>
                        )}
                        {d.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {d.dueDate.slice(0, 10)}
                          </span>
                        )}
                      </div>
                      {(d.mainImage?.length > 0 || d.threeViews?.length > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {[...(d.mainImage ?? []), ...(d.threeViews ?? [])]
                            .slice(0, 4)
                            .map((a) => (
                              <a key={a.url} href={a.url} target="_blank" rel="noreferrer">
                                <img
                                  src={a.url}
                                  alt={a.name}
                                  className="size-10 rounded-md border border-border object-cover"
                                />
                              </a>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="inline-flex items-center gap-1 font-heading text-base font-semibold tabular-nums text-foreground">
                        <Wallet className="size-3.5 text-muted-foreground" />
                        {d.designFeeAmount != null
                          ? `¥${d.designFeeAmount.toFixed(2)}`
                          : "—"}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => startEdit(d)}
                          aria-label={t("crm.designOrders.edit")}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => setDeleteId(d.id)}
                          aria-label={t("crm.designOrders.delete")}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        <div className="min-h-0 lg:col-span-4">
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("crm.designOrders.edit")
                : t("crm.designOrders.add")}
            </DialogTitle>
            <DialogDescription>{t("crm.designOrders.listTitle")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
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
                    if (rec && !productName.trim()) setProductName(rec.label);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>
                  {t("crm.designOrders.productName")}
                  <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder={t("crm.designOrders.productName")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>
                  {t("crm.designOrders.productType")}
                  <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Select
                  value={productType || null}
                  onValueChange={(v) => setProductType(v ? String(v) : "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("crm.designOrders.productTypePlaceholder")} />
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
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.designOrders.assistant")}</Label>
                <Select
                  value={assistantId || null}
                  onValueChange={(v) => setAssistantId(v ? String(v) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("crm.designOrders.assistantPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {designers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.designOrders.status")}</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(String(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGN_STATUS_KEYS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`crm.designOrders.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>{t("crm.designOrders.designFeeAmount")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={designFeeAmount}
                  onChange={(e) => setDesignFeeAmount(e.target.value)}
                  placeholder="0.00"
                />
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

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submit} disabled={saving}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
