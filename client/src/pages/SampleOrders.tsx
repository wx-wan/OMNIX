import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Pencil, Plus, Trash2, UserRound } from "lucide-react";
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

interface DesignOrderLite {
  id: string;
  productName: string;
  status: string;
  productId: string;
}

interface SampleOrderItem {
  id: string;
  dealId: string;
  productId?: string | null;
  designOrderId: string;
  designOrder?: {
    id: string;
    productName: string;
    status: string;
    productId: string;
  } | null;
  sampleType: string;
  responsibleId?: string | null;
  responsible?: { id: string; name: string } | null;
  assistantId?: string | null;
  assistant?: { id: string; name: string } | null;
  status: string;
  colorCode?: string | null;
  quantity: number;
  craft?: string | null;
  material?: string | null;
  hardness?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  requiredCompletion?: string | null;
  orderDate?: string | null;
  functionalReq?: string | null;
  packagingImage: Attachment[];
  engravingImage: Attachment[];
  otherAttachments: Attachment[];
  acceptanceCriteria?: string | null;
  packagingLength?: number | null;
  packagingWidth?: number | null;
  packagingHeight?: number | null;
  sampleFiles: Attachment[];
  trackingNo?: string | null;
  recipient?: string | null;
  createdAt: string;
  updatedAt: string;
}

const SAMPLE_TYPES = [
  "新品开发样",
  "新品产前确认样",
  "老品产前确认样",
  "模种样",
  "3D手工上色样",
  "实验室测试样",
  "参展样",
  "大货样",
  "工厂内测样",
  "包装样",
  "组合样",
] as const;

const SAMPLE_STATUS_KEYS = [
  "pending",
  "sampling",
  "shipped",
  "confirmed",
  "rejected",
] as const;

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  sampling: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  shipped: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const toISODate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
const fromISODate = (s?: string | null) => (s ? new Date(s) : null);

export default function SampleOrders() {
  const { id: dealId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [items, setItems] = useState<SampleOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [designOrders, setDesignOrders] = useState<DesignOrderLite[]>([]);
  const [products, setProducts] = useState<
    { id: string; name: string | null; description?: string | null; image?: string | null; unit?: string | null }[]
  >([]);
  const [expediters, setExpediters] = useState<{ id: string; name: string }[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [designOrderId, setDesignOrderId] = useState("");
  const [productId, setProductId] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [status, setStatus] = useState("pending");
  const [colorCode, setColorCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [craft, setCraft] = useState("");
  const [material, setMaterial] = useState("");
  const [hardness, setHardness] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [requiredCompletion, setRequiredCompletion] = useState<Date | null>(null);
  const [orderDate, setOrderDate] = useState<Date | null>(null);
  const [functionalReq, setFunctionalReq] = useState("");
  const [packagingImage, setPackagingImage] = useState<Attachment[]>([]);
  const [engravingImage, setEngravingImage] = useState<Attachment[]>([]);
  const [otherAttachments, setOtherAttachments] = useState<Attachment[]>([]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [packagingLength, setPackagingLength] = useState("");
  const [packagingWidth, setPackagingWidth] = useState("");
  const [packagingHeight, setPackagingHeight] = useState("");
  const [sampleFiles, setSampleFiles] = useState<Attachment[]>([]);
  const [trackingNo, setTrackingNo] = useState("");
  const [recipient, setRecipient] = useState("");

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
      const [list, dos, prod, contacts] = await Promise.all([
        api.get<SampleOrderItem[]>(`/sample-orders?dealId=${dealId}`),
        api.get<DesignOrderLite[]>(`/design-orders?dealId=${dealId}`),
        api.get<{
          id: string;
          name: string | null;
          description?: string | null;
          image?: string | null;
          unit?: string | null;
        }[]>("/products"),
        api.get<{ id: string; name: string; position?: string | null }[]>(
          "/contacts?type=supplier",
        ),
      ]);
      setItems(list.data);
      setDesignOrders(dos.data ?? []);
      setProducts(prod.data ?? []);
      setExpediters((contacts.data ?? []).filter((c) => c.position === "跟单"));
    } catch {
      toast.error(t("crm.sampleOrders.loadFailed"));
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
    setDesignOrderId("");
    setProductId("");
    setSampleType("");
    setAssistantId(null);
    setStatus("pending");
    setColorCode("");
    setQuantity("1");
    setCraft("");
    setMaterial("");
    setHardness("");
    setLength("");
    setWidth("");
    setHeight("");
    setRequiredCompletion(null);
    setOrderDate(null);
    setFunctionalReq("");
    setPackagingImage([]);
    setEngravingImage([]);
    setOtherAttachments([]);
    setAcceptanceCriteria("");
    setPackagingLength("");
    setPackagingWidth("");
    setPackagingHeight("");
    setSampleFiles([]);
    setTrackingNo("");
    setRecipient("");
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const startEdit = (s: SampleOrderItem) => {
    setEditingId(s.id);
    setDesignOrderId(s.designOrderId);
    setProductId(s.productId ?? "");
    setSampleType(s.sampleType);
    setAssistantId(s.assistantId ?? null);
    setStatus(s.status);
    setColorCode(s.colorCode ?? "");
    setQuantity(String(s.quantity ?? 1));
    setCraft(s.craft ?? "");
    setMaterial(s.material ?? "");
    setHardness(s.hardness ?? "");
    setLength(s.length != null ? String(s.length) : "");
    setWidth(s.width != null ? String(s.width) : "");
    setHeight(s.height != null ? String(s.height) : "");
    setRequiredCompletion(fromISODate(s.requiredCompletion));
    setOrderDate(fromISODate(s.orderDate));
    setFunctionalReq(s.functionReq ?? "");
    setPackagingImage(s.packagingImage ?? []);
    setEngravingImage(s.engravingImage ?? []);
    setOtherAttachments(s.otherAttachments ?? []);
    setAcceptanceCriteria(s.acceptanceCriteria ?? "");
    setPackagingLength(s.packagingLength != null ? String(s.packagingLength) : "");
    setPackagingWidth(s.packagingWidth != null ? String(s.packagingWidth) : "");
    setPackagingHeight(s.packagingHeight != null ? String(s.packagingHeight) : "");
    setSampleFiles(s.sampleFiles ?? []);
    setTrackingNo(s.trackingNo ?? "");
    setRecipient(s.recipient ?? "");
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!designOrderId)
      return toast.error(t("crm.sampleOrders.designOrderRequired"));
    if (!sampleType)
      return toast.error(t("crm.sampleOrders.sampleTypeRequired"));
    setSaving(true);
    const body = {
      dealId: dealId!,
      designOrderId,
      productId: productId || undefined,
      sampleType,
      assistantId: assistantId ?? undefined,
      status,
      colorCode: colorCode || undefined,
      quantity: Number(quantity) || 1,
      craft: craft || undefined,
      material: material || undefined,
      hardness: hardness || undefined,
      length: length ? Number(length) : undefined,
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      requiredCompletion: toISODate(requiredCompletion),
      orderDate: toISODate(orderDate),
      functionalReq: functionalReq || undefined,
      packagingImage,
      engravingImage,
      otherAttachments,
      acceptanceCriteria: acceptanceCriteria || undefined,
      packagingLength: packagingLength ? Number(packagingLength) : undefined,
      packagingWidth: packagingWidth ? Number(packagingWidth) : undefined,
      packagingHeight: packagingHeight ? Number(packagingHeight) : undefined,
      sampleFiles,
      trackingNo: trackingNo || undefined,
      recipient: recipient || undefined,
    };
    try {
      if (editingId) {
        await api.patch(`/sample-orders/${editingId}`, body);
        toast.success(t("crm.sampleOrders.saveSuccess"));
      } else {
        await api.post("/sample-orders", body);
        toast.success(t("crm.sampleOrders.createSuccess"));
      }
      setDialogOpen(false);
      resetForm();
      await load();
      setRefreshToken((k) => k + 1);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(msg ?? t("crm.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/sample-orders/${deleteId}`);
      toast.success(t("common.success"));
      setDeleteId(null);
      await load();
      setRefreshToken((k) => k + 1);
    } catch {
      toast.error(t("crm.saveFailed"));
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
    (SAMPLE_STATUS_KEYS as readonly string[]).includes(s)
      ? t(`crm.sampleOrders.${s}`)
      : s;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageMeta
        title={t("crm.sampleOrders.title")}
        description={t("crm.sampleOrders.listTitle")}
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
          {t("crm.sampleOrders.title")}
        </h1>
        <div className="ml-auto">
          <Button onClick={openAdd}>
            <Plus className="size-4" />
            {t("crm.sampleOrders.add")}
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-10">
        <div className="flex min-h-0 flex-col gap-4 lg:col-span-6">
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {t("crm.sampleOrders.listTitle")}
                </h2>
                {!loading && items.length > 0 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                )}
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
                    {t("crm.sampleOrders.empty")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("crm.sampleOrders.emptyHint")}
                  </p>
                </div>
              )}
              {!loading &&
                items.map((s) => (
                  <div
                    key={s.id}
                    className="group -mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {s.sampleType}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            STATUS_CHIP[s.status] ??
                            "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {statusLabel(s.status)}
                        </span>
                        {s.designOrder && (
                          <span className="text-xs text-muted-foreground">
                            {s.designOrder.productName}
                          </span>
                        )}
                        {s.assistant && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <UserRound className="size-3.5" />
                            {s.assistant.name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          ×{s.quantity}
                        </span>
                      </div>
                      {(s.packagingImage?.length > 0 ||
                        s.engravingImage?.length > 0 ||
                        s.sampleFiles?.length > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {[
                            ...(s.sampleFiles ?? []),
                            ...(s.packagingImage ?? []),
                            ...(s.engravingImage ?? []),
                          ]
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
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => startEdit(s)}
                        aria-label={t("crm.sampleOrders.edit")}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                        onClick={() => setDeleteId(s.id)}
                        aria-label={t("crm.sampleOrders.delete")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("crm.sampleOrders.edit")
                : t("crm.sampleOrders.add")}
            </DialogTitle>
            <DialogDescription>{t("crm.sampleOrders.listTitle")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* 关联 / 类型 / 人员 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>
                  {t("crm.sampleOrders.designOrder")}
                  <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Select
                  value={designOrderId || null}
                  onValueChange={(v) => {
                    setDesignOrderId(v ? String(v) : "");
                    const d = designOrders.find((x) => x.id === v);
                    if (d) setProductId(d.productId);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("crm.sampleOrders.designOrderPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {designOrders
                      .filter((d) => d.status === "approved")
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.productName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.product")}</Label>
                <Picker
                  records={productRecords}
                  value={productId || null}
                  searchMoreTitle={t("crm.sampleOrders.product")}
                  placeholder={t("crm.designOrders.productRequired")}
                  onChange={(rec) => setProductId(rec?.id ?? "")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>
                  {t("crm.sampleOrders.sampleType")}
                  <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Select
                  value={sampleType || null}
                  onValueChange={(v) => setSampleType(v ? String(v) : "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("crm.sampleOrders.sampleTypePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_TYPES.map((tp) => (
                      <SelectItem key={tp} value={tp}>
                        {tp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.assistant")}</Label>
                <Select
                  value={assistantId || null}
                  onValueChange={(v) => setAssistantId(v ? String(v) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("crm.sampleOrders.assistantPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {expediters.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.status")}</Label>
                <Select value={status} onValueChange={(v) => setStatus(String(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_STATUS_KEYS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`crm.sampleOrders.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.quantity")}</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.orderDate")}</Label>
                <DatePicker
                  value={orderDate}
                  onChange={setOrderDate}
                  placeholder={t("crm.sampleOrders.orderDate")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.requiredCompletion")}</Label>
                <DatePicker
                  value={requiredCompletion}
                  onChange={setRequiredCompletion}
                  placeholder={t("crm.sampleOrders.requiredCompletion")}
                />
              </div>
            </div>

            {/* 规格 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.colorCode")}</Label>
                <Input
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.craft")}</Label>
                <Input value={craft} onChange={(e) => setCraft(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.material")}</Label>
                <Input value={material} onChange={(e) => setMaterial(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.hardness")}</Label>
                <Input value={hardness} onChange={(e) => setHardness(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.length")}</Label>
                <Input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.width")}</Label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.height")}</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t("crm.sampleOrders.functionalReq")}</Label>
              <Textarea
                value={functionalReq}
                onChange={(e) => setFunctionalReq(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("crm.sampleOrders.acceptanceCriteria")}</Label>
              <Textarea
                value={acceptanceCriteria}
                onChange={(e) => setAcceptanceCriteria(e.target.value)}
                rows={2}
              />
            </div>

            {/* 包装尺寸 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.packagingLength")}</Label>
                <Input
                  type="number"
                  value={packagingLength}
                  onChange={(e) => setPackagingLength(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.packagingWidth")}</Label>
                <Input
                  type="number"
                  value={packagingWidth}
                  onChange={(e) => setPackagingWidth(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.packagingHeight")}</Label>
                <Input
                  type="number"
                  value={packagingHeight}
                  onChange={(e) => setPackagingHeight(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.trackingNo")}</Label>
                <Input value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("crm.sampleOrders.recipient")}</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} />
              </div>
            </div>

            {/* 附件分桶 */}
            <div className="flex flex-col gap-1.5">
              <Label>{t("crm.sampleOrders.packagingImage")}</Label>
              <AttachmentUpload value={packagingImage} onChange={setPackagingImage} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("crm.sampleOrders.engravingImage")}</Label>
              <AttachmentUpload value={engravingImage} onChange={setEngravingImage} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("crm.sampleOrders.sampleFiles")}</Label>
              <AttachmentUpload value={sampleFiles} onChange={setSampleFiles} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("crm.sampleOrders.otherAttachments")}</Label>
              <AttachmentUpload value={otherAttachments} onChange={setOtherAttachments} />
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

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("crm.sampleOrders.delete")}</DialogTitle>
            <DialogDescription>
              {t("crm.sampleOrders.deleteConfirm", {
                type: items.find((x) => x.id === deleteId)?.sampleType ?? "",
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
