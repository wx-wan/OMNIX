import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  CircleDot,
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
  relativeDays,
  resolveDate,
  useWorkspace,
} from "src/api/workspace/use-workspace";
import {
  STAGES,
  advanceStage,
  createProject as createStageProject,
  projectNo,
  projectStage,
  stageLabel,
  useProjectStageStore,
  type StageKey,
} from "src/api/workspace/project-stages";
import type { WsProject } from "src/types/apps/workspace";
import {
  PmsAvatar,
  PmsAvatarGroup,
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
  PmsPriority,
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
import { ProjectRowActions } from "./project-row-actions";

const COLUMNS: PmsColumn[] = [
  { label: "Project", w: "w-56" },
  { label: "Stage", w: "w-28" },
  { label: "Lead", w: "w-36" },
  { label: "Members", w: "w-28" },
  { label: "Progress", w: "w-32" },
  { label: "Priority", w: "w-28" },
  { label: "Due date", w: "w-32" },
];
const PRIORITY_RANK: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};
/** 线上 PMS 表头加号展开的 Columns 菜单顺序；Completed 为锁定项。 */
const COLUMN_MENU = ["Lead", "Members", "Progress", "Priority", "Due date"];
const GROUP_BY = ["Stage", "Team", "Lead", "Status", "None"];
const SORT_BY = ["Recently updated", "Name (A–Z)", "Due date", "Progress", "Priority"];
/** 看板列配色沿用 /apps/kanban 的四套浅色，九阶段循环取值。 */
const BOARD_TONES = [
  { wrap: "bg-sky-400/10", badge: "border-sky-400/40 text-sky-500", dot: "bg-sky-400" },
  { wrap: "bg-teal-400/10", badge: "border-teal-400/40 text-teal-500", dot: "bg-teal-400" },
  { wrap: "bg-blue-500/10", badge: "border-blue-500/40 text-blue-500", dot: "bg-blue-500" },
  { wrap: "bg-amber-300/10", badge: "border-amber-300/40 text-amber-500", dot: "bg-amber-300" },
];

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { snap, zh, user, firstName, isLoading } = useWorkspace();
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
  const navigate = useNavigate();
  const [creatingStage, setCreatingStage] = useState<StageKey | null>(null);

  /** 弹窗里填写项目基本信息后创建并进详情；客户与产品信息在迭代 → 需求阶段 → 需求详情表单里补录。 */
  const create = (values: NewProjectValues, stage: StageKey) => {
    const created = createStageProject(values.name, values.description, stage, {
      status: values.status,
      priority: values.priority,
      ...(values.dueDate ? { dueDate: values.dueDate } : {}),
    });
    setCreatingStage(null);
    navigate(`/projects/${created.id}`);
  };

  const all = useMemo(
    () => (snap?.projects ?? []).filter((p) => showArchived || !p.archived),
    [snap, showArchived]
  );
  const indexOf = (project: WsProject) => all.findIndex((p) => p.id === project.id);
  const noOf = (project: WsProject) => projectNo(project.id, indexOf(project));
  const stageOf = (project: WsProject) => projectStage(project.id, indexOf(project));
  const stageName = (project: WsProject) => stageLabel(stageOf(project), zh);
  const advance = (project: WsProject) => advanceStage(project.id, stageOf(project));

  const list = useMemo(() => {
    let out = all.filter((p) =>
      `${p.name} ${p.description} ${noOf(p)}`.toLowerCase().includes(query.toLowerCase())
    );
    if (highOnly) out = out.filter((p) => p.priority === "high" || p.priority === "urgent");
    if (mineOnly) out = out.filter((p) => p.memberIds.includes(CURRENT_USER_ID));
    const sorted = [...out];
    const time = (value: string) => resolveDate(value)?.getTime() ?? 0;
    if (sortBy === "Name (A–Z)") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "Due date") sorted.sort((a, b) => time(a.dueDate) - time(b.dueDate));
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
    return (snap?.teams ?? [])
      .map((team) => ({ label: team.name, items: list.filter((p) => p.teamId === team.id) }))
      .filter((g) => g.items.length);
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

  const membersOf = (project: WsProject) =>
    project.memberIds.map((id) => ({ name: user(id)?.name ?? id, avatar: user(id)?.avatar }));

  const dueText = (project: WsProject) => {
    if (project.progress === 100 || project.status === "completed") return t("Completed");
    const days = relativeDays(project.dueDate);
    if (days !== null && days > 0 && days <= 14)
      return zh ? `${days} 天后` : `${days}d left`;
    return formatDate(project.dueDate, "ch", "full");
  };


  if (isLoading || !snap) return <div className="p-10 text-sm text-muted-foreground">…</div>;

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
        <DropdownMenuCheckboxItem checked={false} disabled>
          {t("Completed")}
        </DropdownMenuCheckboxItem>
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
            <PmsHeader columns={columns} columnsMenu={columnsMenu} />
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
                {group.items.map((project) => (
                  <PmsRow
                    key={project.id}
                    icon={<CircleDot className="size-4 text-blue-500" />}
                    title={project.name}
                    description={`${noOf(project)} · ${project.description}`}
                    href={`/projects/${project.id}`}
                    actions={
                      <ProjectRowActions
                        project={project}
                        currentStage={stageOf(project)}
                        zh={zh}
                      />
                    }
                    cells={
                      <Fragment>
                        {visible("Stage") ? (
                          <PmsCell w="w-28">
                            <span className="inline-flex h-5 items-center rounded-4xl bg-blue-500/10 px-2 text-[11px] font-medium text-blue-500">
                              {stageName(project)}
                            </span>
                          </PmsCell>
                        ) : null}
                        {visible("Lead") ? (
                          <PmsCell w="w-36">
                            <div className="flex items-center gap-2">
                              <PmsAvatar
                                name={user(project.leadId)?.name}
                                avatar={user(project.leadId)?.avatar}
                              />
                              <span className="truncate text-sm">
                                {firstName(project.leadId)}
                              </span>
                            </div>
                          </PmsCell>
                        ) : null}
                        {visible("Members") ? (
                          <PmsCell w="w-28">
                            <PmsAvatarGroup people={membersOf(project)} />
                          </PmsCell>
                        ) : null}
                        {visible("Progress") ? (
                          <PmsCell w="w-32">
                            <PmsProgress value={project.progress} status={project.status} />
                          </PmsCell>
                        ) : null}
                        {visible("Priority") ? (
                          <PmsCell w="w-28">
                            <PmsPriority
                              value={project.priority}
                              label={t(
                                project.priority.charAt(0).toUpperCase() +
                                  project.priority.slice(1)
                              )}
                            />
                          </PmsCell>
                        ) : null}
                        {visible("Due date") ? (
                          <PmsCell w="w-32">
                            <PmsDate text={dueText(project)} />
                          </PmsCell>
                        ) : null}
                      </Fragment>
                    }
                  />
                ))}
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
                  {items.map((project) => (
                    <div
                      key={project.id}
                      className="group/task relative flex w-full cursor-grab flex-col gap-3 rounded-xl bg-card p-3 shadow-sm active:cursor-grabbing"
                    >
                      <Link to={`/projects/${project.id}`} className="flex flex-col gap-2 pr-6">
                        <span className="text-[10px] font-medium text-blue-500">
                          {noOf(project)}
                        </span>
                        <p className="cursor-pointer text-sm wrap-break-word text-card-foreground hover:text-card-foreground/80">
                          {project.name}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(project.dueDate, "en", "full")} · 3:09 PM
                        </span>
                      </Link>
                      {stageOf(project) !== "after_sales" ? (
                        <button
                          type="button"
                          title={zh ? "流转到下一阶段" : "Move to next stage"}
                          onClick={() => advance(project)}
                          className="absolute right-2 top-2 hidden size-6 items-center justify-center rounded-md bg-blue-500 text-white group-hover/task:flex"
                        >
                          <ArrowRight className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCreatingStage(stage.key)}
                    className="flex h-8 w-full cursor-pointer items-center gap-2 px-2 text-xs text-muted-foreground hover:bg-muted"
                  >
                    + {t("Add Task")}
                  </button>
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
    </PmsPage>
  );
}
