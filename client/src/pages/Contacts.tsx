import { useEffect, useMemo, useState } from "react";
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
import { RobotAvatar } from "@/components/common/RobotAvatar";
import { useBotConfig, saveBotConfig } from "@/lib/botConfig";
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
  type ContactTypeValue,
  type ContactValues,
} from "@/components/crm/ContactForm";

type ContactType = ContactTypeValue;

interface Contact {
  id: string;
  type: ContactType;
  customerType?: string | null;
  aiGenerated?: boolean;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  website?: string | null;
  role?: string | null;
  _count?: { deals: number };
  archived?: boolean;
}

// wobnimo 内置 3D 形象（角色 id），供系统机器人形象选择。
const BOT_CHARACTERS = [
  "mochi", "bao", "berry", "boo", "bumble", "cacti", "cap", "drift",
  "ember", "hop", "inky", "latte", "microduck", "miso", "pebble", "pip",
  "rex", "swirl", "tad", "volt",
];

const TABS: { value: "" | ContactType; labelKey: string }[] = [
  { value: "", labelKey: "common.all" },
  { value: "customer", labelKey: "contact.typeCustomer" },
  { value: "supplier", labelKey: "contact.typeSupplier" },
  { value: "user", labelKey: "contact.typeUser" },
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
  const [tab, setTab] = useState<"" | ContactType>("");
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

  // 系统机器人形象设置
  const bot = useBotConfig();
  const [botName, setBotName] = useState("ominXBot");
  const [botChar, setBotChar] = useState("mochi");
  const [botSaving, setBotSaving] = useState(false);
  useEffect(() => {
    if (bot) {
      setBotName(bot.name);
      setBotChar(bot.botCharacter);
    }
  }, [bot]);
  const saveBot = async () => {
    if (botSaving) return;
    setBotSaving(true);
    try {
      await saveBotConfig({ name: botName.trim() || "ominXBot", botCharacter: botChar });
      toast.success("机器人形象已更新");
    } catch {
      toast.error("保存失败，请重试");
    } finally {
      setBotSaving(false);
    }
  };

  const load = () => {
    setLoading(true);
    api
      .get<Contact[]>("/contacts", { params: { includeArchived: true } })
      .then((r) => setList(r.data))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return list
      .filter((c) => (tab ? c.type === tab : true))
      .filter((c) => (showArchived ? true : !c.archived))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          (c.company ?? "").toLowerCase().includes(q.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(q.toLowerCase()),
      );
  }, [list, tab, q, showArchived]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_CONTACT);
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

  const openDetail = (c: Contact) => {
    setDetail(c);
    setDetailOpen(true);
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
          <Button onClick={openCreate}>
            {t("contact.add")}
          </Button>
        }
      />

      {/* 系统机器人形象设置：选择 3D 形象与名称，作用于全站机器人头像与提示 */}
      <Section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <RobotAvatar size={64} state="idle" character={botChar} />
            <div>
              <h3 className="text-sm font-semibold">系统机器人形象</h3>
              <p className="text-xs text-muted-foreground">
                设置 ominXBot 的 3D 形象与名称，将作用于全站机器人头像与各类提示。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              名称
              <Input
                className="w-40"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="ominXBot"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              形象
              <Select
                items={Object.fromEntries(BOT_CHARACTERS.map((c) => [c, c]))}
                value={botChar}
                onValueChange={(v) => setBotChar(String(v))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOT_CHARACTERS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Button onClick={saveBot} disabled={botSaving || !bot}>
              {botSaving ? "保存中…" : t("common.save")}
            </Button>
          </div>
        </div>
      </Section>

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

      <Section noPadding>
        <div className="flex flex-col gap-1">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50"
              onClick={() => openDetail(c)}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-medium">
                  <span className="truncate">{c.name}</span>
                  {c.aiGenerated && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-600"
                      title={t("contact.aiPendingHint")}
                    >
                      {t("contact.aiPending")}
                    </Badge>
                  )}
                  {c.company && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.company}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.email || c.phone || "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={c.type === "user" ? "default" : "secondary"}>
                  {typeLabel(c.type)}
                </Badge>
                {c.archived && (
                  <Badge
                    variant="outline"
                    className="border-slate-500 text-slate-500"
                  >
                    {t("common.archived")}
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
          {filtered.length === 0 && (
            <p className="px-5 py-4 text-sm text-muted-foreground">
              {loading ? t("common.loading") : t("contact.empty")}
            </p>
          )}
        </div>
      </Section>

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
            <ContactForm values={form} onChange={setForm} />
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
                  <Badge variant={detail.type === "user" ? "default" : "secondary"}>
                    {typeLabel(detail.type)}
                  </Badge>
                  {detail.archived && (
                    <Badge
                      variant="outline"
                      className="border-slate-500 text-slate-500"
                    >
                      {t("common.archived")}
                    </Badge>
                  )}
                  {detail.aiGenerated && (
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
                {detail.company && (
                  <SheetDescription>{detail.company}</SheetDescription>
                )}
              </SheetHeader>

              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">{t("contact.panel")}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoItem label={t("crm.fieldCustomerType")}>
                    {detail.customerType || "—"}
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
