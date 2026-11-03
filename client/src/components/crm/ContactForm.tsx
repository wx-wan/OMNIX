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

export type ContactTypeValue = "customer" | "supplier" | "user";

export interface ContactValues {
  type: ContactTypeValue;
  customerType: string;
  name: string;
  company: string;
  email: string;
  aiGenerated?: boolean;
  phone: string;
  country: string;
  website: string;
  password: string;
  role: string;
}

export const EMPTY_CONTACT: ContactValues = {
  type: "customer",
  customerType: "",
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  website: "",
  password: "",
  role: "",
};

/**
 * 客户信息是否已完善：除官网外，核心字段（姓名/公司/邮箱/电话/客户类型/国家地区）
 * 全部有值即视为完善——「待完善」徽标仅在这些字段有缺失时展示（见各处 aiPending 条件）。
 * 实时计算、不动服务端 aiGenerated 数据，字段补齐后徽标自动消失。
 */
export function isContactComplete(
  c:
    | Partial<
        Pick<
          ContactValues,
          "name" | "company" | "email" | "phone" | "customerType" | "country"
        >
      >
    | null
    | undefined,
): boolean {
  const filled = (v?: string | null) => typeof v === "string" && v.trim().length > 0;
  return [c?.name, c?.company, c?.email, c?.phone, c?.customerType, c?.country].every(filled);
}

export const CONTACT_TYPE_OPTIONS: ContactTypeValue[] = [
  "customer",
  "supplier",
  "user",
];

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
  values: ContactValues;
  onChange: (v: ContactValues) => void;
  idPrefix?: string;
}

/** 统一往来单位 / 联系人 表单。type=user 时额外展示登录密码与角色。 */
export function ContactForm({ values, onChange, idPrefix = "c" }: Props) {
  const { t } = useTranslation();
  const set =
    (k: keyof ContactValues) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      onChange({ ...values, [k]: e.target.value });
  const id = (k: string) => `${idPrefix}-contact-${k}`;

  return (
    <div className="flex flex-col gap-3">
      <Field label={t("contact.typeCustomer")} required>
        <Select
          value={values.type}
          onValueChange={(v) => onChange({ ...values, type: v as ContactTypeValue })}
        >
          <SelectTrigger id={id("type")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {t(`contact.type${opt[0].toUpperCase()}${opt.slice(1)}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label={t("contact.name")} required>
        <Input id={id("name")} value={values.name} onChange={set("name")} />
      </Field>
      <Field label={t("contact.company")}>
        <Input
          id={id("company")}
          value={values.company}
          placeholder={t("contact.companyPlaceholder")}
          onChange={set("company")}
        />
      </Field>
      <Field label={t("contact.email")}>
        <Input
          id={id("email")}
          type="email"
          value={values.email}
          onChange={set("email")}
        />
      </Field>
      <Field label={t("contact.phone")}>
        <Input id={id("phone")} value={values.phone} onChange={set("phone")} />
      </Field>
      <Field label={t("contact.country")}>
        <Input id={id("country")} value={values.country} onChange={set("country")} />
      </Field>
      <Field label={t("contact.website")}>
        <Input
          id={id("website")}
          type="url"
          placeholder="https://"
          value={values.website}
          onChange={set("website")}
        />
      </Field>
      {values.type === "user" && (
        <>
          <Field label={t("contact.password")}>
            <Input
              id={id("password")}
              type="password"
              placeholder="••••••"
              value={values.password}
              onChange={set("password")}
            />
          </Field>
          <Field label={t("contact.role")}>
            <Select
              value={values.role || "user"}
              onValueChange={(v) => onChange({ ...values, role: v ?? "user" })}
            >
              <SelectTrigger id={id("role")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="user">user</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </>
      )}
    </div>
  );
}
