import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ListFilter, Search, SlidersHorizontal } from "lucide-react";
import {
  formatDate,
  formatRange,
  resolveDate,
  useWorkspace,
} from "src/api/workspace/use-workspace";
import { addSprint, getActiveProject } from "src/api/workspace/project-stages";
import { taskNo } from "src/api/workspace/task-no";
import { useTasks } from "src/api/tasks/use-tasks";
import { NewStageDialog, type NewStageValues } from "../create-dialogs";
import type { WsSprint } from "src/types/apps/workspace";
import {
  PmsCard,
  PmsCell,
  PmsField,
  PmsGroup,
  PmsHeader,
  PmsIconButton,
  PmsNewButton,
  PmsOptionGroup,
  PmsPage,
  PmsPopover,
  PmsProgress,
  PmsRow,
  PmsSheet,
  PmsDate,
  type PmsColumn,
} from "../pms";

const COLUMNS: PmsColumn[] = [
  { label: "Sprint", w: "w-56" },
  { label: "Project", w: "w-40" },
  { label: "Progress", w: "w-40" },
  { label: "Dates", w: "w-40" },
  { label: "Tasks", w: "w-20" },
  { label: "Timing", w: "w-56" },
];
const GROUPS: { label: string; values: string[] }[] = [
  { label: "Active", values: ["active"] },
  { label: "Upcoming", values: ["planning"] },
  { label: "Completed", values: ["completed"] },
];

export default function SprintsPage() {
  const { t } = useTranslation();
  const { snap, projectName, isLoading } = useWorkspace();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [groupBy, setGroupBy] = useState("Status");
  const [sortBy, setSortBy] = useState("Start date");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [selected, setSelected] = useState<WsSprint | null>(null);
  const [creating, setCreating] = useState(false);
  const all = useMemo(() => snap?.sprints ?? [], [snap]);
  const { tasks: allTasks } = useTasks();
  /** Sprint 的任务按 task.sprintId 归属，进度与任务编号同源。 */
  const tasksOf = (sprint: WsSprint) => allTasks.filter((task) => task.sprintId === sprint.id);
  const isDone = (status: string) =>
    status === "done" || status === "closed" || status === "completed";

  const progressOf = (sprint: WsSprint) => {
    if (sprint.status === "completed") return 100;
    const tasks = tasksOf(sprint);
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((task) => isDone(task.status)).length / tasks.length) * 100);
  };

  const timingOf = (sprint: WsSprint) => {
    const start = resolveDate(sprint.startDate);
    const end = resolveDate(sprint.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!start || !end) return "—";
    const day = Math.round((today.getTime() - start.getTime()) / 86400000) + 1;
    const left = Math.round((end.getTime() - today.getTime()) / 86400000);
    if (sprint.status === "completed")
      return t("Finished {{date}} · 15 days long", {
        date: formatDate(sprint.endDate, "ch"),
      });
    if (sprint.status === "planning")
      return t("Starts in {{d}} days · 15 days long", { d: -day + 1 });
    return t("Day {{d}} of 15 · {{left}} days left", { d: day, left });
  };

  const groups = useMemo(() => {
    const filtered = all.filter((sprint) =>
      `${sprint.name} ${sprint.goal}`.toLowerCase().includes(query.toLowerCase())
    );
    const sorted = (items: WsSprint[]) =>
      [...items].sort((a, b) => {
        if (sortBy === "Name (A–Z)") return a.name.localeCompare(b.name);
        if (sortBy === "Progress") return progressOf(b) - progressOf(a);
        return (
          (resolveDate(b.startDate)?.getTime() ?? 0) -
          (resolveDate(a.startDate)?.getTime() ?? 0)
        );
      });
    if (groupBy === "None") return [{ label: "All", items: sorted(filtered) }];
    return GROUPS.map((group) => ({
      label: group.label,
      items: sorted(filtered.filter((s) => group.values.includes(s.status))),
    })).filter((group) => group.items.length);
  }, [all, query, groupBy, sortBy]);

  const create = (values: NewStageValues) => {
    addSprint(values.projectId || getActiveProject(), {
      name: values.name,
      goal: values.goal,
      status: "planning",
      startDate: values.startDate,
      endDate: values.endDate,
    });
    setCreating(false);
  };

  if (isLoading || !snap) return <div className="p-10 text-sm text-muted-foreground">…</div>;

  return (
    <PmsPage title={t("Sprints")} count={t("N sprints", { n: all.length })}>
      <PmsCard
        toolbar={
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1">
                <PmsPopover icon={ListFilter} label="Filters">
                  <p className="text-xs text-muted-foreground">{t("Filters")}</p>
                </PmsPopover>
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
                      options={["Status", "None"]}
                      value={groupBy}
                      onPick={setGroupBy}
                    />
                    <PmsOptionGroup
                      title="SORT BY"
                      options={["Start date", "Name (A–Z)", "Progress"]}
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
                  placeholder={t("Search sprints...")}
                  className="h-8 w-44 rounded-lg border border-border bg-background px-2 text-xs outline-none"
                />
              ) : null}
            </div>
            <PmsNewButton label={t("New sprint")} onClick={() => setCreating(true)} />
          </>
        }
      >
        <PmsHeader columns={COLUMNS} showColumnsButton />
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
            {group.items.map((sprint) => (
              <PmsRow
                key={sprint.id}
                title={sprint.name}
                description={sprint.goal}
                onClick={() => setSelected(sprint)}
                cells={
                  <Fragment>
                    <PmsCell w="w-40">
                      <span className="block truncate text-sm">
                        {projectName(sprint.projectId)}
                      </span>
                    </PmsCell>
                    <PmsCell w="w-40">
                      <PmsProgress value={progressOf(sprint)} />
                    </PmsCell>
                    <PmsCell w="w-40">
                      <span className="text-sm whitespace-nowrap text-muted-foreground">
                        {formatRange(sprint.startDate, sprint.endDate, "ch")}
                      </span>
                    </PmsCell>
                    <PmsCell w="w-20">
                      <span className="text-sm text-muted-foreground">
                        {tasksOf(sprint).length}
                      </span>
                    </PmsCell>
                    <PmsCell w="w-56">
                      <PmsDate text={timingOf(sprint)} />
                    </PmsCell>
                  </Fragment>
                }
              />
            ))}
          </PmsGroup>
        ))}
      </PmsCard>

      <PmsSheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.name ?? ""}
        description={selected?.goal}
      >
        {selected ? (
          <>
            <PmsField label={t("Project")}>{projectName(selected.projectId)}</PmsField>
            <PmsField label={t("Dates")}>
              {formatRange(selected.startDate, selected.endDate, "ch")}
            </PmsField>
            <PmsField label={t("Progress")}>
              <PmsProgress value={progressOf(selected)} />
            </PmsField>
            <PmsField label={t("Timing")}>{timingOf(selected)}</PmsField>
            <div className="space-y-2 border-t border-border pt-4">
              <h3 className="text-xs font-semibold">
                {t("Tasks")} ({tasksOf(selected).length})
              </h3>
              {tasksOf(selected).map((task) => (
                <div key={task.id} className="flex items-baseline gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-blue-500">
                    {taskNo(task, allTasks)}
                  </span>
                  <span className="truncate">{task.title}</span>
                  <span className="ms-auto shrink-0">{t(task.status)}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </PmsSheet>

      <NewStageDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={create}
        projects={snap.projects}
      />
    </PmsPage>
  );
}
