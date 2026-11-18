"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
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

const DEPARTMENTS = ["Sales", "Support", "Engineering"];

/**
 * 联系人信息录入栏：嵌在事项详情「描述」卡片内（红色区域），
 * 当可选操作选择「新建联系人」时展开。字段对应线上 Add New Contact 弹窗。
 */
export function ContactInfoFields() {
  const { t } = useTranslation();
  const [values, setValues] = useState({
    firstname: "",
    lastname: "",
    department: "",
    company: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const set = (key: keyof typeof values, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    if (!values.firstname.trim()) {
      toast.error(t("Operation failed"), { description: t("Firstname") });
      return;
    }
    toast.success(t("Contact created"));
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h3 className="mb-3 text-sm font-semibold">{t("Add New Contact")}</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        {t("Enter the contact details for this item.")}
      </p>
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>{t("Firstname")}</FieldLabel>
          <Input
            value={values.firstname}
            placeholder="John"
            onChange={(e) => set("firstname", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>{t("Lastname")}</FieldLabel>
          <Input
            value={values.lastname}
            placeholder="Smith"
            onChange={(e) => set("lastname", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>{t("Select Department")}</FieldLabel>
          <Select value={values.department} onValueChange={(v) => v && set("department", v)}>
            <SelectTrigger className="w-full">
              <SelectValue>{values.department || t("Select Department")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {t(dept)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>{t("Company")}</FieldLabel>
          <Input
            value={values.company}
            placeholder="Muller Inc"
            onChange={(e) => set("company", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>{t("Phone Number")}</FieldLabel>
          <Input
            value={values.phone}
            placeholder="456-485-5623"
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>{t("Email address")}</FieldLabel>
          <Input
            type="email"
            value={values.email}
            placeholder="name@company.com"
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel>{t("Address")}</FieldLabel>
          <Textarea
            value={values.address}
            placeholder="address..."
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel>{t("Notes")}</FieldLabel>
          <Textarea
            value={values.notes}
            placeholder="notes..."
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </FieldGroup>
      <div className="mt-4 flex items-center gap-2">
        <Button type="button" onClick={submit}>
          {t("Submit")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setValues({
          firstname: "",
          lastname: "",
          department: "",
          company: "",
          phone: "",
          email: "",
          address: "",
          notes: "",
        })}>
          {t("Cancel")}
        </Button>
      </div>
    </div>
  );
}
