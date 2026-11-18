import useSWR, { mutate as globalMutate } from "swr";
import { getFetcher, patchFetcher, postFetcher } from "@/api/global-fetcher";
import type { WsIssue } from "src/types/apps/workspace";

export type IssueInput = {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  action?: string | null;
  severity?: string;
  assigneeId?: string | null;
  /** 创建人：可由下拉改派，后端按 PATCH 更新。 */
  reporterId?: string | null;
  sprintId?: string | null;
  number: number;
  projectId: string;
};

const KEY = "/api/issues";

const revalidateIssues = () =>
  globalMutate((key) => typeof key === "string" && key.startsWith(KEY));

export async function createIssue(input: IssueInput) {
  const created = await postFetcher(KEY, input);
  await revalidateIssues();
  return created as WsIssue;
}

export async function updateIssue(id: string, patch: Partial<IssueInput>) {
  const updated = await patchFetcher(`${KEY}/${id}`, patch);
  await revalidateIssues();
  return updated as WsIssue;
}

export async function bulkCompleteIssues(ids: string[]) {
  const result = await patchFetcher(`${KEY}/bulk/complete`, { ids });
  await revalidateIssues();
  return result as { count: number };
}

export async function removeIssue(id: string) {
  const res = await fetch(`${KEY}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "删除失败" }));
    throw new Error(body.message ?? "删除失败");
  }
  await revalidateIssues();
}

/**
 * 问题唯一读写入口：与 useTasks 同构，项目详情 Issues / 阶段详情 / 项目弹窗
 * 都通过它调用同一组 /api/issues 接口，避免任何页面再写本地 overlay。
 */
export function useIssues(projectId?: string, sprintId?: string) {
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", projectId);
  if (sprintId) params.set("sprintId", sprintId);
  const url = params.toString() ? `${KEY}?${params}` : KEY;
  const { data, error, isLoading, mutate } = useSWR<WsIssue[]>(url, getFetcher);

  return {
    issues: data ?? [],
    isLoading,
    error,
    create: async (input: IssueInput) => {
      const created = await createIssue(input);
      await mutate();
      return created;
    },
    update: async (id: string, patch: Partial<IssueInput>) => {
      const updated = await updateIssue(id, patch);
      await mutate();
      return updated;
    },
    remove: async (id: string) => {
      await removeIssue(id);
      await mutate();
    },
    mutate,
  };
}
