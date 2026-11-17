import { useEffect, useRef, useState, type FormEvent } from "react";
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
import { Textarea } from "src/components/ui/textarea";

export type NewProjectValues = {
  name: string;
  description: string;
  status: string;
  priority: string;
};

/** 新建项目默认状态=进行中、优先级=中；字段在弹窗中隐藏，仅作为创建默认值。 */
const EMPTY: NewProjectValues = {
  name: "",
  description: "",
  status: "active",
  priority: "medium",
};

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
  onSubmit: (values: NewProjectValues) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<NewProjectValues>(EMPTY);
  const submitting = useRef(false);

  useEffect(() => {
    if (open) {
      setValues(EMPTY);
      submitting.current = false;
    }
  }, [open]);

  const set = (key: keyof NewProjectValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    const name = values.name.trim();
    if (!name) return;
    submitting.current = true;
    try {
      await onSubmit({ ...values, name, description: values.description.trim() });
    } catch {
      // 创建失败且弹窗仍开着时释放锁，允许重试；成功时页面跳转，锁随弹窗卸载
      submitting.current = false;
    }
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
