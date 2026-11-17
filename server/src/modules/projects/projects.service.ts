import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

/** 项目真实入库：PostgreSQL projects 表，含阶段与编号，提供完整 CRUD。 */
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        id: dto.id,
        name: dto.name,
        description: dto.description ?? "",
        cover: dto.cover ?? "",
        status: dto.status ?? "active",
        priority: dto.priority ?? "medium",
        dueDate: dto.dueDate ?? null,
        memberIds: dto.memberIds ?? [],
        leadId: dto.leadId ?? null,
        progress: dto.progress ?? 0,
        archived: dto.archived ?? false,
        teamId: dto.teamId ?? null,
        stage: dto.stage ?? "requirement",
        no: dto.no ?? "",
      },
    });
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
