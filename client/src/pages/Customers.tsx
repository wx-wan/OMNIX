import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Stack } from "@/components/layout/Stack";
import { HeaderAction } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CustomerForm,
  EMPTY_CUSTOMER,
  type CustomerValues,
} from "@/components/crm/CustomerForm";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Company {
  id: string;
  name: string;
  country: string | null;
  website: string | null;
  customerType: string | null;
  contacts: Contact[];
}

type ContactDraft = { name: string; email: string; phone: string };
const EMPTY_CONTACT: ContactDraft = { name: "", email: "", phone: "" };

const typeLabel = (t: (k: string) => string, type?: string | null) =>
  type ? t(`customer.type${type[0].toUpperCase()}${type.slice(1)}`) : "";

export default function Customers() {
  const { t } = useTranslation();
  const [list, setList] = useState<Company[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [values, setValues] = useState<CustomerValues>(EMPTY_CUSTOMER);
  const [saving, setSaving] = useState(false);
  const [createErr, setCreateErr] = useState(false);

  const [detail, setDetail] = useState<Company | null>(null);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactDraft, setContactDraft] = useState<ContactDraft>(EMPTY_CONTACT);
  const [contactBusy, setContactBusy] = useState(false);

  const load = () =>
    api
      .get<Company[]>("/customers")
      .then((r) => setList(r.data))
      .catch(() => setList([]));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!values.name.trim() || saving) return;
    setSaving(true);
    try {
      await api.post("/customers", { ...values, name: values.name.trim() });
      setCreateOpen(false);
      setValues(EMPTY_CUSTOMER);
      setCreateErr(false);
      load();
    } catch {
      setCreateErr(true);
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const r = await api.get<Company>(`/customers/${id}`);
      setDetail(r.data);
    } catch {
      /* ignore */
    }
  };

  const startAddContact = () => {
    setEditingContact(null);
    setContactDraft(EMPTY_CONTACT);
    setContactFormOpen(true);
  };

  const startEditContact = (c: Contact) => {
    setEditingContact(c);
    setContactDraft({ name: c.name, email: c.email ?? "", phone: c.phone ?? "" });
    setContactFormOpen(true);
  };

  const saveContact = async () => {
    if (!detail || !contactDraft.name.trim() || contactBusy) return;
    setContactBusy(true);
    try {
      const payload = {
        name: contactDraft.name.trim(),
        email: contactDraft.email.trim() || undefined,
        phone: contactDraft.phone.trim() || undefined,
      };
      if (editingContact) {
        await api.patch(`/customers/contacts/${editingContact.id}`, payload);
      } else {
        await api.post(`/customers/${detail.id}/contacts`, payload);
      }
      setContactFormOpen(false);
      await openDetail(detail.id);
      load();
    } catch {
      /* ignore */
    } finally {
      setContactBusy(false);
    }
  };

  const deleteContact = async (cid: string) => {
    if (!detail) return;
    try {
      await api.delete(`/customers/contacts/${cid}`);
      await openDetail(detail.id);
      load();
    } catch {
      /* ignore */
    }
  };

  return (
    <Stack gap={4}>
      <HeaderAction>
        <Button
          onClick={() => {
            setCreateErr(false);
            setValues(EMPTY_CUSTOMER);
            setCreateOpen(true);
          }}
        >
          <Plus />
          {t("crm.newDeal")}
        </Button>
      </HeaderAction>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("customer.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer transition hover:shadow-md"
              onClick={() => openDetail(c.id)}
            >
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                {c.customerType && <span>{typeLabel(t, c.customerType)}</span>}
                {c.country && <span>{c.country}</span>}
                {c.website && <span className="truncate">{c.website}</span>}
                <span className="text-xs">
                  {t("contact.panel")}：{c.contacts.length}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 新建公司 */}
      <Sheet
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v);
          if (v) setCreateErr(false);
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("customer.panel")}</SheetTitle>
            <SheetDescription>{t("customer.empty")}</SheetDescription>
          </SheetHeader>
          <CustomerForm values={values} onChange={setValues} />
          {createErr && <p className="text-sm text-red-500">{t("crm.createFailed")}</p>}
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!values.name.trim() || saving}
              onClick={handleCreate}
            >
              {t("common.save")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 公司详情 + 联系人 */}
      <Sheet
        open={!!detail}
        onOpenChange={(v) => {
          if (!v) {
            setDetail(null);
            setContactFormOpen(false);
          }
        }}
      >
        <SheetContent className="sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.name}</SheetTitle>
                <SheetDescription>{t("customer.detail")}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                {detail.customerType && (
                  <div>
                    {t("customer.customerType")}：{typeLabel(t, detail.customerType)}
                  </div>
                )}
                {detail.country && (
                  <div>
                    {t("customer.country")}：{detail.country}
                  </div>
                )}
                {detail.website && (
                  <div>
                    {t("customer.website")}：
                    <a
                      href={detail.website}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary hover:underline"
                    >
                      {detail.website}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t("contact.panel")}</h3>
                <Button size="sm" variant="outline" onClick={startAddContact}>
                  <Plus />
                  {t("contact.add")}
                </Button>
              </div>

              {contactFormOpen && (
                <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>{t("contact.name")}</Label>
                    <Input
                      value={contactDraft.name}
                      onChange={(e) =>
                        setContactDraft({ ...contactDraft, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label>{t("contact.email")}</Label>
                      <Input
                        type="email"
                        value={contactDraft.email}
                        onChange={(e) =>
                          setContactDraft({ ...contactDraft, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>{t("contact.phone")}</Label>
                      <Input
                        value={contactDraft.phone}
                        onChange={(e) =>
                          setContactDraft({ ...contactDraft, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setContactFormOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      disabled={!contactDraft.name.trim() || contactBusy}
                      onClick={saveContact}
                    >
                      {t("common.save")}
                    </Button>
                  </div>
                </div>
              )}

              {detail.contacts.length === 0 && !contactFormOpen && (
                <p className="text-sm text-muted-foreground">{t("contact.empty")}</p>
              )}

              <div className="flex flex-col gap-2">
                {detail.contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border p-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[c.email, c.phone].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditContact(c)}
                        aria-label={t("contact.edit")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteContact(c.id)}
                        aria-label={t("contact.delete")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Stack>
  );
}
