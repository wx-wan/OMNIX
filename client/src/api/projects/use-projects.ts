import useSWR, { mutate as globalMutate } from "swr";
import { getFetcher, patchFetcher, postFetcher } from "@/api/global-fetcher";
import type { WsProject } from "src/types/apps/workspace";

export type ProjectRecord = WsProject & { stage: string; no: string };

export type ProjectInput = {
  id: string;
  name: string;
  description?: string;
  cover?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  memberIds?: string[];
  leadId?: string | null;
  progress?: number;
  archived?: boolean;
  teamId?: string | null;
  stage?: string;
  no?: string;
  /** 阶段日程：预估起止 + 实际完成时间，见 WsProject.stageSchedule。 */
  stageSchedule?: Record<string, Record<string, string>> | null;
  createdAt?: string;
};

const KEY = "/api/projects";

/** 任意写入后刷新所有 /api/projects* 缓存，保证列表/详情同步。 */
const revalidateProjects = () =>
  globalMutate((key) => typeof key === "string" && key.startsWith(KEY));

/** 独立 API：供非 hook 场景（project-stages 写操作、行操作菜单等）直接调用。 */
export async function createProject(input: ProjectInput) {
  const created = await postFetcher(KEY, input);
  await revalidateProjects();
  return created as ProjectRecord;
}

export async function updateProject(id: string, patch: Partial<ProjectInput>) {
  const updated = await patchFetcher(`${KEY}/${id}`, patch);
  await revalidateProjects();
  return updated as ProjectRecord;
}

export async function removeProject(id: string) {
  const res = await fetch(`${KEY}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "删除失败" }));
    throw new Error(body.message ?? "删除失败");
  }
  await revalidateProjects();
}

/** 项目真实入库：走 /api/projects 后端 CRUD，替换此前的 MSW 示例项目。 */
export function useProjects(includeArchived = false) {
  const url = includeArchived ? `${KEY}?includeArchived=true` : KEY;
  const { data, error, isLoading, mutate } = useSWR<ProjectRecord[]>(url, getFetcher);

  return {
    projects: data ?? [],
    isLoading,
    error,
    create: async (input: ProjectInput) => {
      const created = await createProject(input);
      await mutate();
      return created;
    },
    update: async (id: string, patch: Partial<ProjectInput>) => {
      const updated = await updateProject(id, patch);
      await mutate();
      return updated;
    },
    remove: async (id: string) => {
      await removeProject(id);
      await mutate();
    },
    mutate,
  };
}
