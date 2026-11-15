import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "src/components/ui/button";
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

export type NewProjectValues = {
  name: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
};

const EMPTY: NewProjectValues = {
  name: "",
  description: "",
  status: "active",
  priority: "medium",
  dueDate: "",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

/**
 * 线上 PMS /projects → New Project 弹窗的 1:1 复刻。
 * 结构与类名全部复用 components/ui 的 Dialog / Field / Input / Textarea / Select / Button，
 * 不额外手写浮层、字段或配色。
 */
export function NewProjectDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NewProjectValues) => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<NewProjectValues>(EMPTY);

  useEffect(() => {
    if (open) setValues(EMPTY);
  }, [open]);

  const set = (key: keyof NewProjectValues, value: string) =>
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
          <DialogTitle className="font-heading">{t("New Project")}</DialogTitle>
          <DialogDescription>
            {t("Create a new project for your team to work on.")}
          </DialogDescription>
        </DialogHeader>

        <form id="new-project-form" onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project-name">{t("Name")}</FieldLabel>
              <Input
                id="project-name"
                name="name"
                placeholder={t("Website Redesign")}
                value={values.name}
                onChange={(event) => set("name", event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-description">{t("Description")}</FieldLabel>
              <Textarea
                id="project-description"
                name="description"
                placeholder={t("What's this project about?")}
                value={values.description}
                onChange={(event) => set("description", event.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="project-status">{t("Status")}</FieldLabel>
                <Select
                  value={values.status}
                  onValueChange={(value) => value && set("status", value)}
                >
                  <SelectTrigger id="project-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="project-priority">{t("Priority")}</FieldLabel>
                <Select
                  value={values.priority}
                  onValueChange={(value) => value && set("priority", value)}
                >
                  <SelectTrigger id="project-priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="project-due-date">{t("Due Date")}</FieldLabel>
              <Input
                id="project-due-date"
                type="date"
                name="dueDate"
                value={values.dueDate}
                onChange={(event) => set("dueDate", event.target.value)}
              />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{t("Cancel")}</DialogClose>
          <Button type="submit" form="new-project-form">
            {t("Create Project")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
