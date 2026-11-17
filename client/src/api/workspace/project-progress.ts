import type { WsIssue, WsTask } from "src/types/apps/workspace";

/** 项目进度口径：已完成(任务+问题) / 总计(任务+问题)；两者都为 0 时进度 0%。 */
export function projectProgress(
  projectId: string,
  tasks: WsTask[],
  issues: WsIssue[]
): number {
  const items = [
    ...tasks.filter((task) => task.projectId === projectId),
    ...issues.filter((issue) => issue.projectId === projectId),
  ];
  if (!items.length) return 0;
  const done = items.filter((item) =>
    ["done", "closed", "completed"].includes(item.status)
  ).length;
  return Math.round((done / items.length) * 100);
}

/** 项目计数：任务与问题各自的总数/完成数，供状态推导使用。 */
export function projectCounts(
  projectId: string,
  tasks: WsTask[],
  issues: WsIssue[]
) {
  const scopedTasks = tasks.filter((task) => task.projectId === projectId);
  const scopedIssues = issues.filter((issue) => issue.projectId === projectId);
  const isDone = (status: string) =>
    ["done", "closed", "completed"].includes(status);
  return {
    total: scopedTasks.length + scopedIssues.length,
    done: scopedTasks.filter((t) => isDone(t.status)).length +
      scopedIssues.filter((i) => isDone(i.status)).length,
  };
}
