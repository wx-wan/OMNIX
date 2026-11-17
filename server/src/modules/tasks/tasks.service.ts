import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

/** 优先级决定预估工时（小时），也是倒计时总时长；作为创建/改优先级时的服务端兜底。 */
const PRIORITY_ESTIMATE: Record<string, number> = {
  none: 24,
  low: 12,
  medium: 8,
  high: 4,
  urgent: 2,
};

/** 到期日规则：创建时间 + 预估工时（小时）。 */

/** 任务真实入库：PostgreSQL tasks 表，按 projectId 过滤、创建、更新、删除。 */
@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  list(projectId?: string) {
    return this.prisma.task.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  create(dto: CreateTaskDto) {
    const priority = dto.priority ?? "medium";
    const estimate =
      dto.estimate === undefined ? PRIORITY_ESTIMATE[priority] ?? 8 : dto.estimate;
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? "",
        status: dto.status ?? "todo",
        priority,
        labelIds: dto.labelIds ?? [],
        assigneeId: dto.assigneeId ?? null,
        // undefined → 到期 = 创建时间 + 预估工时；显式 null → 不赋值（待规划任务用）
        dueDate:
          dto.dueDate === undefined
            ? this.defaultDueDate(estimate)
            : dto.dueDate
              ? new Date(dto.dueDate)
              : null,
        sprintId: dto.sprintId ?? null,
        estimate,
        projectId: dto.projectId,
        parentId: dto.parentId ?? null,
      },
    });
  }

  /** 批量标记任务完成（阶段完成时调用；问题模块尚未搭建，后续在此扩展）。 */
  async bulkComplete(ids: string[]) {
    return this.prisma.task.updateMany({
      where: { id: { in: ids } },
      data: { status: "done" },
    });
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.ensureExists(id);
    // 改优先级且未显式传 estimate 时，按新优先级的默认工时联动
    const estimate =
      dto.estimate !== undefined
        ? dto.estimate
        : dto.priority !== undefined
          ? (PRIORITY_ESTIMATE[dto.priority] ?? null)
          : undefined;
    // 预估变化且未显式传到期时，到期联动为「创建时间 + 新预估」
    const dueDate =
      dto.dueDate !== undefined
        ? dto.dueDate
          ? new Date(dto.dueDate)
          : null
        : estimate !== undefined
          ? new Date(new Date(existing.createdAt).getTime() + (estimate ?? 8) * 3_600_000)
          : undefined;
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.labelIds !== undefined ? { labelIds: dto.labelIds } : {}),
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId ?? null } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(dto.sprintId !== undefined ? { sprintId: dto.sprintId ?? null } : {}),
        ...(estimate !== undefined ? { estimate } : {}),
        ...(dto.parentId !== undefined ? { parentId: dto.parentId ?? null } : {}),
      },
    });
  }

  /** 到期时间 = 当前时间 + 预估工时（estimate 为 null 时回退 8h）。 */
  private defaultDueDate(estimate: number | null) {
    return new Date(Date.now() + (estimate ?? 8) * 60 * 60 * 1000);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.task.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }
}
