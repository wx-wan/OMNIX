import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { resolveDate } from "src/api/workspace/use-workspace";
import { Button } from "src/components/ui/button";
import { Checkbox } from "src/components/ui/checkbox";
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
import type { WsProject, WsTeam, WsUser } from "src/types/apps/workspace";
import { PmsAvatar } from "../pms";

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

function RecordSelect({
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
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
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
  teamId: string;
  memberIds: string[];
};

const editValues = (project: WsProject): EditProjectValues => ({
  name: project.name,
  description: project.description,
  status: project.status,
  priority: project.priority,
  dueDate: isoDay(project.dueDate),
  leadId: project.leadId,
  teamId: project.teamId,
  memberIds: [...project.memberIds],
});

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  users,
  teams,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: WsProject;
  users: WsUser[];
  teams: WsTeam[];
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
              <FieldLabel htmlFor="edit-project-due-date">{t("Due Date")}</FieldLabel>
              <DatePicker
                id="edit-project-due-date"
                value={values.dueDate}
                placeholder={t("Select a date")}
                onChange={(value) => set("dueDate", value ?? "")}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="edit-project-lead">{t("Lead")}</FieldLabel>
                <RecordSelect
                  id="edit-project-lead"
                  value={values.leadId}
                  onChange={(value) => set("leadId", value)}
                  options={users.map((person) => ({ value: person.id, label: person.name }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-project-team">{t("Team")}</FieldLabel>
                <RecordSelect
                  id="edit-project-team"
                  value={values.teamId}
                  onChange={(value) => set("teamId", value)}
                  options={teams.map((team) => ({ value: team.id, label: team.name }))}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>{t("Members")}</FieldLabel>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                {users.map((person, index) => (
                  <label
                    key={person.id}
                    className={`flex cursor-pointer items-center gap-2 px-2 py-1.5 ${
                      index > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <Checkbox
                      checked={values.memberIds.includes(person.id)}
                      onCheckedChange={(checked) =>
                        set(
                          "memberIds",
                          checked
                            ? [...values.memberIds, person.id]
                            : values.memberIds.filter((item) => item !== person.id)
                        )
                      }
                    />
                    <PmsAvatar name={person.name} avatar={person.avatar} size={6} />
                    <span className="text-sm">{person.name}</span>
                    <span className="ms-auto text-xs text-muted-foreground">
                      {t(person.role.charAt(0).toUpperCase() + person.role.slice(1))}
                    </span>
                  </label>
                ))}
              </div>
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
