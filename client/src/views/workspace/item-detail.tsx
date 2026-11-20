"use client";

import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Trash2 } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import {
  agoLabel,
  formatDate,
  useWorkspace,
} from "src/api/workspace/use-workspace";
import { useTasks, updateTask, removeTask } from "src/api/tasks/use-tasks";
import { useIssues, updateIssue, removeIssue } from "src/api/issues/use-issues";
import { stageLabel } from "src/api/workspace/project-stages";
import { taskNo } from "src/api/workspace/task-no";
import type { WsTask, WsIssue } from "src/types/apps/workspace";
import { PeopleField } from "./people-field";
import {
  ItemPriorityMenu,
  ItemStatusMenu,
  STATUS_LABEL,
  ISSUE_STATUS_LABEL,
} from "./item-fields";
import { cn } from "@/lib/utils";
import { InlineEdit } from "@/components/shadcn-dashboard/input/inline-edit";
import { ContactInfoFields } from "./contact-info-fields";
import { PropertyRow, PropertiesPanel } from "./item-properties";

type Item = WsTask | WsIssue;
const isIssue = (item: Item): item is WsIssue => "number" in item;

/**
 * 事项详情页：任务与问题共用一套，1:1 还原线上 /issues/i12 的
 * 「面包屑 → 标题+状态/优先级 → Description/Activity → Properties」结构。
 * 路由：/issues/:id?kind=task|issue。
 */
export default function ItemDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { snap, zh, userName, projectName } = useWorkspace();
  const kind = params.get("kind") === "issue" ? "issue" : "task";
  const { tasks } = useTasks();
  const { issues } = useIssues();

  const item = useMemo<Item | undefined>(() => {
    const list: Item[] = kind === "issue" ? issues : tasks;
    return list.find((entry) => entry.id === id);
  }, [kind, tasks, issues, id]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!item) {
    return (
      <div className="p-10 text-sm text-muted-foreground">{t("No items")}</div>
    );
  }

  const issue = isIssue(item) ? item : null;
  /** 编号口径与项目详情/列表一致：任务 #T001（taskNo），问题 #Q{number}。 */
  const itemNo = issue
    ? `#Q${issue.number}`
    : taskNo(item as WsTask, tasks.filter((task) => task.projectId === item.projectId));
  const statusLabelMap = issue ? ISSUE_STATUS_LABEL : STATUS_LABEL;
  const projectId = item.projectId;
  const sprintLabel = item.sprintId && (snap?.sprints ?? []).find((s) => s.id === item.sprintId)?.name;
  const stageName = item.sprintId ? stageLabel(item.sprintId as Parameters<typeof stageLabel>[0], zh) : null;
  const reporterId = issue?.reporterId ?? null;
  const createdAt = item.createdAt;
  const updatedAt = item.updatedAt;

  const update = (patch: Partial<Item>) => {
    if (issue) return updateIssue(item.id, patch as Parameters<typeof updateIssue>[1]);
    return updateTask(item.id, patch as Parameters<typeof updateTask>[1]);
  };
  const onDelete = async () => {
    if (issue) await removeIssue(item.id);
    else await removeTask(item.id);
    toast.success(t("Saved successfully"));
    navigate(-1);
  };

  const content = (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/projects" />}>
              {t("Projects")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={`/projects/${projectId}`} />}>
              {projectName(projectId)}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {item.sprintId ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link to={`/projects/${projectId}/stages/${item.sprintId}`} />}
                >
                  {stageName ?? t("Stage")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          ) : null}
          <BreadcrumbItem>
            <BreadcrumbPage>{itemNo}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <InlineEdit
              as="h1"
              value={item.title}
              onCommit={(next) => next && void update({ title: next } as Partial<Item>)}
              className="text-2xl font-semibold tracking-tight"
              label={t("Click to edit")}
            />
            <span className="text-sm font-medium text-blue-500">{itemNo}</span>
          </div>
          <InlineEdit
            as="p"
            value={item.description ?? ""}
            placeholder={t("No description")}
            onCommit={(next) => void update({ description: next } as Partial<Item>)}
            className="mt-1 max-w-2xl text-sm text-muted-foreground"
            label={t("Click to edit")}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            title={t("Delete")}
            aria-label={t("Delete")}
            className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-destructive/30 bg-destructive/10 px-2.5 text-sm font-medium text-destructive hover:bg-destructive/20"
          >
            <Trash2 className="size-3.5" />
            {t("Delete")}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          {item.action === "contact" ? (
            <section className="rounded-xl border border-border bg-card p-5">
              <ContactInfoFields taskId={item.id} />
            </section>
          ) : null}
          <section className="rounded-xl border border-border bg-card">
            <h2 className="border-b border-border px-5 py-4 text-base font-semibold">
              {t("Activity")}
            </h2>
            <ul className="flex flex-col gap-4 px-5 py-4">
              <ActivityLine color="bg-blue-500" text={`${userName(reporterId)} ${t("Created by")}`} time={agoLabel(createdAt, zh ? "ch" : "en")} />
              <ActivityLine color="bg-teal-500" text={`${userName(item.assigneeId)} ${t("Assigned to")}`} time={agoLabel(updatedAt, zh ? "ch" : "en")} />
              <ActivityLine color="bg-orange-500" text={`${t(statusLabelMap[item.status])} ${t("is the current status")}`} time={agoLabel(updatedAt, zh ? "ch" : "en")} />
            </ul>
          </section>
        </div>

        <PropertiesPanel title={t("Properties")}>
          <div className="divide-y divide-border px-5">
            <PropertyRow label={t("Status")}>
              <ItemStatusMenu
                value={item.status}
                labelMap={statusLabelMap}
                onChange={(status) => void update({ status } as Partial<Item>)}
              />
            </PropertyRow>
            <PropertyRow label={t("Priority")}>
              <ItemPriorityMenu
                value={item.priority}
                onChange={(priority) => void update({ priority } as Partial<Item>)}
              />
            </PropertyRow>
            <PropertyRow label={t("Assignee")}>
              <PeopleField
                users={snap?.users ?? []}
                value={item.assigneeId}
                editable
                label={t("Assignee")}
                onChange={(next) => void update({ assigneeId: (next as string | null) ?? null } as Partial<Item>)}
              />
            </PropertyRow>
            {issue ? (
              <PropertyRow label={t("Created by")}>
                <PeopleField
                  users={snap?.users ?? []}
                  value={issue.reporterId}
                  editable
                  label={t("Created by")}
                  onChange={(next) => void update({ reporterId: (next as string | null) ?? null } as Partial<Item>)}
                />
              </PropertyRow>
            ) : null}
            <PropertyRow label={t("Project")}>{projectName(projectId)}</PropertyRow>
            <PropertyRow label={t("Stage")}>{stageName ?? "—"}</PropertyRow>
            {sprintLabel ? <PropertyRow label={t("Sprint")}>{sprintLabel}</PropertyRow> : null}
            {issue?.severity ? (
              <PropertyRow label={t("Severity")}>{t(issue.severity)}</PropertyRow>
            ) : null}
            <PropertyRow label={t("Created")}>
              {formatDate(createdAt, zh ? "ch" : "en", "full")}
            </PropertyRow>
            <PropertyRow label={t("Updated")}>{agoLabel(updatedAt, zh ? "ch" : "en")}</PropertyRow>
          </div>
        </PropertiesPanel>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-base font-semibold">{t("Delete")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.title}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmOpen(false)} className="h-9 rounded-lg border px-3 text-sm">
                {t("Cancel")}
              </button>
              <button type="button" onClick={() => void onDelete()} className="h-9 rounded-lg bg-destructive px-3 text-sm text-destructive-foreground">
                {t("Delete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  return <div className="flex min-w-0 flex-1 flex-col">{content}</div>;
}

function ActivityLine({ color, text, time }: { color: string; text: string; time: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className={cn("mt-1.5 size-3 shrink-0 rounded-full", color)} />
      <span className="min-w-0 flex-1">{text}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
    </li>
  );
}
