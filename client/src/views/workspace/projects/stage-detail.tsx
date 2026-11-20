"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { DateRange } from "react-day-picker";
import { differenceInCalendarDays } from "date-fns";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import Loading from "@/components/shadcn-dashboard/spinner/loading";
import { DateRangePicker } from "@/components/shadcn-dashboard/date-picker/date-picker-02";
import { formatDate, useWorkspace } from "src/api/workspace/use-workspace";
import { useTasks, bulkCompleteTasks } from "src/api/tasks/use-tasks";
import { useIssues, bulkCompleteIssues } from "src/api/issues/use-issues";
import { NewIssueDialog, NewTaskDialog, type NewIssueValues, type NewTaskValues } from "../create-dialogs";
import {
  STAGES,
  STAGE_KEYS,
  STAGE_NO_TIME,
  stageDateInfo,
  nextStage,
  setProjectStage,
  getStageForm,
  stageFormKey,
  stageLabel,
  saveStageForm,
  saveStageEstimatedDates,
  type StageForm,
  type StageKey,
} from "src/api/workspace/project-stages";
import { ItemsTable, type ItemsTableGroup, type ItemsTableRow } from "../items-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { taskNo } from "src/api/workspace/task-no";

const GROUPS = [
  { key: "in_progress", title: "In progress", hint: "being worked on or in review", statuses: ["in_progress", "review"] },
  { key: "todo", title: "To do", hint: "not started yet", statuses: ["todo", "backlog"] },
  { key: "done", title: "Done", hint: "finished", statuses: ["done", "closed", "completed"] },
] as const;

const STAGE_GOAL: Record<string, { en: string; zh: string }> = {
  requirement: { en: "Capture and confirm customer requirements.", zh: "收集并确认客户需求。" },
  quotation: { en: "Prepare and send the quotation.", zh: "准备并发送报价。" },
  sample: { en: "Develop and confirm samples.", zh: "打样并确认样品。" },
};

/** Date → ISO 日期 yyyy-mm-dd（用本地年月日，避免 UTC 偏移）。 */
const toISODate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function StageDetailPage() {
  const { id, stage } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { snap, zh, isLoading: wsLoading } = useWorkspace();
  const stageKey = (STAGE_KEYS.includes(stage as StageKey) ? stage : "requirement") as StageKey;
  const {
    tasks: projectTasks,
    isLoading: tasksLoading,
    create: createTask,
    update: updateTask,
  } = useTasks(id);
  const { issues: stageIssues, create: createIssue, update: updateIssue } = useIssues(
    id,
    stageKey
  );
  /** 编号按项目全部问题计算，与项目详情 Issues 页口径一致，避免跨阶段重复。 */
  const { issues: projectIssues } = useIssues(id);
  const project = snap?.projects.find((p) => p.id === id);
  const currentStage = (project?.stage as StageKey) ?? "requirement";

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const formKey = stageFormKey(project?.no ?? "", stageKey);

  const stageTasks = useMemo(
    () =>
      projectTasks
        .filter((task) => task.sprintId === stageKey)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [projectTasks, stageKey]
  );
  const tableGroups: ItemsTableGroup[] = useMemo(() => {
    const groups: ItemsTableGroup[] = GROUPS.map((group) => ({
      key: group.key,
      title: t(group.title),
      hint: t(group.hint),
      items: stageTasks
        .filter((task) => (group.statuses as readonly string[]).includes(task.status))
        .map<ItemsTableRow>((task) => ({
          id: task.id,
          kind: "task",
          title: task.title,
          no: taskNo(task, projectTasks),
          type: task.type,
          action: task.action,
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId,
          onOpen: () => openItem("task", task.id),
        })),
    }));
    groups.push({
      key: "issues",
      title: t("Issues"),
      hint: t("Open issues"),
      items: stageIssues.map<ItemsTableRow>((issue) => ({
        id: issue.id,
        kind: "issue",
        title: issue.title,
        no: `#Q${issue.number}`,
        type: issue.type,
        action: issue.action,
        status: issue.status,
        priority: issue.priority,
        assigneeId: issue.assigneeId,
        onOpen: () => openItem("issue", issue.id),
      })),
    });
    return groups;
  }, [stageTasks, stageIssues, projectTasks, t]);

  const doneCount = stageTasks.filter((task) =>
    ["done", "closed", "completed"].includes(task.status)
  ).length;
  const progress = stageTasks.length ? Math.round((doneCount / stageTasks.length) * 100) : 0;
  const form = getStageForm(formKey);
  const stageName = stageLabel(stageKey, zh);
  const active = stageKey === currentStage;
  const finished = STAGE_KEYS.indexOf(stageKey) < STAGE_KEYS.indexOf(currentStage);

  /** 预估起止（用户可编辑）与实际完成时间（点击完成时写入）分开呈现。 */
  const dateInfo = stageDateInfo(
    stageKey,
    project?.createdAt ?? "",
    project?.stageSchedule
  );
  const resolveRange = (key: string): DateRange | undefined => {
    if (STAGE_NO_TIME.has(key)) return undefined;
    const info = stageDateInfo(key, project?.createdAt ?? "", project?.stageSchedule);
    return info ? { from: info.start, to: info.estimatedEnd } : undefined;
  };
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    resolveRange(stageKey)
  );
  useEffect(() => {
    setDateRange(resolveRange(stageKey));
  }, [formKey, stageKey]);

  /** 进度提示：距开始天数 / 总天数 / 剩余天数（按日历日）。 */
  const dayInfo = (() => {
    if (!dateRange?.from || !dateRange?.to) return null;
    const today = new Date();
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    const total = differenceInCalendarDays(to, from) + 1;
    const sinceStart = differenceInCalendarDays(today, from);
    const left = differenceInCalendarDays(to, today);
    return { total, sinceStart, left };
  })();

  const handleDateCommit = (range: DateRange) => {
    setDateRange(range);
    const nextForm: StageForm = form ?? {
      billFrom: "",
      billTo: "",
      createDate: "",
      dueDate: "",
      status: "",
      notes: "",
      items: [],
      updatedAt: "",
    };
    const estimatedStart = toISODate(range.from ?? new Date());
    const estimatedEnd = toISODate(range.to ?? range.from ?? new Date());
    saveStageForm(
      formKey,
      {
        ...nextForm,
        createDate: estimatedStart,
        dueDate: estimatedEnd,
      },
      id
    );
    saveStageEstimatedDates(id!, stageKey, estimatedStart, estimatedEnd);
    toast.success(t("Saved successfully"));
  };

  if (wsLoading || tasksLoading || !project) return <Loading />;

  const handleComplete = async () => {
    if (!active) return;
    setCompleting(true);
    try {
      // 批量把当前阶段未完成的任务与问题标记为完成
      const openIds = stageTasks
        .filter((task) => !["done", "closed", "completed"].includes(task.status))
        .map((task) => task.id);
      if (openIds.length) await bulkCompleteTasks(openIds);
      const openIssueIds = stageIssues
        .filter((issue) => !["done", "closed", "completed"].includes(issue.status))
        .map((issue) => issue.id);
      if (openIssueIds.length) await bulkCompleteIssues(openIssueIds);
      const next = nextStage(currentStage);
      if (next !== currentStage)
        await setProjectStage(id!, next, undefined, currentStage);
      toast.success(t("Saved successfully"));
      setConfirmOpen(false);
      // 完成后停留在阶段详情，直接切到下一阶段页；最后一阶段则留在当前页。
      if (next !== currentStage) navigate(`/projects/${id}/stages/${next}`);
    } finally {
      setCompleting(false);
    }
  };

  const handleStatus = (taskId: string, status: string) => {
    void updateTask(taskId, { status }).then(() => toast.success(t("Saved successfully")));
  };
  /** 事项标题跳转统一详情页：/issues/:id?kind=task|issue。 */
  const openItem = (kind: "task" | "issue", itemId: string) =>
    navigate(`/issues/${itemId}?kind=${kind}`);

  const handleCreateIssue = (values: NewIssueValues) => {
    const nextNumber = Math.max(500, ...projectIssues.map((i) => i.number)) + 1;
    void createIssue({
      title: values.title,
      description: values.description,
      priority: values.priority,
      severity: values.severity,
      assigneeId: values.assigneeId || null,
      projectId: id!,
      sprintId: stageKey,
      number: nextNumber,
    }).then(() => {
      setIssueOpen(false);
      toast.success(t("Saved successfully"));
    });
  };
  const handleCreateTask = (values: NewTaskValues) => {
    void createTask({
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      assigneeId: values.assigneeId || null,
      dueDate: values.dueDate || null,
      projectId: id!,
      sprintId: stageKey,
    }).then(() => {
      setTaskOpen(false);
      toast.success(t("Saved successfully"));
    });
  };
  return (
    <>
    <div className="flex min-w-0 flex-1 flex-col gap-5 rounded-xl bg-background p-6">
      {/* Header：面包屑 Projects / 项目 / 阶段（点击项目返回项目详情） */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/projects" />}>
                  {t("Projects")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to={`/projects/${id}`} />}>
                  {project?.name ?? "—"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{stageName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="mt-2 text-xl font-semibold">{stageName}</h1>
          <p className="text-sm text-muted-foreground">
            {zh ? "展示当前阶段的事项，跟踪阶段进度。" : "View items in the current stage and track its progress."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={stageKey}
            onValueChange={(next) => {
              if (next && next !== stageKey) navigate(`/projects/${id}/stages/${next}`);
            }}
          >
            <SelectTrigger className="h-8! min-w-28 rounded-[10px]! px-2.5! text-sm font-medium" aria-label={t("Stage")}>
              <SelectValue>{stageName}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {stageLabel(item.key, zh)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
        <ItemsTable
          groups={tableGroups}
          onStatus={(row, status) => handleStatus(row.id, status)}
          onPriority={(row, priority) =>
            void (row.kind === "issue"
              ? updateIssue(row.id, { priority })
              : updateTask(row.id, { priority }))
          }
          onAssignee={(row, assigneeId) =>
            void (row.kind === "issue"
              ? updateIssue(row.id, { assigneeId })
              : updateTask(row.id, { assigneeId }))
          }
          onAddIssue={() => setIssueOpen(true)}
          onAddTask={() => setTaskOpen(true)}
        />

        {/* Right: sprint detail panel */}
        <aside className="w-full shrink-0 lg:w-80">
          <div className="overflow-hidden rounded-xl border border-border bg-card lg:sticky lg:top-20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">{stageName}</h2>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  finished
                    ? "bg-teal-400/10 text-teal-500"
                    : active
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {finished ? t("Done") : active ? t("Active") : t("Not started")}
              </span>
            </div>
            {/* Progress */}
            <div className="border-b border-border px-5 py-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("Progress")}</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-teal-400/10">
                <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {dayInfo
                  ? dayInfo.sinceStart < 0
                    ? t("Starts in {{n}} days · {{total}} days total", {
                        n: -dayInfo.sinceStart,
                        total: dayInfo.total,
                      })
                    : dayInfo.left < 0
                      ? t("Ended · {{total}} days total", { total: dayInfo.total })
                      : t("{{d}} days since start · {{total}} days total · {{left}} days left", {
                          d: dayInfo.sinceStart,
                          total: dayInfo.total,
                          left: dayInfo.left,
                        })
                  : null}
              </p>
            </div>
            {/* Fields */}
            <div className="divide-y divide-border text-sm">
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-muted-foreground">{t("Project")}</span>
                <span className="max-w-36 truncate font-medium">{project.name}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-muted-foreground">{t("Estimated dates")}</span>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  onCommit={handleDateCommit}
                  zh={zh}
                />
              </div>
              {dateInfo?.completedAt ? (
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-muted-foreground">{t("Actual completion")}</span>
                  <span
                    className={cn(
                      "font-medium",
                      dateInfo.variance === 0
                        ? "text-foreground"
                        : dateInfo.variance === -1
                          ? "text-green-600"
                          : "text-red-500"
                    )}
                  >
                    {formatDate(dateInfo.start.toISOString(), zh ? "zh" : "en", "short")} –{" "}
                    {formatDate(dateInfo.completedAt.toISOString(), zh ? "zh" : "en", "short")}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-muted-foreground">{t("Items")}</span>
                <span className="font-medium">{stageTasks.length}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-muted-foreground">{t("Done")}</span>
                <span className="font-medium">
                  {doneCount} of {stageTasks.length}
                </span>
              </div>
              <div className="px-5 py-3">
                <p className="text-muted-foreground">{t("Goal")}</p>
                <p className="mt-1 font-medium">
                  {form?.notes || STAGE_GOAL[stageKey]?.[zh ? "zh" : "en"] || stageName}
                </p>
              </div>
            </div>
            {/* Complete */}
            <div className="p-5">
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={!active}
                className="h-8 w-full rounded-[10px] bg-foreground px-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("Complete stage")}
              </button>
            </div>
          </div>
        </aside>
      </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Complete stage")}</AlertDialogTitle>
            <AlertDialogDescription>
              {zh
                ? "是否标记当前阶段的所有事项为完成？确认后将批量完成事项并进入下一阶段。"
                : "Mark all items in this stage as done? This will complete every item and move the project to the next stage."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={completing}>
              {completing ? "…" : t("Confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <NewIssueDialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        onSubmit={handleCreateIssue}
        projects={snap.projects}
        users={snap.users}
        defaultProjectId={id}
      />
      <NewTaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        onSubmit={handleCreateTask}
        projects={snap.projects}
        users={snap.users}
        defaultProjectId={id}
      />
    </>
  );
}
