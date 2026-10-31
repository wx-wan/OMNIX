import { Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { ContactType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 往来单位 / 联系人列表：可按 type 过滤、限制条数。含关联商机数。 */
  list(type?: ContactType, limit?: number) {
    return this.prisma.contact.findMany({
      where: type ? { type } : undefined,
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
    const data: Prisma.ContactUpdateInput = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.contact.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.contact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contact ${id} not found`);
    return this.prisma.contact.delete({ where: { id } });
  }
}
