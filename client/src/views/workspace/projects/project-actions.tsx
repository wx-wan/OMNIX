import { useState } from "react";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import { createTask, updateTask } from "src/api/tasks/use-tasks";
import { createIssue, updateIssue } from "src/api/issues/use-issues";
import type {
  WsFile,
  WsIssue,
  WsProject,
  WsSprint,
  WsTask,
  WsUser,
} from "src/types/apps/workspace";
import { ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Textarea } from "src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/components/ui/select";
import { PmsField, PmsSheet } from "../pms";
import { CURRENT_USER_ID, resolveDate } from "src/api/workspace/use-workspace";
import {
  addActivityNote,
  addFile,
  addSprint,
  archiveProject,
  setProjectMembers,
  updateProject,
  updateRecord,
} from "src/api/workspace/project-stages";

/**
 * 项目详情页的写入层：所有表单复用 PmsSheet + PmsField + shadcn Input/Select/Button，
 * 通过项目制 store 落库，保证「新建 → 编辑 → 归档」与七个 tab 的数据闭环。
 */

export type ProjectDialog =
  | { kind: "edit" }
  | { kind: "archive" }
  | { kind: "issue"; record?: WsIssue }
  | { kind: "task"; record?: WsTask }
  | { kind: "sprint"; record?: WsSprint }
  | { kind: "file"; record?: WsFile }
  | { kind: "member" }
  | { kind: "note" };

type Draft = {
  name: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  leadId: string;
  memberIds: string[];
  assigneeId: string;
  goal: string;
  startDate: string;
  endDate: string;
  fileType: string;
  size: string;
  estimate: string;
  message: string;
};

const isoDay = (value?: string | null) => {
  const date = resolveDate(value);
  return date ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
};

const STATUS_OPTIONS = ["active", "on_hold", "completed"];
const ISSUE_STATUS = ["backlog", "todo", "in_progress", "review", "done", "closed"];
const TASK_STATUS = ["todo", "in_progress", "review", "done", "closed"];
const SPRINT_STATUS = ["planning", "active", "completed"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];

const emptyDraft = (): Draft => ({
  name: "",
  description: "",
  status: "active",
  priority: "medium",
  dueDate: new Date().toISOString().slice(0, 10),
  leadId: CURRENT_USER_ID,
  memberIds: [CURRENT_USER_ID],
  assigneeId: CURRENT_USER_ID,
  goal: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  fileType: "",
  size: "",
  estimate: "",
  message: "",
});

const initialDraft = (dialog: ProjectDialog, project: WsProject): Draft => {
  const base = emptyDraft();
  switch (dialog.kind) {
    case "edit":
      return {
        ...base,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        dueDate: isoDay(project.dueDate),
        leadId: project.leadId,
        memberIds: [...project.memberIds],
      };
    case "issue":
      return {
        ...base,
        name: dialog.record?.title ?? "",
        description: dialog.record?.description ?? "",
        status: dialog.record?.status ?? "todo",
        priority: dialog.record?.priority ?? "medium",
        assigneeId: dialog.record?.assigneeId ?? CURRENT_USER_ID,
      };
    case "task":
      return {
        ...base,
        name: dialog.record?.title ?? "",
        description: dialog.record?.description ?? "",
        status: dialog.record?.status ?? "todo",
        priority: dialog.record?.priority ?? "medium",
        assigneeId: dialog.record?.assigneeId ?? CURRENT_USER_ID,
        dueDate: isoDay(dialog.record?.dueDate),
        estimate: dialog.record?.estimate ? String(dialog.record.estimate) : "",
      };
    case "sprint":
      return {
        ...base,
        name: dialog.record?.name ?? "",
        goal: dialog.record?.goal ?? "",
        status: dialog.record?.status ?? "planning",
        startDate: isoDay(dialog.record?.startDate),
        endDate: isoDay(dialog.record?.endDate),
      };
    case "file":
      return {
        ...base,
        name: dialog.record?.name ?? "",
        fileType: dialog.record?.type ?? "",
        size: dialog.record?.size
          ? String((dialog.record.size / 1048576).toFixed(1))
          : "",
      };
    default:
      return base;
  }
};

const dialogTitle = (dialog: ProjectDialog, t: (key: string) => string) => {
  const edit = Boolean(
    (dialog.kind === "issue" ||
      dialog.kind === "task" ||
      dialog.kind === "sprint" ||
      dialog.kind === "file") &&
      dialog.record
  );
  switch (dialog.kind) {
    case "edit":
      return t("Edit Project");
    case "archive":
      return t("Archive");
    case "issue":
      return edit ? t("Edit Issue") : t("New Issue");
    case "task":
      return edit ? t("Edit Task") : t("New Task");
    case "sprint":
      return edit ? t("Edit Iteration") : t("New Iteration");
    case "file":
      return edit ? t("Edit File") : t("Upload File");
    case "member":
      return t("Add Member");
    case "note":
      return t("Add Note");
  }
};

export function ProjectDialogs({
  project,
  users,
  dialog,
  onClose,
  zh,
  t,
  nextIssueNumber,
}: {
  project: WsProject;
  users: WsUser[];
  dialog: ProjectDialog | null;
  onClose: () => void;
  zh: boolean;
  t: (key: string) => string;
  nextIssueNumber: number;
}) {
  if (!dialog) return null;
  return (
    <DialogBody
      key={`${dialog.kind}-${"record" in dialog ? dialog.record?.id ?? "new" : ""}`}
      project={project}
      users={users}
      dialog={dialog}
      onClose={onClose}
      zh={zh}
      t={t}
      nextIssueNumber={nextIssueNumber}
    />
  );
}

function DialogBody({
  project,
  users,
  dialog,
  onClose,
  zh,
  t,
  nextIssueNumber,
}: {
  project: WsProject;
  users: WsUser[];
  dialog: ProjectDialog;
  onClose: () => void;
  zh: boolean;
  t: (key: string) => string;
  nextIssueNumber: number;
}) {
  const [draft, setDraft] = useState<Draft>(() => initialDraft(dialog, project));
  const set = (key: keyof Draft, value: string | string[]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));
  const label = (en: string, cn: string) => (zh ? cn : en);
  const title = dialogTitle(dialog, t);

  const field = (name: string, key: keyof Draft, placeholder = "") => (
    <PmsField label={name}>
      <Input
        value={String(draft[key])}
        onChange={(event) => set(key, event.target.value)}
        placeholder={placeholder}
        className="h-9 text-sm"
      />
    </PmsField>
  );

  const selectField = (name: string, key: keyof Draft, options: string[]) => (
    <PmsField label={name}>
      <Select value={String(draft[key])} onValueChange={(value) => value && set(key, value)}>
        <SelectTrigger className="h-9 w-full text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {t(option.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PmsField>
  );

  const assigneeField = () => (
    <PmsField label={t("Assignee")}>
      <Select
        value={draft.assigneeId || "none"}
        onValueChange={(value) => value && set("assigneeId", value === "none" ? "" : value)}
      >
        <SelectTrigger className="h-9 w-full text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("Unassigned")}</SelectItem>
          {users.map((person) => (
            <SelectItem key={person.id} value={person.id}>
              {person.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PmsField>
  );

  const descriptionField = () => (
    <PmsField label={t("Description")}>
      <Textarea
        value={draft.description}
        onChange={(event) => set("description", event.target.value)}
        className="min-h-20 text-sm"
      />
    </PmsField>
  );

  const submit = async () => {
    switch (dialog.kind) {
      case "edit":
        updateProject(project.id, {
          name: draft.name.trim() || project.name,
          description: draft.description,
          status: draft.status,
          priority: draft.priority,
          dueDate: draft.dueDate,
          leadId: draft.leadId || project.leadId,
          memberIds: draft.memberIds,
        });
        break;
      case "archive":
        archiveProject(project.id);
        break;
      case "issue": {
        const rec = dialog.kind === "issue" ? dialog.record : undefined;
        if (rec)
          await updateIssue(rec.id, {
            title: draft.name.trim() || rec.title,
            description: draft.description,
            status: draft.status,
            priority: draft.priority,
            assigneeId: draft.assigneeId || null,
          });
        else
          await createIssue({
            title: draft.name.trim(),
            description: draft.description,
            status: draft.status,
            priority: draft.priority,
            assigneeId: draft.assigneeId || null,
            number: nextIssueNumber,
            projectId: project.id,
          });
        break;
      }
      case "task": {
        const rec = dialog.kind === "task" ? dialog.record : undefined;
        if (rec)
          await updateTask(rec.id, {
            title: draft.name.trim() || rec.title,
            description: draft.description,
            status: draft.status,
            priority: draft.priority,
            assigneeId: draft.assigneeId || null,
            dueDate: draft.dueDate || null,
            estimate: draft.estimate ? Number(draft.estimate) : null,
          });
        else
          await createTask({
            title: draft.name.trim(),
            description: draft.description,
            status: draft.status,
            priority: draft.priority,
            assigneeId: draft.assigneeId || null,
            dueDate: draft.dueDate || null,
            estimate: draft.estimate ? Number(draft.estimate) : null,
            projectId: project.id,
          });
        break;
      }
      case "sprint": {
        const rec = dialog.kind === "sprint" ? dialog.record : undefined;
        if (rec)
          updateRecord(
            "sprints",
            rec.id,
            {
              name: draft.name.trim() || rec.name,
              goal: draft.goal,
              status: draft.status,
              startDate: draft.startDate,
              endDate: draft.endDate,
            },
            project.id
          );
        else
          addSprint(project.id, {
            name: draft.name.trim(),
            goal: draft.goal,
            status: draft.status,
            startDate: draft.startDate,
            endDate: draft.endDate,
          });
        break;
      }
      case "file": {
        const rec = dialog.kind === "file" ? dialog.record : undefined;
        if (rec)
          updateRecord(
            "files",
            rec.id,
            {
              name: draft.name.trim() || rec.name,
              type: draft.fileType || rec.type,
              size: draft.size ? Number(draft.size) * 1048576 : rec.size,
            },
            project.id
          );
        else
          addFile(project.id, {
            name: draft.name.trim(),
            type: draft.fileType || undefined,
            size: draft.size ? Number(draft.size) * 1048576 : undefined,
          });
        break;
      }
      case "member":
        if (draft.assigneeId && !project.memberIds.includes(draft.assigneeId))
          setProjectMembers(project.id, [...project.memberIds, draft.assigneeId]);
        break;
      case "note":
        addActivityNote(project.id, draft.message.trim());
        break;
    }
    if (dialog.kind !== "archive") toast.success(t("Saved successfully"));
    onClose();
  };

  if (dialog.kind === "archive")
    return (
      <PmsSheet open onOpenChange={(open) => !open && onClose()} title={title}>
        <p className="text-sm text-muted-foreground">
          {label(
            "The project will be hidden from the list. You can restore it from this page.",
            "项目将从列表隐藏，可在本页恢复。"
          )}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button
            type="button"
            className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20"
            onClick={submit}
          >
            {t("Archive")}
          </Button>
        </div>
      </PmsSheet>
    );

  return (
    <PmsSheet open onOpenChange={(open) => !open && onClose()} title={title}>
      {dialog.kind === "edit" ? (
        <>
          {field(t("Name"), "name")}
          {descriptionField()}
          {selectField(t("Status"), "status", STATUS_OPTIONS)}
          {selectField(t("Priority"), "priority", PRIORITY_OPTIONS)}
          <PmsField label={t("Due date")}>
            <Input
              type="date"
              value={draft.dueDate}
              onChange={(event) => set("dueDate", event.target.value)}
              className="h-9 text-sm"
            />
          </PmsField>
          <PmsField label={t("Lead")}>
            <Select
              value={draft.leadId}
              onValueChange={(value) => value && set("leadId", value)}
            >
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PmsField>
          <PmsField label={t("Members")}>
            <div className="flex flex-col gap-1.5">
              {users.map((person) => (
                <label key={person.id} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.memberIds.includes(person.id)}
                    onChange={(event) =>
                      set(
                        "memberIds",
                        event.target.checked
                          ? [...draft.memberIds, person.id]
                          : draft.memberIds.filter((item) => item !== person.id)
                      )
                    }
                  />
                  {person.name}
                </label>
              ))}
            </div>
          </PmsField>
        </>
      ) : null}

      {dialog.kind === "issue" || dialog.kind === "task" ? (
        <>
          {field(t("Title"), "name")}
          {descriptionField()}
          {selectField(
            t("Status"),
            "status",
            dialog.kind === "issue" ? ISSUE_STATUS : TASK_STATUS
          )}
          {selectField(t("Priority"), "priority", PRIORITY_OPTIONS)}
          {assigneeField()}
          {dialog.kind === "task" ? (
            <>
              <PmsField label={t("Due date")}>
                <Input
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) => set("dueDate", event.target.value)}
                  className="h-9 text-sm"
                />
              </PmsField>
              {field(t("Estimate"), "estimate")}
            </>
          ) : null}
        </>
      ) : null}

      {dialog.kind === "sprint" ? (
        <>
          {field(t("Name"), "name")}
          {field(t("Goal"), "goal")}
          {selectField(t("Status"), "status", SPRINT_STATUS)}
          <PmsField label={t("Start date")}>
            <Input
              type="date"
              value={draft.startDate}
              onChange={(event) => set("startDate", event.target.value)}
              className="h-9 text-sm"
            />
          </PmsField>
          <PmsField label={t("End date")}>
            <Input
              type="date"
              value={draft.endDate}
              onChange={(event) => set("endDate", event.target.value)}
              className="h-9 text-sm"
            />
          </PmsField>
        </>
      ) : null}

      {dialog.kind === "file" ? (
        <>
          {field(t("File name"), "name", "spec.pdf")}
          {field(t("Type"), "fileType", "pdf")}
          {field(label("Size (MB)", "大小 (MB)"), "size", "1.5")}
        </>
      ) : null}

      {dialog.kind === "member" ? (
        <PmsField label={t("Member")}>
          <Select
            value={draft.assigneeId || "none"}
            onValueChange={(value) => value && set("assigneeId", value)}
          >
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("Select a member")}</SelectItem>
              {users
                .filter((person) => !project.memberIds.includes(person.id))
                .map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </PmsField>
      ) : null}

      {dialog.kind === "note" ? (
        <PmsField label={t("Message")}>
          <Textarea
            value={draft.message}
            onChange={(event) => set("message", event.target.value)}
            className="min-h-20 text-sm"
          />
        </PmsField>
      ) : null}

      <Button type="button" className="w-full" onClick={submit}>
        {t("Save")}
      </Button>
    </PmsSheet>
  );
}

/** 新增入口：沿用工作区卡片的分栏节奏，使用 shadcn outline 按钮。 */
export function AddBar({
  title,
  label,
  onAdd,
}: {
  title: string;
  label: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
      <span className="text-xs text-muted-foreground">{title}</span>
      <Button type="button" variant="outline" size="sm" className="h-7" onClick={onAdd}>
        <Plus className="size-3.5" />
        {label}
      </Button>
    </div>
  );
}

/**
 * 行操作：shadcn ghost 图标按钮。
 * - editIcon="external" 时首按钮改为跳转箭头（预设阶段点击即打开详情）；
 * - onDelete 缺省时不渲染删除按钮（系统预设阶段不可删除）。
 */
export function RowActions({
  onEdit,
  onDelete,
  zh,
  editIcon = "edit",
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  zh: boolean;
  editIcon?: "edit" | "external";
}) {
  const EditIcon = editIcon === "external" ? ArrowUpRight : Pencil;
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            editIcon === "external" ? (zh ? "打开" : "Open") : zh ? "编辑" : "Edit"
          }
          className="size-7 text-muted-foreground"
          onClick={onEdit}
        >
          <EditIcon className="size-3.5" />
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={zh ? "删除" : "Delete"}
          className="size-7 text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
