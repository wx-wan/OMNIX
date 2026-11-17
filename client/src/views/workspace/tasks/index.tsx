import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronsUpDown,
  CircleCheck,
  Clock,
  Columns3,
  List,
  ListFilter,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CURRENT_USER_ID,
  dueLabel,
  isZh,
  resolveDate,
  useWorkspace,
} from "src/api/workspace/use-workspace";
import { taskNo } from "src/api/workspace/task-no";
import {
  getActiveProject,
  STAGE_KEYS,
  stageLabel,
  useProjectStageStore,
  type StageKey,
} from "src/api/workspace/project-stages";
import { useTasks } from "src/api/tasks/use-tasks";
import SpinnerBars from "@/components/shadcn-dashboard/spinner/spinner-06";
import { NewTaskDialog, type NewTaskValues } from "../create-dialogs";
import type { WsTask } from "src/types/apps/workspace";
import {
  PmsCard,
  PmsField,
  PmsIconButton,
  PmsNewButton,
  PmsOptionGroup,
  PmsPage,
  PmsPopover,
  PmsSegmented,
  PmsSheet,
} from "../pms";
import {
  ItemAssigneeMenu,
  ItemPriorityMenu,
  ItemStatusMenu,
  STATUS_LABEL,
  STATUS_ORDER,
} from "../item-fields";

const GROUPS: { label: string; values: string[] }[] = [
  { label: "Backlog", values: ["backlog"] },
  { label: "Todo", values: ["todo"] },
  { label: "In Progress", values: ["in_progress"] },
  { label: "Review", values: ["review"] },
  { label: "Done", values: ["done", "closed"] },
];
const HEADERS = [
  "",
  "Task",
  "Project",
  "Stage",
  "Priority",
  "Estimate",
  "Due",
  "Status",
  "Assignee",
  "Actions",
];
/** 项目详情内嵌时不显示「项目」列（已在项目上下文里）。 */
const headersFor = (embedded?: boolean) =>
  embedded ? HEADERS.filter((h) => h !== "Project") : HEADERS;

/** 列头排序：仅项目详情 Tasks 列表支持；默认按任务编号（创建顺序）升序。 */
type SortKey = "number" | "priority" | "estimate" | "due" | "status";
type SortDir = "asc" | "desc";
const SORTABLE_HEADERS: Record<string, SortKey> = {
  Task: "number",
  Priority: "priority",
  Estimate: "estimate",
  Due: "due",
  Status: "status",
};
const PRIORITY_RANK: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

export default function TasksPage({
  projectId: projectIdProp,
  embedded,
}: { projectId?: string; embedded?: boolean } = {}) {
  const { t } = useTranslation();
  const { snap, lang, userName, projectName, isLoading: wsLoading } = useWorkspace();
  useProjectStageStore();
  const {
    tasks: all,
    isLoading: tasksLoading,
    create: createTask,
    update: updateTask,
    remove: removeTask,
  } = useTasks();
  const [view, setView] = useState("List");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [currentStageOnly, setCurrentStageOnly] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("number");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [groupBy, setGroupBy] = useState("Status");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [selected, setSelected] = useState<WsTask | null>(null);
  const [creating, setCreating] = useState(false);

  /** 任务列只展示各项目「当前阶段」的任务；该筛选默认开启，可在 Filters 里关闭以查看其它阶段。 */
  const stageOfProject = (projectId: string): string | undefined =>
    snap?.projects.find((project) => project.id === projectId)?.stage;

  const list = useMemo(() => {
    let out = all.filter(
      (task) =>
        (!projectIdProp || task.projectId === projectIdProp) &&
        // 独立 /tasks 页维持原状：始终只看当前阶段；项目详情可由「只展示当前阶段」勾选切换
        (embedded
          ? !currentStageOnly || task.sprintId === stageOfProject(task.projectId)
          : task.sprintId === stageOfProject(task.projectId)) &&
        `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase())
    );
    if (hideCompleted)
      out = out.filter((task) => task.status !== "done" && task.status !== "closed");
    if (mineOnly) out = out.filter((task) => task.assigneeId === CURRENT_USER_ID);
    // 优先级筛选仅在项目详情提供；独立页保持 All 不过滤
    if (embedded) {
      if (priorityFilter === "High")
        out = out.filter((task) => task.priority === "high" || task.priority === "urgent");
      else if (priorityFilter !== "All")
        out = out.filter((task) => task.priority === priorityFilter.toLowerCase());
    }
    return [...out].sort((a, b) => {
      // 独立 /tasks 页维持原状：按到期时间升序
      if (!embedded)
        return (
          (resolveDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (resolveDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER)
        );
      // 项目详情：按列头排序键；默认 number 升序（编号 = createdAt 顺序）
      let diff = 0;
      switch (sortKey) {
        case "number":
          diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "priority":
          diff = (PRIORITY_RANK[a.priority] ?? 0) - (PRIORITY_RANK[b.priority] ?? 0);
          break;
        case "estimate":
          diff = (a.estimate ?? 0) - (b.estimate ?? 0);
          break;
        case "due":
          diff =
            (resolveDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
            (resolveDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER);
          break;
        case "status":
          diff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
          break;
      }
      return sortDir === "asc" ? diff : -diff;
    });
  }, [all, query, hideCompleted, mineOnly, currentStageOnly, priorityFilter, sortKey, sortDir, embedded, snap]);

  const groups = useMemo(() => {
    if (groupBy === "None") return [{ label: "All", items: list }];
    return GROUPS.map((group) => ({
      label: group.label,
      items: list.filter((task) => group.values.includes(task.status)),
    })).filter((group) => group.items.length);
  }, [groupBy, list]);

  /** 任务自身阶段：sprintId 即阶段 key（requirement/quotation/sample…），非法值回退需求。 */
  const stageOf = (task: WsTask): StageKey =>
    STAGE_KEYS.includes(task.sprintId as StageKey)
      ? (task.sprintId as StageKey)
      : "requirement";

  /** 预估按「日」展示（小时向上折算为天）；编辑时仍按小时精确修改。 */
  const estimateDays = (task: WsTask) =>
    task.estimate ? `${Math.ceil(task.estimate / 24)}d` : "—";

  const create = (values: NewTaskValues) => {
    const projectId = values.projectId || projectIdProp || getActiveProject();
    const projectPriority =
      snap?.projects.find((project) => project.id === projectId)?.priority ?? "medium";
    createTask({
      title: values.title,
      description: values.description,
      status: values.status,
      // 未显式选择时，优先级默认跟随所属项目
      priority: values.priority || projectPriority,
      // 经办人默认创建人；预估按优先级推导，到期默认=创建时间+预估（用户可指定）
      assigneeId: values.assigneeId || CURRENT_USER_ID,
      dueDate: values.dueDate || undefined,
      projectId,
    });
    setCreating(false);
  };

  if (wsLoading || tasksLoading)
    return (
      <div className="flex min-h-40 items-center justify-center text-muted-foreground">
        <SpinnerBars />
      </div>
    );

  return (
    <PmsPage
      title={t("Tasks")}
      count={t("N tasks", { n: all.length })}
      embedded={embedded}
      segmented={
        <PmsSegmented
          options={["Board", "List"]}
          value={view}
          onChange={setView}
          icons={{ Board: Columns3, List }}
        />
      }
    >
      <PmsCard
        toolbar={
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1">
                <PmsPopover icon={ListFilter} label="Filters">
                  {embedded ? (
                    <div className="space-y-4">
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={currentStageOnly}
                          onCheckedChange={(checked) => setCurrentStageOnly(checked === true)}
                          aria-label={t("Current stage only")}
                          className="size-3.5"
                        />
                        {t("Current stage only")}
                      </label>
                      <PmsOptionGroup
                        title="Priority"
                        options={["All", "High", "Urgent", "Medium", "Low", "none"]}
                        value={priorityFilter}
                        onPick={setPriorityFilter}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t("Filters")}</p>
                  )}
                </PmsPopover>
                <PmsIconButton
                  icon={CircleCheck}
                  label={t("Hide completed")}
                  active={hideCompleted}
                  onClick={() => setHideCompleted((v) => !v)}
                />
                <PmsIconButton
                  icon={UserRound}
                  label={t("Assigned to me")}
                  active={mineOnly}
                  onClick={() => setMineOnly((v) => !v)}
                />
                <PmsIconButton
                  icon={Search}
                  label="Search"
                  active={searchOpen}
                  onClick={() => setSearchOpen((v) => !v)}
                />
                <PmsPopover icon={SlidersHorizontal} label="View options">
                  <PmsOptionGroup
                    title="GROUP BY"
                    options={["Status", "None"]}
                    value={groupBy}
                    onPick={setGroupBy}
                  />
                </PmsPopover>
              </div>
              {searchOpen ? (
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Search tasks...")}
                  className="h-8 w-44 rounded-lg border border-border bg-background px-2 text-xs outline-none"
                />
              ) : null}
            </div>
            <PmsNewButton label={t("New Task")} onClick={() => setCreating(true)} />
          </>
        }
      >
        {view === "List" ? (
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b">
                {headersFor(embedded).map((head, index) => {
                  const sort = embedded ? SORTABLE_HEADERS[head] : undefined;
                  const active = sort && sortKey === sort;
                  return (
                    <th
                      key={index}
                      className={`h-10 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground ${index === 0 ? "w-10" : ""}`}
                    >
                      {sort ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (sortKey === sort) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                            else {
                              setSortKey(sort);
                              setSortDir("asc");
                            }
                          }}
                          className={`inline-flex items-center gap-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring ${
                            active ? "text-foreground" : "text-muted-foreground"
                          }`}
                          aria-label={`${t(head)} ${active ? (sortDir === "asc" ? "ascending" : "descending") : ""}`}
                        >
                          {t(head)}
                          {active ? (
                            sortDir === "asc" ? (
                              <ArrowUp className="size-3" />
                            ) : (
                              <ArrowDown className="size-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="size-3 opacity-50" />
                          )}
                        </button>
                      ) : head ? (
                        t(head)
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.label}>
                  <tr className="border-b bg-muted/30 hover:bg-muted/30">
                    <td colSpan={headersFor(embedded).length} className="p-0">
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsed((prev) =>
                            prev.includes(group.label)
                              ? prev.filter((x) => x !== group.label)
                              : [...prev, group.label]
                          )
                        }
                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-medium"
                      >
                        <ChevronDown
                          className={`size-4 text-muted-foreground transition-transform ${
                            collapsed.includes(group.label) ? "-rotate-90" : ""
                          }`}
                        />
                        {t(group.label)}
                        <span className="rounded-full bg-foreground/10 px-1.5 text-[10px] font-normal">
                          {group.items.length}
                        </span>
                      </button>
                    </td>
                  </tr>
                  {!collapsed.includes(group.label)
                    ? group.items.map((task) => (
                        <tr
                          key={task.id}
                          className="group border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <td className="w-10 p-2 px-3 py-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0">
                            <Checkbox
                              checked={task.status === "done" || task.status === "closed"}
                              onCheckedChange={() =>
                                updateTask(task.id, {
                                  status:
                                    task.status === "done" || task.status === "closed"
                                      ? "todo"
                                      : "done",
                                })
                              }
                              aria-label="Mark as done"
                              className="size-3.5"
                            />
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelected(task)}
                              className="min-w-0 text-left"
                            >
                              <h6 className="flex max-w-72 items-baseline gap-2 truncate text-sm font-medium">
                                <span
                                  className={`truncate ${
                                    task.status === "done" || task.status === "closed"
                                      ? "text-muted-foreground line-through"
                                      : ""
                                  }`}
                                >
                                  {task.title}
                                </span>
                                <span className="shrink-0 text-xs font-normal text-muted-foreground">
                                  {taskNo(task, all)}
                                </span>
                              </h6>
                            </button>
                          </td>
                          {embedded ? null : (
                            <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                              <span className="text-sm whitespace-nowrap">
                                {projectName(task.projectId)}
                              </span>
                            </td>
                          )}
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <span className="inline-flex h-5 items-center rounded-4xl bg-blue-500/10 px-2 text-[11px] font-medium text-blue-500">
                              {stageLabel(stageOf(task), isZh(lang))}
                            </span>
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <ItemPriorityMenu
                              value={task.priority}
                              onChange={(priority) => updateTask(task.id, { priority })}
                            />
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                aria-label={`Estimate: ${task.estimate ?? 0}h`}
                                className="flex items-center gap-1.5 rounded-md px-1 py-1 text-sm text-muted-foreground outline-none hover:bg-muted"
                              >
                                <Clock className="size-3.5" />
                                {estimateDays(task)}
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-36">
                                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                  {t("Estimate (hours)")}
                                </div>
                                {[2, 4, 8, 12, 24, 48].map((hours) => (
                                  <DropdownMenuItem
                                    key={hours}
                                    onClick={() => updateTask(task.id, { estimate: hours })}
                                  >
                                    {hours}h · {Math.ceil(hours / 24)}d
                                    {task.estimate === hours ? <Check className="ml-auto size-4" /> : null}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <input
                              type="date"
                              aria-label={`Due date: ${task.title}`}
                              value={
                                task.dueDate
                                  ? new Date(task.dueDate).toISOString().slice(0, 10)
                                  : ""
                              }
                              onChange={(event) =>
                                updateTask(task.id, {
                                  dueDate: event.target.value
                                    ? new Date(event.target.value).toISOString()
                                    : null,
                                })
                              }
                              className="h-8 w-32 rounded-md border bg-background px-2 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <ItemStatusMenu
                              value={task.status}
                              onChange={(status) => updateTask(task.id, { status })}
                            />
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <ItemAssigneeMenu
                              value={task.assigneeId}
                              onChange={(assigneeId) => updateTask(task.id, { assigneeId })}
                            />
                          </td>
                          <td className="w-10 p-2 px-3 py-3 align-middle whitespace-nowrap text-right">
                            <button
                              type="button"
                              aria-label={t("Delete")}
                              title={t("Delete")}
                              onClick={() => removeTask(task.id)}
                              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex w-max min-w-full items-start gap-4 px-4">
            {groups.map((group) => (
              <div
                key={group.label}
                className="flex w-72 shrink-0 flex-col items-start gap-2 rounded-2xl border border-border bg-muted p-2"
              >
                <div className="flex w-full items-center gap-2 px-2 py-1.5 text-sm font-medium">
                  {t(group.label)}
                  <span className="rounded-full bg-foreground/10 px-1.5 text-[10px]">
                    {group.items.length}
                  </span>
                </div>
                {group.items.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelected(task)}
                    className="w-full cursor-pointer rounded-xl bg-card p-3 text-sm shadow-sm"
                  >
                    <div
                      className={`font-medium ${
                        task.status === "done" || task.status === "closed"
                          ? "text-muted-foreground line-through"
                          : ""
                      }`}
                    >
                      {task.title}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {embedded ? null : `${projectName(task.projectId)} · `}
                      {dueLabel(task.dueDate, lang)}
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex h-5 items-center rounded-4xl bg-blue-500/10 px-2 text-[11px] font-medium text-blue-500">
                        {stageLabel(stageOf(task), isZh(lang))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </PmsCard>

      <PmsSheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.title ?? ""}
        description={selected ? projectName(selected.projectId) : undefined}
      >
        {selected ? (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {selected.description || t("No description")}
            </p>
            <div className="space-y-3 border-t border-border pt-4">
              <PmsField label={t("Status")}>{t(STATUS_LABEL[selected.status])}</PmsField>
              <PmsField label={t("Priority")}>
                {t(selected.priority.charAt(0).toUpperCase() + selected.priority.slice(1))}
              </PmsField>
              <PmsField label={t("Assignee")}>
                {selected.assigneeId ? userName(selected.assigneeId) : t("Unassigned")}
              </PmsField>
              <PmsField label={t("Estimate")}>
                {selected.estimate ? `${selected.estimate}h` : "—"}
              </PmsField>
              <PmsField label={t("Due date")}>{dueLabel(selected.dueDate, lang)}</PmsField>
              <PmsField label={t("Stage")}>
                <span className="inline-flex h-5 items-center rounded-4xl bg-blue-500/10 px-2 text-[11px] font-medium text-blue-500">
                  {stageLabel(stageOf(selected), isZh(lang))}
                </span>
              </PmsField>
            </div>
          </>
        ) : null}
      </PmsSheet>

      <NewTaskDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={create}
        projects={snap.projects}
        users={snap.users}
        defaultProjectId={projectIdProp || getActiveProject()}
      />
    </PmsPage>
  );
}
