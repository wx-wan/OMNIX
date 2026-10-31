import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return items.map((p) => ({
      ...p,
      price: p.price != null ? p.price.toNumber() : null,
    }));
  }

  async getOne(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Product ${id} not found`);
    return { ...p, price: p.price != null ? p.price.toNumber() : null };
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }
}
