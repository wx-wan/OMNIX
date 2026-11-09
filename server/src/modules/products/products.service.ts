import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { CrmService } from "../crm/crm.service";

/** 产品生命周期状态流转白名单（有限状态机）。 */
export const PRODUCT_TRANSITIONS: Record<string, string[]> = {
  requirement: ["designing", "obsolete"],
  designing: ["reviewing", "obsolete"],
  reviewing: ["released", "designing", "obsolete"],
  released: ["obsolete"],
  obsolete: ["released"],
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  requirement: "需求",
  designing: "设计中",
  reviewing: "评审中",
  released: "已发布",
  obsolete: "已停用",
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crm: CrmService,
  ) {}

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
    const [bom, whereUsed, revisions] = await Promise.all([
      this.getBom(id),
      this.getWhereUsed(id),
      this.getRevisions(id),
    ]);
    return {
      ...p,
      price: p.price != null ? p.price.toNumber() : null,
      linked: linked.has(p.id),
      bom,
      whereUsed,
      revisions,
    };
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Product ${id} not found`);
    return this.prisma.product.update({ where: { id }, data: dto as never });
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

  // —— PLM：生命周期状态机 ——
  async transition(id: string, to: string, actorId?: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Product ${id} not found`);
    const from = p.status ?? "requirement";
    const allowed = PRODUCT_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `不允许的状态流转：${PRODUCT_STATUS_LABELS[from] ?? from} → ${PRODUCT_STATUS_LABELS[to] ?? to}`,
      );
    }
    const data: { status: string; releasedAt?: Date; obsoletedAt?: Date } = {
      status: to,
    };
    if (to === "released" && !p.releasedAt) data.releasedAt = new Date();
    if (to === "obsolete") data.obsoletedAt = new Date();
    const updated = await this.prisma.product.update({ where: { id }, data });
    const actor = actorId ? await this.crm.getActorName(actorId) : "系统";
    await this.crm.recordEvent(
      id,
      `${actor} 将产品状态由「${PRODUCT_STATUS_LABELS[from] ?? from}」变更为「${PRODUCT_STATUS_LABELS[to] ?? to}」`,
      "product",
    );
    return updated;
  }

  // —— PLM：版本 / 修订 ——
  async getRevisions(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Product ${id} not found`);
    if (!p.partNo) return [p];
    return this.prisma.product.findMany({
      where: { partNo: p.partNo },
      orderBy: { revision: "asc" },
    });
  }

  async createRevision(id: string, actorId?: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Product ${id} not found`);
    const prevRev = p.revision || "A";
    let nextRev = "A";
    if (/^[A-Z]$/.test(prevRev)) {
      nextRev = String.fromCharCode(prevRev.charCodeAt(0) + 1);
    } else {
      nextRev = `${prevRev}-2`;
    }
    const partNo = p.partNo || `P-${p.id.slice(-6).toUpperCase()}`;
    const created = await this.prisma.product.create({
      data: {
        description: p.description,
        mode: p.mode,
        process: p.process,
        audience: p.audience,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice,
        tax: p.tax,
        image: p.image,
        quantity: p.quantity,
        unit: p.unit,
        isRequirement: false,
        status: "designing",
        partNo,
        revision: nextRev,
        revisionParentId: p.id,
        drawings: p.drawings ?? undefined,
        parentId: null,
      },
    });
    const actor = actorId ? await this.crm.getActorName(actorId) : "系统";
    await this.crm.recordEvent(
      created.id,
      `${actor} 基于「${p.description || p.id}」${prevRev} 版升版为 ${nextRev} 版`,
      "product",
    );
    return created;
  }

  // —— PLM：BOM（物料清单） ——
  async getBom(id: string) {
    return this.prisma.bomItem.findMany({
      where: { parentProductId: id },
      orderBy: { position: "asc" },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            partNo: true,
            revision: true,
            status: true,
            unit: true,
          },
        },
      },
    });
  }

  async replaceBom(
    id: string,
    items: {
      childProductId: string;
      quantity: number;
      position?: string;
      note?: string;
    }[],
    actorId?: string,
  ) {
    for (const it of items) {
      if (it.childProductId === id) {
        throw new BadRequestException("BOM 子件不能是产品自身");
      }
    }
    await this.prisma.$transaction([
      this.prisma.bomItem.deleteMany({ where: { parentProductId: id } }),
      this.prisma.bomItem.createMany({
        data: items.map((it) => ({
          parentProductId: id,
          childProductId: it.childProductId,
          quantity: it.quantity,
          position: it.position ?? null,
          note: it.note ?? null,
        })),
      }),
    ]);
    const actor = actorId ? await this.crm.getActorName(actorId) : "系统";
    await this.crm.recordEvent(
      id,
      `${actor} 更新了 BOM（共 ${items.length} 个子件）`,
      "product",
    );
    return this.getBom(id);
  }

  async getWhereUsed(id: string) {
    return this.prisma.bomItem.findMany({
      where: { childProductId: id },
      orderBy: { createdAt: "asc" },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            description: true,
            partNo: true,
            revision: true,
            status: true,
          },
        },
      },
    });
  }

  // —— PLM：审计 / 讨论（复用 Chatter，resModel=product） ——
  listChatter(
    id: string,
    opts?: { limit?: number; before?: string },
  ) {
    return this.crm.listChatter(id, opts, "product");
  }

  addChatter(id: string, text: string, userId?: string) {
    return this.crm.addComment(id, text, userId, "product");
  }

  deleteChatter(id: string, msgId: string, userId?: string) {
    return this.crm.deleteChatter(id, msgId, userId, "product");
  }
}
