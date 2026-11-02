import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { ContactType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 往来单位 / 联系人列表：可按 type 过滤、限制条数。含关联商机数。
   *  系统机器人（isSystem）不出现在管理列表，避免被编辑/删除。
   *  archived 默认过滤已归档项；includeArchived=true 时一并返回。 */
  list(type?: ContactType, limit?: number, includeArchived = false) {
    return this.prisma.contact.findMany({
      where: {
        ...(type ? { type } : {}),
        isSystem: false,
        ...(includeArchived ? {} : { archived: false }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { _count: { select: { deals: true } } },
    });
  }

  async getOne(id: string) {
    const c = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        deals: {
          select: { id: true, title: true, stageId: true, amount: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!c) throw new NotFoundException(`Contact ${id} not found`);
    return c;
  }

  async create(dto: CreateContactDto) {
    const data: Prisma.ContactCreateInput = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.contact.create({ data });
  }

  async update(id: string, dto: UpdateContactDto) {
    const existing = await this.prisma.contact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contact ${id} not found`);
    if (existing.isSystem) throw new ForbiddenException("系统机器人不可编辑");
    const data: Prisma.ContactUpdateInput = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.contact.update({ where: { id }, data });
  }

  /** 归档 / 取消归档：关联了商机的往来单位不允许删除，用归档隐藏代替。 */
  async archive(id: string, archived: boolean) {
    const existing = await this.prisma.contact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contact ${id} not found`);
    if (existing.isSystem) throw new ForbiddenException("系统机器人不可归档");
    await this.prisma.contact.update({ where: { id }, data: { archived } });
    return { ok: true };
  }

  async remove(id: string) {
    const existing = await this.prisma.contact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contact ${id} not found`);
    if (existing.isSystem) throw new ForbiddenException("系统机器人不可删除");
    // 关联了商机的往来单位禁止删除，只能归档
    const dealCount = await this.prisma.deal.count({
      where: { contactId: id },
    });
    if (dealCount > 0) {
      throw new BadRequestException(
        "该客户已关联商机，无法删除，请先归档",
      );
    }
    return this.prisma.contact.delete({ where: { id } });
  }

  /** 系统机器人配置（用于前端选择 3D 形象）。仅返回安全字段，避免泄露 password。 */
  async getBot() {
    const bot = await this.prisma.contact.findFirst({
      where: { isSystem: true },
      select: {
        id: true,
        name: true,
        type: true,
        email: true,
        botCharacter: true,
      },
    });
    if (!bot) throw new NotFoundException("系统机器人不存在");
    return bot;
  }

  /** 更新系统机器人配置（名称 / 3D 形象）。绕过 isSystem 的编辑保护（仅限此专用接口）。 */
  async updateBot(dto: UpdateContactDto) {
    const bot = await this.prisma.contact.findFirst({ where: { isSystem: true } });
    if (!bot) throw new NotFoundException("系统机器人不存在");
    return this.prisma.contact.update({
      where: { id: bot.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.botCharacter !== undefined ? { botCharacter: dto.botCharacter } : {}),
      },
      select: {
        id: true,
        name: true,
        type: true,
        email: true,
        botCharacter: true,
      },
    });
  }
}
