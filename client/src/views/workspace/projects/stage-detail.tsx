"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { differenceInCalendarDays } from "date-fns";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import { DateRangePicker } from "@/components/shadcn-dashboard/date-picker/date-picker-02";
import { useWorkspace } from "src/api/workspace/use-workspace";
import { useTasks, bulkCompleteTasks } from "src/api/tasks/use-tasks";
import { useIssues, bulkCompleteIssues } from "src/api/issues/use-issues";
import { NewIssueDialog, NewTaskDialog, type NewIssueValues, type NewTaskValues } from "../create-dialogs";
import {
  STAGES,
  STAGE_KEYS,
  STAGE_NO_TIME,
  stageTimeRange,
  nextStage,
  setProjectStage,
  getStageForm,
  stageFormKey,
  stageLabel,
  saveStageForm,
  type StageForm,
  type StageKey,
} from "src/api/workspace/project-stages";
import {
  ItemAssigneeMenu,
  ItemPriorityMenu,
  ItemStatusMenu,
} from "../item-fields";
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
import type { WsTask } from "src/types/apps/workspace";

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

/** 表单日期字符串 → Date；兼容 ISO(yyyy-mm-dd) 与英文长日期(April 1, 2025)。 */
const toDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
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
  const doneCount = stageTasks.filter((task) =>
    ["done", "closed", "completed"].includes(task.status)
  ).length;
  const progress = stageTasks.length ? Math.round((doneCount / stageTasks.length) * 100) : 0;
  const form = getStageForm(formKey);
  const stageName = stageLabel(stageKey, zh);
  const active = stageKey === currentStage;
  const finished = STAGE_KEYS.indexOf(stageKey) < STAGE_KEYS.indexOf(currentStage);

  /** 阶段日期：优先持久化的 stageForm，无则与项目阶段卡片一致按创建时间推算；费用/售后为空。 */
  const resolveRange = (key: string, formKeyValue: string): DateRange | undefined => {
    if (STAGE_NO_TIME.has(key)) return undefined;
    const saved = getStageForm(formKeyValue);
    const from = toDate(saved?.createDate);
    const to = toDate(saved?.dueDate);
    if (from || to) return { from, to };
    const range = stageTimeRange(key, project?.createdAt ?? "");
    return range ? { from: range.start, to: range.end } : undefined;
  };
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    resolveRange(stageKey, formKey)
  );
  useEffect(() => {
    setDateRange(resolveRange(stageKey, formKey));
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
    saveStageForm(
      formKey,
      {
        ...nextForm,
        createDate: toISODate(range.from ?? new Date()),
        dueDate: toISODate(range.to ?? range.from ?? new Date()),
      },
      id
    );
    toast.success(t("Saved successfully"));
  };

  if (wsLoading || tasksLoading || !project)
    return <div className="p-10 text-sm text-muted-foreground">…</div>;

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
      if (next !== currentStage) await setProjectStage(id!, next);
      toast.success(t("Saved successfully"));
      setConfirmOpen(false);
      navigate(`/projects/${id}`);
    } finally {
      setCompleting(false);
    }
  };

  const handleStatus = (taskId: string, status: string) => {
    void updateTask(taskId, { status }).then(() => toast.success(t("Saved successfully")));
  };
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
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t("Sprints")}</h1>
          <p className="text-sm text-muted-foreground">
            {zh ? "展示当前阶段的事项，跟踪阶段进度。" : "View items in the current stage and track its progress."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/projects/${id}`)}
            className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border bg-card px-2.5 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            {t("Back to project")}
          </button>
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
        {/* Left: grouped task table */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[55%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border text-sm font-medium text-foreground">
                <th className="px-3 py-3 text-left font-medium">{t("Item")}</th>
                <th className="px-3 py-3 text-left font-medium">{t("Status")}</th>
                <th className="px-3 py-3 text-left font-medium">{t("Priority")}</th>
                <th className="px-3 py-3 text-left font-medium">{t("Assignee")}</th>
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => {
                const items = stageTasks.filter((task) =>
                  (group.statuses as readonly string[]).includes(task.status)
                );
                if (!items.length) return null;
                return (
                  <GroupRows
                    key={group.key}
                    title={t(group.title)}
                    hint={t(group.hint)}
                    items={items}
                    allTasks={projectTasks}
                    onStatus={handleStatus}
                    onPriority={(taskId, priority) => void updateTask(taskId, { priority })}
                    onAssignee={(taskId, assigneeId) =>
                      void updateTask(taskId, { assigneeId })
                    }
                  />
                );
              })}
              {stageIssues.length ? (
                <>
                  <tr className="border-b border-border bg-muted/30">
                    <td colSpan={4} className="px-3 py-2.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{t("Issues")}</span>{" "}
                      {stageIssues.length} · {t("Open issues")}
                    </td>
                  </tr>
                  {stageIssues.map((issue) => (
                    <tr key={issue.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">#Q{issue.number}</p>
                      </td>
                      <td className="px-3 py-3">
                        <ItemStatusMenu
                          variant="chip"
                          value={issue.status}
                          onChange={(status) => void updateIssue(issue.id, { status })}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <ItemPriorityMenu
                          value={issue.priority}
                          onChange={(priority) => void updateIssue(issue.id, { priority })}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <ItemAssigneeMenu
                          value={issue.assigneeId}
                          onChange={(assigneeId) =>
                            void updateIssue(issue.id, { assigneeId })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </>
              ) : null}
              {stageTasks.length === 0 && stageIssues.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {t("No items")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="flex items-center gap-4 border-t border-border px-3 py-2.5">
            <button
              type="button"
              onClick={() => setIssueOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-3.5" />
              {t("Add Issue")}
            </button>
            <button
              type="button"
              onClick={() => setTaskOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-3.5" />
              {t("Add Task")}
            </button>
          </div>
        </div>

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
                <span className="text-muted-foreground">{t("Dates")}</span>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  onCommit={handleDateCommit}
                  zh={zh}
                />
              </div>
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

/** 状态分组的小标题行 + 任务行：字段控件与项目详情 Tasks 列表同源。 */
function GroupRows({
  title,
  hint,
  items,
  allTasks,
  onStatus,
  onPriority,
  onAssignee,
}: {
  title: string;
  hint: string;
  items: WsTask[];
  allTasks: WsTask[];
  onStatus: (id: string, status: string) => void;
  onPriority: (id: string, priority: string) => void;
  onAssignee: (id: string, assigneeId: string | null) => void;
}) {
  return (
    <>
      <tr className="border-b border-border bg-muted/30">
        <td colSpan={4} className="px-3 py-2.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{title}</span> {items.length} · {hint}
        </td>
      </tr>
      {items.map((task) => (
        <tr key={task.id} className="border-b border-border last:border-0">
          <td className="px-3 py-3">
            <p className="text-sm font-medium">{task.title}</p>
            <p className="text-xs text-muted-foreground">{taskNo(task, allTasks)}</p>
          </td>
          <td className="px-3 py-3">
            <ItemStatusMenu
              variant="chip"
              value={task.status}
              onChange={(status) => onStatus(task.id, status)}
            />
          </td>
          <td className="px-3 py-3">
            <ItemPriorityMenu
              value={task.priority}
              onChange={(priority) => onPriority(task.id, priority)}
            />
          </td>
          <td className="px-3 py-3">
            <ItemAssigneeMenu
              value={task.assigneeId}
              onChange={(assigneeId) => onAssignee(task.id, assigneeId)}
            />
          </td>
        </tr>
      ))}
    </>
  );
}
