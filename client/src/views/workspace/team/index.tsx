import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ListFilter, MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router";
import {
  CURRENT_USER_ID,
  useWorkspace,
} from "src/api/workspace/use-workspace";
import {
  addTeam,
  removeRecord,
  updateRecord,
} from "src/api/workspace/project-stages";
import type { WsTeam } from "src/types/apps/workspace";
import {
  PmsAvatar,
  PmsCard,
  PmsCreateForm,
  PmsField,
  PmsIconButton,
  PmsNewButton,
  PmsOptionGroup,
  PmsPage,
  PmsPopover,
  PmsSheet,
} from "../pms";

const CARD_STYLE: Record<string, string> = {
  Design: "bg-sky-400/10 text-sky-500",
  Engineering: "bg-teal-400/10 text-teal-500",
  Product: "bg-blue-500/10 text-blue-500",
};
const SORTS = ["Name", "People", "Live projects", "Founded"];

export default function TeamPage() {
  const { t } = useTranslation();
  const { snap, user, isLoading } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const teamId = params.get("team");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Name");
  const [mineOnly, setMineOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "" });
  const all = useMemo(() => snap?.teams ?? [], [snap]);
  const mineCount = all.filter((team) => team.memberIds.includes(CURRENT_USER_ID)).length;

  const liveOf = (team: WsTeam) =>
    (snap?.projects ?? []).filter(
      (project) => project.teamId === team.id && !project.archived && project.status === "active"
    ).length;

  const list = useMemo(() => {
    let out = all.filter((team) =>
      `${team.name} ${team.description}`.toLowerCase().includes(query.toLowerCase())
    );
    if (mineOnly) out = out.filter((team) => team.memberIds.includes(CURRENT_USER_ID));
    const sorted = [...out];
    if (sortBy === "People")
      sorted.sort((a, b) => b.memberIds.length - a.memberIds.length);
    else if (sortBy === "Live projects") sorted.sort((a, b) => liveOf(b) - liveOf(a));
    else if (sortBy === "Founded")
      sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [all, query, mineOnly, sortBy]);

  const selected = all.find((team) => team.id === teamId) ?? null;

  const create = () => {
    const name = draft.name.trim();
    if (!name) return;
    addTeam({ name, description: draft.description.trim() });
    setDraft({ name: "", description: "" });
    setCreating(false);
  };

  if (isLoading || !snap) return <div className="p-10 text-sm text-muted-foreground">…</div>;

  if (selected) {
    const members = selected.memberIds.map((id) => user(id)).filter(Boolean);
    const projects = snap.projects.filter(
      (project) => project.teamId === selected.id && !project.archived
    );
    return (
      <PmsPage
        title={selected.name}
        count={t("N people", { n: members.length })}
        segmented={
          <button
            type="button"
            onClick={() => setParams({})}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs hover:bg-muted"
          >
            <ArrowLeft className="size-3.5" />
            {t("All teams")}
          </button>
        }
      >
        <PmsCard>
          <div className="space-y-4 p-4">
            <p className="text-sm text-muted-foreground">{selected.description}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <PmsField label={t("Owner")}>{user(selected.leadId)?.name ?? "—"}</PmsField>
              <PmsField label={t("Founded")}>{selected.createdAt}</PmsField>
              <PmsField label={t("Live projects")}>{liveOf(selected)}</PmsField>
              <PmsField label={t("Members")}>{members.length}</PmsField>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold">{t("Members")}</h2>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member!.id} className="flex items-center gap-2 text-xs">
                    <PmsAvatar name={member!.name} avatar={member!.avatar} size={8} />
                    {member!.name}
                    <span className="text-muted-foreground">{member!.email}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold">{t("Projects")}</h2>
              <div className="space-y-1">
                {projects.map((project) => (
                  <div key={project.id} className="text-xs">
                    {project.name}
                    <span className="ms-2 text-muted-foreground">{project.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const isMember = selected.memberIds.includes(CURRENT_USER_ID);
                  updateRecord("teams", selected.id, {
                    memberIds: isMember
                      ? selected.memberIds.filter((item) => item !== CURRENT_USER_ID)
                      : [...selected.memberIds, CURRENT_USER_ID],
                  });
                }}
                className="h-8 rounded-lg border px-2.5 text-xs hover:bg-muted"
              >
                {selected.memberIds.includes(CURRENT_USER_ID) ? t("Joined") : t("Join team")}
              </button>
              <button
                type="button"
                onClick={() => {
                  removeRecord("teams", selected.id);
                  setParams({});
                }}
                className="h-8 rounded-lg border px-2.5 text-xs text-destructive hover:bg-muted"
              >
                {t("Delete team")}
              </button>
            </div>
          </div>
        </PmsCard>
      </PmsPage>
    );
  }

  return (
    <PmsPage
      title={t("Teams")}
      count={t("N teams", { n: all.length, mine: mineCount })}
    >
      <PmsCard
        toolbar={
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1">
                <PmsPopover icon={ListFilter} label="Filters">
                  <label className="flex cursor-pointer items-center justify-between text-xs">
                    {t("Only my teams")}
                    <input
                      type="checkbox"
                      checked={mineOnly}
                      onChange={(e) => setMineOnly(e.target.checked)}
                    />
                  </label>
                </PmsPopover>
                <PmsIconButton
                  icon={Search}
                  label="Search"
                  active={searchOpen}
                  onClick={() => setSearchOpen((v) => !v)}
                />
                <PmsPopover icon={SlidersHorizontal} label="View options">
                  <PmsOptionGroup title="SORT BY" options={SORTS} value={sortBy} onPick={setSortBy} />
                </PmsPopover>
              </div>
              {searchOpen ? (
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Search teams...")}
                  className="h-8 w-44 rounded-lg border border-border bg-background px-2 text-xs outline-none"
                />
              ) : null}
            </div>
            <PmsNewButton label={t("New team")} onClick={() => setCreating(true)} />
          </>
        }
      >
        <div className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(7rem,9rem))] content-start gap-3 overflow-y-auto p-4">
          {list.map((team) => (
            <div
              key={team.id}
              role="link"
              tabIndex={0}
              onClick={() => setParams({ team: team.id })}
              className="group relative cursor-pointer rounded-xl border bg-card p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div
                className={`flex aspect-square w-full items-center justify-center rounded-lg text-4xl font-bold ${
                  CARD_STYLE[team.name] ?? "bg-blue-500/10 text-blue-500"
                }`}
              >
                {team.name[0]}
              </div>
              <div className="absolute top-2 right-2 rounded-lg bg-background opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  aria-label={`Actions for ${team.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setParams({ team: team.id });
                  }}
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-[min(var(--radius-md),12px)] hover:bg-muted"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
              <div className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{team.name}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("N people", { n: team.memberIds.length })} ·{" "}
                  {t("N live", { n: liveOf(team) })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </PmsCard>

      <PmsSheet open={creating} onOpenChange={setCreating} title={t("New team")}>
        <PmsCreateForm
          submitLabel={t("Create")}
          onSubmit={create}
          fields={[
            {
              name: t("Name"),
              value: draft.name,
              onChange: (value) => setDraft((prev) => ({ ...prev, name: value })),
              placeholder: t("Team name"),
            },
            {
              name: t("Description"),
              value: draft.description,
              onChange: (value) => setDraft((prev) => ({ ...prev, description: value })),
              placeholder: t("What does this team do?"),
              multiline: true,
            },
          ]}
        />
      </PmsSheet>
    </PmsPage>
  );
}
