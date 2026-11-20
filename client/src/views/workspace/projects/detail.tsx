import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import { useTasks } from "src/api/tasks/use-tasks";
import {
  Activity,
  CalendarClock,
  Check,
  ChevronDown,
  CircleCheck,
  CircleDot,
  ClipboardList,
  Factory,
  File,
  Flag,
  Headphones,
  LayoutDashboard,
  ListChecks,
  Package,
  Plus,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Truck,
  TriangleAlert,
  Wallet,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  agoLabel,
  formatDate,
  relativeDays,
  resolveDate,
  useWorkspace,
} from "src/api/workspace/use-workspace";
import {
  STAGES,
  STAGE_NO_TIME,
  stageDateInfo,
  stageMilestones,
  archiveProject,
  getStageView,
  projectNo,
  projectStage,
  removeRecord,
  restoreProject,
  saveStageOrder,
  setActiveProject,
  setProjectMembers,
  stageIndexOf,
  stageLabel,
  updateProject,
  useProjectStageStore,
} from "src/api/workspace/project-stages";
import { PmsAvatar, PriorityMenu } from "../pms";
import { PeopleField } from "../people-field";
import { taskNo } from "src/api/workspace/task-no";
import { projectProgress } from "src/api/workspace/project-progress";
import { ProgressTicker } from "./progress-ticker";
import { StackRipple } from "@/components/shadcn-dashboard/animated-list/animated-list-03";
import Loading from "@/components/shadcn-dashboard/spinner/loading";
import { DurationTimer } from "./duration-timer";
import { LeadSelect } from "./lead-select";
import { ArchiveProjectDialog } from "./edit-archive-dialogs";
import { STATUS_ITEMS, statusVisual } from "./project-row-actions";
import { InlineEdit } from "@/components/shadcn-dashboard/input/inline-edit";
import { DatePicker } from "@/components/ui/date-picker";
import {
  ProjectDialogs,
  RowActions,
  type ProjectDialog,
} from "./project-actions";
import IssuesPage from "../issues";
import { useIssues } from "src/api/issues/use-issues";
import TasksPage from "../tasks";

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
  super_admin: "Super Admin",
  member: "Member",
  viewer: "Viewer",
  lead: "Lead",
};

const labelOf = (value: string) =>
  STATUS_LABEL[value] ?? value.charAt(0).toUpperCase() + value.slice(1);

/** 状态 tag 背景/文字色，与 STATUS_ITEMS 的 icon tone 保持一致。 */
const STATUS_TONE_BADGE: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-500",
  on_hold: "bg-amber-500/10 text-amber-500",
  completed: "bg-emerald-500/10 text-emerald-500",
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

/** 九阶段图标与配色：用于「即将到来」任务列表按阶段区分。 */
const STAGE_ICON: Record<string, { icon: LucideIcon; tone: string }> = {
  requirement: { icon: ClipboardList, tone: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  quotation: { icon: ReceiptText, tone: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  sample: { icon: Package, tone: "bg-teal-400/10 text-teal-500 border-teal-400/20" },
  order: { icon: ShoppingCart, tone: "bg-green-500/10 text-green-500 border-green-500/20" },
  expense: { icon: Wallet, tone: "bg-orange-400/10 text-orange-500 border-orange-400/20" },
  purchase: { icon: ShoppingBag, tone: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  production: { icon: Factory, tone: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  logistics: { icon: Truck, tone: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  after_sales: { icon: Headphones, tone: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
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
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [comingOpen, setComingOpen] = useState(true);
  const dragKey = useRef<string | null>(null);
  const navigate = useNavigate();

  const tr = (en: string, cn: string) => (zh ? cn : en);
  useProjectStageStore();
  /** 任务已真实入库后端，按当前项目读取（替换快照里的示例任务）。 */
  const { tasks: dbTasks } = useTasks(id);
  const { issues: dbIssues } = useIssues(id);
  /** 打开任一项目即自动成为跨模块的当前项目，新建记录无需再手选项目。 */
  useEffect(() => setActiveProject(id), [id]);
  const allProjects = snap?.projects ?? [];
  const projectIndex = allProjects.findIndex((item) => item.id === id);
  const project = allProjects[projectIndex];
  const no = projectNo(id, projectIndex);
  const currentStage = projectStage(id, projectIndex);

  const data = useMemo(() => {
    if (!snap) return null;
    const issues = dbIssues;
    const tasks = dbTasks;
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
    /** 阶段完成时间计入里程碑，与手动里程碑合并后按日期升序。 */
    const milestones = [
      ...stageMilestones(project, zh),
      ...snap.milestones.filter((item) => item.projectId === id),
    ].sort((a, b) => {
      const da = resolveDate(a.date)?.getTime() ?? 0;
      const db = resolveDate(b.date)?.getTime() ?? 0;
      return da - db;
    });
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
  }, [snap, id, dbTasks, dbIssues]);

  if (isLoading || !snap) return <Loading />;

  if (!project || !data)
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
        <TriangleAlert className="size-6 text-muted-foreground/60" strokeWidth={1.5} />
        <p className="text-sm">{tr("Project not found", "项目不存在")}</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
          {tr("Back to projects", "返回项目列表")}
        </Button>
      </div>
    );

  /** 就地编辑保存：单字段 PATCH 后端并提示。 */
  const saveField = (patch: Record<string, unknown>) => {
    void updateProject(id, patch as Partial<Parameters<typeof updateProject>[1]>).then(() =>
      toast.success(t("Saved successfully"))
    );
  };
  /** 进度按真实的「已完成(任务+问题)/总计(任务+问题)」计算，空项目为 0%。 */
  const progress = projectProgress(id, dbTasks, dbIssues);

  const members = project.memberIds
    .map((memberId) => user(memberId))
    .filter(Boolean);
  const tabs: { key: string; label: string; icon: LucideIcon }[] = [
    { key: "Overview", label: t("Overview"), icon: LayoutDashboard },
    { key: "Sprints", label: `${t("Sprints")} (${STAGES.length + data.sprints.length})`, icon: Zap },
    { key: "Tasks", label: `${t("Tasks")} (${data.tasks.length})`, icon: ListChecks },
    { key: "Issues", label: `${t("Issues")} (${data.issues.length})`, icon: CircleDot },
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
        // 悬浮新建 icon 已移除：新建问题入口保留在工具栏的「新建问题」按钮。
        return null;
      case "Tasks":
        // 悬浮新建 icon 已移除：新建任务入口保留在本页工具栏的 New Task 按钮。
        return null;
      case "Sprints":
        /** 阶段页不设右上角悬浮新建按钮：入口改为网格末尾的「添加阶段」卡片。 */
        return null;
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

  /** 「即将到来」动画列表：仅未完成，按创建时间升序（最早创建在前），图标按阶段配色，状态以 tag 展示。 */
  const comingUpItems = [...data.tasks]
    .filter((task) => task.sprintId === currentStage)
    .filter((task) => task.status !== "done" && task.status !== "closed")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((task) => {
    const stage = STAGE_ICON[task.sprintId ?? ""] ?? STAGE_ICON.requirement;
    const Icon = stage.icon;
    return {
      id: task.id,
      icon: (
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
            stage.tone
          )}
        >
          <Icon className="size-5" />
        </span>
      ),
      title: task.title,
      description:
        task.assigneeId
          ? `${taskNo(task, data.tasks)} · ${userName(task.assigneeId)}`
          : taskNo(task, data.tasks),
      tag: (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
            STATUS_COLOR[task.status] ?? "bg-blue-500/10 text-blue-500"
          )}
        >
          {t(STATUS_LABEL[task.status] ?? task.status)}
        </span>
      ),
    };
  });

  /** Sprint 进度以归属该 Sprint 的任务为准（task.sprintId），与任务列表/编号同源。 */
  const sprintTasks = (sprint: (typeof data.sprints)[number]) =>
    dbTasks.filter((task) => task.sprintId === sprint.id);
  const isTaskDone = (status: string) =>
    status === "done" || status === "closed" || status === "completed";
  const sprintDone = (sprint: (typeof data.sprints)[number]) =>
    sprintTasks(sprint).filter((task) => isTaskDone(task.status)).length;

  /**
   * 阶段卡片：9 个固定阶段，每个阶段通过 task.sprintId === stage.key 关联任务，
   * 卡片底部的彩色块与「x/y done · N%」直接反映该阶段任务完成进度。
   */
  const stageTasks = (stageKey: string) => dbTasks.filter((task) => task.sprintId === stageKey);
  const stageCards = STAGES.map((stage, i) => {
    const finished = i < stageIndexOf(currentStage);
    const active = stage.key === currentStage;
    const tasks = stageTasks(stage.key);
    return {
      key: `stage-${stage.key}`,
      href: `/projects/${id}/stages/${stage.key}`,
      title: stageLabel(stage.key, zh),
      subtitle: (() => {
        if (STAGE_NO_TIME.has(stage.key)) return "\u00A0"; // 保留占位，保持卡片高度一致
        const info = stageDateInfo(stage.key, project.createdAt, project.stageSchedule);
        if (!info) return "\u00A0";
        const startText = fullDate(info.start.toISOString());
        if (!info.completedAt) {
          return `${startText} – ${fullDate(info.estimatedEnd.toISOString())}`;
        }
        return (
          <span
            className={
              info.variance === 0
                ? "text-foreground"
                : info.variance === -1
                  ? "text-green-600"
                  : "text-red-500"
            }
          >
            {startText} – {fullDate(info.completedAt.toISOString())}
          </span>
        );
      })(),
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
      dots: tasks.map((task) => ({
        key: task.id,
        title: `${taskNo(task, dbTasks)} ${task.title} · ${labelOf(task.status)}`,
        tone: SPRINT_DOT[task.status] ?? "bg-slate-200",
      })),
      done: tasks.filter((task) => isTaskDone(task.status)).length,
      total: tasks.length,
      editable: false,
      sprintId: "",
    };
  });

  const sprintCards = data.sprints.map((sprint) => {
    const tasks = sprintTasks(sprint);
    const done = sprintDone(sprint);
    const total = tasks.length;
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
      dots: tasks.map((task) => ({
        key: task.id,
        title: `${taskNo(task, dbTasks)} ${task.title} · ${labelOf(task.status)}`,
        tone: SPRINT_DOT[task.status] ?? "bg-slate-200",
      })),
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
  const personCell = (id?: string | null) => (
    <PeopleField users={snap.users} value={id ?? null} />
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
            <InlineEdit
              as="h1"
              value={project.name}
              onCommit={(next) => next && saveField({ name: next })}
              className="text-2xl font-semibold tracking-tight"
              label={t("Click to edit")}
            />
            <span className="text-sm font-medium text-blue-500">{no}</span>
            {project.archived ? (
              <span
                data-slot="badge"
                className="inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl border-0 bg-amber-300/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-amber-500 shadow-none"
              >
                {t("Archived")}
              </span>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      "inline-flex h-5 w-fit shrink-0 cursor-pointer items-center justify-center rounded-4xl border-0 px-2 py-0.5 text-xs font-medium whitespace-nowrap shadow-none hover:opacity-80",
                      STATUS_TONE_BADGE[project.status] ?? STATUS_TONE_BADGE.active
                    )}
                  />
                }
              >
                <span className="flex items-center gap-1.5">
                  {(() => {
                    const visual = statusVisual(project.status);
                    const StatusIcon = visual.icon;
                    return <StatusIcon className={cn("size-3.5", visual.tone)} />;
                  })()}
                  {statusLabel}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {STATUS_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.value}
                      onClick={() => saveField({ status: item.value })}
                    >
                      <Icon className={cn("size-3.5", item.tone)} />
                      {t(item.label)}
                      {project.status === item.value ? <Check className="ml-auto size-4" /> : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <PriorityMenu value={project.priority} onChange={(priority) => saveField({ priority })} />
          </div>
          <InlineEdit
            as="p"
            value={project.description ?? ""}
            placeholder={t("No description")}
            onCommit={(next) => saveField({ description: next })}
            className="mt-1 max-w-2xl text-sm text-muted-foreground"
            label={t("Click to edit")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
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
                              <button
                                type="button"
                                onClick={() => setTab("Tasks")}
                                className="flex w-full items-center gap-3 py-3 text-left"
                              >
                                <TriangleAlert className="size-4 shrink-0 text-red-500" />
                                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                  {task.title}
                                </span>
                                <span className="shrink-0 text-xs text-red-500">
                                  {tr(`Overdue ${days}d`, `逾期 ${days} 天`)}
                                </span>
                                <span className="hidden shrink-0 sm:block">
                                  {personCell(task.assigneeId)}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                        {data.highIssues.map((issue) => (
                          <li key={issue.id}>
                            <button
                              type="button"
                              onClick={() => setTab("Issues")}
                              className="flex w-full items-center gap-3 py-3 text-left"
                            >
                              <TriangleAlert className="size-4 shrink-0 text-orange-500" />
                              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                #Q{issue.number} {issue.title}
                              </span>
                              <span className="shrink-0 text-xs text-amber-500">
                                {t("High priority")}
                              </span>
                              <span className="hidden shrink-0 sm:block">
                                {personCell(issue.assigneeId)}
                              </span>
                            </button>
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
                                    {milestone.completed ? (
                                      <CircleCheck className="size-4 text-teal-500" />
                                    ) : (
                                      <div className="size-3 rounded-full bg-card outline-2 outline-muted-foreground" />
                                    )}
                                  </div>
                                  {index < data.milestones.length - 1 ? (
                                    <div className="ms-3.5 -mt-2 h-full border-s border-border" />
                                  ) : null}
                                </div>
                                <div className="min-w-0 grow pt-0.5 pb-5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p
                                      className={cn(
                                        "text-sm font-medium",
                                        milestone.completed && "text-muted-foreground"
                                      )}
                                    >
                                      {milestone.title}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {milestone.completed
                                        ? t("Completed")
                                        : tr(`${days}d left`, `剩 ${days} 天`)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {milestone.description}
                                    {milestone.description ? " · " : ""}
                                    {fullDate(milestone.date)}
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
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-medium">{t("Coming up")}</h3>
                          {comingUpItems.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => setComingOpen((v) => !v)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {comingOpen ? t("Hide") : t("Show All")}
                              <ChevronDown
                                className={cn(
                                  "size-3 transition-transform",
                                  comingOpen && "rotate-180"
                                )}
                              />
                            </button>
                          ) : null}
                        </div>
                        <p className="mb-4 text-xs text-muted-foreground">
                          {t("Open tasks due in the next 14 days")}
                        </p>
                        {comingUpItems.length ? (
                          <StackRipple
                            stackCardItems={comingUpItems}
                            open={comingOpen}
                            onOpenChange={setComingOpen}
                            showToggle={false}
                            showAllLabel={t("Show All")}
                            hideLabel={t("Hide")}
                          />
                        ) : (
                          <EmptyState icon={CalendarClock} text={t("No tasks due soon")} />
                        )}
                      </div>
                    </div>
                  </>
                ) : null}

                {tab === "Issues" ? <IssuesPage projectId={id} embedded /> : null}

                {tab === "Tasks" ? <TasksPage projectId={id} embedded /> : null}

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
                            editIcon={card.editable ? "edit" : "external"}
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
                            onDelete={
                              card.editable
                                ? () => removeRecord("sprints", card.sprintId, id)
                                : undefined
                            }
                          />
                        </div>
                      </div>
                    ))}
                    {/* 阶段页的新建入口：网格末尾的虚线卡片，替代右上角 hover 按钮 */}
                    <button
                      type="button"
                      onClick={() => setDialog({ kind: "sprint" })}
                      aria-label={t("Add stage")}
                      className="group/add flex flex-col items-center justify-center gap-2 self-stretch rounded-xl border border-dashed border-border bg-card/40 p-4 text-muted-foreground transition-colors outline-none hover:border-foreground/25 hover:bg-muted/30 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full border border-border bg-background transition-colors group-hover/add:border-foreground/20">
                        <Plus className="size-4" />
                      </span>
                      <span className="text-xs font-medium">{t("Add stage")}</span>
                    </button>
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
                <span className="text-sm font-medium text-blue-500">{progress}%</span>
              </div>
              <div className="flex h-1.5 flex-wrap gap-3 [&>div]:h-1.5">
                <div className="relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-blue-500/10">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${progress}%` }}
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
              <ProgressTicker
                done={data.closedIssues + data.doneTasks}
                total={data.issues.length + data.tasks.length}
                doneTasks={data.doneTasks}
                totalTasks={data.tasks.length}
                doneIssues={data.closedIssues}
                totalIssues={data.issues.length}
                progress={progress}
                zh={zh}
              />
            </div>
            <div className="divide-y divide-border">
              {detailRow(t("Project No."), no)}
              {detailRow(t("Stage"), stageLabel(currentStage, zh))}
              {detailRow(
                t("Lead"),
                <LeadSelect
                  value={project.leadId}
                  onChange={(leadId) => {
                    void updateProject(id, { leadId }).then(() =>
                      toast.success(t("Saved successfully"))
                    );
                  }}
                />
              )}
              {detailRow(
                t("Members"),
                <PeopleField
                  users={snap.users}
                  value={project.memberIds}
                  multiple
                  editable
                  max={4}
                  label={t("Members")}
                  onChange={(ids) => {
                    void setProjectMembers(id, ids as string[]).then(() =>
                      toast.success(t("Saved successfully"))
                    );
                  }}
                />
              )}
              {detailRow(
                t("Started"),
                <DatePicker
                  variant="inline"
                  zh={zh}
                  value={
                    project.createdAt
                      ? new Date(project.createdAt).toISOString().slice(0, 10)
                      : undefined
                  }
                  onChange={(value) =>
                    value && saveField({ createdAt: new Date(value).toISOString() })
                  }
                />
              )}
              {detailRow(t("Order date"), fullDate(project.dueDate))}
              {detailRow(t("Duration"), <DurationTimer createdAt={project.createdAt} />)}
              {detailRow(t("Open issues"), data.issues.length - data.closedIssues)}
              {detailRow(t("Tasks done"), `${data.doneTasks}/${data.tasks.length}`)}
            </div>
          </div>
        </div>
      </div>
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
        nextIssueNumber={Math.max(500, ...dbIssues.map((item) => item.number)) + 1}
      />
    </div>
  );
}
