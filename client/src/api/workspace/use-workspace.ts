import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import { getFetcher } from "src/api/global-fetcher";
import {
  hydrateBackendProjects,
  mergeWorkspaceSnapshot,
  useProjectStageStore,
} from "./project-stages";
import type { ProjectRecord } from "../projects/use-projects";
import type { MemberUser } from "../auth/use-users";
import type {
  WorkspaceSnapshot,
  WsComment,
  WsLabel,
  WsProject,
  WsSprint,
  WsTeam,
  WsUser,
} from "src/types/apps/workspace";

const REL = "RELATIVE_DAYS_";

export { CURRENT_USER_ID } from "./constants";

/** PMS 线上数据用 RELATIVE_DAYS_PLUS30 / MINUS7 占位，渲染时按当天换算。 */
export function resolveDate(value?: string | null): Date | null {
  if (!value) return null;
  if (value.startsWith(REL)) {
    const rest = value.slice(REL.length);
    const sign = rest.startsWith("MINUS") ? -1 : 1;
    const days = Number(rest.replace(/\D/g, "")) || 0;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + sign * days);
    return date;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function relativeDays(value?: string | null): number | null {
  if (!value) return null;
  const date = resolveDate(value);
  if (!date) return null;
  return Math.round((date.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
}

export const isZh = (lang: string) => /^(ch|zh)/i.test(lang);

/** full: 2026年12月14日 / Dec 14, 2026；short: 12月14日 / Dec 14 */
export function formatDate(
  value?: string | null,
  lang = "en",
  style: "full" | "short" = "short"
): string {
  const date = resolveDate(value);
  if (!date) return "—";
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (isZh(lang)) return style === "full" ? `${y}年${m}月${d}日` : `${m}月${d}日`;
  const month = date.toLocaleString("en-US", { month: "short" });
  return style === "full" ? `${month} ${d}, ${y}` : `${month} ${d}`;
}

export function formatRange(
  start?: string | null,
  end?: string | null,
  lang = "en"
): string {
  return `${formatDate(start, lang)} – ${formatDate(end, lang)}`;
}

/** 到期日：PMS 线上口径 —— 今天/明天为相对文案，其余一律中文短日期（11月26日）。 */
export function dueLabel(value?: string | null, lang = "en"): string {
  const days = relativeDays(value);
  if (days === 0) return isZh(lang) ? "今天" : "Today";
  if (days === 1) return isZh(lang) ? "明天" : "Tomorrow";
  return formatDate(value, "ch", "short");
}

/** Updated 列：近 7 天用 1d ago，更早用 PMS 的中文短日期（10月30日）。 */
export function agoLabel(value?: string | null, lang = "en"): string {
  const days = relativeDays(value);
  if (days === null) return "—";
  if (days >= 0) return isZh(lang) ? "刚刚" : "just now";
  const n = Math.abs(days);
  if (n >= 7) return formatDate(value, "ch", "short");
  return isZh(lang) ? `${n} 天前` : `${n}d ago`;
}

export function initials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

type Lookup = {
  user: (id?: string | null) => WsUser | undefined;
  team: (id?: string | null) => WsTeam | undefined;
  label: (id?: string | null) => WsLabel | undefined;
  project: (id?: string | null) => WsProject | undefined;
  sprint: (id?: string | null) => WsSprint | undefined;
  comment: (id?: string | null) => WsComment | undefined;
  userName: (id?: string | null) => string;
  firstName: (id?: string | null) => string;
  projectName: (id?: string | null) => string;
  teamName: (id?: string | null) => string;
};

/** 工作区快照：项目 / 任务 / 用户全部走后端 API，子记录来自本地 overlay，无示例数据。 */
export function useWorkspace() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  /** 项目真实入库：以后端 /api/projects 为准。 */
  const { data: dbProjects, isLoading: projectsLoading, error: projectsError } = useSWR<ProjectRecord[]>(
    "/api/projects",
    getFetcher
  );
  /** 成员真实来源：后端 /api/auth/users（与团队/成员管理页同一份数据）。 */
  const { data: dbMembers, isLoading: membersLoading, error: membersError } = useSWR<MemberUser[]>(
    "/api/auth/users",
    getFetcher
  );
  const overlay = useProjectStageStore();
  /** 后端项目到达即同步阶段/编号到本地缓存（projectStage / projectNo 同步读取）。 */
  useEffect(() => {
    if (dbProjects?.length) hydrateBackendProjects(dbProjects);
  }, [dbProjects]);

  /** 空基线：无任何 MSW 示例数据，仅由后端项目 + 真实用户 + 本地 overlay 组成。 */
  const base = useMemo<WorkspaceSnapshot>(
    () => ({
      users: (dbMembers ?? []).map<WsUser>((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: member.avatarUrl,
        role: member.role,
        status: "active",
        createdAt: member.createdAt,
      })),
      teams: [],
      labels: [],
      projects: dbProjects ?? [],
      issues: [],
      tasks: [],
      sprints: [],
      events: [],
      milestones: [],
      files: [],
      comments: [],
      activities: [],
    }),
    [dbMembers, dbProjects]
  );
  /** 后端数据 + 本地项目制子记录写入，合并后所有页面共享同一份状态。 */
  const snap = useMemo(
    () => mergeWorkspaceSnapshot(base, overlay),
    [base, overlay]
  );

  const lookup = useMemo<Lookup>(() => {
    const byId = <T extends { id: string }>(list: T[] = []) =>
      new Map(list.map((item) => [item.id, item]));
    const users = byId(snap?.users);
    const teams = byId(snap?.teams);
    const labels = byId(snap?.labels);
    const projects = byId(snap?.projects);
    const sprints = byId(snap?.sprints);
    const comments = byId(snap?.comments);
    const get = <T,>(map: Map<string, T>, id?: string | null) =>
      id ? map.get(id) : undefined;
    const user = (id?: string | null) => get(users, id);
    return {
      user,
      team: (id) => get(teams, id),
      label: (id) => get(labels, id),
      project: (id) => get(projects, id),
      sprint: (id) => get(sprints, id),
      comment: (id) => get(comments, id),
      userName: (id) => user(id)?.name ?? (isZh(lang) ? "未指派" : "Unassigned"),
      firstName: (id) => user(id)?.name.split(" ")[0] ?? (isZh(lang) ? "未指派" : "Unassigned"),
      projectName: (id) => get(projects, id)?.name ?? "—",
      teamName: (id) => get(teams, id)?.name ?? "—",
    };
  }, [snap, lang]);

  return {
    snap,
    ...lookup,
    lang,
    zh: isZh(lang),
    isLoading: projectsLoading || membersLoading,
    error: projectsError ?? membersError,
  };
}

export type UseWorkspace = ReturnType<typeof useWorkspace>;
