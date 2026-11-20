"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Loading from "@/components/shadcn-dashboard/spinner/loading";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import {
  getTaskContactId,
  submitContactForm,
  type Contact,
  type ContactFormInput,
} from "@/api/contacts/use-contacts";
import { getFetcher } from "@/api/global-fetcher";
import { ContactBusinessCard, type ContactBusinessCardValue } from "@/components/contacts/contact-business-card";
import { CountrySelect } from "@/components/shared/CountrySelect";
import { CompanyAutocomplete } from "./company-autocomplete";


const SOURCES = ["网站", "展会", "转介绍", "广告", "拜访", "其他"];
const SOCIALS = ["微信", "WhatsApp", "LinkedIn", "Facebook", "Twitter", "其他"];
const GENDERS = ["male", "female", "other"];

type FormState = {
  company: ContactFormInput["company"];
  contact: ContactFormInput["contact"];
};

const emptyForm: FormState = {
  company: { name: "", website: "", country: "", source: "", landline: "" },
  contact: {
    nickname: "", email: "", socialPlatform: "", socialAccount: "",
    mobile: "", phone: "", jobRank: "", position: "", birthday: "",
    gender: "", avatarUrl: "", contactNotes: "",
    businessCardFront: null, businessCardBack: null,
  },
};

/** 把已落库的联系人 + 所属公司映射回表单 state。 */
function toFormState(contact: Contact, company: Contact | null): FormState {
  const isoDate = contact.birthday ? String(contact.birthday).slice(0, 10) : "";
  return {
    company: {
      name: company?.name ?? "",
      website: company?.website ?? "",
      country: company?.country ?? "",
      source: company?.source ?? "",
      landline: company?.landline ?? "",
    },
    contact: {
      nickname: contact.nickname ?? "",
      email: contact.email ?? "",
      socialPlatform: contact.socialPlatform ?? "",
      socialAccount: contact.socialAccount ?? "",
      mobile: contact.mobile ?? "",
      phone: contact.phone ?? "",
      jobRank: contact.jobRank ?? "",
      position: contact.position ?? "",
      birthday: isoDate,
      gender: contact.gender ?? "",
      avatarUrl: contact.avatarUrl ?? "",
      contactNotes: contact.contactNotes ?? "",
      businessCardFront: contact.businessCardFront ?? null,
      businessCardBack: contact.businessCardBack ?? null,
    },
  };
}

/** 联系人表单：公司常用信息 + 联系人信息，提交后公司落公司库、个人关联该公司。 */
export function ContactInfoFields({ taskId }: { taskId?: string }) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // 再次打开任务时：按 task→contact 映射读取联系人与公司，回填表单。
  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const contactId = await getTaskContactId(taskId);
        if (!contactId) return;
        const contact = await getFetcher(`/api/contacts/${contactId}`) as Contact;
        let company: Contact | null = null;
        if (contact.parentId) {
          company = await getFetcher(`/api/contacts/${contact.parentId}`) as Contact;
        }
        if (!cancelled) {
          setForm(toFormState(contact, company));
          setFormKey((prev) => prev + 1);
        }
      } catch {
        // 回填失败时保持空表单，不影响新建。
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [taskId]);

  const setCompany = (key: keyof FormState["company"], value: string) =>
    setForm((prev) => ({ ...prev, company: { ...prev.company, [key]: value } }));
  const setContact = (key: keyof FormState["contact"], value: string) =>
    setForm((prev) => ({ ...prev, contact: { ...prev.contact, [key]: value } }));

  const submit = async () => {
    if (!form.company.name.trim()) {
      toast.error(t("Operation failed"), { description: t("Company") });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitContactForm(form, taskId);
      toast.success(t("Contact created"));
      setForm(emptyForm);
      setFormKey((prev) => prev + 1);
    } catch {
      toast.error(t("Operation failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const select = (
    label: string,
    value: string,
    options: string[],
    onChange: (v: string) => void
  ) => (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger className="w-full">
          <SelectValue>{value || t("Select")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );

  if (loading) return <Loading className="min-h-40" />;

  return (
    <div className="flex flex-col gap-6">
      <FieldSet>
        <FieldLegend>{t("Company information")}</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>{t("Company")} <span className="text-destructive">*</span></FieldLabel>
            <CompanyAutocomplete
              key={formKey}
              value={form.company.name}
              placeholder={t("Company")}
              onChange={(name) => setCompany("name", name)}
              onPick={(company) =>
                setForm((prev) => ({
                  ...prev,
                  company: {
                    name: company.name,
                    website: company.website ?? "",
                    country: company.country ?? "",
                    source: company.source ?? "",
                    landline: company.landline ?? "",
                  },
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel>{t("Website")}</FieldLabel>
            <Input value={form.company.website} onChange={(e) => setCompany("website", e.target.value)} placeholder="https://" />
          </Field>
          <Field>
            <FieldLabel>{t("Country or Region")}</FieldLabel>
            <CountrySelect
              key={`country-${formKey}`}
              value={form.company.country}
              placeholder={t("Country or Region")}
              onChange={(country) => setCompany("country", country)}
            />
          </Field>
          {select(t("Customer source"), form.company.source, SOURCES, (v) => setCompany("source", v))}
          <Field>
            <FieldLabel>{t("Landline")}</FieldLabel>
            <Input value={form.company.landline} onChange={(e) => setCompany("landline", e.target.value)} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t("Contact information")}</FieldLegend>
        <div className="mb-4">
          <ContactBusinessCard
            value={{
              front: form.contact.businessCardFront,
              back: form.contact.businessCardBack,
            }}
            onChange={(next: ContactBusinessCardValue) =>
              setForm((prev) => ({
                ...prev,
                contact: {
                  ...prev.contact,
                  businessCardFront: next.front,
                  businessCardBack: next.back,
                },
              }))
            }
          />
        </div>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>{t("Nickname")}</FieldLabel>
            <Input value={form.contact.nickname} onChange={(e) => setContact("nickname", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t("Email address")}</FieldLabel>
            <Input type="email" value={form.contact.email} onChange={(e) => setContact("email", e.target.value)} />
          </Field>
          {select(t("Social platform"), form.contact.socialPlatform, SOCIALS, (v) => setContact("socialPlatform", v))}
          <Field>
            <FieldLabel>{t("Social account")}</FieldLabel>
            <Input value={form.contact.socialAccount} onChange={(e) => setContact("socialAccount", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t("Mobile")}</FieldLabel>
            <Input value={form.contact.mobile} onChange={(e) => setContact("mobile", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t("Phone Number")}</FieldLabel>
            <Input value={form.contact.phone} onChange={(e) => setContact("phone", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t("Job rank")}</FieldLabel>
            <Input value={form.contact.jobRank} onChange={(e) => setContact("jobRank", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t("Position")}</FieldLabel>
            <Input value={form.contact.position} onChange={(e) => setContact("position", e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t("Birthday")}</FieldLabel>
            <DatePicker value={form.contact.birthday || undefined} onChange={(v) => setContact("birthday", v ?? "")} />
          </Field>
          {select(t("Gender"), form.contact.gender, GENDERS, (v) => setContact("gender", v))}
          <Field className="sm:col-span-2">
            <FieldLabel>{t("Contact notes")}</FieldLabel>
            <Textarea value={form.contact.contactNotes} onChange={(e) => setContact("contactNotes", e.target.value)} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <div className="flex items-center gap-2">
        <Button type="button" onClick={submit} disabled={submitting}>
          {submitting ? <Loading className="size-4 min-h-0" /> : null}
          {t("Submit")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setForm(emptyForm)}>
          {t("Cancel")}
        </Button>
      </div>
    </div>
  );
}
