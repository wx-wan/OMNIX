import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CURRENT_USER_ID } from "src/api/workspace/constants";
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
import { Switch } from "src/components/ui/switch";
import { Textarea } from "src/components/ui/textarea";
import type { WsProject, WsUser } from "src/types/apps/workspace";

/**
 * 线上 PMS 五个「新建」弹窗的 1:1 复刻。
 * 与 NewProjectDialog 共用同一套 Dialog / Field / Input / Textarea / Select / DatePicker / Switch / Button，
 * 不新增浮层、字段容器、字号或配色；表单值由各模块页写入项目制 store。
 */

const NONE = "none";

const isoDay = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

type Option = { value: string; label: string };

const PRIORITY_OPTIONS: Option[] = [
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
  { value: "urgent", label: "urgent" },
];
const SEVERITY_OPTIONS: Option[] = [
  { value: "critical", label: "critical" },
  { value: "major", label: "major" },
  { value: "minor", label: "minor" },
  { value: "trivial", label: "trivial" },
];
const TASK_STATUS_OPTIONS: Option[] = [
  { value: "backlog", label: "backlog" },
  { value: "todo", label: "todo" },
  { value: "in_progress", label: "in_progress" },
  { value: "review", label: "review" },
  { value: "done", label: "done" },
];
const EVENT_TYPE_OPTIONS: Option[] = [
  { value: "meeting", label: "meeting" },
  { value: "deadline", label: "deadline" },
  { value: "release", label: "release" },
  { value: "sprint", label: "sprint" },
];

type CreateProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: WsProject[];
  users: WsUser[];
};

function CreateDialog({
  open,
  onOpenChange,
  title,
  description,
  formId,
  submitLabel,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  formId: string;
  submitLabel: string;
  onSubmit: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form id={formId} onSubmit={submit}>
          <FieldGroup>{children}</FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{t("Cancel")}</DialogClose>
          <Button type="submit" form={formId}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** 枚举下拉：与 NewProjectDialog 的 Select 用法一致，label 走词典。 */
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

/** 记录下拉：首项为「未选择」，与线上 Select a project / Unassigned / none 一致。 */
function RecordSelect({
  id,
  value,
  onChange,
  options,
  noneLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  noneLabel: string;
}) {
  return (
    <Select
      value={value || NONE}
      onValueChange={(next) => next && onChange(next === NONE ? "" : next)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{noneLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* --------------------------------- New Issue --------------------------------- */

export type NewIssueValues = {
  title: string;
  description: string;
  projectId: string;
  priority: string;
  severity: string;
  assigneeId: string;
};

const EMPTY_ISSUE: NewIssueValues = {
  title: "",
  description: "",
  projectId: "",
  priority: "medium",
  severity: "minor",
  assigneeId: "",
};

export function NewIssueDialog({
  open,
  onOpenChange,
  onSubmit,
  projects,
  users,
}: CreateProps & { onSubmit: (values: NewIssueValues) => void }) {
  const { t } = useTranslation();
  const [values, setValues] = useState<NewIssueValues>(EMPTY_ISSUE);

  useEffect(() => {
    if (open) setValues(EMPTY_ISSUE);
  }, [open]);

  const set = (key: keyof NewIssueValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const submit = () => {
    const title = values.title.trim();
    if (!title) return;
    onSubmit({ ...values, title, description: values.description.trim() });
  };

  return (
    <CreateDialog
      open={open}
      onOpenChange={onOpenChange}
      formId="new-issue-form"
      title={t("New Issue")}
      description={t("Report a bug or work item.")}
      submitLabel={t("Create Issue")}
      onSubmit={submit}
    >
      <Field>
        <FieldLabel htmlFor="issue-title">{t("Title")}</FieldLabel>
        <Input
          id="issue-title"
          placeholder={t("Fix responsive layout issues")}
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="issue-description">{t("Description")}</FieldLabel>
        <Textarea
          id="issue-description"
          placeholder={t("What's going wrong?")}
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="issue-project">{t("Project")}</FieldLabel>
        <RecordSelect
          id="issue-project"
          value={values.projectId}
          onChange={(value) => set("projectId", value)}
          noneLabel={t("Select a project")}
          options={projects.map((project) => ({ value: project.id, label: project.name }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="issue-priority">{t("Priority")}</FieldLabel>
          <EnumSelect
            id="issue-priority"
            value={values.priority}
            onChange={(value) => set("priority", value)}
            options={PRIORITY_OPTIONS}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="issue-severity">{t("Severity")}</FieldLabel>
          <EnumSelect
            id="issue-severity"
            value={values.severity}
            onChange={(value) => set("severity", value)}
            options={SEVERITY_OPTIONS}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="issue-assignee">{t("Assignee")}</FieldLabel>
        <RecordSelect
          id="issue-assignee"
          value={values.assigneeId}
          onChange={(value) => set("assigneeId", value)}
          noneLabel={t("Unassigned")}
          options={users.map((person) => ({ value: person.id, label: person.name }))}
        />
      </Field>
    </CreateDialog>
  );
}

/* ---------------------------------- New Task --------------------------------- */

export type NewTaskValues = {
  title: string;
  description: string;
  projectId: string;
  status: string;
  priority: string;
  assigneeId: string;
  dueDate: string;
};

const EMPTY_TASK: NewTaskValues = {
  title: "",
  description: "",
  projectId: "",
  status: "todo",
  priority: "medium",
  assigneeId: "",
  dueDate: "",
};

export function NewTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  projects,
  users,
}: CreateProps & { onSubmit: (values: NewTaskValues) => void }) {
  const { t } = useTranslation();
  const [values, setValues] = useState<NewTaskValues>(EMPTY_TASK);

  useEffect(() => {
    if (open) setValues(EMPTY_TASK);
  }, [open]);

  const set = (key: keyof NewTaskValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const submit = () => {
    const title = values.title.trim();
    if (!title) return;
    onSubmit({ ...values, title, description: values.description.trim() });
  };

  return (
    <CreateDialog
      open={open}
      onOpenChange={onOpenChange}
      formId="new-task-form"
      title={t("New Task")}
      description={t("Add a task to a project.")}
      submitLabel={t("Create Task")}
      onSubmit={submit}
    >
      <Field>
        <FieldLabel htmlFor="task-title">{t("Title")}</FieldLabel>
        <Input
          id="task-title"
          placeholder={t("Write project documentation")}
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="task-description">{t("Description")}</FieldLabel>
        <Textarea
          id="task-description"
          placeholder={t("Optional details")}
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="task-project">{t("Project")}</FieldLabel>
        <RecordSelect
          id="task-project"
          value={values.projectId}
          onChange={(value) => set("projectId", value)}
          noneLabel={t("Select a project")}
          options={projects.map((project) => ({ value: project.id, label: project.name }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="task-status">{t("Status")}</FieldLabel>
          <EnumSelect
            id="task-status"
            value={values.status}
            onChange={(value) => set("status", value)}
            options={TASK_STATUS_OPTIONS}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="task-priority">{t("Priority")}</FieldLabel>
          <EnumSelect
            id="task-priority"
            value={values.priority}
            onChange={(value) => set("priority", value)}
            options={PRIORITY_OPTIONS}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="task-assignee">{t("Assignee")}</FieldLabel>
          <RecordSelect
            id="task-assignee"
            value={values.assigneeId}
            onChange={(value) => set("assigneeId", value)}
            noneLabel={t("Unassigned")}
            options={users.map((person) => ({ value: person.id, label: person.name }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="task-due-date">{t("Due Date")}</FieldLabel>
          <DatePicker
            id="task-due-date"
            value={values.dueDate}
            placeholder={t("Select a date")}
            onChange={(value) => set("dueDate", value ?? "")}
          />
        </Field>
      </div>
    </CreateDialog>
  );
}

/* --------------------------------- New Stage --------------------------------- */

export type NewStageValues = {
  name: string;
  goal: string;
  projectId: string;
  startDate: string;
  endDate: string;
};

const emptyStage = (): NewStageValues => ({
  name: "",
  goal: "",
  projectId: "",
  startDate: isoDay(),
  endDate: isoDay(14),
});

export function NewStageDialog({
  open,
  onOpenChange,
  onSubmit,
  projects,
}: Omit<CreateProps, "users"> & { onSubmit: (values: NewStageValues) => void }) {
  const { t } = useTranslation();
  const [values, setValues] = useState<NewStageValues>(emptyStage);

  useEffect(() => {
    if (open) setValues(emptyStage());
  }, [open]);

  const set = (key: keyof NewStageValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const submit = () => {
    const name = values.name.trim();
    if (!name) return;
    onSubmit({ ...values, name, goal: values.goal.trim() });
  };

  return (
    <CreateDialog
      open={open}
      onOpenChange={onOpenChange}
      formId="new-stage-form"
      title={t("New sprint")}
      description={t(
        "A sprint is a short, fixed period (usually 1-2 weeks) with a set of issues to finish."
      )}
      submitLabel={t("Create sprint")}
      onSubmit={submit}
    >
      <Field>
        <FieldLabel htmlFor="stage-name">{t("Name")}</FieldLabel>
        <Input
          id="stage-name"
          placeholder={t("Sprint 5")}
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="stage-project">{t("Project")}</FieldLabel>
        <RecordSelect
          id="stage-project"
          value={values.projectId}
          onChange={(value) => set("projectId", value)}
          noneLabel={t("Select a project")}
          options={projects.map((project) => ({ value: project.id, label: project.name }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="stage-start">{t("Start")}</FieldLabel>
          <DatePicker
            id="stage-start"
            value={values.startDate}
            placeholder={t("Select a date")}
            onChange={(value) => set("startDate", value ?? "")}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="stage-end">{t("End")}</FieldLabel>
          <DatePicker
            id="stage-end"
            value={values.endDate}
            placeholder={t("Select a date")}
            onChange={(value) => set("endDate", value ?? "")}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="stage-goal">{t("Goal")}</FieldLabel>
        <Textarea
          id="stage-goal"
          placeholder={t("What should be done by the end of this sprint?")}
          value={values.goal}
          onChange={(event) => set("goal", event.target.value)}
        />
      </Field>
    </CreateDialog>
  );
}

/* --------------------------------- New Event --------------------------------- */

export type NewEventValues = {
  title: string;
  description: string;
  projectId: string;
  type: string;
  assigneeId: string;
  date: string;
  time: string;
  allDay: boolean;
};

const emptyEvent = (defaultDate?: string): NewEventValues => ({
  title: "",
  description: "",
  projectId: "",
  type: "meeting",
  assigneeId: "",
  date: defaultDate || isoDay(),
  time: "09:00",
  allDay: false,
});

export function NewEventDialog({
  open,
  onOpenChange,
  onSubmit,
  projects,
  users,
  defaultDate,
}: CreateProps & {
  onSubmit: (values: NewEventValues) => void;
  defaultDate?: string;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<NewEventValues>(() => emptyEvent(defaultDate));

  useEffect(() => {
    if (open) setValues(emptyEvent(defaultDate));
  }, [open, defaultDate]);

  const set = (key: keyof NewEventValues, value: string | boolean) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const submit = () => {
    const title = values.title.trim();
    if (!title) return;
    onSubmit({ ...values, title, description: values.description.trim() });
  };

  return (
    <CreateDialog
      open={open}
      onOpenChange={onOpenChange}
      formId="new-event-form"
      title={t("New event")}
      description={t("Schedule something on the calendar.")}
      submitLabel={t("Add event")}
      onSubmit={submit}
    >
      <Field>
        <FieldLabel htmlFor="event-title">{t("Title")}</FieldLabel>
        <Input
          id="event-title"
          placeholder={t("Sprint planning")}
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="event-type">{t("Type")}</FieldLabel>
          <EnumSelect
            id="event-type"
            value={values.type}
            onChange={(value) => set("type", value)}
            options={EVENT_TYPE_OPTIONS}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="event-assignee">{t("Assignee")}</FieldLabel>
          <RecordSelect
            id="event-assignee"
            value={values.assigneeId}
            onChange={(value) => set("assigneeId", value)}
            noneLabel={t("none")}
            options={users.map((person) => ({ value: person.id, label: person.name }))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="event-date">{t("Date")}</FieldLabel>
          <DatePicker
            id="event-date"
            value={values.date}
            placeholder={t("Select a date")}
            onChange={(value) => set("date", value ?? "")}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="event-time">{t("Time")}</FieldLabel>
          <Input
            id="event-time"
            type="time"
            disabled={values.allDay}
            value={values.time}
            onChange={(event) => set("time", event.target.value)}
          />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor="event-all-day">{t("All-day event")}</FieldLabel>
        <Switch
          id="event-all-day"
          checked={values.allDay}
          onCheckedChange={(checked) => set("allDay", checked)}
        />
      </div>
      <Field>
        <FieldLabel htmlFor="event-project">{t("Project")}</FieldLabel>
        <RecordSelect
          id="event-project"
          value={values.projectId}
          onChange={(value) => set("projectId", value)}
          noneLabel={t("none")}
          options={projects.map((project) => ({ value: project.id, label: project.name }))}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="event-description">{t("Description")}</FieldLabel>
        <Textarea
          id="event-description"
          placeholder={t("Optional details")}
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </Field>
    </CreateDialog>
  );
}

/* ---------------------------------- New Team --------------------------------- */

export type NewTeamValues = {
  name: string;
  description: string;
  leadId: string;
};

const EMPTY_TEAM: NewTeamValues = {
  name: "",
  description: "",
  leadId: CURRENT_USER_ID,
};

export function NewTeamDialog({
  open,
  onOpenChange,
  onSubmit,
  users,
}: Omit<CreateProps, "projects"> & { onSubmit: (values: NewTeamValues) => void }) {
  const { t } = useTranslation();
  const [values, setValues] = useState<NewTeamValues>(EMPTY_TEAM);

  useEffect(() => {
    if (open) setValues(EMPTY_TEAM);
  }, [open]);

  const set = (key: keyof NewTeamValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const submit = () => {
    const name = values.name.trim();
    if (!name) return;
    onSubmit({ ...values, name, description: values.description.trim() });
  };

  /** 线上 Owner 下拉直接展示用户 id（默认 u2）。 */
  const owners: Option[] = users.map((person) => ({ value: person.id, label: person.id }));
  if (!owners.some((owner) => owner.value === CURRENT_USER_ID))
    owners.unshift({ value: CURRENT_USER_ID, label: CURRENT_USER_ID });

  return (
    <CreateDialog
      open={open}
      onOpenChange={onOpenChange}
      formId="new-team-form"
      title={t("New team")}
      description={t("Group people who work together on the same projects.")}
      submitLabel={t("Create team")}
      onSubmit={submit}
    >
      <Field>
        <FieldLabel htmlFor="team-name">{t("Name")}</FieldLabel>
        <Input
          id="team-name"
          placeholder={t("Engineering")}
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="team-owner">{t("Owner")}</FieldLabel>
        <EnumSelect
          id="team-owner"
          value={values.leadId}
          onChange={(value) => set("leadId", value)}
          options={owners}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="team-description">{t("Description")}</FieldLabel>
        <Textarea
          id="team-description"
          placeholder={t("What does this team do?")}
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </Field>
    </CreateDialog>
  );
}
