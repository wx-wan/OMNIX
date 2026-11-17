import type { WsTask } from "src/types/apps/workspace";

/**
 * 任务编号：#T001、#T002……；传入所属项目编号时组合为 #2611019T001。
 * 当前 Task 后端模型无持久化 number 字段，故按「创建时间 + id」稳定排序后的序号生成，
 * 每个项目独立从 T001 开始。序号在同一数据集内稳定（仅该项目增删任务时后续会顺延）。
 */
export function taskNo(task: WsTask, allTasks: WsTask[], projectNumber?: string): string {
  const ordered = allTasks
    .filter((item) => item.projectId === task.projectId)
    .sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return ta - tb || a.id.localeCompare(b.id);
    });
  const index = ordered.findIndex((item) => item.id === task.id);
  const seq = `T${String(index < 0 ? 0 : index + 1).padStart(3, "0")}`;
  if (!projectNumber) return `#${seq}`;
  return `#${projectNumber.replace("#", "")}${seq}`;
}
