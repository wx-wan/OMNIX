import useSWR, { mutate as globalMutate } from "swr";
import { getFetcher, patchFetcher, postFetcher } from "@/api/global-fetcher";
import type { WsTask } from "src/types/apps/workspace";
import { nextStage, STAGE_KEYS, type StageKey } from "src/api/workspace/project-stages";

export type TaskInput = {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  labelIds?: string[];
  assigneeId?: string | null;
  dueDate?: string | null;
  sprintId?: string | null;
  estimate?: number | null;
  projectId: string;
  parentId?: string | null;
};

const KEY = "/api/tasks";

/** 任意写入后刷新所有 /api/tasks* 缓存，保证列表页与详情页同步。 */
const revalidateTasks = () =>
  globalMutate((key) => typeof key === "string" && key.startsWith(KEY));

const isDone = (status?: string | null) =>
  status === "done" || status === "closed" || status === "completed";

/**
 * 阶段随任务推进：若项目当前阶段的任务（非空）全部完成，则把项目 stage 推进到下一阶段。
 * 空阶段不自动推进（等任务初始化），最后一阶段封顶（nextStage 返回自身）也不推进。
 */
async function maybeAdvanceStage(projectId: string) {
  try {
    const [tasks, project] = await Promise.all([
      getFetcher(`${KEY}?projectId=${encodeURIComponent(projectId)}`) as Promise<WsTask[]>,
      getFetcher(`/api/projects/${encodeURIComponent(projectId)}`) as Promise<{ stage?: string }>,
    ]);
    const current = project?.stage as StageKey;
    if (!current || !STAGE_KEYS.includes(current)) return;
    const stageTasks = tasks.filter((task) => task.sprintId === current);
    if (!stageTasks.length || !stageTasks.every((task) => isDone(task.status))) return;
    const next = nextStage(current);
    if (next === current) return;
    await patchFetcher(`/api/projects/${encodeURIComponent(projectId)}`, { stage: next });
    await globalMutate(
      (key) =>
        typeof key === "string" &&
        (key.startsWith("/api/projects") || key.startsWith(KEY))
    );
  } catch {
    // 阶段推进失败不影响任务本身的更新结果
  }
}

/** 独立 API：供非 hook 场景（项目详情弹窗提交、预置任务等）直接调用。 */
export async function createTask(input: TaskInput) {
  const created = await postFetcher(KEY, input);
  await revalidateTasks();
  return created as WsTask;
}

export async function updateTask(id: string, patch: Partial<TaskInput>) {
  const updated = (await patchFetcher(`${KEY}/${id}`, patch)) as WsTask;
  await revalidateTasks();
  if (patch.status !== undefined) await maybeAdvanceStage(updated.projectId);
  return updated;
}

/** 批量把任务标记为完成（阶段完成确认后调用）。 */
export async function bulkCompleteTasks(ids: string[]) {
  const result = await patchFetcher(`${KEY}/bulk/complete`, { ids });
  await revalidateTasks();
  return result as { count: number };
}

export async function removeTask(id: string) {
  // 后端 DELETE 返回 204，直接 fetch 避免全局 deleteFetcher 尝试 res.json() 失败
  const res = await fetch(`${KEY}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "删除失败" }));
    throw new Error(body.message ?? "删除失败");
  }
  await revalidateTasks();
}

/** 任务真实入库：走 /api/tasks 后端 CRUD，替换此前的 MSW 快照示例数据。 */
export function useTasks(projectId?: string) {
  const url = projectId ? `${KEY}?projectId=${encodeURIComponent(projectId)}` : KEY;
  const { data, error, isLoading, mutate } = useSWR<WsTask[]>(url, getFetcher);

  return {
    tasks: data ?? [],
    isLoading,
    error,
    create: async (input: TaskInput) => {
      const created = await createTask(input);
      await mutate();
      return created;
    },
    update: async (id: string, patch: Partial<TaskInput>) => {
      const updated = await updateTask(id, patch);
      await mutate();
      return updated;
    },
    remove: async (id: string) => {
      await removeTask(id);
      await mutate();
    },
    mutate,
  };
}
