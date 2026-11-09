import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Layers,
  GitBranch,
  History,
  Plus,
  Trash2,
  ClipboardList,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PageMeta } from "@/components/layout/PageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AttachmentUpload, type Attachment } from "@/components/ui/attachment-upload";
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

interface ProductDetail {
  id: string;
  description: string | null;
  name: string | null;
  image?: string | null;
  category?: string | null;
  mode?: string | null;
  process?: string | null;
  audience?: string | null;
  price?: number | null;
  costPrice?: number | null;
  tax?: number | null;
  quantity?: number;
  unit?: string | null;
  isRequirement?: boolean;
  status?: string;
  partNo?: string | null;
  revision?: string;
  releasedAt?: string | null;
  obsoletedAt?: string | null;
  drawings?: Attachment[] | null;
  categoryId?: string | null;
  specs?: Record<string, unknown> | null;
  linked?: boolean;
}

interface BomRow {
  id: string;
  child: {
    id: string;
    name: string | null;
    description: string | null;
    image: string | null;
    partNo: string | null;
    revision: string;
    status: string;
    unit: string | null;
  };
  quantity: number;
  position: string | null;
  note: string | null;
}

interface RevisionItem {
  id: string;
  description: string | null;
  revision: string;
  status: string;
  partNo: string | null;
}

interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
  specTemplate: unknown;
  children: CategoryNode[];
}

interface SpecAttr {
  key: string;
  label: string;
  type?: string;
  unit?: string;
  options?: string[];
  required?: boolean;
}

interface EcoItem {
  id: string;
  number: string;
  title: string;
  description: string | null;
  status: string;
  reason?: string | null;
  impact?: string | null;
  _count?: { products: number };
}

const ECO_STATUS_KEYS = [
  "draft",
  "review",
  "approved",
  "implemented",
  "closed",
  "cancelled",
] as const;

const ECO_STATUS_CHIP: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  review: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  implemented: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  closed: "bg-slate-400/10 text-slate-500",
  cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

// 与后端 ECO_TRANSITIONS 保持一致
const ECO_TRANSITIONS: Record<string, string[]> = {
  draft: ["review", "cancelled"],
  review: ["approved", "cancelled"],
  approved: ["implemented", "cancelled"],
  implemented: ["closed"],
  closed: [],
  cancelled: ["draft"],
};

const ecoStatusLabel = (t: (k: string) => string, s: string) =>
  (ECO_STATUS_KEYS as readonly string[]).includes(s)
    ? t(`product.ecoStatus.${s}`)
    : s;

function findCategory(
  nodes: CategoryNode[],
  id: string,
): CategoryNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const f = findCategory(n.children, id);
    if (f) return f;
  }
  return null;
}

const PRODUCT_STATUS_KEYS = [
  "requirement",
  "designing",
  "reviewing",
  "released",
  "obsolete",
] as const;

const STATUS_CHIP: Record<string, string> = {
  requirement: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  designing: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  reviewing: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  released: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  obsolete: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

// 与后端 PRODUCT_TRANSITIONS 保持一致：允许的状态流转
const TRANSITIONS: Record<string, string[]> = {
  requirement: ["designing", "obsolete"],
  designing: ["reviewing", "obsolete"],
  reviewing: ["released", "designing", "obsolete"],
  released: ["obsolete"],
  obsolete: ["released"],
};

const statusLabel = (t: (k: string) => string, s: string) =>
  (PRODUCT_STATUS_KEYS as readonly string[]).includes(s)
    ? t(`product.status.${s}`)
    : s;

function AttrRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

export default function ProductDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [p, setP] = useState<ProductDetail | null>(null);
  const [bom, setBom] = useState<BomRow[]>([]);
  const [whereUsed, setWhereUsed] = useState<
    { id: string; parent: { id: string; description: string | null; partNo: string | null; revision: string; status: string } }[]
  >([]);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 审计流
  const [initialChatter, setInitialChatter] = useState<ChatterMessage[] | null>(null);
  const [chatterHasMore, setChatterHasMore] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  // BOM 添加弹窗
  const [addOpen, setAddOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<SelectRecord[]>([]);
  const [pickerId, setPickerId] = useState("");
  const [qty, setQty] = useState("1");
  const [pos, setPos] = useState("");
  const [saving, setSaving] = useState(false);

  // 分类与参数化规格
  const [catTree, setCatTree] = useState<CategoryNode[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, unknown>>({});
  // 工程变更 ECO
  const [ecos, setEcos] = useState<EcoItem[]>([]);
  const [ecoOpen, setEcoOpen] = useState(false);
  const [ecoForm, setEcoForm] = useState<{
    title: string;
    description: string;
    reason: string;
    impact: string;
  }>({ title: "", description: "", reason: "", impact: "" });
  const [ecoSaving, setEcoSaving] = useState(false);

  const currentStatus = p?.status ?? "requirement";
  const nextStates = TRANSITIONS[currentStatus] ?? [];

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await api.get<ProductDetail & {
        bom: BomRow[];
        whereUsed: typeof whereUsed;
        revisions: RevisionItem[];
      }>(`/products/${id}`);
      const d = r.data;
      setP(d);
      setBom(d.bom ?? []);
      setWhereUsed(d.whereUsed ?? []);
      setRevisions(d.revisions ?? []);
      setSpecValues((d.specs as Record<string, unknown>) ?? {});
    } catch {
      toast.error(t("product.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    if (!id) return;
    api
      .get<{ messages: ChatterMessage[]; hasMore: boolean }>(
        `/products/${id}/chatter?limit=30`,
      )
      .then((r) => {
        setInitialChatter(
          (r.data.messages ?? []).map((m) => ({
            ...m,
            sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
          })),
        );
        setChatterHasMore(r.data.hasMore);
      })
      .catch(() => {});
    api
      .get<CategoryNode[]>("/product-categories")
      .then((r) => setCatTree(r.data ?? []))
      .catch(() => {});
    api
      .get<EcoItem[]>(`/engineering-changes?productId=${id}`)
      .then((r) => setEcos(r.data ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const transition = async (to: string) => {
    try {
      await api.patch(`/products/${id}/status`, { status: to });
      toast.success(t("product.transitionSuccess", { status: statusLabel(t, to) }));
      await load();
      setRefreshToken((k) => k + 1);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t("crm.saveFailed"));
    }
  };

  const loadProducts = async () => {
    const r = await api.get<(ProductDetail & { id: string })[]>(
      "/products?includeArchived=true",
    );
    const data = Array.isArray(r.data) ? r.data : ((r.data as { data?: unknown }).data as (ProductDetail & { id: string })[]);
    setAllProducts(
      (data ?? []).map((x) => ({
        id: x.id,
        label: x.description || x.name || x.id,
        sublabel: x.partNo ? `${x.partNo} · ${x.revision ?? "A"}` : x.revision,
        image: x.image ?? undefined,
      })),
    );
  };

  const openAdd = () => {
    setPickerId("");
    setQty("1");
    setPos("");
    void loadProducts();
    setAddOpen(true);
  };

  const saveBom = async (items: { childProductId: string; quantity: number; position?: string; note?: string }[]) => {
    setSaving(true);
    try {
      const r = await api.put<BomRow[]>(`/products/${id}/bom`, { items });
      setBom(r.data ?? []);
      toast.success(t("product.bomSaved"));
    } catch {
      toast.error(t("crm.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const addBomItem = () => {
    if (!pickerId) return toast.error(t("product.bomChildRequired"));
    const existing = bom.map((b) => ({
      childProductId: b.child.id,
      quantity: b.quantity,
      position: b.position ?? undefined,
      note: b.note ?? undefined,
    }));
    void saveBom([
      ...existing,
      {
        childProductId: pickerId,
        quantity: Number(qty) || 1,
        position: pos || undefined,
      },
    ]);
    setAddOpen(false);
  };

  const removeBomItem = (childId: string) => {
    const existing = bom
      .filter((b) => b.child.id !== childId)
      .map((b) => ({
        childProductId: b.child.id,
        quantity: b.quantity,
        position: b.position ?? undefined,
        note: b.note ?? undefined,
      }));
    void saveBom(existing);
  };

  const createRevision = async () => {
    try {
      await api.post(`/products/${id}/revisions`);
      toast.success(t("product.revisionCreated"));
      await load();
      setRefreshToken((k) => k + 1);
    } catch {
      toast.error(t("crm.saveFailed"));
    }
  };

  const saveDrawings = async (value: Attachment[]) => {
    try {
      await api.patch(`/products/${id}`, { drawings: value });
      setRefreshToken((k) => k + 1);
    } catch {
      toast.error(t("crm.saveFailed"));
    }
  };

  // —— 分类与规格 ——
  const catFlat = useMemo(() => {
    const out: { id: string; label: string; name: string }[] = [];
    const walk = (nodes: CategoryNode[], prefix: string) => {
      for (const n of nodes) {
        const label = prefix ? `${prefix} / ${n.name}` : n.name;
        out.push({ id: n.id, label, name: n.name });
        walk(n.children, label);
      }
    };
    walk(catTree, "");
    return out;
  }, [catTree]);

  const selectedCat = useMemo(
    () => (p?.categoryId ? findCategory(catTree, p.categoryId) : null),
    [catTree, p?.categoryId],
  );

  const changeCategory = async (catId: string) => {
    const node = catFlat.find((c) => c.id === catId);
    try {
      await api.patch(`/products/${id}`, {
        categoryId: catId || null,
        category: node ? node.name : "",
      });
      setRefreshToken((k) => k + 1);
      await load();
    } catch {
      toast.error(t("crm.saveFailed"));
    }
  };

  const setSpec = (key: string, value: unknown) => {
    const next = { ...specValues, [key]: value };
    setSpecValues(next);
    api
      .patch(`/products/${id}`, { specs: next })
      .catch(() => toast.error(t("crm.saveFailed")));
  };

  // —— 工程变更 ECO ——
  const reloadEcos = async () => {
    try {
      const r = await api.get<EcoItem[]>(`/engineering-changes?productId=${id}`);
      setEcos(r.data ?? []);
    } catch {
      // ignore
    }
  };

  const ecoTransition = async (ecoId: string, to: string) => {
    try {
      await api.patch(`/engineering-changes/${ecoId}/status`, { status: to });
      toast.success(t("product.ecoTransitionTo", { status: ecoStatusLabel(t, to) }));
      await reloadEcos();
      setRefreshToken((k) => k + 1);
    } catch (e: unknown) {
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("crm.saveFailed"),
      );
    }
  };

  const ecoImplement = async (ecoId: string) => {
    try {
      await api.post(`/engineering-changes/${ecoId}/implement`);
      toast.success(t("product.ecoImplementSuccess"));
      await reloadEcos();
      setRefreshToken((k) => k + 1);
    } catch (e: unknown) {
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("crm.saveFailed"),
      );
    }
  };

  const createEco = async () => {
    if (!ecoForm.title.trim()) return toast.error(t("common.required"));
    setEcoSaving(true);
    try {
      await api.post("/engineering-changes", { ...ecoForm, productIds: [id] });
      toast.success(t("product.ecoCreateSuccess"));
      setEcoOpen(false);
      setEcoForm({ title: "", description: "", reason: "", impact: "" });
      await reloadEcos();
    } catch {
      toast.error(t("crm.saveFailed"));
    } finally {
      setEcoSaving(false);
    }
  };

  const loadOlderChatter = async (oldest: ChatterMessage) => {
    const r = await api.get<{ messages: ChatterMessage[]; hasMore: boolean }>(
      `/products/${id}/chatter?limit=30&before=${encodeURIComponent(oldest.createdAt ?? "")}`,
    );
    return {
      messages: (r.data.messages ?? []).map((m) => ({
        ...m,
        sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
      })),
      hasMore: r.data.hasMore,
    };
  };
  const loadLatestChatter = async () => {
    const r = await api.get<{ messages: ChatterMessage[]; hasMore: boolean }>(
      `/products/${id}/chatter?limit=30`,
    );
    return {
      messages: (r.data.messages ?? []).map((m) => ({
        ...m,
        sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
      })),
      hasMore: r.data.hasMore,
    };
  };
  const handleChatterSend = async (text: string): Promise<ChatterMessage | void> => {
    const r = await api.post<ChatterMessage>(`/products/${id}/chatter`, { text });
    return {
      ...r.data,
      sentAt: r.data.createdAt ? Date.parse(r.data.createdAt) : undefined,
    };
  };
  const handleChatterRecall = async (msgId: string) => {
    await api.delete(`/products/${id}/chatter/${msgId}`);
  };

  const pickerRecords = useMemo(
    () => allProducts.filter((x) => x.id !== id),
    [allProducts, id],
  );

  const fmtDate = (s?: string | null) => (s ? s.slice(0, 10) : "—");

  if (loading && !p) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }
  if (!p) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageMeta title={p.description || p.name || t("product.detail")} />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/products")}
          aria-label={t("common.back")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-xl font-semibold text-foreground">
            {p.description || p.name}
          </h1>
          {p.partNo && (
            <p className="text-xs text-muted-foreground">
              {p.partNo} · {t("product.revision")} {p.revision ?? "A"}
            </p>
          )}
        </div>
        <span
          className={`ml-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_CHIP[currentStatus] ?? ""}`}
        >
          {statusLabel(t, currentStatus)}
        </span>
      </div>

      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <TabsList variant="line" className="shrink-0">
          <TabsTrigger value="overview">{t("product.tabOverview")}</TabsTrigger>
          <TabsTrigger value="bom">
            <Layers className="size-4" />
            {t("product.tabBom")}
            {bom.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                {bom.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="versions">
            <GitBranch className="size-4" />
            {t("product.tabVersions")}
            {revisions.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                {revisions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="size-4" />
            {t("product.tabAudit")}
          </TabsTrigger>
          <TabsTrigger value="eco">
            <ClipboardList className="size-4" />
            {t("product.eco")}
            {ecos.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                {ecos.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 概览 */}
        <TabsContent value="overview" className="min-h-0 overflow-y-auto">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("product.attributes")}</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                <AttrRow label={t("product.mode")} value={p.mode} />
                <AttrRow label={t("product.process")} value={p.process} />
                <AttrRow label={t("product.audience")} value={p.audience} />
                <AttrRow
                  label={t("product.price")}
                  value={p.price != null ? `¥${p.price}` : undefined}
                />
                <AttrRow
                  label={t("product.costPrice")}
                  value={p.costPrice != null ? `¥${p.costPrice}` : undefined}
                />
                <AttrRow label={t("product.tax")} value={p.tax != null ? `${p.tax}%` : undefined} />
                <AttrRow
                  label={t("product.quantity")}
                  value={p.quantity != null ? `${p.quantity}${p.unit ? ` ${p.unit}` : ""}` : undefined}
                />
                <AttrRow
                  label={t("common.requirement")}
                  value={p.isRequirement ? t("common.yes") : t("common.no")}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("product.lifecycle")}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_CHIP[currentStatus] ?? ""}`}
                    >
                      {statusLabel(t, currentStatus)}
                    </span>
                    {p.releasedAt && (
                      <span className="text-xs text-muted-foreground">
                        {t("product.releasedAt")}：{fmtDate(p.releasedAt)}
                      </span>
                    )}
                    {p.obsoletedAt && (
                      <span className="text-xs text-muted-foreground">
                        {t("product.obsoletedAt")}：{fmtDate(p.obsoletedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {nextStates.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        {t("product.noTransition")}
                      </span>
                    )}
                    {nextStates.map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        onClick={() => transition(s)}
                      >
                        {t("product.transitionTo", { status: statusLabel(t, s) })}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="size-4" />
                    {t("product.category")} / {t("product.specs")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>{t("product.category")}</Label>
                    <Picker
                      records={catFlat.map((c) => ({
                        id: c.id,
                        label: c.label,
                      }))}
                      value={p.categoryId || null}
                      searchMoreTitle={t("product.category")}
                      placeholder={t("product.categoryEmpty")}
                      onChange={(rec) => changeCategory(rec?.id ?? "")}
                    />
                    {catTree.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t("product.categoryManageHint")}
                      </p>
                    )}
                  </div>

                  {selectedCat?.specTemplate &&
                  Array.isArray(selectedCat.specTemplate) &&
                  selectedCat.specTemplate.length > 0 ? (
                    <div className="flex flex-col gap-2 border-t border-border pt-2">
                      <Label>{t("product.specs")}</Label>
                      {(selectedCat.specTemplate as SpecAttr[]).map((attr) => (
                        <div key={attr.key} className="flex flex-col gap-1">
                          <Label className="text-xs font-normal text-muted-foreground">
                            {attr.label}
                            {attr.unit ? ` (${attr.unit})` : ""}
                          </Label>
                          {attr.options && attr.options.length > 0 ? (
                            <Select
                              value={(specValues[attr.key] as string) ?? ""}
                              onValueChange={(v) => setSpec(attr.key, v)}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("product.specsEmpty")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {attr.options.map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={(specValues[attr.key] as string) ?? ""}
                              onChange={(e) =>
                                setSpec(attr.key, e.target.value)
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t("product.specsEmpty")}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("product.drawings")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <AttachmentUpload
                    value={p.drawings ?? []}
                    onChange={(v) => {
                      setP((prev) => (prev ? { ...prev, drawings: v } : prev));
                      void saveDrawings(v);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* BOM */}
        <TabsContent value="bom" className="min-h-0 overflow-y-auto">
          <Card>
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <CardTitle>{t("product.bomTitle")}</CardTitle>
              <Button variant="outline" size="sm" onClick={openAdd}>
                <Plus className="size-4" />
                {t("product.bomAdd")}
              </Button>
            </div>
            <CardContent className="py-3">
              {bom.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("product.bomEmpty")}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {bom.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {b.child.description || b.child.name || b.child.id}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {b.child.partNo ? `${b.child.partNo} · ${b.child.revision} · ` : ""}
                          {t(`product.status.${b.child.status}`)} · ×{b.quantity}
                          {b.child.unit ? ` ${b.child.unit}` : ""}
                          {b.position ? ` · ${b.position}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => removeBomItem(b.child.id)}
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {t("product.whereUsed")}
                </p>
                {whereUsed.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("product.whereUsedEmpty")}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {whereUsed.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => navigate(`/products/${w.parent.id}`)}
                        className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-left transition hover:bg-muted"
                      >
                        <span className="truncate text-sm text-foreground">
                          {w.parent.description || w.parent.id}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {w.parent.partNo ? `${w.parent.partNo} · ${w.parent.revision} · ` : ""}
                          {t(`product.status.${w.parent.status}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 版本 */}
        <TabsContent value="versions" className="min-h-0 overflow-y-auto">
          <Card>
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <CardTitle>{t("product.versionsTitle")}</CardTitle>
              <Button variant="outline" size="sm" onClick={createRevision}>
                <GitBranch className="size-4" />
                {t("product.revisionNew")}
              </Button>
            </div>
            <CardContent className="py-3">
              {revisions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("product.versionsEmpty")}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {revisions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => navigate(`/products/${v.id}`)}
                      className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-left transition hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {v.description || v.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.partNo ? `${v.partNo} · ` : ""}
                          {t("product.revision")} {v.revision}
                        </p>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_CHIP[v.status] ?? ""}`}
                      >
                        {statusLabel(t, v.status)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 审计 */}
        <TabsContent value="audit" className="min-h-0">
          {initialChatter && (
            <Chatter
              fill
              className="h-full"
              initialMessages={initialChatter}
              hasMore={chatterHasMore}
              onSend={handleChatterSend}
              onRecall={handleChatterRecall}
              onLoadOlder={loadOlderChatter}
              onLoadLatest={loadLatestChatter}
              refreshToken={refreshToken}
              pollMs={15000}
            />
          )}
        </TabsContent>

        {/* 工程变更 ECO */}
        <TabsContent value="eco" className="min-h-0 overflow-y-auto">
          <Card>
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <CardTitle>{t("product.eco")}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEcoForm({ title: "", description: "", reason: "", impact: "" });
                  setEcoOpen(true);
                }}
              >
                <Plus className="size-4" />
                {t("product.ecoCreate")}
              </Button>
            </div>
            <CardContent className="py-3">
              {ecos.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("product.ecoEmpty")}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {ecos.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-lg bg-muted/40 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {e.number} · {e.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {e.description || "—"} · {t("product.ecoProductCount")}{" "}
                            {e._count?.products ?? 0}
                          </p>
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${ECO_STATUS_CHIP[e.status] ?? ""}`}
                        >
                          {ecoStatusLabel(t, e.status)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(ECO_TRANSITIONS[e.status] ?? []).map((s) => (
                          <Button
                            key={s}
                            variant="outline"
                            size="sm"
                            onClick={() => ecoTransition(e.id, s)}
                          >
                            {t("product.ecoTransitionTo", {
                              status: ecoStatusLabel(t, s),
                            })}
                          </Button>
                        ))}
                        {e.status === "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ecoImplement(e.id)}
                          >
                            {t("product.ecoImplement")}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加 BOM 子件 */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("product.bomAdd")}</DialogTitle>
            <DialogDescription>{t("product.bomAddHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("product.bomChild")}</Label>
              <Picker
                records={pickerRecords}
                value={pickerId || null}
                searchMoreTitle={t("product.bomChild")}
                placeholder={t("product.bomChildPlaceholder")}
                onChange={(rec) => setPickerId(rec?.id ?? "")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>{t("product.bomQuantity")}</Label>
                <Input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("product.bomPosition")}</Label>
                <Input value={pos} onChange={(e) => setPos(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={addBomItem} disabled={saving}>
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建工程变更 */}
      <Dialog open={ecoOpen} onOpenChange={setEcoOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("product.ecoCreateTitle")}</DialogTitle>
            <DialogDescription>{t("product.ecoCreateHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("product.ecoTitle")}</Label>
              <Input
                value={ecoForm.title}
                onChange={(e) =>
                  setEcoForm({ ...ecoForm, title: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("product.ecoDescription")}</Label>
              <Input
                value={ecoForm.description}
                onChange={(e) =>
                  setEcoForm({ ...ecoForm, description: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("product.ecoReason")}</Label>
              <Input
                value={ecoForm.reason}
                onChange={(e) =>
                  setEcoForm({ ...ecoForm, reason: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("product.ecoImpact")}</Label>
              <Input
                value={ecoForm.impact}
                onChange={(e) =>
                  setEcoForm({ ...ecoForm, impact: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEcoOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={createEco} disabled={ecoSaving}>
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
