import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import {
  Activity,
  CalendarClock,
  CircleCheck,
  CircleDot,
  CirclePlus,
  Clock,
  File,
  Flag,
  LayoutDashboard,
  List,
  ListChecks,
  Plus,
  TriangleAlert,
  UserRound,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  agoLabel,
  formatDate,
  relativeDays,
  resolveDate,
  useWorkspace,
} from "src/api/workspace/use-workspace";
import {
  STAGES,
  archiveProject,
  getStageForm,
  getStageView,
  hideStageCard,
  projectNo,
  projectNoParam,
  projectStage,
  removeRecord,
  restoreProject,
  saveStageOrder,
  setActiveProject,
  setProjectMembers,
  stageFormKey,
  stageIndexOf,
  stageLabel,
  updateProject,
  useProjectStageStore,
} from "src/api/workspace/project-stages";
import { PmsAvatar, PmsAvatarGroup } from "../pms";
import { ArchiveProjectDialog, EditProjectDialog } from "./edit-archive-dialogs";
import {
  ProjectDialogs,
  RowActions,
  type ProjectDialog,
} from "./project-actions";

/**
 * /projects/:id 项目详情，逐项复刻 https://pms-workspace-app.vercel.app/projects/p1
 * 七个标签页 + 右侧 sticky Details，数据全部来自 PMS 快照。
 */

const fullDate = (value?: string | null) => formatDate(value, "ch", "full");

/**
 * 互动左列时分。快照的 timestamp 是 RELATIVE_DAYS_*（resolveDate 会把时分归零），
 * 没有时分粒度；线上 PMS 截图的左列是固定时分 16:25，按取证复刻该展示值，
 * 不生成随机假时间。未来若写入 ISO 时间戳则直接读真实时分。
 */
const activityTime = (value?: string | null) => {
  const date = resolveDate(value);
  if (!date) return "—";
  if (value?.startsWith("RELATIVE_DAYS_")) return "16:25";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

/** 互动时间线圆点沿用线上取证状态色板。 */
const ACTIVITY_COLORS = [
  "text-blue-500",
  "text-teal-400",
  "text-orange-400",
  "text-red-500",
  "text-amber-300",
];

/**
 * 初始化空态：线上新建项目（0 issues / 0 tasks / 0 files…）各 tab 的占位。
 * 取证见用户 2026-11-15 提供的六张 /projects/1947405371764 截图与
 * pms-audit/dom/20-project-p9.json；线上不是 shadcn Empty 组件，故用同一套
 * 「浅灰图标 + 单行说明 + 居中留白」的轻量结构，不改既有卡片与表格几何。
 */
function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <Icon className="size-5 text-muted-foreground/60" strokeWidth={1.5} />
      <p className="text-xs">{text}</p>
    </div>
  );
}

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

/** 迭代子任务状态色：默认灰、完成绿、进行中蓝、逾期橙。 */
const SPRINT_DOT: Record<string, string> = {
  done: "bg-teal-400",
  closed: "bg-teal-400",
  completed: "bg-teal-400",
  in_progress: "bg-blue-500",
  active: "bg-blue-500",
  review: "bg-orange-400",
  overdue: "bg-orange-400",
  backlog: "bg-slate-200",
  todo: "bg-slate-200",
  planning: "bg-slate-200",
};

/** 迭代卡片徽标沿用同一套状态语义。 */
const CARD_TONE = {
  done: "bg-teal-400/10 text-teal-500",
  active: "bg-blue-500/10 text-blue-500",
  overdue: "bg-orange-400/10 text-orange-500",
  todo: "bg-muted text-muted-foreground",
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
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const dragKey = useRef<string | null>(null);
  const navigate = useNavigate();

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
      /** 里程碑由问题 / 任务 / 阶段产出，概览只做只读展示，不提供手动添加入口。 */
      case "Overview":
        return null;
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

  /** 迭代卡片：第一行阶段名、第二行起止日期、第三行阶段描述；子任务按真实数量渲染。 */
  const stageCards = STAGES.map((stage, i) => {
    const form = getStageForm(stageFormKey(no, stage.key));
    const finished = i < stageIndexOf(currentStage);
    const active = stage.key === currentStage;
    return {
      key: `stage-${stage.key}`,
      href: `/apps/invoice/edit/${noParam}?stage=${stage.key}`,
      title: stageLabel(stage.key, zh),
      subtitle: form
        ? `${fullDate(form.createDate)} – ${fullDate(form.dueDate)}`
        : "—",
      statusText: finished
        ? tr("Done", "完成")
        : active
          ? tr("In Progress", "进行中")
          : tr("Not started", "未开始"),
      tone: finished
        ? CARD_TONE.done
        : active
          ? CARD_TONE.active
          : CARD_TONE.todo,
      desc: STAGE_DESC[stage.key]?.[zh ? "zh" : "en"] ?? "",
      dots: [] as { key: string; title?: string; tone: string }[],
      done: 0,
      total: 0,
      editable: false,
      sprintId: "",
    };
  });

  const sprintCards = data.sprints.map((sprint) => {
    const done = sprintDone(sprint);
    const total = sprint.issueIds.length;
    const days = relativeDays(sprint.endDate);
    const overdue = sprint.status !== "completed" && days !== null && days < 0;
    const running = sprint.status === "in_progress" || sprint.status === "active";
    return {
      key: sprint.id,
      href: "/sprints",
      title: sprint.name,
      subtitle: `${fullDate(sprint.startDate)} – ${fullDate(sprint.endDate)}`,
      statusText: sprint.status === "completed"
        ? tr("Done", "完成")
        : overdue
          ? tr("Overdue", "逾期")
          : running
            ? tr("In Progress", "进行中")
            : tr("Not started", "未开始"),
      tone: sprint.status === "completed"
        ? CARD_TONE.done
        : overdue
          ? CARD_TONE.overdue
          : running
            ? CARD_TONE.active
            : CARD_TONE.todo,
      desc: sprint.goal,
      dots: sprint.issueIds.map((issueId) => {
        const issue = snap.issues.find((item) => item.id === issueId);
        return {
          key: issueId,
          title: issue
            ? `#${issue.number} ${issue.title} · ${labelOf(issue.status)}`
            : undefined,
          tone: SPRINT_DOT[issue?.status ?? ""] ?? "bg-slate-200",
        };
      }),
      done,
      total,
      editable: true,
      sprintId: sprint.id,
    };
  });

  const allCards = [...stageCards, ...sprintCards];
  const stageView = getStageView(id);
  const orderedCards = stageView.order.length
    ? [
        ...stageView.order.flatMap((key) => {
          const card = allCards.find((item) => item.key === key);
          return card ? [card] : [];
        }),
        ...allCards.filter((card) => !stageView.order.includes(card.key)),
      ]
    : allCards;
  const visibleCards = orderedCards.filter(
    (card) => !stageView.hidden.includes(card.key)
  );

  const dropCard = (targetKey: string) => {
    const from = dragKey.current;
    dragKey.current = null;
    setDragOverKey(null);
    if (!from || from === targetKey) return;
    const keys = visibleCards
      .map((card) => card.key)
      .filter((key) => key !== from);
    const at = keys.indexOf(targetKey);
    if (at < 0) return;
    keys.splice(at, 0, from);
    saveStageOrder(id, keys);
  };

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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/projects" />}>
              {t("Projects")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
          <button
            type="button"
            onClick={() => setEditOpen(true)}
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
              onClick={() => setArchiveOpen(true)}
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

            <div className="group/content relative w-full overflow-hidden rounded-xl border border-border bg-card">
              {/* 线上 PMS 七个 tab 顶部都无常驻新建工具栏；入口改为 hover 浮现，功能保留。 */}
              {addBar ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={addBar.label}
                  title={addBar.label}
                  onClick={addBar.onAdd}
                  className="absolute right-2 top-1 z-10 hidden group-hover/content:inline-flex"
                >
                  <Plus className="size-3.5" />
                </Button>
              ) : null}
              <div className="mt-0 flex-1 text-sm outline-none">
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
                        {data.overdue.length === 0 && data.highIssues.length === 0 ? (
                          <li>
                            <EmptyState
                              icon={CircleCheck}
                              text={t("Nothing needs attention right now")}
                            />
                          </li>
                        ) : null}
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
                          {data.milestones.length === 0 ? (
                            <EmptyState icon={Flag} text={t("No milestones yet")} />
                          ) : null}
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
                        {data.comingUp.length === 0 ? (
                          <EmptyState icon={CalendarClock} text={t("No tasks due soon")} />
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : null}

                {tab === "Issues" && data.issues.length === 0 ? (
                  <EmptyState icon={CirclePlus} text={t("No issues in this project")} />
                ) : null}
                {tab === "Issues" && data.issues.length > 0 ? (
                  <div className="relative w-full overflow-x-auto">
                    <table className="w-full min-w-3xl caption-bottom text-sm">
                      {tableHead([
                        t("Issue"),
                        t("Status"),
                        t("Priority"),
                        t("Assignee"),
                        t("Created by"),
                        t("Updated"),
                      ])}
                      <tbody>
                        {data.issues.map((issue) => (
                          <tr key={issue.id} className="group/row border-b">
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
                            <td className={cn(cellClass, "relative")}>
                              {dateCell(agoLabel(issue.updatedAt, zh ? "ch" : "en"))}
                              <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md bg-card group-hover/row:flex">
                                <RowActions
                                  zh={zh}
                                  onEdit={() => setDialog({ kind: "issue", record: issue })}
                                  onDelete={() => removeRecord("issues", issue.id, id)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {tab === "Tasks" && data.tasks.length === 0 ? (
                  <EmptyState icon={List} text={t("No tasks in this project")} />
                ) : null}
                {tab === "Tasks" && data.tasks.length > 0 ? (
                  <div className="relative w-full overflow-x-auto">
                    <table className="w-full min-w-3xl caption-bottom text-sm">
                      {tableHead([
                        t("Task"),
                        t("Status"),
                        t("Priority"),
                        t("Assignee"),
                        t("Due"),
                      ])}
                      <tbody>
                        {data.tasks.map((task) => (
                          <tr key={task.id} className="group/row border-b">
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
                            <td className={cn(cellClass, "relative")}>
                              {dateCell(detailDue(task))}
                              <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md bg-card group-hover/row:flex">
                                <RowActions
                                  zh={zh}
                                  onEdit={() => setDialog({ kind: "task", record: task })}
                                  onDelete={() => removeRecord("tasks", task.id, id)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {tab === "Sprints" ? (
                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    {visibleCards.map((card) => (
                      <div
                        key={card.key}
                        draggable
                        aria-roledescription="sortable"
                        onDragStart={(event) => {
                          dragKey.current = card.key;
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          dragKey.current = null;
                          setDragOverKey(null);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverKey(card.key);
                        }}
                        onDragLeave={() => setDragOverKey(null)}
                        onDrop={(event) => {
                          event.preventDefault();
                          dropCard(card.key);
                        }}
                        className={cn(
                          "group/card relative cursor-grab active:cursor-grabbing",
                          dragOverKey === card.key && dragKey.current !== card.key
                            ? "opacity-60"
                            : null
                        )}
                      >
                        <Link to={card.href} draggable={false} className="block">
                          <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold">
                                  {card.title}
                                </h3>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {card.subtitle}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap group-hover/card:hidden",
                                  card.tone
                                )}
                              >
                                {card.statusText}
                              </span>
                            </div>
                            <p className="mt-3 line-clamp-2 min-h-8 flex-1 text-xs text-muted-foreground">
                              {card.desc}
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                              <div className="flex flex-wrap gap-1.5">
                                {card.dots.map((dot) => (
                                  <span
                                    key={dot.key}
                                    title={dot.title}
                                    className={cn("size-3.5 rounded-[4px]", dot.tone)}
                                  />
                                ))}
                              </div>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {card.done}
                                </span>/{card.total} {tr("done", "完成")} ·{" "}
                                {card.total
                                  ? Math.round((card.done / card.total) * 100)
                                  : 0}%
                              </span>
                            </div>
                          </div>
                        </Link>
                        <div className="absolute right-3 top-3 z-10 hidden group-hover/card:block">
                          <RowActions
                            zh={zh}
                            onEdit={() => {
                              if (!card.editable) {
                                navigate(card.href);
                                return;
                              }
                              const rec = data.sprints.find(
                                (item) => item.id === card.sprintId
                              );
                              if (rec) setDialog({ kind: "sprint", record: rec });
                            }}
                            onDelete={() =>
                              card.editable
                                ? removeRecord("sprints", card.sprintId, id)
                                : hideStageCard(id, card.key)
                            }
                          />
                        </div>
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
                      ])}
                      <tbody>
                        {members.map((member) => (
                          <tr key={member!.id} className="group/row border-b">
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
                            <td className={cn(cellClass, "relative")}>
                              {openTasksOf(member!.id)}
                              <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md bg-card group-hover/row:flex">
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
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {tab === "Files" && data.files.length === 0 ? (
                  <EmptyState icon={File} text={t("No files uploaded yet")} />
                ) : null}
                {tab === "Files" && data.files.length > 0 ? (
                  <div className="divide-y divide-border">
                    {data.files.map((file) => {
                      const type = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
                      return (
                        <div key={file.id} className="group/file flex items-center gap-3 p-4">
                          <span className="flex w-8 shrink-0 items-center justify-center text-xs font-semibold text-sky-500 uppercase">
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
                          <div className="hidden shrink-0 rounded-md bg-card group-hover/file:flex">
                            <RowActions
                              zh={zh}
                              onEdit={() => setDialog({ kind: "file", record: file })}
                              onDelete={() => removeRecord("files", file.id, id)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {tab === "Activity" && data.activities.length === 0 ? (
                  <EmptyState icon={Zap} text={t("No activity yet")} />
                ) : null}
                {tab === "Activity" && data.activities.length > 0 ? (
                  <div>
                    {data.activities.map((activity, i) => (
                      <div key={activity.id} className="flex gap-3 px-4 pt-4">
                        <span className="w-10 shrink-0 text-xs text-muted-foreground">
                          {activityTime(activity.timestamp)}
                        </span>
                        <div className="flex w-2 shrink-0 flex-col items-center">
                          <span
                            className={cn(
                              "mt-1 size-2 shrink-0 rounded-full border-2 border-current bg-card",
                              ACTIVITY_COLORS[i % ACTIVITY_COLORS.length]
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1 pb-4">
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
      <EditProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        users={snap.users}
        teams={snap.teams}
        onSubmit={(values) => {
          updateProject(id, values);
          setEditOpen(false);
        }}
      />
      <ArchiveProjectDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        projectName={project.name}
        zh={zh}
        onSubmit={() => archiveProject(id)}
      />
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
