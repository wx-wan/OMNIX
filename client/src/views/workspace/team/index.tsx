"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { MoreHorizontal, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useWorkspace } from "src/api/workspace/use-workspace";
import { useUsers } from "src/api/auth/use-users";
import { PmsCard, PmsIconButton, PmsPage } from "../pms";
import { PeopleField } from "../people-field";
import Loading from "@/components/shadcn-dashboard/spinner/loading";
import type { WsUser } from "src/types/apps/workspace";

type TeamGroup = { id: string; name: string; memberIds: string[]; projectIds: string[] };

/**
 * 团队页：当前后端尚无独立 team 表，团队由项目的 teamId 分组推导；
 * 成员关系来自项目 memberIds。teamId 为空的项目归入「未分组」。
 */
export default function TeamPage() {
  const { t } = useTranslation();
  const { snap, isLoading: wsLoading, userName } = useWorkspace();
  const { users: members } = useUsers();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const projects = snap?.projects ?? [];
  const teams = useMemo<TeamGroup[]>(() => {
    const map = new Map<string, TeamGroup>();
    projects.forEach((project) => {
      const key = project.teamId || "ungrouped";
      const group =
        map.get(key) ??
        {
          id: key,
          name: key === "ungrouped" ? t("Unassigned") : key,
          memberIds: [] as string[],
          projectIds: [] as string[],
        };
      group.memberIds = Array.from(new Set([...group.memberIds, ...project.memberIds]));
      group.projectIds.push(project.id);
      map.set(key, group);
    });
    return Array.from(map.values());
  }, [projects, t]);

  const filtered = teams.filter((team) =>
    `${team.name} ${team.memberIds.map((id) => userName(id)).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  if (wsLoading) return <Loading />;

  const allUsers: WsUser[] = (members ?? []).map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    avatar: member.avatarUrl,
    role: member.role,
    status: "active",
    createdAt: member.createdAt,
  }));

  return (
    <PmsPage
      title={t("Teams")}
      count={t("{{n}} teams", { n: teams.length })}
    >
      <PmsCard
        toolbar={
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <PmsIconButton icon={SlidersHorizontal} label={t("Filters")} />
              <PmsIconButton
                icon={Search}
                label="Search"
                active={searchOpen}
                onClick={() => setSearchOpen((v) => !v)}
              />
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
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-foreground px-2.5 text-sm font-medium text-background"
            >
              <Plus className="size-4" />
              {t("New team")}
            </button>
          </>
        }
      >
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((team) => (
            <div
              key={team.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                    {team.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("{{n}} people · {{m}} projects", {
                        n: team.memberIds.length,
                        m: team.projectIds.length,
                      })}
                    </p>
                  </div>
                </div>
                <button type="button" aria-label={t("Actions")} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <PeopleField users={allUsers} value={team.memberIds} multiple max={4} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {team.projectIds.slice(0, 3).map((projectId) => (
                  <Link
                    key={projectId}
                    to={`/projects/${projectId}`}
                    className="rounded-4xl bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {snap?.projects.find((p) => p.id === projectId)?.name ?? projectId}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              {t("No items")}
            </p>
          ) : null}
        </div>
      </PmsCard>
    </PmsPage>
  );
}
