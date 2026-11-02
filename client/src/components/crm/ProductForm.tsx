import type { ChangeEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { api } from "@/lib/api";

export interface ProductValues {
  description: string;
  quantity: string;
  mode: string;
  process: string;
  audience: string;
  category: string;
  price: string;
  costPrice: string;
  tax: string;
  image: string;
  unit: string;
}

export const EMPTY_PRODUCT: ProductValues = {
  description: "",
  quantity: "",
  mode: "",
  process: "",
  audience: "",
  category: "",
  price: "",
  costPrice: "",
  tax: "",
  image: "",
  unit: "",
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
    (k: keyof ProductValues) => (e: ChangeEvent<HTMLInputElement>) =>
      onChange({ ...values, [k]: e.target.value });
  const id = (k: string) => `${idPrefix}-prod-${k}`;

  // 上传产品图：通过后端 /upload 接口落盘，返回可访问 URL 存入 image 字段
  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data.url as string;
  };

  return (
    <div className="flex flex-col gap-3">
      <Field label={t("product.description")} required>
        <Input id={id("description")} value={values.description} onChange={set("description")} />
      </Field>
      <Field label={t("product.image")}>
        <ImageUpload
          value={values.image || null}
          onChange={(v) => onChange({ ...values, image: v ?? "" })}
          onUpload={uploadImage}
          ratio="4/3"
          className="max-w-xs"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("product.quantity")}>
          <Input id={id("quantity")} type="number" min="0" value={values.quantity} onChange={set("quantity")} />
        </Field>
        <Field label={t("product.category")}>
          <Input id={id("category")} value={values.category} onChange={set("category")} />
        </Field>
        <Field label={t("product.mode")}>
          <Input id={id("mode")} value={values.mode} onChange={set("mode")} />
        </Field>
        <Field label={t("product.process")}>
          <Input id={id("process")} value={values.process} onChange={set("process")} />
        </Field>
        <Field label={t("product.audience")}>
          <Input id={id("audience")} value={values.audience} onChange={set("audience")} />
        </Field>
        <Field label={t("product.price")}>
          <Input id={id("price")} type="number" min="0" step="0.01" value={values.price} onChange={set("price")} />
        </Field>
        <Field label={t("product.costPrice")}>
          <Input id={id("costPrice")} type="number" min="0" step="0.01" value={values.costPrice} onChange={set("costPrice")} />
        </Field>
        <Field label={t("product.tax")}>
          <Input id={id("tax")} type="number" min="0" step="0.01" value={values.tax} onChange={set("tax")} />
        </Field>
      </div>
    </div>
  );
}
