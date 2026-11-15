import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleDotDashed,
  Columns3,
  List,
  ListFilter,
  Search,
  SlidersHorizontal,
  UserRound,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import {
  CURRENT_USER_ID,
  agoLabel,
  resolveDate,
  useWorkspace,
} from "src/api/workspace/use-workspace";
import { addIssue, getActiveProject } from "src/api/workspace/project-stages";
import type { WsIssue } from "src/types/apps/workspace";
import {
  PmsAvatar,
  PmsCard,
  PmsCell,
  PmsCreateForm,
  PmsField,
  PmsGroup,
  PmsHeader,
  PmsIconButton,
  PmsLabelChip,
  PmsNewButton,
  PmsOptionGroup,
  PmsPage,
  PmsPopover,
  PmsPriority,
  PmsSegmented,
  PmsSheet,
  PmsRow,
  type PmsColumn,
} from "../pms";

const COLUMNS: PmsColumn[] = [
  { label: "Issue", w: "w-56" },
  { label: "Project", w: "w-36" },
  { label: "Labels", w: "w-52" },
  { label: "Status", w: "w-36" },
  { label: "Priority", w: "w-28" },
  { label: "Assignee", w: "w-40" },
  { label: "Created by", w: "w-40" },
  { label: "Updated", w: "w-28" },
];
const STATUS_GROUPS: { label: string; values: string[] }[] = [
  { label: "Backlog", values: ["backlog"] },
  { label: "Todo", values: ["todo"] },
  { label: "In Progress", values: ["in_progress"] },
  { label: "Review", values: ["review"] },
  { label: "Done", values: ["done"] },
  { label: "Closed", values: ["closed"] },
];
const STATUS_ICON: Record<string, { icon: typeof Circle; color: string }> = {
  backlog: { icon: CircleDashed, color: "text-amber-500" },
  todo: { icon: Circle, color: "text-sky-500" },
  in_progress: { icon: CircleDot, color: "text-blue-500" },
  review: { icon: CircleDotDashed, color: "text-orange-500" },
  done: { icon: CircleCheck, color: "text-teal-500" },
  closed: { icon: CircleCheck, color: "text-teal-500" },
};
const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
  closed: "Closed",
};

export default function IssuesPage() {
  const { t } = useTranslation();
  const { snap, lang, user, userName, projectName, label, comment, isLoading } =
    useWorkspace();
  const [view, setView] = useState("List");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [groupBy, setGroupBy] = useState("Status");
  const [sortBy, setSortBy] = useState("Recently updated");
  const [mineOnly, setMineOnly] = useState(false);
  const [createdByMe, setCreatedByMe] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [hideDone, setHideDone] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [selected, setSelected] = useState<WsIssue | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const all = useMemo(() => snap?.issues ?? [], [snap]);

  const list = useMemo(() => {
    let out = all.filter((issue) =>
      `${issue.title} #${issue.number} ${issue.description}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
    if (mineOnly) out = out.filter((issue) => issue.assigneeId === CURRENT_USER_ID);
    if (createdByMe) out = out.filter((issue) => issue.reporterId === CURRENT_USER_ID);
    if (unassignedOnly) out = out.filter((issue) => !issue.assigneeId);
    if (hideDone) out = out.filter((issue) => issue.status !== "done" && issue.status !== "closed");
    const sorted = [...out];
    if (sortBy === "Name (A–Z)") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "Number") sorted.sort((a, b) => a.number - b.number);
    else if (sortBy === "Priority") {
      const rank: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      sorted.sort((a, b) => (rank[b.priority] ?? 0) - (rank[a.priority] ?? 0));
    } else
      sorted.sort(
        (a, b) =>
          (resolveDate(b.updatedAt)?.getTime() ?? 0) -
          (resolveDate(a.updatedAt)?.getTime() ?? 0)
      );
    return sorted;
  }, [all, query, mineOnly, createdByMe, unassignedOnly, hideDone, sortBy]);

  const groups = useMemo(() => {
    if (groupBy === "None") return [{ label: "All", items: list }];
    return STATUS_GROUPS.map((group) => ({
      label: group.label,
      items: list.filter((issue) => group.values.includes(issue.status)),
    })).filter((group) => group.items.length);
  }, [groupBy, list]);

  const labelsOf = (issue: WsIssue) =>
    issue.labelIds.slice(0, 2).map((id) => ({
      name: label(id)?.name ?? id,
      color: label(id)?.color,
    }));

  const create = () => {
    const title = draft.title.trim();
    if (!title) return;
    addIssue(getActiveProject(), {
      title,
      description: draft.description.trim(),
      status: "backlog",
      priority: "medium",
      assigneeId: CURRENT_USER_ID,
      number: Math.max(500, ...all.map((item) => item.number)) + 1,
    });
    setDraft({ title: "", description: "" });
    setCreating(false);
  };

  if (isLoading || !snap) return <div className="p-10 text-sm text-muted-foreground">…</div>;

  const statusIcon = (status: string) => {
    const spec = STATUS_ICON[status] ?? STATUS_ICON.backlog;
    const Icon = spec.icon;
    return <Icon className={`size-4 ${spec.color}`} />;
  };

  return (
    <PmsPage
      title={t("Issues")}
      count={t("N issues", { n: all.length })}
      segmented={
        <PmsSegmented
          options={["List", "Board"]}
          value={view}
          onChange={setView}
          icons={{ List, Board: Columns3 }}
        />
      }
    >
      <PmsCard
        toolbar={
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1">
                <PmsPopover icon={ListFilter} label="Filters">
                  <p className="text-xs text-muted-foreground">{t("High priority")}</p>
                </PmsPopover>
                <PmsIconButton
                  icon={UserRound}
                  label={t("Assigned to me")}
                  active={mineOnly}
                  onClick={() => setMineOnly((v) => !v)}
                />
                <PmsIconButton
                  icon={UserRoundCheck}
                  label={t("Created by me")}
                  active={createdByMe}
                  onClick={() => setCreatedByMe((v) => !v)}
                />
                <PmsIconButton
                  icon={UserRoundX}
                  label={t("Unassigned")}
                  active={unassignedOnly}
                  onClick={() => setUnassignedOnly((v) => !v)}
                />
                <PmsIconButton
                  icon={CircleCheck}
                  label={t("Hide done")}
                  active={hideDone}
                  onClick={() => setHideDone((v) => !v)}
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
                      options={["Status", "None"]}
                      value={groupBy}
                      onPick={setGroupBy}
                    />
                    <PmsOptionGroup
                      title="SORT BY"
                      options={["Recently updated", "Name (A–Z)", "Priority", "Number"]}
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
                  placeholder={t("Search issues...")}
                  className="h-8 w-44 rounded-lg border border-border bg-background px-2 text-xs outline-none"
                />
              ) : null}
            </div>
            <PmsNewButton label={t("New Issue")} onClick={() => setCreating(true)} />
          </>
        }
      >
        {view === "List" ? (
          <>
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
                onAdd={() => setCreating(true)}
                addLabel={t("Add Issue")}
              >
                {group.items.map((issue) => (
                  <PmsRow
                    key={issue.id}
                    icon={<span title={group.label}>{statusIcon(issue.status)}</span>}
                    title={issue.title}
                    suffix={
                      <span className="shrink-0 text-xs text-muted-foreground">
                        #{issue.number}
                      </span>
                    }
                    onClick={() => setSelected(issue)}
                    cells={
                      <Fragment>
                        <PmsCell w="w-36">
                          <span className="block truncate text-sm">
                            {projectName(issue.projectId)}
                          </span>
                        </PmsCell>
                        <PmsCell w="w-52">
                          <div className="flex items-center gap-1 overflow-hidden">
                            {labelsOf(issue).map((item) => (
                              <PmsLabelChip key={item.name} {...item} />
                            ))}
                          </div>
                        </PmsCell>
                        <PmsCell w="w-36">
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={false}
                            className="flex h-8 w-full cursor-pointer items-center justify-between gap-1.5 rounded-md border bg-background px-2 text-sm outline-none hover:bg-muted"
                          >
                            {t(STATUS_LABEL[issue.status])}
                            <ChevronDown className="size-3.5 text-muted-foreground" />
                          </button>
                        </PmsCell>
                        <PmsCell w="w-28">
                          <PmsPriority
                            value={issue.priority}
                            label={t(
                              issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)
                            )}
                          />
                        </PmsCell>
                        <PmsCell w="w-40">
                          <div className="flex items-center gap-2">
                            {issue.assigneeId ? (
                              <>
                                <PmsAvatar
                                  name={userName(issue.assigneeId)}
                                  avatar={user(issue.assigneeId)?.avatar}
                                />
                                <span className="truncate text-sm">
                                  {userName(issue.assigneeId)}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {t("Unassigned")}
                              </span>
                            )}
                          </div>
                        </PmsCell>
                        <PmsCell w="w-40">
                          <span className="block truncate text-sm">
                            {userName(issue.reporterId)}
                          </span>
                        </PmsCell>
                        <PmsCell w="w-28">
                          <span className="text-sm text-muted-foreground">
                            {agoLabel(issue.updatedAt, lang)}
                          </span>
                        </PmsCell>
                      </Fragment>
                    }
                  />
                ))}
              </PmsGroup>
            ))}
          </>
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
                {group.items.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelected(issue)}
                    className="w-full cursor-pointer rounded-xl bg-card p-3 text-sm shadow-sm"
                  >
                    <div className="font-medium">{issue.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      #{issue.number} · {projectName(issue.projectId)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {labelsOf(issue).map((item) => (
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
        title={selected ? `#${selected.number} ${selected.title}` : ""}
      >
        {selected ? (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {selected.description || t("No description")}
            </p>
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-xs font-semibold">{t("Properties")}</h3>
              <PmsField label={t("Status")}>{t(STATUS_LABEL[selected.status])}</PmsField>
              <PmsField label={t("Priority")}>
                {t(selected.priority.charAt(0).toUpperCase() + selected.priority.slice(1))}
              </PmsField>
              <PmsField label={t("Assignee")}>
                {selected.assigneeId ? userName(selected.assigneeId) : t("Unassigned")}
              </PmsField>
              <PmsField label={t("Labels")}>
                <div className="flex flex-wrap gap-1">
                  {labelsOf(selected).map((item) => (
                    <PmsLabelChip key={item.name} {...item} />
                  ))}
                </div>
              </PmsField>
              <PmsField label={t("Project")}>{projectName(selected.projectId)}</PmsField>
              <PmsField label={t("Sprint")}>
                {snap.sprints.find((s) => s.id === selected.sprintId)?.name ?? "—"}
              </PmsField>
              <PmsField label={t("Milestones")}>{selected.milestone ?? "—"}</PmsField>
            </div>
            <div className="space-y-2 border-t border-border pt-4">
              <h3 className="text-xs font-semibold">{t("Activity")}</h3>
              {snap.activities
                .filter((activity) => activity.projectId === selected.projectId)
                .slice(0, 4)
                .map((activity) => (
                  <div key={activity.id} className="text-[11px] text-muted-foreground">
                    · {activity.message}
                  </div>
                ))}
              {selected.commentIds.map((id) => {
                const item = comment(id);
                return item ? (
                  <div key={id} className="text-[11px] text-muted-foreground">
                    · {item.text}
                  </div>
                ) : null;
              })}
            </div>
          </>
        ) : null}
      </PmsSheet>

      <PmsSheet open={creating} onOpenChange={setCreating} title={t("New Issue")}>
        <PmsCreateForm
          submitLabel={t("Create")}
          onSubmit={create}
          fields={[
            {
              name: t("Title"),
              value: draft.title,
              onChange: (value) => setDraft((prev) => ({ ...prev, title: value })),
              placeholder: t("Issue title"),
            },
            {
              name: t("Description"),
              value: draft.description,
              onChange: (value) => setDraft((prev) => ({ ...prev, description: value })),
              placeholder: t("Describe the issue"),
              multiline: true,
            },
          ]}
        />
      </PmsSheet>
    </PmsPage>
  );
}
