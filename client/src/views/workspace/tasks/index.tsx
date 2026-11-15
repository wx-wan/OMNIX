import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  CircleCheck,
  Clock,
  Columns3,
  List,
  ListFilter,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CURRENT_USER_ID,
  dueLabel,
  resolveDate,
  useWorkspace,
} from "src/api/workspace/use-workspace";
import { addTask, getActiveProject } from "src/api/workspace/project-stages";
import type { WsTask } from "src/types/apps/workspace";
import {
  PmsAvatar,
  PmsCard,
  PmsCreateForm,
  PmsField,
  PmsIconButton,
  PmsLabelChip,
  PmsNewButton,
  PmsOptionGroup,
  PmsPage,
  PmsPopover,
  PmsSegmented,
  PmsSheet,
  PmsPriority,
} from "../pms";

const GROUPS: { label: string; values: string[] }[] = [
  { label: "Backlog", values: ["backlog"] },
  { label: "Todo", values: ["todo"] },
  { label: "In Progress", values: ["in_progress"] },
  { label: "Review", values: ["review"] },
  { label: "Done", values: ["done", "closed"] },
];
const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
  closed: "Done",
};
const HEADERS = [
  "",
  "Task",
  "Project",
  "Labels",
  "Priority",
  "Estimate",
  "Due",
  "Status",
  "Assignee",
];

export default function TasksPage() {
  const { t } = useTranslation();
  const { snap, lang, user, userName, projectName, label, isLoading } = useWorkspace();
  const [view, setView] = useState("List");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [groupBy, setGroupBy] = useState("Status");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [selected, setSelected] = useState<WsTask | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const all = useMemo(() => snap?.tasks ?? [], [snap]);

  const list = useMemo(() => {
    let out = all.filter((task) =>
      `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase())
    );
    if (hideCompleted)
      out = out.filter((task) => task.status !== "done" && task.status !== "closed");
    if (mineOnly) out = out.filter((task) => task.assigneeId === CURRENT_USER_ID);
    return [...out].sort(
      (a, b) =>
        (resolveDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (resolveDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER)
    );
  }, [all, query, hideCompleted, mineOnly]);

  const groups = useMemo(() => {
    if (groupBy === "None") return [{ label: "All", items: list }];
    return GROUPS.map((group) => ({
      label: group.label,
      items: list.filter((task) => group.values.includes(task.status)),
    })).filter((group) => group.items.length);
  }, [groupBy, list]);

  const labelsOf = (task: WsTask) =>
    task.labelIds.slice(0, 2).map((id) => ({
      name: label(id)?.name ?? id,
      color: label(id)?.color,
    }));

  const create = () => {
    const title = draft.title.trim();
    if (!title) return;
    addTask(getActiveProject(), {
      title,
      description: draft.description.trim(),
      status: "todo",
      priority: "medium",
      assigneeId: CURRENT_USER_ID,
      estimate: 4,
    });
    setDraft({ title: "", description: "" });
    setCreating(false);
  };

  if (isLoading || !snap) return <div className="p-10 text-sm text-muted-foreground">…</div>;

  return (
    <PmsPage
      title={t("Tasks")}
      count={t("N tasks", { n: all.length })}
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
                  <p className="text-xs text-muted-foreground">{t("Filters")}</p>
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
                {HEADERS.map((head, index) => (
                  <th
                    key={index}
                    className={`h-10 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground ${index === 0 ? "w-10" : ""}`}
                  >
                    {head ? t(head) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.label}>
                  <tr className="border-b bg-muted/30 hover:bg-muted/30">
                    <td colSpan={9} className="p-0">
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
                              <h6 className="max-w-72 truncate text-sm font-medium">
                                {task.title}
                              </h6>
                            </button>
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <span className="text-sm whitespace-nowrap">
                              {projectName(task.projectId)}
                            </span>
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {labelsOf(task).map((item) => (
                                <PmsLabelChip key={item.name} {...item} />
                              ))}
                            </div>
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <button
                              type="button"
                              aria-label={`Priority: ${task.priority}`}
                              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-muted"
                            >
                              <PmsPriority
                                value={task.priority}
                                label={t(
                                  task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
                                )}
                              />
                            </button>
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Clock className="size-3.5" />
                              {task.estimate ? `${task.estimate}h` : "—"}
                            </span>
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <span className="text-sm whitespace-nowrap text-muted-foreground">
                              {dueLabel(task.dueDate, lang)}
                            </span>
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <button
                              type="button"
                              aria-haspopup="menu"
                              aria-expanded={false}
                              className="inline-flex h-8 w-30 cursor-pointer items-center justify-between rounded-md border bg-background px-2 text-sm"
                            >
                              {t(STATUS_LABEL[task.status])}
                              <ChevronDown className="size-3.5 text-muted-foreground" />
                            </button>
                          </td>
                          <td className="p-2 px-3 py-3 align-middle whitespace-nowrap">
                            <button
                              type="button"
                              aria-label={`Assignee: ${task.assigneeId ? userName(task.assigneeId) : "Unassigned"}`}
                              className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-muted"
                            >
                              {task.assigneeId ? (
                                <>
                                  <PmsAvatar
                                    name={userName(task.assigneeId)}
                                    avatar={user(task.assigneeId)?.avatar}
                                  />
                                  {userName(task.assigneeId)}
                                </>
                              ) : (
                                <span className="text-muted-foreground">{t("Unassigned")}</span>
                              )}
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
                    <div className="font-medium">{task.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {projectName(task.projectId)} · {dueLabel(task.dueDate, lang)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {labelsOf(task).map((item) => (
                        <PmsLabelChip key={item.name} {...item} />
                      ))}
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
              <PmsField label={t("Labels")}>
                <div className="flex flex-wrap gap-1">
                  {labelsOf(selected).map((item) => (
                    <PmsLabelChip key={item.name} {...item} />
                  ))}
                </div>
              </PmsField>
            </div>
          </>
        ) : null}
      </PmsSheet>

      <PmsSheet open={creating} onOpenChange={setCreating} title={t("New Task")}>
        <PmsCreateForm
          submitLabel={t("Create")}
          onSubmit={create}
          fields={[
            {
              name: t("Title"),
              value: draft.title,
              onChange: (value) => setDraft((prev) => ({ ...prev, title: value })),
              placeholder: t("Task title"),
            },
            {
              name: t("Description"),
              value: draft.description,
              onChange: (value) => setDraft((prev) => ({ ...prev, description: value })),
              placeholder: t("Describe the task"),
              multiline: true,
            },
          ]}
        />
      </PmsSheet>
    </PmsPage>
  );
}
