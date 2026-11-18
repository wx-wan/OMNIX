import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateIssueDto } from "./dto/create-issue.dto";
import { UpdateIssueDto } from "./dto/update-issue.dto";

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  list(projectId?: string, sprintId?: string) {
    return this.prisma.issue.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(sprintId ? { sprintId } : {}),
      },
      orderBy: { number: "asc" },
    });
  }

  /** reporterId 只取自创建时的登录会话，避免前端伪造创建人。 */
  create(dto: CreateIssueDto, reporterId?: string | null) {
    return this.prisma.issue.create({
      data: {
        title: dto.title,
        description: dto.description ?? "",
        status: dto.status ?? "backlog",
        priority: dto.priority ?? "medium",
        severity: dto.severity ?? "minor",
        type: dto.type ?? "output",
        action: dto.action ?? "",
        assigneeId: dto.assigneeId ?? null,
        reporterId: reporterId ?? null,
        sprintId: dto.sprintId ?? null,
        number: dto.number,
        projectId: dto.projectId,
      },
    });
  }

  async update(id: string, dto: UpdateIssueDto) {
    await this.ensureExists(id);
    return this.prisma.issue.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.action !== undefined ? { action: dto.action ?? "" } : {}),
        ...(dto.severity !== undefined ? { severity: dto.severity } : {}),
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
        ...(dto.reporterId !== undefined ? { reporterId: dto.reporterId } : {}),
        ...(dto.sprintId !== undefined ? { sprintId: dto.sprintId } : {}),
      },
    });
  }

  async bulkComplete(ids: string[]) {
    return this.prisma.issue.updateMany({
      where: { id: { in: ids } },
      data: { status: "done" },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.issue.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const issue = await this.prisma.issue.findUnique({ where: { id } });
    if (!issue) throw new NotFoundException(`Issue ${id} not found`);
    return issue;
  }
}
