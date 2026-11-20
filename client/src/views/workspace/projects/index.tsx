import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import Loading from "@/components/shadcn-dashboard/spinner/loading";
import {
  Columns3,
  List,
  ListFilter,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import {
  CURRENT_USER_ID,
  formatDate,
  resolveDate,
  useWorkspace,
} from "src/api/workspace/use-workspace";
import {
  SEED_TASKS,
  STAGES,
  createProject as createStageProject,
  projectNo,
  projectStage,
  stageLabel,
  updateProject,
  useProjectStageStore,
  type StageKey,
} from "src/api/workspace/project-stages";
import { useTasks } from "src/api/tasks/use-tasks";
import { projectCounts, projectProgress } from "src/api/workspace/project-progress";
import { useUsers } from "src/api/auth/use-users";
import { useWorkspaceDefaults } from "src/api/settings/use-workspace-defaults";
import type { WsProject } from "src/types/apps/workspace";
import {
  PmsCard,
  PmsCell,
  PmsDate,
  PmsGroup,
  PmsHeader,
  PmsIconButton,
  PmsNewButton,
  PmsOptionGroup,
  PmsPage,
  PmsPopover,
  PriorityMenu,
  PmsProgress,
  PmsRow,
  PmsSegmented,
  type PmsColumn,
} from "../pms";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { NewProjectDialog, type NewProjectValues } from "./new-project-dialog";
import { SetupSteps, type StepItem } from "@/components/shadcn-dashboard/animated-list/animated-list-02";
import { ProjectRowActions, statusVisual } from "./project-row-actions";
import { PeopleField } from "../people-field";

/**
 * 列宽平衡：项目列 w-48（比原 w-56 短，保留名称可读性）；
 * 成员列 w-28 容纳 3 个 24px 头像 + 间距；Progress/Created 各收一档为项目列腾空间。
 */
const TITLE_W = "w-48 min-w-48";
const COLUMNS: PmsColumn[] = [
  { label: "Project", w: TITLE_W },
  { label: "Lead", w: "w-32" },
  { label: "Members", w: "w-28" },
  { label: "Progress", w: "w-32" },
  { label: "Priority", w: "w-32" },
  { label: "Created", w: "w-40" },
];
const PRIORITY_RANK: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};
/** 看板卡片状态胶囊配色：与 project-row-actions 的 STATUS_ITEMS 保持一致。 */
const STATUS_BADGE: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-500",
  on_hold: "bg-amber-500/10 text-amber-500",
  completed: "bg-emerald-500/10 text-emerald-500",
};
/** 线上 PMS 表头加号展开的 Columns 菜单顺序；Completed 为锁定项。 */
const COLUMN_MENU = ["Lead", "Members", "Progress", "Priority", "Created"];
const GROUP_BY = ["Stage", "Lead", "Status", "None"];
const SORT_BY = ["Recently updated", "Name (A–Z)", "Created", "Progress", "Priority"];
/** 看板列配色沿用 /apps/kanban 的四套浅色，九阶段循环取值。 */
const BOARD_TONES = [
  { wrap: "bg-sky-400/10", badge: "border-sky-400/40 text-sky-500", dot: "bg-sky-400" },
  { wrap: "bg-teal-400/10", badge: "border-teal-400/40 text-teal-500", dot: "bg-teal-400" },
  { wrap: "bg-blue-500/10", badge: "border-blue-500/40 text-blue-500", dot: "bg-blue-500" },
  { wrap: "bg-amber-300/10", badge: "border-amber-300/40 text-amber-500", dot: "bg-amber-300" },
];

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { snap, zh, isLoading } = useWorkspace();
  const { tasks: allTasks } = useTasks();
  const { users: members } = useUsers();
  const [view, setView] = useState("List");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [groupBy, setGroupBy] = useState("Stage");
  const [sortBy, setSortBy] = useState("Recently updated");
  const [highOnly, setHighOnly] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const store = useProjectStageStore();
  const { defaults } = useWorkspaceDefaults();
  const navigate = useNavigate();
  const [creatingStage, setCreatingStage] = useState<StageKey | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [initPointer, setInitPointer] = useState(0);
  const [initDone, setInitDone] = useState(false);
  // 初始化进度步骤：按 SEED_TASKS 的阶段顺序去重，直接复用项目初始化清单。
  const initSteps: StepItem[] = useMemo(
    () =>
      Array.from(new Set(SEED_TASKS.map((seed) => seed.stage))).map((key) => ({
        id: key,
        title: stageLabel(key, zh),
      })),
    [zh]
  );

  /** 弹窗里填写项目基本信息后创建并进详情；默认 task / issue 由后端按首选项落库。 */
  const create = async (values: NewProjectValues, stage: StageKey) => {
    // 经办成员按首选项默认任务的「职位」解析（Contact.position），与部门无关。
    const people = members ?? [];
    const POSITION_LABEL: Record<string, string> = {
      lead: "", // 负责人不按职位匹配，直接用项目负责人
      design: "设计", art: "美工", operations: "运营",
      shipping: "出运", purchase: "采购", engineering: "工程对接人",
    };
    const byPosition = (role?: string) => {
      const label = role ? POSITION_LABEL[role] : undefined;
      return label ? people.find((p) => p.position?.includes(label))?.id ?? CURRENT_USER_ID : CURRENT_USER_ID;
    };
    const memberIds = Array.from(
      new Set(
        defaults.stages.flatMap((stageDefault) =>
          (stageDefault.defaultTasks ?? []).map((task) => byPosition(task.assigneeRole))
        )
      )
    );

    setCreatingStage(null);
    setInitPointer(0);
    setInitDone(false);
    setInitializing(true);
    try {
      const created = await createStageProject(values.name, values.description, stage, {
        status: values.status,
        priority: values.priority,
        memberIds,
        stageDefaults: defaults.stages,
      });
      // 后端已在项目创建事务里按首选项建好各阶段默认 task / issue；
      // 前端仅按阶段推进初始化动画，不再逐个写库。
      for (let i = 0; i < initSteps.length; i++) {
        setInitPointer(i);
        await new Promise((resolve) => window.setTimeout(resolve, 60));
      }
      setInitPointer(initSteps.length);
      setInitDone(true);
      await new Promise((resolve) => window.setTimeout(resolve, 1400));
      toast.success(t("Project created"));
      navigate(`/projects/${created.id}`);
    } finally {
      setInitializing(false);
    }
  };

  const all = useMemo(
    () => (snap?.projects ?? []).filter((p) => showArchived || !p.archived),
    [snap, showArchived]
  );
  const indexOf = (project: WsProject) => all.findIndex((p) => p.id === project.id);
  const noOf = (project: WsProject) => projectNo(project.id, indexOf(project));
  const stageOf = (project: WsProject) => projectStage(project.id, indexOf(project));

  const list = useMemo(() => {
    let out = all.filter((p) =>
      `${p.name} ${p.description} ${noOf(p)}`.toLowerCase().includes(query.toLowerCase())
    );
    if (highOnly) out = out.filter((p) => p.priority === "high" || p.priority === "urgent");
    if (mineOnly) out = out.filter((p) => p.memberIds.includes(CURRENT_USER_ID));
    const sorted = [...out];
    const time = (value: string) => resolveDate(value)?.getTime() ?? 0;
    if (sortBy === "Name (A–Z)") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "Created") sorted.sort((a, b) => time(a.createdAt) - time(b.createdAt));
    else if (sortBy === "Progress") sorted.sort((a, b) => b.progress - a.progress);
    else if (sortBy === "Priority")
      sorted.sort((a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0));
    else sorted.sort((a, b) => time(b.updatedAt) - time(a.updatedAt));
    return sorted;
  }, [all, query, highOnly, mineOnly, sortBy, store]);

  const groups = useMemo(() => {
    if (groupBy === "Stage")
      return STAGES.map((stage) => ({
        label: stageLabel(stage.key, zh),
        items: list.filter((p) => stageOf(p) === stage.key),
      }));
    if (groupBy === "None") return [{ label: "All", items: list }];
    if (groupBy === "Lead")
      return (snap?.users ?? [])
        .map((person) => ({
          label: person.name,
          items: list.filter((p) => p.leadId === person.id),
        }))
        .filter((g) => g.items.length);
    if (groupBy === "Status")
      return ["active", "on_hold", "completed"]
        .map((status) => ({
          label: status === "on_hold" ? "On hold" : status === "active" ? "Active" : "Completed",
          items: list.filter((p) => p.status === status),
        }))
        .filter((g) => g.items.length);
    return [{ label: "All", items: list }];
  }, [groupBy, list, snap, zh, store]);

  const boardColumns = useMemo(
    () =>
      STAGES.map((stage, i) => ({
        stage,
        tone: BOARD_TONES[i % BOARD_TONES.length],
        items: list.filter((p) => stageOf(p) === stage.key),
      })),
    [list, store]
  );

  /** 下单日期 = 订单阶段开始日期，当前由 dueDate 承载（创建项目时设定）。 */
  const orderDateOf = (project: WsProject) => project.dueDate;
  /** 看板卡片时间沿用项目创建时刻（下单仅有日期粒度）。 */
  const cardTime = (project: WsProject) => {
    const date = resolveDate(project.createdAt);
    return date
      ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "";
  };
  /** 列表「创建时间」列：显示项目创建时刻。 */
  const createdText = (project: WsProject) => formatDate(project.createdAt, "ch", "full");


  if (isLoading || !snap) return <Loading />;

  const visible = (label: string) => !hidden.includes(label);
  const columns = COLUMNS.filter((c) => c.label === "Project" || visible(c.label));
  const columnsMenu = (
    <DropdownMenuContent align="end" className="min-w-40">
      <DropdownMenuGroup>
        <DropdownMenuLabel>{t("Columns")}</DropdownMenuLabel>
        {COLUMN_MENU.map((label) => (
          <DropdownMenuCheckboxItem
            key={label}
            checked={!hidden.includes(label)}
            onCheckedChange={(checked) =>
              setHidden((prev) =>
                checked
                  ? prev.filter((item) => item !== label)
                  : [...prev, label]
              )
            }
          >
            {t(label)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );

  return (
    <PmsPage
      title={t("Projects")}
      count={t("N projects", { n: all.length })}
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
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center justify-between text-xs">
                      {t("High priority")}
                      <input
                        type="checkbox"
                        checked={highOnly}
                        onChange={(e) => setHighOnly(e.target.checked)}
                      />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between text-xs">
                      {t("Only my projects")}
                      <input
                        type="checkbox"
                        checked={mineOnly}
                        onChange={(e) => setMineOnly(e.target.checked)}
                      />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between text-xs">
                      {t("Show archived")}
                      <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                      />
                    </label>
                  </div>
                </PmsPopover>
                <PmsIconButton
                  icon={UserRound}
                  label={t("My projects")}
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
                  <div className="space-y-4">
                    <PmsOptionGroup
                      title="GROUP BY"
                      options={GROUP_BY}
                      value={groupBy}
                      onPick={setGroupBy}
                    />
                    <PmsOptionGroup
                      title="SORT BY"
                      options={SORT_BY}
                      value={sortBy}
                      onPick={setSortBy}
                    />
                  </div>
                </PmsPopover>
              </div>
              {searchOpen ? (
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Search projects...")}
                  className="h-8 w-44 rounded-lg border border-border bg-background px-2 text-xs outline-none"
                />
              ) : null}
            </div>
            <PmsNewButton
              label={t("New Project")}
              onClick={() => setCreatingStage("requirement")}
            />
          </>
        }
      >
        {view === "List" ? (
          <>
            <PmsHeader columns={columns} columnsMenu={columnsMenu} titleW={TITLE_W} />
            {groups.map((group) => (
              <PmsGroup
                key={group.label}
                label={group.label}
                count={group.items.length}
                collapsed={collapsed.includes(group.label)}
                onToggle={() =>
                  setCollapsed((prev) =>
                    prev.includes(group.label)
                      ? prev.filter((x) => x !== group.label)
                      : [...prev, group.label]
                  )
                }
              >
                {group.items.map((project) => {
                  const status = statusVisual(project.status);
                  const StatusIcon = status.icon;
                  return (
                  <PmsRow
                    key={project.id}
                    icon={<StatusIcon className={`size-4 ${status.tone}`} />}
                    title={project.name}
                    titleW={TITLE_W}
                    description={
                      project.description
                        ? `${noOf(project)} · ${project.description}`
                        : noOf(project)
                    }
                    href={`/projects/${project.id}`}
                    actions={
                      <ProjectRowActions
                        project={project}
                        currentStage={stageOf(project)}
                      />
                    }
                    cells={
                      <Fragment>
                        {visible("Lead") ? (
                          <PmsCell w="w-32">
                            <PeopleField users={snap?.users ?? []} value={project.leadId} />
                          </PmsCell>
                        ) : null}
                        {visible("Members") ? (
                          <PmsCell w="w-28">
                            <PeopleField
                              users={snap?.users ?? []}
                              value={project.memberIds}
                              multiple
                              max={3}
                            />
                          </PmsCell>
                        ) : null}
                        {visible("Progress") ? (
                          <PmsCell w="w-32">
                            <PmsProgress
                              value={projectProgress(project.id, allTasks, snap?.issues ?? [])}
                              status={project.status}
                            />
                          </PmsCell>
                        ) : null}
                        {visible("Priority") ? (
                          <PmsCell w="w-32">
                            <PriorityMenu
                              value={project.priority}
                              onChange={(priority) => updateProject(project.id, { priority })}
                            />
                          </PmsCell>
                        ) : null}
                        {visible("Created") ? (
                          <PmsCell w="w-40">
                            <PmsDate text={createdText(project)} />
                          </PmsCell>
                        ) : null}
                      </Fragment>
                    }
                  />
                  );
                })}
              </PmsGroup>
            ))}
          </>
        ) : (
          <div className="flex w-max min-w-full items-start gap-4 p-4">
            {boardColumns.map(({ stage, tone, items }, i) => (
              <div
                key={stage.key}
                className={`flex w-72 shrink-0 flex-col items-start gap-2 rounded-2xl border border-border p-2 ${tone.wrap}`}
              >
                <div className="flex w-full items-center gap-2 px-2 py-1.5">
                  <span className={`size-2 shrink-0 rounded-full ${tone.dot}`} />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
                    {String(i + 1).padStart(2, "0")} · {stageLabel(stage.key, zh)}
                  </p>
                  <span
                    className={`inline-flex h-5 items-center rounded-4xl border bg-background px-2 text-[11px] font-medium ${tone.badge}`}
                  >
                    {String(items.length).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex w-full flex-col items-start gap-2">
                  {items.map((project) => {
                    const { total } = projectCounts(project.id, allTasks, snap?.issues ?? []);
                    return (
                    <div
                      key={project.id}
                      className="relative flex w-full cursor-grab flex-col gap-3 rounded-xl bg-card p-3 shadow-sm active:cursor-grabbing"
                    >
                      <Link to={`/projects/${project.id}`} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 cursor-pointer text-sm wrap-break-word text-card-foreground hover:text-card-foreground/80">
                            {project.name}
                          </p>
                          <span
                            className={`inline-flex h-5 shrink-0 items-center rounded-4xl px-2 text-[11px] font-medium ${
                              total === 0
                                ? "bg-muted text-muted-foreground"
                                : STATUS_BADGE[project.status] ?? STATUS_BADGE.active
                            }`}
                          >
                            {total === 0 ? t("Not started") : t(statusVisual(project.status).label)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(orderDateOf(project), "en", "full")} · {cardTime(project)}
                          </span>
                          <PeopleField users={snap?.users ?? []} value={project.leadId} />
                        </div>
                      </Link>
                    </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </PmsCard>

      <NewProjectDialog
        open={creatingStage !== null}
        onOpenChange={(open) => {
          if (!open) setCreatingStage(null);
        }}
        onSubmit={(values) => create(values, creatingStage ?? "requirement")}
      />

      {initializing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
          role="status"
          aria-live="polite"
        >
          <SetupSteps steps={initSteps} pointer={initPointer} done={initDone} />
        </div>
      ) : null}
    </PmsPage>
  );
}
