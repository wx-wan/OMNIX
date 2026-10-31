import type { ChangeEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ProductValues {
  name: string;
  category: string;
  spec: string;
  price: string;
  quantity: string;
  unit: string;
  description: string;
}

export const EMPTY_PRODUCT: ProductValues = {
  name: "",
  category: "",
  spec: "",
  price: "",
  quantity: "1",
  unit: "",
  description: "",
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
  values: ProductValues;
  onChange: (v: ProductValues) => void;
  idPrefix?: string;
}

/** 产品需求表单（受控）。用于「新建商机」右栏与「产品」页独立新增。 */
export function ProductForm({ values, onChange, idPrefix = "p" }: Props) {
  const { t } = useTranslation();
  const set =
    (k: keyof ProductValues) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...values, [k]: e.target.value });
  const id = (k: string) => `${idPrefix}-prod-${k}`;

  return (
    <div className="flex flex-col gap-3">
      <Field label={t("product.name")} required>
        <Input id={id("name")} value={values.name} onChange={set("name")} />
      </Field>
      <Field label={t("product.category")}>
        <Input id={id("category")} value={values.category} onChange={set("category")} />
      </Field>
      <Field label={t("product.spec")}>
        <Input id={id("spec")} value={values.spec} onChange={set("spec")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("product.price")}>
          <Input
            id={id("price")}
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={set("price")}
          />
        </Field>
        <Field label={t("product.quantity")}>
          <Input
            id={id("quantity")}
            type="number"
            min="0"
            value={values.quantity}
            onChange={set("quantity")}
          />
        </Field>
      </div>
      <Field label={t("product.unit")}>
        <Input id={id("unit")} value={values.unit} onChange={set("unit")} placeholder="件/套/台" />
      </Field>
      <Field label={t("product.description")}>
        <Textarea
          id={id("description")}
          rows={2}
          className="resize-none"
          value={values.description}
          onChange={set("description")}
        />
      </Field>
    </div>
  );
}
