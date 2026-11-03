import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { ContactType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { isContactComplete } from "./contact-complete";

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 往来单位 / 联系人列表：可按 type / isCompany / parentId 过滤、q 关键字搜索、限制条数。含关联商机数。
   *  系统机器人（isSystem）不出现在管理列表，避免被编辑/删除。
   *  archived 默认过滤已归档项；includeArchived=true 时一并返回。
   *  - isCompany=true 即「公司维护表」视图；
   *  - parentId 用于列某家公司下的联系人（child_ids）；
   *  - q 关键字在姓名 / 邮箱 / 旧公司文本 / 所属公司名（parent.name）上做不区分大小写模糊匹配。 */
  list(
    type?: ContactType,
    limit?: number,
    includeArchived = false,
    isCompany?: boolean,
    parentId?: string,
    q?: string,
  ) {
    const where: Prisma.ContactWhereInput = {
      ...(type ? { type } : {}),
      ...(isCompany !== undefined ? { isCompany } : {}),
      ...(parentId !== undefined ? { parentId } : {}),
      isSystem: false,
      ...(includeArchived ? {} : { archived: false }),
      ...(q && q.trim()
        ? {
            OR: [
              { name: { contains: q.trim(), mode: "insensitive" } },
              { email: { contains: q.trim(), mode: "insensitive" } },
              { company: { contains: q.trim(), mode: "insensitive" } },
              { parent: { name: { contains: q.trim(), mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    return this.prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        _count: { select: { deals: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  async getOne(id: string) {
    const c = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, type: true } },
        children: {
          where: { archived: false, isSystem: false },
          select: { id: true, name: true, type: true, email: true },
          orderBy: { createdAt: "asc" },
        },
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
    // 新建默认带「待完善」标签；若必填字段（姓名/邮箱/电话/客户类型/国家地区，
    // 个人还需关联公司 parentId）已全部满足，则走完善逻辑立即清除 aiGenerated。
    data.aiGenerated = isContactComplete(data) ? false : true;
    return this.prisma.contact.create({ data });
  }

  async update(id: string, dto: UpdateContactDto) {
    const existing = await this.prisma.contact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contact ${id} not found`);
    if (existing.isSystem) throw new ForbiddenException("系统机器人不可编辑");
    const data: Prisma.ContactUpdateInput = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    // 信息完善（除官网外核心字段齐全）→ 标记「已核实」，清除 aiGenerated 并持久化
    if (isContactComplete({ ...existing, ...dto })) data.aiGenerated = false;
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

  /**
   * 系统机器人「展示用」配置（按当前登录用户个性化）：
   * 返回当前用户的偏好（名称 / 3D 形象），未设置时回退到全局机器人默认值。
   * 仅用于前端展示，不写回全局机器人账号——改自己的偏好不会影响其他用户。
   */
  async getBotForUser(userId: string) {
    const global = await this.prisma.contact.findUnique({
      where: { email: "bot@omnix.dev" },
      select: { id: true, name: true, type: true, email: true, botCharacter: true },
    });
    const [namePref, charPref] = await this.prisma.$transaction([
      this.prisma.setting.findUnique({ where: { key: `bot.name.${userId}` } }),
      this.prisma.setting.findUnique({ where: { key: `bot.character.${userId}` } }),
    ]);
    return {
      id: global?.id ?? null,
      name: namePref?.value ?? global?.name ?? "ominXBot",
      type: global?.type ?? "user",
      email: global?.email ?? "bot@omnix.dev",
      botCharacter: charPref?.value ?? global?.botCharacter ?? "mochi",
    };
  }

  /**
   * 保存当前用户的机器人展示偏好（名称 / 3D 形象）到 Setting 键值表（按 userId 隔离）。
   * 与全局机器人账号解耦：每个用户自定义自己的机器人外观，互不影响。
   */
  async updateBotForUser(userId: string, dto: UpdateContactDto) {
    if (dto.name !== undefined) {
      await this.prisma.setting.upsert({
        where: { key: `bot.name.${userId}` },
        create: { key: `bot.name.${userId}`, value: dto.name },
        update: { value: dto.name },
      });
    }
    if (dto.botCharacter !== undefined) {
      await this.prisma.setting.upsert({
        where: { key: `bot.character.${userId}` },
        create: { key: `bot.character.${userId}`, value: dto.botCharacter },
        update: { value: dto.botCharacter },
      });
    }
    return this.getBotForUser(userId);
  }
}
