import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 扫描所有商机，收集被其引用的产品 id：
   *  - Deal.productId（商机主产品，外键）
   *  - Deal.linesJson 各明细行的 productId（订单明细引用的产品）
   * 用于判断「产品是否关联了商机」——关联则不允许删除，只能归档。 */
  private async linkedProductIds(): Promise<Set<string>> {
    const deals = await this.prisma.deal.findMany({
      where: {
        OR: [{ productId: { not: null } }, { linesJson: { not: null } }],
      },
      select: { productId: true, linesJson: true },
    });
    const ids = new Set<string>();
    for (const d of deals) {
      if (d.productId) ids.add(d.productId);
      if (d.linesJson) {
        try {
          const lines = JSON.parse(d.linesJson);
          if (Array.isArray(lines)) {
            for (const l of lines) {
              if (l && typeof l.productId === "string") ids.add(l.productId);
            }
          }
        } catch {
          // 损坏的 JSON 忽略
        }
      }
    }
    return ids;
  }

  async list(includeArchived = false, page?: number, pageSize?: number) {
    const where = includeArchived ? {} : { archived: false };
    const linked = await this.linkedProductIds();
    const decorate = (p: (typeof items)[number]) => ({
      ...p,
      price: p.price != null ? p.price.toNumber() : null,
      linked: linked.has(p.id),
    });
    // 真正的后端分页：传了 page & pageSize 才分页，返回 { data, total, page, pageSize }
    if (page != null && pageSize != null) {
      const take = Math.max(1, Math.min(Math.floor(pageSize) || 1, 200));
      const safePage = Math.max(1, Math.floor(page) || 1);
      const skip = (safePage - 1) * take;
      const items = await this.prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      });
      const total = await this.prisma.product.count({ where });
      return { data: items.map(decorate), total, page: safePage, pageSize: take };
    }
    // 未分页：返回完整数组（供产品选择器等需要全量的场景，向后兼容）
    const items = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return items.map(decorate);
  }

  async getOne(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Product ${id} not found`);
    const linked = await this.linkedProductIds();
    return {
      ...p,
      price: p.price != null ? p.price.toNumber() : null,
      linked: linked.has(p.id),
    };
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  /** 归档 / 取消归档：被商机引用的产品不允许删除，用归档隐藏代替。 */
  async archive(id: string, archived: boolean) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Product ${id} not found`);
    await this.prisma.product.update({ where: { id }, data: { archived } });
    return { ok: true };
  }

  async remove(id: string) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Product ${id} not found`);
    // 关联了商机的产品禁止删除，只能归档
    const linked = await this.linkedProductIds();
    if (linked.has(id)) {
      throw new BadRequestException(
        "该产品已关联商机，无法删除，请先归档",
      );
    }
    // Chatter 无外键，按引用清理
    await this.prisma.chatterMessage.deleteMany({
      where: { resModel: "product", resId: id },
    });
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }
}
