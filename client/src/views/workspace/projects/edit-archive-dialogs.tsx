import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { resolveDate } from "src/api/workspace/use-workspace";
import { Button } from "src/components/ui/button";
import { DatePicker } from "src/components/ui/date-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "src/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/components/ui/select";
import { Textarea } from "src/components/ui/textarea";
import type { WsProject, WsUser } from "src/types/apps/workspace";
import { PeopleField } from "../people-field";

/**
 * 线上 PMS /projects/p1 的「Edit Project」与「Archive "…"?」两个居中弹窗 1:1 复刻。
 * 结构与 NewProjectDialog 一致：Dialog / Field / Input / Textarea / Select / DatePicker /
 * Checkbox / Button 全部复用 components/ui，不改组件源码、字号、间距与配色。
 */

const isoDay = (value?: string | null) => {
  const date = resolveDate(value) ?? new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

type Option = { value: string; label: string };

const STATUS_OPTIONS: Option[] = [
  { value: "active", label: "active" },
  { value: "on_hold", label: "on_hold" },
  { value: "completed", label: "completed" },
];
const PRIORITY_OPTIONS: Option[] = [
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
  { value: "urgent", label: "urgent" },
];

function EnumSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  const { t } = useTranslation();
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue>
          {(selected) =>
            t(
              options.find((option) => option.value === selected)?.label ??
                (selected as string) ??
                ""
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {t(option.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* -------------------------------- Edit Project -------------------------------- */

export type EditProjectValues = {
  name: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  leadId: string;
  memberIds: string[];
};

const editValues = (project: WsProject): EditProjectValues => ({
  name: project.name,
  description: project.description,
  status: project.status,
  priority: project.priority,
  dueDate: isoDay(project.dueDate),
  leadId: project.leadId,
  memberIds: [...project.memberIds],
});

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  users,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: WsProject;
  users: WsUser[];
  onSubmit: (values: EditProjectValues) => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<EditProjectValues>(() => editValues(project));

  useEffect(() => {
    if (open) setValues(editValues(project));
    // 快照会在其它页面写入后重建对象；只依赖 id，避免编辑过程中表单被重置。
  }, [open, project.id]);

  const set = (key: keyof EditProjectValues, value: string | string[]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = values.name.trim();
    if (!name) return;
    onSubmit({ ...values, name, description: values.description.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("Edit Project")}</DialogTitle>
          <DialogDescription>{t("Update this project's details.")}</DialogDescription>
        </DialogHeader>

        <form id="edit-project-form" onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-project-name">{t("Name")}</FieldLabel>
              <Input
                id="edit-project-name"
                value={values.name}
                onChange={(event) => set("name", event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-project-description">{t("Description")}</FieldLabel>
              <Textarea
                id="edit-project-description"
                value={values.description}
                onChange={(event) => set("description", event.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="edit-project-status">{t("Status")}</FieldLabel>
                <EnumSelect
                  id="edit-project-status"
                  value={values.status}
                  onChange={(value) => set("status", value)}
                  options={STATUS_OPTIONS}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-project-priority">{t("Priority")}</FieldLabel>
                <EnumSelect
                  id="edit-project-priority"
                  value={values.priority}
                  onChange={(value) => set("priority", value)}
                  options={PRIORITY_OPTIONS}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="edit-project-order-date">{t("Created date")}</FieldLabel>
              <DatePicker
                id="edit-project-order-date"
                value={values.dueDate}
                placeholder={t("Select a date")}
                onChange={(value) => set("dueDate", value ?? "")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-project-lead">{t("Lead")}</FieldLabel>
              <div className="[&>div]:max-w-none">
                <PeopleField
                  users={users}
                  value={values.leadId}
                  onChange={(value) => set("leadId", (value as string) ?? "")}
                  editable
                  label={t("Lead")}
                />
              </div>
            </Field>

            <Field>
              <FieldLabel>{t("Members")}</FieldLabel>
              <PeopleField
                users={users}
                value={values.memberIds}
                onChange={(ids) => set("memberIds", ids as string[])}
                multiple
                editable
                max={5}
                label={t("Members")}
                className="min-h-9"
              />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{t("Cancel")}</DialogClose>
          <Button type="submit" form="edit-project-form">
            {t("Save Changes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- Archive ---------------------------------- */

export function ArchiveProjectDialog({
  open,
  onOpenChange,
  projectName,
  zh,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  zh: boolean;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {zh ? `归档“${projectName}”？` : `Archive "${projectName}"?`}
          </DialogTitle>
          <DialogDescription>
            {zh
              ? "该项目将从主项目列表隐藏，稍后可以撤销。"
              : "This will hide the project from the main projects list. This action can be undone later."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-t-0 bg-transparent">
          <DialogClose render={<Button variant="ghost" />}>{t("Cancel")}</DialogClose>
          <Button
            type="button"
            variant="ghost"
            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
            onClick={() => {
              onSubmit();
              onOpenChange(false);
            }}
          >
            {t("Archive")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
