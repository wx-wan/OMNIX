import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { HeaderAction } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Chatter } from "@/components/chatter/Chatter";
import type { ContactValues } from "@/components/crm/ContactForm";
import { EMPTY_CONTACT, CONTACT_TYPE_OPTIONS } from "@/components/crm/ContactForm";
import type { ProductValues } from "@/components/crm/ProductForm";
import { EMPTY_PRODUCT } from "@/components/crm/ProductForm";
import type { KanbanPriority } from "@/components/kanban/KanbanBoard";

interface DealDetailData {
  id: string;
  title: string;
  description: string | null;
  tag: string | null;
  priority: KanbanPriority;
  amount: number | null;
  assignee: string | null;
  meta: string | null;
  stage: { id: string; title: string; accent: string };
  contact: (ContactValues & { id: string }) | null;
  product: (ProductValues & { id: string; price: number | null; quantity: number | null }) | null;
}

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

export default function DealForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isEdit = !!id && id !== "new";

  const [detail, setDetail] = useState<DealDetailData | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(false);

  // 新建商机默认落「线索到达」阶段
  const [leadStageId, setLeadStageId] = useState<string | null>(null);

  // 表单状态
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<KanbanPriority>("medium");
  const [tag, setTag] = useState("");
  const [assignee, setAssignee] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState<ContactValues>(EMPTY_CONTACT);
  const [product, setProduct] = useState<ProductValues>(EMPTY_PRODUCT);

  const [saving, setSaving] = useState(false);

  // 新建：拉取第一个阶段 id（落库用）
  useEffect(() => {
    if (isEdit) return;
    api
      .get<{ id: string }[]>("/crm/board")
      .then((r) => setLeadStageId(r.data[0]?.id ?? null))
      .catch(() => setLeadStageId(null));
  }, [isEdit]);

  // 编辑：拉取详情并回填
  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    setError(false);
    setDetail(null);
    api
      .get<DealDetailData>(`/crm/deals/${id}`)
      .then((r) => {
        const d = r.data;
        setDetail(d);
        setTitle(d.title);
        setPriority(d.priority);
        setTag(d.tag ?? "");
        setAssignee(d.assignee ?? "");
        setDescription(d.description ?? "");
        setContact({
          ...EMPTY_CONTACT,
          name: d.contact?.name ?? "",
          type: d.contact?.type ?? "customer",
          company: d.contact?.company ?? "",
          email: d.contact?.email ?? "",
          phone: d.contact?.phone ?? "",
          country: d.contact?.country ?? "",
          website: d.contact?.website ?? "",
        });
        setProduct({
          ...EMPTY_PRODUCT,
          name: d.product?.name ?? "",
          category: d.product?.category ?? "",
          spec: d.product?.spec ?? "",
          unit: d.product?.unit ?? "",
          price: d.product?.price != null ? String(d.product.price) : "",
          quantity: d.product?.quantity != null ? String(d.product.quantity) : "1",
          description: d.product?.description ?? "",
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isEdit, id]);

  const canSave =
    !saving &&
    (!isEdit ||
      (!!contact.name.trim() || !!contact.company.trim()) && !!product.name.trim());

  const buildPayload = () => ({
    title: title.trim() || undefined,
    description: description.trim() || undefined,
    tag: tag.trim() || undefined,
    priority,
    assignee: assignee.trim() || undefined,
    contact: {
      name: contact.name.trim() || contact.company.trim() || undefined,
      type: contact.type || "customer",
      company: contact.company.trim() || undefined,
      email: contact.email.trim() || undefined,
      phone: contact.phone.trim() || undefined,
      country: contact.country.trim() || undefined,
      website: contact.website.trim() || undefined,
    },
    product: {
      name: product.name.trim() || undefined,
      category: product.category.trim() || undefined,
      spec: product.spec.trim() || undefined,
      unit: product.unit.trim() || undefined,
      price: product.price ? Number(product.price) : undefined,
      quantity: product.quantity ? Number(product.quantity) : undefined,
      description: product.description.trim() || undefined,
    },
  });

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(false);
    try {
      if (isEdit && id) {
        await api.patch(`/crm/deals/${id}`, buildPayload());
        const r = await api.get<DealDetailData>(`/crm/deals/${id}`);
        setDetail(r.data);
      } else {
        const res = await api.post("/crm/deals", {
          ...buildPayload(),
          stageId: leadStageId ?? undefined,
        });
        const newId: string = res.data.id;
        navigate(`/crm/deals/${newId}`, { replace: true });
      }
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* 返回 + 标题：portal 到顶栏左侧 */}
      <HeaderAction>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => navigate("/crm")}
            aria-label={t("crm.back")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-semibold leading-none tracking-tight">
              {isEdit ? t("crm.detailTitle") : t("crm.formTitle")}
            </h1>
            {!isEdit && (
              <p className="hidden text-xs text-muted-foreground md:block">{t("crm.formDesc")}</p>
            )}
          </div>
        </div>
      </HeaderAction>

      {loading && (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {t("auth.loading")}
        </div>
      )}
      {!loading && error && (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {t("crm.notFound")}
        </div>
      )}

      {!loading && !error && (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-10">
          {/* 商机信息（6） */}
          <Card className="flex min-h-0 flex-col gap-5 overflow-y-auto p-5 lg:col-span-6">
            {/* 头部：优先级 / 标签 / 标题 / 阶段 / 金额 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-4xl px-2 py-0.5 text-[11px] font-medium ${priorityClasses[priority]}`}
                >
                  {t(priorityKey[priority])}
                </span>
                {tag && <Badge variant="secondary">{tag}</Badge>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      <SelectItem value="high">{t(priorityKey.high)}</SelectItem>
                      <SelectItem value="medium">{t(priorityKey.medium)}</SelectItem>
                      <SelectItem value="low">{t(priorityKey.low)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-tag">{t("crm.fieldTag")}</Label>
                  <Input
                    id="deal-tag"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="deal-title">{t("crm.fieldTitle")}</Label>
                <Input
                  id="deal-title"
                  className="text-base"
                  value={title}
                  placeholder={
                    !isEdit
                      ? `${contact.company.trim() || contact.name.trim() || "—"} · ${product.name.trim() || "—"}`
                      : undefined
                  }
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {isEdit && detail && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className={`size-2 rounded-full ${detail.stage.accent}`} />
                  {t("crm.stage")}：{detail.stage.title}
                  {detail.amount != null && (
                    <span className="ml-2 font-heading text-lg font-semibold tabular-nums text-foreground">
                      {formatAmount(detail.amount)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 往来单位 / 联系人 */}
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">{t("contact.panel")}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-cust-company">
                    {t("contact.company")}
                    {!isEdit && <span className="text-red-500"> *</span>}
                  </Label>
                  <Input
                    id="deal-cust-company"
                    value={contact.company}
                    onChange={(e) => setContact({ ...contact, company: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>{t("contact.type")}</Label>
                  <Select
                    value={contact.type || undefined}
                    onValueChange={(v) =>
                      setContact({ ...contact, type: v as ContactValues["type"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {t(`contact.type${opt[0].toUpperCase()}${opt.slice(1)}`)}
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
                  <Label htmlFor="deal-contact-phone">{t("contact.phone")}</Label>
                  <Input
                    id="deal-contact-phone"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-cust-country">{t("contact.country")}</Label>
                  <Input
                    id="deal-cust-country"
                    value={contact.country}
                    onChange={(e) => setContact({ ...contact, country: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-cust-website">{t("contact.website")}</Label>
                  <Input
                    id="deal-cust-website"
                    type="url"
                    placeholder="https://"
                    value={contact.website}
                    onChange={(e) => setContact({ ...contact, website: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* 产品需求 */}
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">{t("product.panel")}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deal-prod-name">
                    {t("product.name")}
                    {!isEdit && <span className="text-red-500"> *</span>}
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

            {/* 描述 */}
            <section className="flex flex-col gap-1.5">
              <Label htmlFor="deal-desc">{t("crm.fieldDesc")}</Label>
              <Textarea
                id="deal-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </section>

            {error && <p className="text-sm text-red-500">{t("crm.createFailed")}</p>}
            <div className="mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => navigate("/crm")}>
                {t("common.cancel")}
              </Button>
              <Button type="button" onClick={() => void handleSave()} disabled={!canSave}>
                {t("common.save")}
              </Button>
            </div>
          </Card>

          {/* Chatter（4） */}
          <div className="min-h-0 lg:col-span-4">
            <Chatter
              fill
              className="h-full"
              currentUser={user?.name}
              followers={assignee.trim() ? [assignee.trim()] : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
