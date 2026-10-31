import type { ChangeEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface CustomerValues {
  name: string;
  contact: string;
  phone: string;
  company: string;
  industry: string;
  email: string;
  note: string;
}

export const EMPTY_CUSTOMER: CustomerValues = {
  name: "",
  contact: "",
  phone: "",
  company: "",
  industry: "",
  email: "",
  note: "",
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      {children}
    </div>
  );
}

interface Props {
  values: CustomerValues;
  onChange: (v: CustomerValues) => void;
  idPrefix?: string;
}

/** 客户画像表单（受控）。用于「新建商机」左栏与「客户」页独立新增。 */
export function CustomerForm({ values, onChange, idPrefix = "c" }: Props) {
  const { t } = useTranslation();
  const set =
    (k: keyof CustomerValues) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...values, [k]: e.target.value });
  const id = (k: string) => `${idPrefix}-cust-${k}`;

  return (
    <div className="flex flex-col gap-3">
      <Field label={t("customer.name")} required>
        <Input id={id("name")} value={values.name} onChange={set("name")} />
      </Field>
      <Field label={t("customer.contact")}>
        <Input id={id("contact")} value={values.contact} onChange={set("contact")} />
      </Field>
      <Field label={t("customer.phone")}>
        <Input id={id("phone")} value={values.phone} onChange={set("phone")} />
      </Field>
      <Field label={t("customer.company")}>
        <Input id={id("company")} value={values.company} onChange={set("company")} />
      </Field>
      <Field label={t("customer.industry")}>
        <Input id={id("industry")} value={values.industry} onChange={set("industry")} />
      </Field>
      <Field label={t("customer.email")}>
        <Input id={id("email")} type="email" value={values.email} onChange={set("email")} />
      </Field>
      <Field label={t("customer.note")}>
        <Textarea
          id={id("note")}
          rows={2}
          className="resize-none"
          value={values.note}
          onChange={set("note")}
        />
      </Field>
    </div>
  );
}
