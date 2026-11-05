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
import { Picker } from "@/components/common/Picker";
import type { SelectRecord } from "@/components/common/SearchableSelect";

export type ContactTypeValue = "customer" | "supplier" | "user";

export interface ContactValues {
  type: ContactTypeValue;
  customerType: string;
  name: string;
  company: string; // 旧版个人所属公司文本（迁移后由 parentId 取代，仅作兼容）
  parentId: string; // 所属公司 id（个人指向公司，自关联）
  isCompany: boolean; // 是否为公司（区别于个人联系人）
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
  parentId: "",
  isCompany: false,
  email: "",
  phone: "",
  country: "",
  website: "",
  password: "",
  role: "",
};

/**
 * 客户信息是否已完善（贴近 Odoo 范式，公司/个人口径不同）：
 * - 个人(isCompany=false)：姓名 / 所属公司(parentId，兼容旧文本 company) / 邮箱 / 电话 /
 *   客户类型 / 国家地区 全有值 → 完善；
 * - 公司(isCompany=true)：自身无需 parent，姓名 / 邮箱 / 电话 / 客户类型 / 国家地区 全有值 → 完善。
 * 除官网(website)外，核心字段齐全即视为「已核实」，徽标消失。
 */
/** 兼容 API 的 Contact（字段可含 null）与表单 ContactValues 的宽类型。 */
type ContactLike = {
  isCompany?: boolean | null;
  name?: string | null;
  company?: string | null;
  parentId?: string | null;
  email?: string | null;
  phone?: string | null;
  customerType?: string | null;
  country?: string | null;
};

export function isContactComplete(c: ContactLike | null | undefined): boolean {
  const filled = (v?: string | null) => typeof v === "string" && v.trim().length > 0;
  const name = filled(c?.name);
  const email = filled(c?.email);
  const phone = filled(c?.phone);
  const customerType = filled(c?.customerType);
  const country = filled(c?.country);
  if (c?.isCompany) {
    return name && email && phone && customerType && country;
  }
  const linkedCompany = filled(c?.parentId) || filled(c?.company);
  return name && linkedCompany && email && phone && customerType && country;
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
  /** 公司记录（isCompany=true 的往来单位），供「所属公司」Picker 选用。 */
  companyRecords?: SelectRecord[];
  /** 在「所属公司」选择器中即时创建公司后回调（由父级建库并回填 parentId）。 */
  onCompanyCreate?: (name: string) => void;
}

/** 统一往来单位 / 联系人 表单。type=user 时额外展示登录密码与角色。 */
export function ContactForm({
  values,
  onChange,
  idPrefix = "c",
  companyRecords,
  onCompanyCreate,
}: Props) {
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
        <Picker
          id={id("company")}
          records={companyRecords ?? []}
          value={values.parentId || null}
          onChange={(rec) => onChange({ ...values, parentId: rec?.id ?? "" })}
          onCreate={onCompanyCreate}
          placeholder={t("contact.companyPlaceholder")}
          searchMoreTitle={t("contact.company")}
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
