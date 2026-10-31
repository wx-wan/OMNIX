import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /** 公司列表（含下属联系人） */
  list() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: { contacts: { orderBy: { createdAt: "asc" } } },
    });
  }

  async getOne(id: string) {
    const c = await this.prisma.customer.findUnique({
      where: { id },
      include: { contacts: { orderBy: { createdAt: "asc" } } },
    });
    if (!c) throw new NotFoundException(`Customer ${id} not found`);
    return c;
  }

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  /** 给某公司新增联系人 */
  async createContact(customerId: string, dto: CreateContactDto) {
    const company = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!company) throw new NotFoundException(`Customer ${customerId} not found`);
    return this.prisma.contact.create({
      data: { customerId, ...dto },
    });
  }

  async updateContact(id: string, dto: UpdateContactDto) {
    const c = await this.prisma.contact.findUnique({ where: { id } });
    if (!c) throw new NotFoundException(`Contact ${id} not found`);
    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  async deleteContact(id: string) {
    const c = await this.prisma.contact.findUnique({ where: { id } });
    if (!c) throw new NotFoundException(`Contact ${id} not found`);
    return this.prisma.contact.delete({ where: { id } });
  }
}
