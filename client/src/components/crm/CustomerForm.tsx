import type { ChangeEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CustomerValues {
  name: string;
  country: string;
  website: string;
  customerType: string;
}

export const EMPTY_CUSTOMER: CustomerValues = {
  name: "",
  country: "",
  website: "",
  customerType: "",
};

export const CUSTOMER_TYPE_OPTIONS = [
  "lead",
  "regular",
  "channel",
  "partner",
  "other",
] as const;

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

/** 公司（客户）画像表单。用于「新建商机」左栏与「客户」页独立新增。 */
export function CustomerForm({ values, onChange, idPrefix = "c" }: Props) {
  const { t } = useTranslation();
  const set =
    (k: keyof CustomerValues) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      onChange({ ...values, [k]: e.target.value });
  const id = (k: string) => `${idPrefix}-cust-${k}`;

  return (
    <div className="flex flex-col gap-3">
      <Field label={t("customer.name")} required>
        <Input id={id("name")} value={values.name} onChange={set("name")} />
      </Field>
      <Field label={t("customer.country")}>
        <Input id={id("country")} value={values.country} onChange={set("country")} />
      </Field>
      <Field label={t("customer.website")}>
        <Input
          id={id("website")}
          type="url"
          placeholder="https://"
          value={values.website}
          onChange={set("website")}
        />
      </Field>
      <Field label={t("customer.customerType")}>
        <Select
          value={values.customerType || undefined}
          onValueChange={(v) => onChange({ ...values, customerType: v ?? "" })}
        >
          <SelectTrigger id={id("customerType")}>
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
      </Field>
    </div>
  );
}
