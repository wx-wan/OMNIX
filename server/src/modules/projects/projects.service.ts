import { Injectable, NotFoundException } from "@nestjs/common";
import { ContactType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

/** 项目真实入库：PostgreSQL projects 表，含阶段与编号，提供完整 CRUD。 */
@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService
  ) {}

  list(includeArchived = false) {
    return this.prisma.project.findMany({
      where: includeArchived ? undefined : { archived: false },
      orderBy: { createdAt: "asc" },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  /**
   * 新建项目：按首选项里每个阶段 configured 的 defaultTasks / defaultIssues 落库，
   * 不再依赖前端写死的 SEED_TASKS。经办人按角色从部门成员解析，缺省用项目负责人。
   */
  async create(dto: CreateProjectDto) {
    const defaults = await this.settings.getWorkspaceDefaults();
    const leadId = dto.leadId ?? null;
    const users = await this.prisma.contact.findMany({
      where: { type: ContactType.user, password: { not: null }, isSystem: false, archived: false },
      select: { id: true, position: true },
      orderBy: { createdAt: "asc" },
    });
    /** 职位 → 中文职位名（Contact.position），与部门无关；无匹配时回退项目负责人。 */
    const POSITION_LABEL: Record<string, string> = {
      design: "设计",
      art: "美工",
      operations: "运营",
      shipping: "出运",
      purchase: "采购",
      engineering: "工程对接人",
      lead: "",
    };
    const byPosition = (role?: string) => {
      const label = POSITION_LABEL[role ?? ""];
      return label ? users.find((user) => user.position?.includes(label))?.id ?? leadId : leadId;
    };

    const taskData = defaults.stages.flatMap((stage) =>
      stage.defaultTasks.map((item, index) => {
        const assignee = byPosition(item.assigneeRole);
        return {
          id: `task-${dto.id}-${stage.key}-${index}`,
          title: item.title,
          description: item.description ?? "",
          status: "backlog",
          priority: dto.priority ?? "medium",
          type: item.type ?? defaults.defaultItemType,
          action: item.action ?? defaults.defaultAction ?? "",
          assigneeId: assignee,
          sprintId: stage.key,
          estimate: null,
          dueDate: null,
          projectId: dto.id,
        };
      })
    );

    let issueNumber = (await this.prisma.issue.aggregate({ _max: { number: true } }))._max.number ?? 500;
    const issueData = defaults.stages.flatMap((stage) =>
      stage.defaultIssues.map((item) => ({
        number: ++issueNumber,
        title: item.title,
        description: item.description ?? "",
        status: "backlog",
        priority: dto.priority ?? "medium",
        severity: "minor",
        type: item.type ?? defaults.defaultItemType,
        action: item.action ?? defaults.defaultAction ?? "",
        assigneeId: leadId,
        sprintId: stage.key,
        projectId: dto.id,
      }))
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.project.create({
        data: {
          id: dto.id,
          name: dto.name,
          description: dto.description ?? "",
          cover: dto.cover ?? "",
          status: dto.status ?? "active",
          priority: dto.priority ?? "medium",
          dueDate: dto.dueDate ?? null,
          memberIds: dto.memberIds ?? [],
          leadId,
          progress: dto.progress ?? 0,
          archived: dto.archived ?? false,
          teamId: dto.teamId ?? null,
          stage: dto.stage ?? "requirement",
          no: dto.no ?? "",
          stageSchedule: dto.stageSchedule ?? undefined,
        },
      });
      for (const task of taskData) await tx.task.create({ data: task });
      for (const issue of issueData) await tx.issue.create({ data: issue });
    });

    return this.prisma.project.findUniqueOrThrow({ where: { id: dto.id } });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.cover !== undefined ? { cover: dto.cover } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate ?? null } : {}),
        ...(dto.memberIds !== undefined ? { memberIds: dto.memberIds } : {}),
        ...(dto.leadId !== undefined ? { leadId: dto.leadId ?? null } : {}),
        ...(dto.progress !== undefined ? { progress: dto.progress } : {}),
        ...(dto.archived !== undefined ? { archived: dto.archived } : {}),
        ...(dto.teamId !== undefined ? { teamId: dto.teamId ?? null } : {}),
        ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
        ...(dto.no !== undefined ? { no: dto.no } : {}),
        ...(dto.stageSchedule !== undefined
          ? { stageSchedule: dto.stageSchedule ?? undefined }
          : {}),
        ...(dto.createdAt !== undefined ? { createdAt: new Date(dto.createdAt) } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // 项目与任务/问题仅通过字符串 projectId 关联（无外键级联），删除项目时须在同一事务里
    // 先删掉该项目下的全部任务与问题，避免留下孤儿记录。
    await this.prisma.$transaction([
      this.prisma.task.deleteMany({ where: { projectId: id } }),
      this.prisma.issue.deleteMany({ where: { projectId: id } }),
      this.prisma.project.delete({ where: { id } }),
    ]);
  }
}
