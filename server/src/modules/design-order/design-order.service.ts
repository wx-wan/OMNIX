import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { DesignOrder } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CrmService } from "../crm/crm.service";
import { CreateDesignOrderDto } from "./dto/create-design-order.dto";
import { UpdateDesignOrderDto } from "./dto/update-design-order.dto";
import { DESIGN_PRODUCT_TYPES } from "./dto/create-design-order.dto";

@Injectable()
export class DesignOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crm: CrmService,
  ) {}

  /** 设计单列表（按商机过滤），软删过滤，倒序。 */
  async list(dealId?: string) {
    const rows = await this.prisma.designOrder.findMany({
      where: { dealId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { product: true, responsible: true, assistant: true },
    });
    return rows.map((r) => this.toDto(r));
  }

  async getOne(id: string) {
    const r = await this.prisma.designOrder.findUnique({
      where: { id },
      include: { product: true, responsible: true, assistant: true, samples: true },
    });
    if (!r || r.deletedAt) throw new NotFoundException(`DesignOrder ${id} not found`);
    return this.toDto(r);
  }

  async create(dto: CreateDesignOrderDto, actorId?: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dto.dealId } });
    if (!deal) throw new NotFoundException(`Deal ${dto.dealId} not found`);
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);
    if (dto.productType && !DESIGN_PRODUCT_TYPES.includes(dto.productType))
      throw new BadRequestException("Invalid productType");

    // 完善产品名称：回写 Product.name（绝不碰 description）
    if (dto.productName && dto.productName !== product.name) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { name: dto.productName },
      });
    }

    // 负责人继承商机负责人；若指向的 Contact 不存在则置空，避免外键约束失败
    const responsibleId = deal.assignee
      ? ((await this.prisma.contact.findUnique({ where: { id: deal.assignee } }))?.id ?? null)
      : null;

    const created = await this.prisma.designOrder.create({
      data: {
        dealId: dto.dealId,
        productId: dto.productId,
        productName: dto.productName,
        productType: dto.productType,
        responsibleId,
        assistantId: dto.assistantId ?? null,
        status: dto.status ?? "draft",
        mainImage: (dto.mainImage as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        threeViews: (dto.threeViews as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        sampleFee: dto.sampleFee ?? false,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdBy: actorId ?? dto.createdBy ?? null,
      },
      include: { product: true, responsible: true, assistant: true },
    });

    const actor = await this.crm.getActorName(actorId);
    await this.crm.recordEvent(
      dto.dealId,
      `${actor} 创建了设计单「${dto.productName}」`,
      "deal",
    );
    return this.toDto(created);
  }

  async update(id: string, dto: UpdateDesignOrderDto, actorId?: string) {
    const exists = await this.prisma.designOrder.findUnique({ where: { id } });
    if (!exists || exists.deletedAt) throw new NotFoundException(`DesignOrder ${id} not found`);
    if (dto.productType && !DESIGN_PRODUCT_TYPES.includes(dto.productType))
      throw new BadRequestException("Invalid productType");

    // 产品名称回写（若改了关联产品或名称）
    const targetProductId = dto.productId ?? exists.productId;
    if (dto.productName) {
      const product = await this.prisma.product.findUnique({ where: { id: targetProductId } });
      if (product && dto.productName !== product.name) {
        await this.prisma.product.update({
          where: { id: product.id },
          data: { name: dto.productName },
        });
      }
    }

    const data: Prisma.DesignOrderUpdateInput = {};
    if (dto.productId !== undefined) data.product = { connect: { id: dto.productId } };
    if (dto.productName !== undefined) data.productName = dto.productName;
    if (dto.productType !== undefined) data.productType = dto.productType;
    if (dto.assistantId !== undefined)
      data.assistant = dto.assistantId
        ? { connect: { id: dto.assistantId } }
        : { disconnect: true };
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === "approved") data.approvedAt = new Date();
    }
    if (dto.mainImage !== undefined) data.mainImage = dto.mainImage as Prisma.InputJsonValue;
    if (dto.threeViews !== undefined) data.threeViews = dto.threeViews as Prisma.InputJsonValue;
    if (dto.sampleFee !== undefined) data.sampleFee = dto.sampleFee;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    const updated = await this.prisma.designOrder.update({
      where: { id },
      data,
      include: { product: true, responsible: true, assistant: true },
    });

    const actor = await this.crm.getActorName(actorId);
    await this.crm.recordEvent(
      exists.dealId,
      `${actor} 更新了设计单「${updated.productName}」`,
      "deal",
    );
    return this.toDto(updated);
  }

  async remove(id: string, actorId?: string) {
    const exists = await this.prisma.designOrder.findUnique({ where: { id } });
    if (!exists || exists.deletedAt) throw new NotFoundException(`DesignOrder ${id} not found`);
    await this.prisma.designOrder.update({ where: { id }, data: { deletedAt: new Date() } });
    const actor = await this.crm.getActorName(actorId);
    await this.crm.recordEvent(
      exists.dealId,
      `${actor} 删除了设计单「${exists.productName}」`,
      "deal",
    );
    return { id };
  }

  private toDto(r: DesignOrder & {
    product?: { id: string; name: string | null; image: string | null } | null;
    responsible?: { id: string; name: string } | null;
    assistant?: { id: string; name: string } | null;
    samples?: { id: string; sampleType: string; status: string }[];
  }) {
    return {
      id: r.id,
      dealId: r.dealId,
      productId: r.productId,
      productName: r.productName,
      product: r.product
        ? { id: r.product.id, name: r.product.name, image: r.product.image }
        : null,
      productType: r.productType,
      responsibleId: r.responsibleId,
      responsible: r.responsible
        ? { id: r.responsible.id, name: r.responsible.name }
        : null,
      assistantId: r.assistantId,
      assistant: r.assistant ? { id: r.assistant.id, name: r.assistant.name } : null,
      status: r.status,
      mainImage: (Array.isArray(r.mainImage) ? r.mainImage : []) as unknown[],
      threeViews: (Array.isArray(r.threeViews) ? r.threeViews : []) as unknown[],
      sampleFee: r.sampleFee,
      dueDate: r.dueDate ? r.dueDate.toISOString() : null,
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      samples: Array.isArray(r.samples)
        ? r.samples.map((s) => ({ id: s.id, sampleType: s.sampleType, status: s.status }))
        : undefined,
    };
  }
}
