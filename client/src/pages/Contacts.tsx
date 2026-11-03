import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Stack } from "@/components/layout/Stack";
import { PageMeta } from "@/components/layout/PageMeta";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Chatter } from "@/components/chatter/Chatter";
import { extractErrorDetail } from "@/lib/error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContactForm,
  EMPTY_CONTACT,
  isContactComplete,
  type ContactTypeValue,
  type ContactValues,
} from "@/components/crm/ContactForm";
import { ViewToggle, type ViewMode } from "@/components/common/ViewToggle";
import type { SelectRecord } from "@/components/common/SearchableSelect";

type ContactType = ContactTypeValue;

interface Contact {
  id: string;
  type: ContactType;
  customerType?: string | null;
  aiGenerated?: boolean;
  name: string;
  company?: string | null; // 旧版个人所属公司文本（迁移后由 parent 取代）
  isCompany?: boolean; // 是否为公司
  parentId?: string | null; // 所属公司 id
  parent?: { id: string; name: string } | null; // 所属公司（列表/详情带回）
  children?: { id: string; name: string; email?: string | null }[]; // 公司下的联系人（详情带回）
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  website?: string | null;
  role?: string | null;
  _count?: { deals: number };
  archived?: boolean;
}

type ContactTab = "" | ContactType | "company";

const TABS: { value: ContactTab; labelKey: string }[] = [
  { value: "", labelKey: "common.all" },
  { value: "customer", labelKey: "contact.typeCustomer" },
  { value: "supplier", labelKey: "contact.typeSupplier" },
  { value: "user", labelKey: "contact.typeUser" },
  { value: "company", labelKey: "contact.companyTab" },
];

function InfoItem({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-sm text-foreground">{children || "—"}</span>
    </div>
  );
}

export default function Contacts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [list, setList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ContactTab>("");
  const [q, setQ] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactValues>(EMPTY_CONTACT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const [detail, setDetail] = useState<Contact | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 手动刷新（新建/编辑/删除/归档后）
  const [qParam, setQParam] = useState(""); // 防抖后的搜索词，驱动后端 filter

  // 公司列表（isCompany=true 的往来单位），供联系人的「所属公司」Picker 选用
  const [companyRecords, setCompanyRecords] = useState<SelectRecord[]>([]);

  // 卡片 / 列表 视图偏好（localStorage 持久化）
  const [view, setView] = useState<ViewMode>(() => {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem("contacts-view") : null;
    return v === "grid" || v === "list" ? v : "list";
  });
  useEffect(() => {
    localStorage.setItem("contacts-view", view);
  }, [view]);

  // 手动刷新：保存/删除/归档后触发主列表重新请求（不重新拉公司下拉）
  const load = () => setRefreshKey((k) => k + 1);

  // 公司列表（isCompany=true 的往来单位），供联系人的「所属公司」Picker 选用；仅挂载时拉一次
  useEffect(() => {
    api
      .get<Contact[]>("/contacts", { params: { isCompany: true, includeArchived: true } })
      .then((r) =>
        setCompanyRecords(
          r.data.map((c) => ({ id: c.id, label: c.name, isCompany: true })),
        ),
      )
      .catch(() => {});
  }, []);

  // 搜索词防抖（300ms）后再驱动后端请求，避免每次按键都打接口
  useEffect(() => {
    const t = setTimeout(() => setQParam(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // 主列表：按分类 / 搜索 / 归档开关走后端 filter，不再一次性拉全量在内存过滤
  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = { includeArchived: showArchived };
    if (tab === "company") params.isCompany = true;
    else if (tab) params.type = tab;
    if (qParam.trim()) params.q = qParam.trim();
    api
      .get<Contact[]>("/contacts", { params })
      .then((r) => setList(r.data))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [tab, qParam, showArchived, refreshKey]);

  // 主列表已交由后端按 tab / q / includeArchived 过滤，前端直接使用 list
  const openCreate = () => {
    setEditing(null);
    // 在「公司」tab 下新建 → 直接创建公司（isCompany=true）
    setForm({ ...EMPTY_CONTACT, isCompany: tab === "company" });
    setError(false);
    setFormOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({
      type: c.type,
      customerType: c.customerType ?? "",
      name: c.name,
      company: c.company ?? "",
      parentId: c.parentId ?? "",
      isCompany: c.isCompany ?? false,
      email: c.email ?? "",
      phone: c.phone ?? "",
      country: c.country ?? "",
      website: c.website ?? "",
      password: "",
      role: c.role ?? "",
    });
    setError(false);
    setFormOpen(true);
  };

  const openDetail = async (c: Contact) => {
    // 拉取完整记录（含所属公司 parent 与下属联系人 children），展示双向关联
    try {
      const r = await api.get<Contact>(`/contacts/${c.id}`);
      setDetail(r.data);
    } catch {
      setDetail(c);
    }
    setDetailOpen(true);
  };

  // 在联系人表单的「所属公司」选择器中即时创建公司（isCompany=true），建好后回填 parentId
  const createCompany = async (name: string) => {
    try {
      const r = await api.post<{ id: string }>("/contacts", {
        name,
        type: "customer",
        isCompany: true,
      });
      setCompanyRecords((prev) => [
        ...prev,
        { id: r.data.id, label: name, isCompany: true },
      ]);
      setForm((f) => ({ ...f, parentId: r.data.id }));
    } catch (e) {
      toast.error(extractErrorDetail(e));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    setError(false);
    try {
      const payload: Record<string, unknown> = { ...form, name: form.name.trim() };
      if (!payload.password) delete payload.password; // 空密码不更新
      if (editing) {
        await api.patch(`/contacts/${editing.id}`, payload);
      } else {
        await api.post("/contacts", payload);
      }
      setFormOpen(false);
      load();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!detail || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/contacts/${detail.id}`);
      toast.success(t("contact.delete") + " " + t("common.success"));
      setDeleteOpen(false);
      setDetailOpen(false);
      load();
    } catch (e) {
      setDeleteOpen(false);
      toast.error(extractErrorDetail(e));
    } finally {
      setDeleting(false);
    }
  };

  // 归档 / 取消归档：关联了商机的往来单位不允许删除，用归档隐藏代替
  const handleArchive = async (c: Contact) => {
    try {
      await api.patch(`/contacts/${c.id}`, { archived: !c.archived });
      toast.success(
        (c.archived ? t("common.unarchive") : t("common.archive")) +
          " " +
          t("common.success"),
      );
      load();
    } catch (e) {
      toast.error(extractErrorDetail(e));
    }
  };

  const typeLabel = (type: ContactType) =>
    t(`contact.type${type[0].toUpperCase()}${type.slice(1)}`);

  return (
    <Stack gap={6}>
      <PageMeta
        title={t("nav.contacts")}
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <Button onClick={openCreate}>
              {t("contact.add")}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("common.search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {TABS.map((tb) => (
            <Button
              key={tb.value || "all"}
              variant={tab === tb.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(tb.value)}
            >
              {t(tb.labelKey)}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? t("common.hideArchived") : t("common.showArchived")}
        </Button>
      </div>

      {view === "list" ? (
        <Section noPadding>
          <div className="flex flex-col gap-1">
            {list.map((c) => (
              <div
                key={c.id}
                className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50"
                onClick={() => openDetail(c)}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    <span className="truncate">{c.name}</span>
                    {c.aiGenerated && !isContactComplete(c) && (
                      <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-600"
                        title={t("contact.aiPendingHint")}
                      >
                        {t("contact.aiPending")}
                      </Badge>
                    )}
                    {(c.parent?.name ?? c.company) && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {c.parent?.name ?? c.company}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.email || c.phone || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {!c.isCompany && (
                  <Badge variant={c.type === "user" ? "default" : "secondary"}>
                    {typeLabel(c.type)}
                  </Badge>
                  )}
                  {c.archived && (
                    <Badge
                      variant="outline"
                      className="border-slate-500 text-slate-500"
                    >
                      {t("common.archived")}
                    </Badge>
                  )}
                  {c.isCompany && (
                    <Badge
                      variant="outline"
                      className="border-sky-500 text-sky-600"
                    >
                      {t("contact.companyTab")}
                    </Badge>
                  )}
                  {c._count && (
                    <span className="text-xs text-muted-foreground">
                      {c._count.deals}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={c.archived ? t("common.unarchive") : t("common.archive")}
                    title={c.archived ? t("common.unarchive") : t("common.archive")}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchive(c);
                    }}
                  >
                    {c.archived ? <ArchiveRestore /> : <Archive />}
                  </Button>
                </div>
              </div>
            ))}
            {list.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                {loading ? t("common.loading") : t("contact.empty")}
              </p>
            )}
          </div>
        </Section>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {loading ? t("common.loading") : t("contact.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Card
              key={c.id}
              className={"cursor-pointer" + (c.archived ? " opacity-60" : "")}
              onClick={() => openDetail(c)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="truncate">{c.name}</span>
                  {c.aiGenerated && !isContactComplete(c) && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-600"
                      title={t("contact.aiPendingHint")}
                    >
                      {t("contact.aiPending")}
                    </Badge>
                  )}
                  <div
                    className="ml-auto flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={c.archived ? t("common.unarchive") : t("common.archive")}
                      title={c.archived ? t("common.unarchive") : t("common.archive")}
                      onClick={() => handleArchive(c)}
                    >
                      {c.archived ? <ArchiveRestore /> : <Archive />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                {(c.parent?.name ?? c.company) && (
                  <span className="truncate">{c.parent?.name ?? c.company}</span>
                )}
                <span className="truncate">{c.email || c.phone || "—"}</span>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {!c.isCompany && (
                  <Badge variant={c.type === "user" ? "default" : "secondary"}>
                    {typeLabel(c.type)}
                  </Badge>
                  )}
                  {c.archived && (
                    <Badge
                      variant="outline"
                      className="border-slate-500 text-slate-500"
                    >
                      {t("common.archived")}
                    </Badge>
                  )}
                  {c.isCompany && (
                    <Badge
                      variant="outline"
                      className="border-sky-500 text-sky-600"
                    >
                      {t("contact.companyTab")}
                    </Badge>
                  )}
                  {c._count && (
                    <span className="text-xs text-muted-foreground">
                      {c._count.deals} 商机
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 新建 / 编辑 侧滑 */}
      <Sheet
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (v) setError(false);
        }}
      >
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {editing ? t("contact.edit") : t("contact.add")}
            </SheetTitle>
            <SheetDescription>{t("contact.panel")}</SheetDescription>
          </SheetHeader>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <ContactForm
              values={form}
              onChange={setForm}
              companyRecords={companyRecords}
              onCompanyCreate={createCompany}
            />
            {error && (
              <p className="text-sm text-red-500">{t("crm.createFailed")}</p>
            )}
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={!form.name.trim() || saving}>
                {t("common.save")}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* 详情 侧滑 */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-2xl">
          {detail && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  {!detail.isCompany && (
                  <Badge variant={detail.type === "user" ? "default" : "secondary"}>
                    {typeLabel(detail.type)}
                  </Badge>
                  )}
                  {detail.archived && (
                    <Badge
                      variant="outline"
                      className="border-slate-500 text-slate-500"
                    >
                      {t("common.archived")}
                    </Badge>
                  )}
                  {detail.aiGenerated && !isContactComplete(detail) && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-600"
                      title={t("contact.aiPendingHint")}
                    >
                      {t("contact.aiPending")}
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-xl">{detail.name}</SheetTitle>
                {detail.parent?.name && (
                  <SheetDescription>
                    {t("contact.parent")}：{detail.parent.name}
                  </SheetDescription>
                )}
              </SheetHeader>

              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">{t("contact.panel")}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoItem label={t("crm.fieldCustomerType")}>
                    {detail.customerType || "—"}
                  </InfoItem>
                  <InfoItem label={t("contact.parent")}>
                    {detail.parent?.name || "—"}
                  </InfoItem>
                  <InfoItem label={t("contact.email")}>{detail.email}</InfoItem>
                  <InfoItem label={t("contact.phone")}>{detail.phone}</InfoItem>
                  <InfoItem label={t("contact.country")}>{detail.country}</InfoItem>
                  <InfoItem label={t("contact.website")}>
                    {detail.website ? (
                      <a
                        href={detail.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {detail.website}
                      </a>
                    ) : null}
                  </InfoItem>
                  {detail.type === "user" && (
                    <InfoItem label={t("contact.role")}>{detail.role}</InfoItem>
                  )}
                </div>

                {/* 双向关联：公司展示其下属联系人（child_ids），个人展示其所属公司（已在上方 parent 显示） */}
                {detail.children && detail.children.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">
                      {t("contact.children")}（{detail.children.length}）
                    </h4>
                    <div className="flex flex-col gap-1">
                      {detail.children.map((ch) => (
                        <div
                          key={ch.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5 text-sm"
                        >
                          <span className="truncate font-medium">{ch.name}</span>
                          {ch.email && (
                            <span className="truncate text-xs text-muted-foreground">
                              {ch.email}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(detail)}>
                  {t("contact.edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleArchive(detail)}
                >
                  {detail.archived ? t("common.unarchive") : t("common.archive")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={(detail._count?.deals ?? 0) > 0}
                  title={
                    (detail._count?.deals ?? 0) > 0
                      ? t("common.deleteBlockedByDeal")
                      : undefined
                  }
                  onClick={() => setDeleteOpen(true)}
                >
                  {t("contact.delete")}
                </Button>
              </div>

              <Chatter className="mt-2" currentUser={user?.name} />
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 删除客户确认 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("contact.delete")}</DialogTitle>
            <DialogDescription>
              {t("contact.deleteConfirm", { name: detail?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? t("common.loading") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
