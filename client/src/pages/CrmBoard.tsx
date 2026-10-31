import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { HeaderAction } from "@/components/layout/AppShell";
import { KanbanBoard, type KanbanItem, type KanbanPriority, type KanbanStage } from "@/components/kanban/KanbanBoard";
import { Stack } from "@/components/layout/Stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Chatter } from "@/components/chatter/Chatter";
import type { CustomerValues } from "@/components/crm/CustomerForm";
import { EMPTY_CUSTOMER } from "@/components/crm/CustomerForm";
import type { ProductValues } from "@/components/crm/ProductForm";
import { EMPTY_PRODUCT } from "@/components/crm/ProductForm";
import { CUSTOMER_TYPE_OPTIONS } from "@/components/crm/CustomerForm";
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

interface DealContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface DealDetail {
  id: string;
  title: string;
  description: string | null;
  tag: string | null;
  priority: KanbanPriority;
  amount: number | null;
  assignee: string | null;
  meta: string | null;
  stage: { id: string; title: string; accent: string };
  customer: {
    id: string;
    name: string;
    country: string | null;
    website: string | null;
    customerType: string | null;
    contacts: DealContact[];
  } | null;
  product: {
    id: string;
    name: string;
    category: string | null;
    spec: string | null;
    price: number | null;
    quantity: number | null;
    unit: string | null;
    description: string | null;
  } | null;
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

const priorityClasses: Record<KanbanPriority, string> = {
  high: "bg-red-500/10 text-red-500",
  medium: "bg-amber-500/15 text-amber-600",
  low: "bg-emerald-500/10 text-emerald-600",
};

const priorityKey: Record<KanbanPriority, string> = {
  high: "kanban.priorityHigh",
  medium: "kanban.priorityMedium",
  low: "kanban.priorityLow",
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

const typeLabel = (t: (k: string) => string, type?: string | null) =>
  type ? t(`customer.type${type[0].toUpperCase()}${type.slice(1)}`) : "";

/** 详情只读信息项（label 上、值下，参考 CRM 详情双栏布局）。 */
function InfoItem({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-sm text-foreground">{children || "—"}</span>
    </div>
  );
}

export default function CrmBoard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stages, setStages] = useState<KanbanStage[]>(FALLBACK_STAGES);
  // 服务端「线索到达」真实 id；为空时新建商机由后端默认落第一阶段
  const [leadStageId, setLeadStageId] = useState<string | null>(null);

  // 新建商机抽屉
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [dealTitle, setDealTitle] = useState("");
  const [customer, setCustomer] = useState<CustomerValues>(EMPTY_CUSTOMER);
  const [product, setProduct] = useState<ProductValues>(EMPTY_PRODUCT);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [assignee, setAssignee] = useState("");
  const [tag, setTag] = useState("");
  const [priority, setPriority] = useState<KanbanPriority>("medium");

  // 商机详情抽屉
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<DealDetail | null>(null);
  const [detailError, setDetailError] = useState(false);

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

  const openDetail = async (dealId: string) => {
    setDetailError(false);
    setDetail(null);
    setDetailOpen(true);
    try {
      const r = await api.get<DealDetail>(`/crm/deals/${dealId}`);
      setDetail(r.data);
    } catch {
      setDetailError(true);
    }
  };

  const resetForm = () => {
    setDealTitle("");
    setCustomer(EMPTY_CUSTOMER);
    setProduct(EMPTY_PRODUCT);
    setContact({ name: "", email: "", phone: "" });
    setAssignee("");
    setTag("");
    setPriority("medium");
    setError(false);
  };

  const handleCreate = async () => {
    if (!customer.name.trim() || !product.name.trim() || saving) return;
    setSaving(true);
    try {
      const primaryContact = contact.name.trim()
        ? {
            name: contact.name.trim(),
            email: contact.email.trim() || undefined,
            phone: contact.phone.trim() || undefined,
          }
        : undefined;
      await api.post("/crm/deals", {
        title: dealTitle.trim() || undefined,
        customer: { ...customer, name: customer.name.trim() },
        contact: primaryContact,
        product: {
          ...product,
          name: product.name.trim(),
          price: product.price ? Number(product.price) : undefined,
          quantity: product.quantity ? Number(product.quantity) : undefined,
        },
        assignee: assignee.trim() || undefined,
        tag: tag.trim() || undefined,
        priority,
        stageId: leadStageId ?? undefined,
      });
      setOpen(false);
      resetForm();
      load();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const primaryContact = detail?.customer?.contacts[0] ?? null;

  return (
    <Stack gap={4}>
      {/* 「新增」作为顶栏操作栏（portal 到顶栏右侧） */}
      <HeaderAction>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          <Plus />
          {t("crm.newDeal")}
        </Button>
      </HeaderAction>

      <KanbanBoard
        stages={stages}
        draggable={CRM_DRAG_ENABLED}
        onDealMove={handleMove}
        onDealClick={openDetail}
      />

      {/* 新建商机：两栏信息网格 + 产品需求区（参考 CRM 详情布局） */}
      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (v) setError(false);
        }}
      >
        <SheetContent className="sm:max-w-5xl">
          <SheetHeader>
            <SheetTitle>{t("crm.formTitle")}</SheetTitle>
            <SheetDescription>{t("crm.formDesc")}</SheetDescription>
          </SheetHeader>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deal-title">{t("crm.fieldTitle")}</Label>
              <Input
                id="deal-title"
                value={dealTitle}
                placeholder={`${customer.name.trim() || "—"} · ${product.name.trim() || "—"}`}
                onChange={(e) => setDealTitle(e.target.value)}
              />
            </div>

            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">{t("crm.basicInfo")}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-cust-name">
                    {t("customer.name")}
                    <span className="text-red-500"> *</span>
                  </Label>
                  <Input
                    id="deal-cust-name"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t("customer.customerType")}</Label>
                  <Select
                    value={customer.customerType || undefined}
                    onValueChange={(v) =>
                      setCustomer({ ...customer, customerType: v ?? "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {t(`customer.type${opt[0].toUpperCase()}${opt.slice(1)}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-contact-name">{t("contact.name")}</Label>
                  <Input
                    id="deal-contact-name"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-assignee">{t("crm.fieldAssignee")}</Label>
                  <Input
                    id="deal-assignee"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-contact-email">{t("contact.email")}</Label>
                  <Input
                    id="deal-contact-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t("crm.fieldPriority")}</Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as KanbanPriority)}
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
                  <Label htmlFor="deal-contact-phone">{t("contact.phone")}</Label>
                  <Input
                    id="deal-contact-phone"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-tag">{t("crm.fieldTag")}</Label>
                  <Input
                    id="deal-tag"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-cust-country">{t("customer.country")}</Label>
                  <Input
                    id="deal-cust-country"
                    value={customer.country}
                    onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-cust-website">{t("customer.website")}</Label>
                  <Input
                    id="deal-cust-website"
                    type="url"
                    placeholder="https://"
                    value={customer.website}
                    onChange={(e) => setCustomer({ ...customer, website: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">{t("product.panel")}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-prod-name">
                    {t("product.name")}
                    <span className="text-red-500"> *</span>
                  </Label>
                  <Input
                    id="deal-prod-name"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-prod-category">{t("product.category")}</Label>
                  <Input
                    id="deal-prod-category"
                    value={product.category}
                    onChange={(e) => setProduct({ ...product, category: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-prod-spec">{t("product.spec")}</Label>
                  <Input
                    id="deal-prod-spec"
                    value={product.spec}
                    onChange={(e) => setProduct({ ...product, spec: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-prod-unit">{t("product.unit")}</Label>
                  <Input
                    id="deal-prod-unit"
                    value={product.unit}
                    placeholder="件/套/台"
                    onChange={(e) => setProduct({ ...product, unit: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-prod-price">{t("product.price")}</Label>
                  <Input
                    id="deal-prod-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => setProduct({ ...product, price: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-prod-qty">{t("product.quantity")}</Label>
                  <Input
                    id="deal-prod-qty"
                    type="number"
                    min="0"
                    value={product.quantity}
                    onChange={(e) => setProduct({ ...product, quantity: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="deal-prod-desc">{t("product.description")}</Label>
                  <Input
                    id="deal-prod-desc"
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {error && <p className="text-sm text-red-500">{t("crm.createFailed")}</p>}
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!customer.name.trim() || !product.name.trim() || saving}
              >
                {t("common.save")}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* 商机详情：标题/阶段/金额 + 两栏信息 + 产品需求 */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-5xl">
          {detailError && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("crm.notFound")}
            </p>
          )}
          {detail && (
            <>
              <SheetHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-4xl px-2 py-0.5 text-[11px] font-medium ${priorityClasses[detail.priority]}`}
                  >
                    {t(priorityKey[detail.priority])}
                  </span>
                  {detail.tag && <Badge variant="secondary">{detail.tag}</Badge>}
                </div>
                <SheetTitle className="text-xl">{detail.title}</SheetTitle>
                <SheetDescription className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${detail.stage.accent}`} />
                  {t("crm.stage")}：{detail.stage.title}
                </SheetDescription>
                {detail.amount != null && (
                  <p className="font-heading text-2xl font-semibold tabular-nums text-foreground">
                    {formatAmount(detail.amount)}
                  </p>
                )}
              </SheetHeader>

              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">{t("crm.basicInfo")}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoItem label={t("customer.name")}>
                    {detail.customer?.name}
                  </InfoItem>
                  <InfoItem label={t("customer.customerType")}>
                    {typeLabel(t, detail.customer?.customerType)}
                  </InfoItem>
                  <InfoItem label={t("contact.name")}>{primaryContact?.name}</InfoItem>
                  <InfoItem label={t("crm.fieldAssignee")}>{detail.assignee}</InfoItem>
                  <InfoItem label={t("contact.email")}>{primaryContact?.email}</InfoItem>
                  <InfoItem label={t("customer.country")}>
                    {detail.customer?.country}
                  </InfoItem>
                  <InfoItem label={t("contact.phone")}>{primaryContact?.phone}</InfoItem>
                  <InfoItem label={t("customer.website")}>
                    {detail.customer?.website}
                  </InfoItem>
                </div>
              </section>

              {detail.product && (
                <section className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold">{t("product.panel")}</h3>
                  <div className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{detail.product.name}</p>
                      {detail.product.price != null &&
                        detail.product.quantity != null && (
                          <p className="text-sm font-semibold tabular-nums">
                            {formatAmount(detail.product.price * detail.product.quantity)}
                          </p>
                        )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <InfoItem label={t("product.category")}>
                        {detail.product.category}
                      </InfoItem>
                      <InfoItem label={t("product.spec")}>{detail.product.spec}</InfoItem>
                      <InfoItem label={t("product.quantity")}>
                        {detail.product.quantity != null
                          ? `${detail.product.quantity}${detail.product.unit ?? ""}`
                          : null}
                      </InfoItem>
                      <InfoItem label={t("product.price")}>
                        {detail.product.price != null
                          ? formatAmount(detail.product.price)
                          : null}
                      </InfoItem>
                    </div>
                    {detail.product.description && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {detail.product.description}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {detail.description && (
                <section className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-semibold">{t("crm.fieldDesc")}</h3>
                  <p className="text-sm text-muted-foreground">{detail.description}</p>
                </section>
              )}

              <Chatter
                className="mt-2"
                currentUser={user?.name}
                followers={detail.assignee ? [detail.assignee] : undefined}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </Stack>
  );
}
