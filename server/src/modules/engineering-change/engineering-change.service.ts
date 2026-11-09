import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CrmService } from "../crm/crm.service";
import { ProductsService } from "../products/products.service";

/** 工程变更状态机。 */
export const ECO_TRANSITIONS: Record<string, string[]> = {
  draft: ["review", "cancelled"],
  review: ["approved", "cancelled"],
  approved: ["implemented", "cancelled"],
  implemented: ["closed"],
  closed: [],
  cancelled: ["draft"],
};

export const ECO_STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  review: "评审中",
  approved: "已批准",
  implemented: "已实施",
  closed: "已关闭",
  cancelled: "已取消",
};

@Injectable()
export class EngineeringChangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crm: CrmService,
    private readonly products: ProductsService,
  ) {}

  /** 生成下一个 ECO 编号：EC0001 自增。 */
  private async nextNumber(): Promise<string> {
    const last = await this.prisma.engineeringChange.findFirst({
      orderBy: { number: "desc" },
    });
    if (!last || !last.number) return "EC0001";
    const m = /^EC(\d+)$/.exec(last.number);
    const n = m ? parseInt(m[1], 10) + 1 : 1;
    return "EC" + String(n).padStart(4, "0");
  }

  async list(productId?: string) {
    if (productId) {
      return this.prisma.engineeringChange.findMany({
        where: { products: { some: { productId } } },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { products: true } } },
      });
    }
    return this.prisma.engineeringChange.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { products: true } } },
    });
  }

  async getOne(id: string) {
    const eco = await this.prisma.engineeringChange.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                description: true,
                partNo: true,
                revision: true,
                status: true,
              },
            },
          },
        },
      },
    });
    if (!eco) throw new NotFoundException(`ECO ${id} not found`);
    return eco;
  }

  async create(dto: {
    title: string;
    description?: string;
    reason?: string;
    impact?: string;
    requestedById?: string;
    productIds?: string[];
  }) {
    const number = await this.nextNumber();
    return this.prisma.engineeringChange.create({
      data: {
        number,
        title: dto.title,
        description: dto.description,
        reason: dto.reason,
        impact: dto.impact,
        requestedById: dto.requestedById,
        products: dto.productIds?.length
          ? { create: dto.productIds.map((pid) => ({ productId: pid })) }
          : undefined,
      },
    });
  }

  async transition(id: string, to: string, actorId?: string) {
    const eco = await this.prisma.engineeringChange.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!eco) throw new NotFoundException(`ECO ${id} not found`);
    const from = eco.status;
    const allowed = ECO_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `不允许的 ECO 状态流转：${ECO_STATUS_LABELS[from] ?? from} → ${ECO_STATUS_LABELS[to] ?? to}`,
      );
    }
    const updated = await this.prisma.engineeringChange.update({
      where: { id },
      data: { status: to },
    });
    const actor = actorId ? await this.crm.getActorName(actorId) : "系统";
    const body = `${actor} 将工程变更 ${eco.number} 状态由「${ECO_STATUS_LABELS[from] ?? from}」变更为「${ECO_STATUS_LABELS[to] ?? to}」`;
    for (const ep of eco.products) {
      await this.crm.recordEvent(ep.productId, body, "product");
    }
    return updated;
  }

  async addProduct(id: string, productId: string, note?: string) {
    const eco = await this.prisma.engineeringChange.findUnique({
      where: { id },
    });
    if (!eco) throw new NotFoundException(`ECO ${id} not found`);
    return this.prisma.ecoProduct.create({
      data: { ecoId: id, productId, note: note ?? null },
    });
  }

  async removeProduct(id: string, productId: string) {
    await this.prisma.ecoProduct.deleteMany({
      where: { ecoId: id, productId },
    });
    return { ok: true };
  }

  /** 实施变更：状态置 implemented，并为每个受影响产品升版（生成新版本）。 */
  async implement(id: string, actorId?: string) {
    const eco = await this.prisma.engineeringChange.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!eco) throw new NotFoundException(`ECO ${id} not found`);
    if (eco.status !== "approved") {
      throw new BadRequestException("仅已批准的工程变更可以实施");
    }
    const updated = await this.prisma.engineeringChange.update({
      where: { id },
      data: { status: "implemented" },
    });
    const actor = actorId ? await this.crm.getActorName(actorId) : "系统";
    for (const ep of eco.products) {
      try {
        await this.products.createRevision(ep.productId, actorId);
        await this.crm.recordEvent(
          ep.productId,
          `${actor} 因工程变更 ${eco.number} 升版`,
          "product",
        );
      } catch {
        // 产品已删除等情况忽略
      }
    }
    return updated;
  }
}
