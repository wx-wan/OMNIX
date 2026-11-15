import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CircleDot,
  Clock,
  File,
  Flag,
  LayoutDashboard,
  ListChecks,
  TriangleAlert,
  UserRound,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  agoLabel,
  formatDate,
  relativeDays,
  resolveDate,
  useWorkspace,
} from "src/api/workspace/use-workspace";
import {
  STAGES,
  advanceStage,
  archiveProject,
  projectNo,
  projectNoParam,
  projectStage,
  removeRecord,
  restoreProject,
  setActiveProject,
  setProjectMembers,
  stageIndexOf,
  stageLabel,
  useProjectStageStore,
} from "src/api/workspace/project-stages";
import { PmsAvatar, PmsAvatarGroup } from "../pms";
import {
  AddBar,
  ProjectDialogs,
  RowActions,
  type ProjectDialog,
} from "./project-actions";

/**
 * /projects/:id 项目详情，逐项复刻 https://pms-workspace-app.vercel.app/projects/p1
 * 七个标签页 + 右侧 sticky Details，数据全部来自 PMS 快照。
 */

const fullDate = (value?: string | null) => formatDate(value, "ch", "full");

const STATUS_LABEL: Record<string, string> = {
  in_progress: "In Progress",
  on_hold: "On hold",
  todo: "Todo",
  backlog: "Backlog",
  review: "Review",
  done: "Done",
  closed: "Closed",
  completed: "Completed",
  active: "Active",
  planning: "Upcoming",
  online: "Online",
  away: "Away",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
  lead: "Lead",
};

const labelOf = (value: string) =>
  STATUS_LABEL[value] ?? value.charAt(0).toUpperCase() + value.slice(1);

const PRIORITY_TEXT: Record<string, string> = {
  urgent: "text-red-500",
  high: "text-orange-400",
  medium: "text-sky-400",
  low: "text-slate-400",
};

const SPRINT_DOT: Record<string, string> = {
  done: "bg-teal-400",
  closed: "bg-teal-400",
  review: "bg-orange-400",
  in_progress: "bg-blue-500",
  backlog: "bg-blue-500/10",
  todo: "bg-blue-500/10",
};

const STATUS_COLOR: Record<string, string> = {
  done: "bg-teal-400/10 text-teal-500",
  completed: "bg-teal-400/10 text-teal-500",
  member: "bg-teal-400/10 text-teal-500",
  closed: "bg-red-500/10 text-red-500",
  in_progress: "bg-blue-500/10 text-blue-500",
  active: "bg-blue-500/10 text-blue-500",
  admin: "bg-blue-500/10 text-blue-500",
  review: "bg-orange-400/10 text-orange-500",
  high: "bg-orange-400/10 text-orange-500",
  lead: "bg-orange-400/10 text-orange-500",
  backlog: "bg-amber-300/10 text-amber-500",
  planning: "bg-amber-300/10 text-amber-500",
  viewer: "bg-amber-300/10 text-amber-500",
  todo: "bg-sky-400/10 text-sky-500",
};

/** 九阶段在迭代卡片中的占位说明，字段表单后续接入。 */
const STAGE_DESC: Record<string, { en: string; zh: string }> = {
  requirement: {
    en: "Capture customer requirements and confirm feasibility",
    zh: "客户需求登记与可行性确认",
  },
  quotation: { en: "Prepare and approve the quotation", zh: "报价核算与审批" },
  sample: { en: "Produce, ship and confirm samples", zh: "打样、寄样与确认" },
  order: { en: "Sign the contract and record the order", zh: "合同签订与订单录入" },
  expense: { en: "Record and settle project expenses", zh: "费用登记与核销" },
  purchase: { en: "Plan purchasing and receive materials", zh: "采购计划与到料" },
  production: { en: "Schedule production and quality checks", zh: "生产排期与质检" },
  logistics: { en: "Arrange shipping, customs and delivery", zh: "出运、报关与配送" },
  after_sales: { en: "Handle claims, returns and follow-ups", zh: "客诉、退换与回访" },
};

export default function ProjectDetailPage() {
  const { t } = useTranslation();
  const { id = "p1" } = useParams();
  const { snap, zh, user, userName, isLoading } = useWorkspace();
  const [tab, setTab] = useState("Overview");
  const [dialog, setDialog] = useState<ProjectDialog | null>(null);

  const tr = (en: string, cn: string) => (zh ? cn : en);
  useProjectStageStore();
  /** 打开任一项目即自动成为跨模块的当前项目，新建记录无需再手选项目。 */
  useEffect(() => setActiveProject(id), [id]);
  const allProjects = snap?.projects ?? [];
  const projectIndex = allProjects.findIndex((item) => item.id === id);
  const project = allProjects[projectIndex];
  const no = projectNo(id, projectIndex);
  const noParam = projectNoParam(no);
  const currentStage = projectStage(id, projectIndex);

  const data = useMemo(() => {
    if (!snap) return null;
    const issues = snap.issues.filter((item) => item.projectId === id);
    const tasks = snap.tasks.filter((item) => item.projectId === id);
    const sprints = [...snap.sprints]
      .filter((item) => item.projectId === id)
      .sort(
        (a, b) =>
          (resolveDate(b.startDate)?.getTime() ?? 0) -
          (resolveDate(a.startDate)?.getTime() ?? 0)
      );
    const files = snap.files.filter((item) => item.projectId === id);
    const activities = [...snap.activities]
      .filter((item) => item.projectId === id)
      .sort(
        (a, b) =>
          (resolveDate(b.timestamp)?.getTime() ?? 0) -
          (resolveDate(a.timestamp)?.getTime() ?? 0)
      );
    const milestones = snap.milestones.filter((item) => item.projectId === id);
    const closedIssues = issues.filter(
      (item) => item.status === "done" || item.status === "closed"
    ).length;
    const doneTasks = tasks.filter(
      (item) => item.status === "done" || item.status === "closed"
    ).length;
    const overdue = tasks.filter(
      (item) =>
        item.status !== "done" &&
        item.status !== "closed" &&
        (relativeDays(item.dueDate) ?? 0) < 0
    );
    const highIssues = issues.filter(
      (item) =>
        (item.priority === "high" || item.priority === "urgent") &&
        item.status !== "done" &&
        item.status !== "closed"
    );
    const comingUp = tasks
      .filter((item) => {
        const days = relativeDays(item.dueDate);
        return (
          item.status !== "done" &&
          item.status !== "closed" &&
          days !== null &&
          days >= 0 &&
          days <= 14
        );
      })
      .sort(
        (a, b) =>
          (resolveDate(a.dueDate)?.getTime() ?? 0) -
          (resolveDate(b.dueDate)?.getTime() ?? 0)
      );
    return {
      issues,
      tasks,
      sprints,
      files,
      activities,
      milestones,
      closedIssues,
      doneTasks,
      overdue,
      highIssues,
      comingUp,
    };
  }, [snap, id]);

  if (isLoading || !snap || !project || !data)
    return <div className="p-10 text-sm text-muted-foreground">…</div>;

  const lead = user(project.leadId);
  const members = project.memberIds
    .map((memberId) => user(memberId))
    .filter(Boolean);
  const team = snap.teams.find((item) => item.id === project.teamId);
  const leftDays = relativeDays(project.dueDate) ?? 0;

  const tabs: { key: string; label: string; icon: LucideIcon }[] = [
    { key: "Overview", label: t("Overview"), icon: LayoutDashboard },
    { key: "Issues", label: `${t("Issues")} (${data.issues.length})`, icon: CircleDot },
    { key: "Tasks", label: `${t("Tasks")} (${data.tasks.length})`, icon: ListChecks },
    { key: "Sprints", label: `${t("Sprints")} (${STAGES.length + data.sprints.length})`, icon: Zap },
    { key: "Members", label: `${t("Members")} (${members.length})`, icon: Users },
    { key: "Files", label: `${t("Files")} (${data.files.length})`, icon: File },
    { key: "Activity", label: t("Activity"), icon: Activity },
  ];

  const statusLabel =
    project.status === "on_hold"
      ? t("On hold")
      : project.status === "completed"
        ? t("Completed")
        : t("Active");

  /** 七个 tab 各自的新建入口，统一走项目制 store 与 PmsSheet 表单。 */
  const addBar: { title: string; label: string; onAdd: () => void } | null = (() => {
    switch (tab) {
      case "Overview":
        return {
          title: t("Key delivery dates"),
          label: t("Add Milestone"),
          onAdd: () => setDialog({ kind: "milestone" }),
        };
      case "Issues":
        return {
          title: `${t("Issues")} (${data.issues.length})`,
          label: t("New Issue"),
          onAdd: () => setDialog({ kind: "issue" }),
        };
      case "Tasks":
        return {
          title: `${t("Tasks")} (${data.tasks.length})`,
          label: t("New Task"),
          onAdd: () => setDialog({ kind: "task" }),
        };
      case "Sprints":
        return {
          title: t("Sprints"),
          label: t("New Iteration"),
          onAdd: () => setDialog({ kind: "sprint" }),
        };
      case "Members":
        return {
          title: `${t("Members")} (${members.length})`,
          label: t("Add Member"),
          onAdd: () => setDialog({ kind: "member" }),
        };
      case "Files":
        return {
          title: `${t("Files")} (${data.files.length})`,
          label: t("Upload File"),
          onAdd: () => setDialog({ kind: "file" }),
        };
      case "Activity":
        return {
          title: t("Activity"),
          label: t("Add Note"),
          onAdd: () => setDialog({ kind: "note" }),
        };
      default:
        return null;
    }
  })();

  const detailDue = (task: (typeof data.tasks)[number]) => {
    if (task.status === "done" || task.status === "closed") return t("Completed");
    const days = relativeDays(task.dueDate);
    if (days === null) return "—";
    if (days < 0) return tr(`${-days}d overdue`, `逾期 ${-days} 天`);
    if (days === 0) return tr("Due today", "今天到期");
    if (days <= 7) return tr(`${days}d left`, `剩 ${days} 天`);
    return fullDate(task.dueDate);
  };

  const comingDue = (task: (typeof data.comingUp)[number]) => {
    const days = relativeDays(task.dueDate) ?? 0;
    if (days === 0) return tr("Today", "今天");
    return tr(`In ${days} days`, `${days} 天后`);
  };

  const sprintDone = (sprint: (typeof data.sprints)[number]) =>
    sprint.issueIds.filter((issueId) => {
      const issue = snap.issues.find((item) => item.id === issueId);
      return issue && (issue.status === "done" || issue.status === "closed");
    }).length;

  const openIssuesOf = (userId: string) =>
    data.issues.filter(
      (issue) =>
        issue.assigneeId === userId &&
        issue.status !== "done" &&
        issue.status !== "closed"
    ).length;
  const openTasksOf = (userId: string) =>
    data.tasks.filter(
      (task) =>
        task.assigneeId === userId &&
        task.status !== "done" &&
        task.status !== "closed"
    ).length;

  const activityDate = (value: string) => {
    const date = resolveDate(value);
    return date ? `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}` : "—";
  };
  const now = new Date();
  const timeNow = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  const detailRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0 text-sm font-medium">{value}</div>
    </div>
  );

  const tableHead = (columns: string[]) => (
    <thead>
      <tr className="border-b">
        {columns.map((column) => (
          <th
            key={column}
            className="h-10 px-3 text-left align-middle text-sm font-medium whitespace-nowrap text-foreground"
          >
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );

  const cellClass = "p-2 px-3 py-3 align-middle whitespace-nowrap";
  const badge = (value: string, color: string) => (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 rounded-4xl border-0 px-2 py-0.5 text-xs font-medium whitespace-nowrap shadow-none",
        color
      )}
    >
      {t(labelOf(value))}
    </span>
  );
  const priorityCell = (value: string) => (
    <div className={cn("flex items-center gap-1.5 text-sm", PRIORITY_TEXT[value])}>
      <Flag className="size-3.5" />
      <span>{t(labelOf(value))}</span>
    </div>
  );
  const personCell = (name?: string, avatar?: string) => (
    <span className="flex items-center gap-2 text-sm">
      {name ? (
        <>
          <PmsAvatar name={name} avatar={avatar} />
          <span className="truncate">{name}</span>
        </>
      ) : (
        <>
          <span className="flex size-6 items-center justify-center rounded-full border border-dashed text-muted-foreground">
            <UserRound className="size-3" />
          </span>
          <span>{t("Unassigned")}</span>
        </>
      )}
    </span>
  );
  const dateCell = (text: string) => (
    <div className="flex items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground">
      <Clock className="size-3.5" />
      <span>{text}</span>
    </div>
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 rounded-xl bg-background p-6">
      <Link
        to="/projects"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        {t("Back to Projects")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <span className="text-sm font-medium text-blue-500">{no}</span>
            {project.archived ? (
              <span
                data-slot="badge"
                className="inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl border-0 bg-amber-300/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-amber-500 shadow-none"
              >
                {t("Archived")}
              </span>
            ) : null}
            <span
              data-slot="badge"
              className="inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl border-0 bg-sky-400/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-sky-500 shadow-none"
            >
              {stageLabel(currentStage, zh)}
            </span>
            <span
              data-slot="badge"
              className="inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl border-0 bg-blue-500/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-blue-500 shadow-none"
            >
              {statusLabel}
            </span>
            {(project.priority === "high" || project.priority === "urgent") && (
              <span
                data-slot="badge"
                className="inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl border-0 bg-orange-400/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-orange-500 shadow-none"
              >
                {t("High priority")}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {project.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentStage !== "after_sales" ? (
            <button
              type="button"
              onClick={() => advanceStage(id, currentStage)}
              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-blue-500 px-2.5 text-[0.8rem] font-medium text-white hover:bg-blue-500/90"
            >
              <ArrowRight className="size-3" />
              {zh ? "推进到下一阶段" : "Advance stage"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setDialog({ kind: "edit" })}
            className="inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-transparent bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("Edit")}
          </button>
          {project.archived ? (
            <button
              type="button"
              onClick={() => restoreProject(id)}
              className="inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-transparent bg-teal-400/10 px-2.5 text-[0.8rem] font-medium text-teal-500 hover:bg-teal-400/20"
            >
              {t("Restore")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => archiveProject(id)}
              className="inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-transparent bg-destructive/10 px-2.5 text-[0.8rem] font-medium text-destructive hover:bg-destructive/20"
            >
              {t("Archive")}
            </button>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="group/tabs flex w-full flex-col gap-4">
            <div className="group/tabs-list flex flex-wrap items-center justify-start gap-1 rounded-xl bg-muted p-1 text-muted-foreground">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  data-active={tab === key ? "" : undefined}
                  onClick={() => setTab(key)}
                  className={cn(
                    "relative inline-flex h-[calc(100%-1px)] min-w-32 flex-1 basis-32 items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap",
                    tab === key
                      ? "bg-background text-foreground shadow-sm"
                      : "hover:bg-background/50 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
              <div className="mt-0 flex-1 text-sm outline-none">
                {addBar ? (
                  <AddBar title={addBar.title} label={addBar.label} onAdd={addBar.onAdd} />
                ) : null}
                {tab === "Overview" ? (
                  <>
                    <div className="border-b border-border p-5">
                      <h3 className="text-sm font-medium">{t("Needs attention")}</h3>
                      <p className="mb-4 text-xs text-muted-foreground">
                        {t("Overdue tasks and high-priority open issues")}
                      </p>
                      <ul className="divide-y divide-border">
                        {data.overdue.map((task) => {
                          const days = -(relativeDays(task.dueDate) ?? 0);
                          return (
                            <li key={task.id}>
                              <Link to="/tasks" className="flex items-center gap-3 py-3">
                                <TriangleAlert className="size-4 shrink-0 text-red-500" />
                                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                  {task.title}
                                </span>
                                <span className="shrink-0 text-xs text-red-500">
                                  {tr(`Overdue ${days}d`, `逾期 ${days} 天`)}
                                </span>
                                <span className="hidden shrink-0 sm:block">
                                  {personCell(
                                    task.assigneeId ? userName(task.assigneeId) : undefined,
                                    task.assigneeId ? user(task.assigneeId)?.avatar : undefined
                                  )}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                        {data.highIssues.map((issue) => (
                          <li key={issue.id}>
                            <Link to="/issues" className="flex items-center gap-3 py-3">
                              <TriangleAlert className="size-4 shrink-0 text-orange-500" />
                              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                #{issue.number} {issue.title}
                              </span>
                              <span className="shrink-0 text-xs text-amber-500">
                                {t("High priority")}
                              </span>
                              <span className="hidden shrink-0 sm:block">
                                {personCell(
                                  issue.assigneeId ? userName(issue.assigneeId) : undefined,
                                  issue.assigneeId ? user(issue.assigneeId)?.avatar : undefined
                                )}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-border">
                      <div className="border-b border-border p-5 lg:border-b-0">
                        <h3 className="text-sm font-medium">{t("Milestones")}</h3>
                        <p className="mb-4 text-xs text-muted-foreground">
                          {t("Key delivery dates")}
                        </p>
                        <div>
                          {data.milestones.map((milestone, index) => {
                            const days = relativeDays(milestone.date) ?? 0;
                            return (
                              <div key={milestone.id} className="flex gap-x-3">
                                <div className="relative">
                                  <div className="relative z-10 flex h-5 w-7 items-center justify-center">
                                    <div className="size-3 rounded-full bg-card outline-2 outline-muted-foreground" />
                                  </div>
                                  {index < data.milestones.length - 1 ? (
                                    <div className="ms-3.5 -mt-2 h-full border-s border-border" />
                                  ) : null}
                                </div>
                                <div className="min-w-0 grow pt-0.5 pb-5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-medium">{milestone.title}</p>
                                    <span className="text-xs text-muted-foreground">
                                      {tr(`${days}d left`, `剩 ${days} 天`)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {milestone.description} · {fullDate(milestone.date)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-sm font-medium">{t("Coming up")}</h3>
                        <p className="mb-4 text-xs text-muted-foreground">
                          {t("Open tasks due in the next 14 days")}
                        </p>
                        <ul className="divide-y divide-border">
                          {data.comingUp.map((task) => (
                            <li
                              key={task.id}
                              className="flex items-center justify-between gap-3 py-3 first:pt-0"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{task.title}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {comingDue(task)} ·{" "}
                                  {task.assigneeId
                                    ? userName(task.assigneeId)
                                    : t("Unassigned")}
                                </p>
                              </div>
                              {badge(
                                task.status,
                                STATUS_COLOR[task.status] ?? "bg-blue-500/10 text-blue-500"
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : null}

                {tab === "Issues" ? (
                  <div className="relative w-full overflow-x-auto">
                    <table className="w-full min-w-3xl caption-bottom text-sm">
                      {tableHead([
                        t("Issue"),
                        t("Status"),
                        t("Priority"),
                        t("Assignee"),
                        t("Created by"),
                        t("Updated"),
                        t("Actions"),
                      ])}
                      <tbody>
                        {data.issues.map((issue) => (
                          <tr key={issue.id} className="border-b">
                            <td className={cellClass}>
                              <Link to="/issues" className="block min-w-0">
                                <h6 className="max-w-64 truncate text-sm font-medium">
                                  {issue.title}
                                </h6>
                                <p className="text-xs text-muted-foreground">
                                  #{issue.number}
                                </p>
                              </Link>
                            </td>
                            <td className={cellClass}>
                              {badge(issue.status, STATUS_COLOR[issue.status])}
                            </td>
                            <td className={cellClass}>{priorityCell(issue.priority)}</td>
                            <td className={cellClass}>
                              {personCell(
                                issue.assigneeId ? userName(issue.assigneeId) : undefined,
                                issue.assigneeId ? user(issue.assigneeId)?.avatar : undefined
                              )}
                            </td>
                            <td className={cellClass}>
                              {personCell(
                                userName(issue.reporterId),
                                user(issue.reporterId)?.avatar
                              )}
                            </td>
                            <td className={cellClass}>
                              {dateCell(agoLabel(issue.updatedAt, zh ? "ch" : "en"))}
                            </td>
                            <td className={cellClass}>
                              <RowActions
                                zh={zh}
                                onEdit={() => setDialog({ kind: "issue", record: issue })}
                                onDelete={() => removeRecord("issues", issue.id, id)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {tab === "Tasks" ? (
                  <div className="relative w-full overflow-x-auto">
                    <table className="w-full min-w-3xl caption-bottom text-sm">
                      {tableHead([
                        t("Task"),
                        t("Status"),
                        t("Priority"),
                        t("Assignee"),
                        t("Due"),
                        t("Actions"),
                      ])}
                      <tbody>
                        {data.tasks.map((task) => (
                          <tr key={task.id} className="border-b">
                            <td className={cellClass}>
                              <h6 className="max-w-64 truncate text-sm font-medium">
                                {task.title}
                              </h6>
                            </td>
                            <td className={cellClass}>
                              {badge(task.status, STATUS_COLOR[task.status])}
                            </td>
                            <td className={cellClass}>{priorityCell(task.priority)}</td>
                            <td className={cellClass}>
                              {personCell(
                                task.assigneeId ? userName(task.assigneeId) : undefined,
                                task.assigneeId ? user(task.assigneeId)?.avatar : undefined
                              )}
                            </td>
                            <td className={cellClass}>{dateCell(detailDue(task))}</td>
                            <td className={cellClass}>
                              <RowActions
                                zh={zh}
                                onEdit={() => setDialog({ kind: "task", record: task })}
                                onDelete={() => removeRecord("tasks", task.id, id)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {tab === "Sprints" ? (
                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    {[
                      ...STAGES.map((stage, i) => {
                        const finished = i < stageIndexOf(currentStage);
                        const active = stage.key === currentStage;
                        const doneCount = stageIndexOf(currentStage);
                        return {
                          key: `stage-${stage.key}`,
                          href: `/apps/invoice/edit/${noParam}?stage=${stage.key}`,
                          title: stageLabel(stage.key, zh),
                          subtitle: `${tr(
                            `Stage ${String(i + 1).padStart(2, "0")}`,
                            `阶段 ${String(i + 1).padStart(2, "0")}`
                          )} · ${no}`,
                          status: finished ? "done" : active ? "active" : "todo",
                          tone: finished
                            ? "bg-teal-400/10 text-teal-500"
                            : active
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-sky-400/10 text-sky-500",
                          desc: STAGE_DESC[stage.key]?.[zh ? "zh" : "en"] ?? "",
                          dots: STAGES.map((item, j) => ({
                            key: item.key,
                            title: stageLabel(item.key, zh),
                            tone:
                              j < doneCount
                                ? SPRINT_DOT.done
                                : j === doneCount
                                  ? SPRINT_DOT.in_progress
                                  : SPRINT_DOT.backlog,
                          })),
                          done: doneCount,
                          total: STAGES.length,
                          editable: false,
                          sprintId: "",
                        };
                      }),
                      ...data.sprints.map((sprint) => {
                        const done = sprintDone(sprint);
                        const total = sprint.issueIds.length;
                        return {
                          key: sprint.id,
                          href: "/sprints",
                          title: sprint.name,
                          subtitle: `${fullDate(sprint.startDate)} – ${fullDate(sprint.endDate)}`,
                          status: sprint.status,
                          tone:
                            sprint.status === "completed"
                              ? "bg-teal-400/10 text-teal-500"
                              : "bg-blue-500/10 text-blue-500",
                          desc: sprint.goal,
                          dots: sprint.issueIds.map((issueId) => {
                            const issue = snap.issues.find((item) => item.id === issueId);
                            return {
                              key: issueId,
                              title: issue
                                ? `#${issue.number} ${issue.title} · ${labelOf(issue.status)}`
                                : undefined,
                              tone: SPRINT_DOT[issue?.status ?? ""] ?? "bg-blue-500/10",
                            };
                          }),
                          done,
                          total,
                          editable: true,
                          sprintId: sprint.id,
                        };
                      }),
                    ].map((card) => (
                      <div key={card.key} className="group/card relative">
                        <Link to={card.href} className="block">
                          <div className="flex h-full flex-col gap-0 rounded-xl border border-border bg-card py-0 ring-0 transition-colors hover:bg-muted/30">
                          <div className="flex h-full flex-col gap-4 p-5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate text-base font-medium">
                                  {card.title}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {card.subtitle}
                                </p>
                              </div>
                              {badge(card.status, card.tone)}
                            </div>
                            <p className="line-clamp-2 flex-1 text-xs text-muted-foreground">
                              {card.desc}
                            </p>
                            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                              <div className="flex flex-wrap gap-1.5">
                                {card.dots.map((dot) => (
                                  <span
                                    key={dot.key}
                                    title={dot.title}
                                    className={cn("size-4 rounded-[5px]", dot.tone)}
                                  />
                                ))}
                              </div>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {card.done}
                                </span>/{card.total} {tr("done", "完成")} ·{" "}
                                {card.total
                                  ? Math.round((card.done / card.total) * 100)
                                  : 0}
                                %
                              </span>
                            </div>
                          </div>
                          </div>
                        </Link>
                        {card.editable ? (
                          <div className="absolute right-2 top-2 z-10 hidden rounded-md bg-card group-hover/card:block">
                            <RowActions
                              zh={zh}
                              onEdit={() => {
                                const rec = data.sprints.find(
                                  (item) => item.id === card.sprintId
                                );
                                if (rec) setDialog({ kind: "sprint", record: rec });
                              }}
                              onDelete={() => removeRecord("sprints", card.sprintId, id)}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {tab === "Members" ? (
                  <div className="relative w-full overflow-x-auto">
                    <table className="w-full min-w-3xl caption-bottom text-sm">
                      {tableHead([
                        t("Member"),
                        t("Role"),
                        t("Status"),
                        t("Open issues"),
                        t("Open tasks"),
                        t("Actions"),
                      ])}
                      <tbody>
                        {members.map((member) => (
                          <tr key={member!.id} className="border-b">
                            <td className={cellClass}>
                              <div className="flex items-center gap-3">
                                <PmsAvatar
                                  name={member!.name}
                                  avatar={member!.avatar}
                                  size={9}
                                />
                                <div className="min-w-0">
                                  <h6 className="flex items-center gap-2 truncate text-sm font-medium">
                                    {member!.name}
                                    {member!.id === project.leadId
                                      ? badge("lead", "bg-orange-400/10 text-orange-500")
                                      : null}
                                  </h6>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {member!.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className={cellClass}>
                              {badge(
                                member!.role,
                                STATUS_COLOR[member!.role] ?? "bg-blue-500/10 text-blue-500"
                              )}
                            </td>
                            <td className={cellClass}>
                              <span className="flex items-center gap-2 text-sm text-muted-foreground capitalize">
                                <span
                                  className={cn(
                                    "size-2 rounded-full",
                                    member!.status === "away" ? "bg-amber-300" : "bg-teal-400"
                                  )}
                                />
                                {t(labelOf(member!.status))}
                              </span>
                            </td>
                            <td className={cellClass}>{openIssuesOf(member!.id)}</td>
                            <td className={cellClass}>{openTasksOf(member!.id)}</td>
                            <td className={cellClass}>
                              <RowActions
                                zh={zh}
                                onDelete={() =>
                                  setProjectMembers(
                                    id,
                                    project.memberIds.filter((item) => item !== member!.id),
                                    "removed a project member"
                                  )
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {tab === "Files" ? (
                  <div className="divide-y divide-border">
                    {data.files.map((file) => {
                      const type = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
                      return (
                        <div key={file.id} className="flex items-center gap-3 p-4">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-xs font-semibold text-sky-500 uppercase">
                            {type}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{file.name}</div>
                            <div className="text-xs text-muted-foreground">
                              v{file.version} · {userName(file.uploadedById)} ·{" "}
                              {agoLabel(file.createdAt, zh ? "ch" : "en")}
                            </div>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {(file.size / 1048576).toFixed(1)} MB
                          </span>
                          <RowActions
                            zh={zh}
                            onEdit={() => setDialog({ kind: "file", record: file })}
                            onDelete={() => removeRecord("files", file.id, id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {tab === "Activity" ? (
                  <div className="divide-y divide-border">
                    {data.activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3 p-4">
                        <span className="shrink-0 text-xs text-muted-foreground">{timeNow}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{userName(activity.userId)}</span>{" "}
                            {activity.message}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {agoLabel(activity.timestamp, zh ? "ch" : "en")} ·{" "}
                            {activityDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-80">
          <div className="overflow-hidden rounded-xl border border-border bg-card lg:sticky lg:top-20">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-medium">{t("Details")}</h2>
            </div>
            <div className="space-y-2 border-b border-border px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("Progress")}</span>
                <span className="text-sm font-medium text-blue-500">{project.progress}%</span>
              </div>
              <div className="flex h-1.5 flex-wrap gap-3 [&>div]:h-1.5">
                <div className="relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-blue-500/10">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span
                  role="presentation"
                  style={{
                    clipPath: "inset(50%)",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    border: 0,
                    padding: 0,
                    width: 1,
                    height: 1,
                    margin: 0,
                    position: "fixed",
                    top: 0,
                    left: 0,
                  }}
                >
                  x
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {tr(
                  `${data.closedIssues} of ${data.issues.length} issues closed`,
                  `${data.issues.length} 个问题中 ${data.closedIssues} 个已关闭`
                )}
              </p>
            </div>
            <div className="divide-y divide-border">
              {detailRow(t("Project No."), no)}
              {detailRow(t("Stage"), stageLabel(currentStage, zh))}
              {detailRow(
                t("Lead"),
                <span className="flex items-center gap-2 text-sm">
                  <PmsAvatar name={lead?.name} avatar={lead?.avatar} />
                  <span className="truncate">{lead?.name}</span>
                </span>
              )}
              {detailRow(t("Team"), team?.name ?? "—")}
              {detailRow(
                t("Members"),
                <PmsAvatarGroup
                  people={members.map((member) => ({
                    name: member!.name,
                    avatar: member!.avatar,
                  }))}
                  max={4}
                />
              )}
              {detailRow(t("Started"), fullDate(project.createdAt))}
              {detailRow(t("Due date"), fullDate(project.dueDate))}
              {detailRow(t("Time left"), `${leftDays}d`)}
              {detailRow(t("Open issues"), data.issues.length - data.closedIssues)}
              {detailRow(t("Tasks done"), `${data.doneTasks}/${data.tasks.length}`)}
            </div>
          </div>
        </div>
      </div>
      <ProjectDialogs
        project={project}
        users={snap.users}
        dialog={dialog}
        onClose={() => setDialog(null)}
        zh={zh}
        t={(key) => t(key)}
        nextIssueNumber={Math.max(100, ...snap.issues.map((item) => item.number)) + 1}
      />
    </div>
  );
}
