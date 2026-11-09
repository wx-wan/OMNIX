import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { SampleOrder } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CrmService } from "../crm/crm.service";
import { CreateSampleOrderDto } from "./dto/create-sample-order.dto";
import { UpdateSampleOrderDto } from "./dto/update-sample-order.dto";
import { SAMPLE_TYPES } from "./dto/create-sample-order.dto";

@Injectable()
export class SampleOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crm: CrmService,
  ) {}

  async list(dealId?: string) {
    const rows = await this.prisma.sampleOrder.findMany({
      where: { dealId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        designOrder: true,
        product: true,
        responsible: true,
        assistant: true,
      },
    });
    return rows.map((r) => this.toDto(r));
  }

  async getOne(id: string) {
    const r = await this.prisma.sampleOrder.findUnique({
      where: { id },
      include: {
        designOrder: true,
        product: true,
        responsible: true,
        assistant: true,
      },
    });
    if (!r || r.deletedAt) throw new NotFoundException(`SampleOrder ${id} not found`);
    return this.toDto(r);
  }

  async create(dto: CreateSampleOrderDto, actorId?: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dto.dealId } });
    if (!deal) throw new NotFoundException(`Deal ${dto.dealId} not found`);

    // 业务必填：关联已确认的设计单
    const designOrder = await this.prisma.designOrder.findUnique({
      where: { id: dto.designOrderId },
    });
    if (!designOrder || designOrder.deletedAt)
      throw new NotFoundException(`DesignOrder ${dto.designOrderId} not found`);
    if (designOrder.status !== "approved")
      throw new BadRequestException("关联的设计单尚未确认（approved），无法创建打样单");

    if (dto.sampleType && !SAMPLE_TYPES.includes(dto.sampleType))
      throw new BadRequestException("Invalid sampleType");

    // 负责人继承商机负责人；若指向的 Contact 不存在则置空，避免外键约束失败
    const responsibleId = deal.assignee
      ? ((await this.prisma.contact.findUnique({ where: { id: deal.assignee } }))?.id ?? null)
      : null;

    const created = await this.prisma.sampleOrder.create({
      data: {
        dealId: dto.dealId,
        productId: dto.productId ?? designOrder.productId,
        designOrderId: dto.designOrderId,
        sampleType: dto.sampleType,
        responsibleId,
        assistantId: dto.assistantId ?? null,
        status: dto.status ?? "pending",
        colorCode: dto.colorCode ?? null,
        quantity: dto.quantity ?? 1,
        craft: dto.craft ?? null,
        material: dto.material ?? null,
        hardness: dto.hardness ?? null,
        length: dto.length != null ? new Prisma.Decimal(dto.length) : null,
        width: dto.width != null ? new Prisma.Decimal(dto.width) : null,
        height: dto.height != null ? new Prisma.Decimal(dto.height) : null,
        requiredCompletion: dto.requiredCompletion ? new Date(dto.requiredCompletion) : null,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(), // 默认创建日期
        functionalReq: dto.functionalReq ?? null,
        packagingImage: (dto.packagingImage as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        engravingImage: (dto.engravingImage as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        otherAttachments: (dto.otherAttachments as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        acceptanceCriteria: dto.acceptanceCriteria ?? null,
        packagingLength:
          dto.packagingLength != null ? new Prisma.Decimal(dto.packagingLength) : null,
        packagingWidth:
          dto.packagingWidth != null ? new Prisma.Decimal(dto.packagingWidth) : null,
        packagingHeight:
          dto.packagingHeight != null ? new Prisma.Decimal(dto.packagingHeight) : null,
        sampleFiles: (dto.sampleFiles as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        trackingNo: dto.trackingNo ?? null,
        recipient: dto.recipient ?? null,
        createdBy: actorId ?? dto.createdBy ?? null,
      },
      include: {
        designOrder: true,
        product: true,
        responsible: true,
        assistant: true,
      },
    });

    const actor = await this.crm.getActorName(actorId);
    await this.crm.recordEvent(
      dto.dealId,
      `${actor} 创建了打样单「${dto.sampleType}」`,
      "deal",
    );
    return this.toDto(created);
  }

  async update(id: string, dto: UpdateSampleOrderDto, actorId?: string) {
    const exists = await this.prisma.sampleOrder.findUnique({ where: { id } });
    if (!exists || exists.deletedAt) throw new NotFoundException(`SampleOrder ${id} not found`);
    if (dto.sampleType && !SAMPLE_TYPES.includes(dto.sampleType))
      throw new BadRequestException("Invalid sampleType");

    const data: Prisma.SampleOrderUpdateInput = {};
    if (dto.productId !== undefined) data.product = { connect: { id: dto.productId } };
    if (dto.sampleType !== undefined) data.sampleType = dto.sampleType;
    if (dto.assistantId !== undefined)
      data.assistant = dto.assistantId
        ? { connect: { id: dto.assistantId } }
        : { disconnect: true };
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.colorCode !== undefined) data.colorCode = dto.colorCode;
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.craft !== undefined) data.craft = dto.craft;
    if (dto.material !== undefined) data.material = dto.material;
    if (dto.hardness !== undefined) data.hardness = dto.hardness;
    if (dto.length !== undefined)
      data.length = dto.length != null ? new Prisma.Decimal(dto.length) : null;
    if (dto.width !== undefined)
      data.width = dto.width != null ? new Prisma.Decimal(dto.width) : null;
    if (dto.height !== undefined)
      data.height = dto.height != null ? new Prisma.Decimal(dto.height) : null;
    if (dto.requiredCompletion !== undefined)
      data.requiredCompletion = dto.requiredCompletion ? new Date(dto.requiredCompletion) : null;
    if (dto.orderDate !== undefined)
      data.orderDate = dto.orderDate ? new Date(dto.orderDate) : null;
    if (dto.functionalReq !== undefined) data.functionalReq = dto.functionalReq;
    if (dto.packagingImage !== undefined)
      data.packagingImage = dto.packagingImage as Prisma.InputJsonValue;
    if (dto.engravingImage !== undefined)
      data.engravingImage = dto.engravingImage as Prisma.InputJsonValue;
    if (dto.otherAttachments !== undefined)
      data.otherAttachments = dto.otherAttachments as Prisma.InputJsonValue;
    if (dto.acceptanceCriteria !== undefined) data.acceptanceCriteria = dto.acceptanceCriteria;
    if (dto.packagingLength !== undefined)
      data.packagingLength =
        dto.packagingLength != null ? new Prisma.Decimal(dto.packagingLength) : null;
    if (dto.packagingWidth !== undefined)
      data.packagingWidth =
        dto.packagingWidth != null ? new Prisma.Decimal(dto.packagingWidth) : null;
    if (dto.packagingHeight !== undefined)
      data.packagingHeight =
        dto.packagingHeight != null ? new Prisma.Decimal(dto.packagingHeight) : null;
    if (dto.sampleFiles !== undefined) data.sampleFiles = dto.sampleFiles as Prisma.InputJsonValue;
    if (dto.trackingNo !== undefined) data.trackingNo = dto.trackingNo;
    if (dto.recipient !== undefined) data.recipient = dto.recipient;

    const updated = await this.prisma.sampleOrder.update({
      where: { id },
      data,
      include: {
        designOrder: true,
        product: true,
        responsible: true,
        assistant: true,
      },
    });

    const actor = await this.crm.getActorName(actorId);
    await this.crm.recordEvent(
      exists.dealId,
      `${actor} 更新了打样单「${updated.sampleType}」`,
      "deal",
    );
    return this.toDto(updated);
  }

  async remove(id: string, actorId?: string) {
    const exists = await this.prisma.sampleOrder.findUnique({ where: { id } });
    if (!exists || exists.deletedAt) throw new NotFoundException(`SampleOrder ${id} not found`);
    await this.prisma.sampleOrder.update({ where: { id }, data: { deletedAt: new Date() } });
    const actor = await this.crm.getActorName(actorId);
    await this.crm.recordEvent(
      exists.dealId,
      `${actor} 删除了打样单「${exists.sampleType}」`,
      "deal",
    );
    return { id };
  }

  private toDto(r: SampleOrder & {
    designOrder?: { id: string; productName: string; status: string; productId: string } | null;
    product?: { id: string; name: string | null; image: string | null } | null;
    responsible?: { id: string; name: string } | null;
    assistant?: { id: string; name: string } | null;
  }) {
    const num = (v: { toNumber: () => number } | null) => (v != null ? v.toNumber() : null);
    const iso = (v: Date | null) => (v ? v.toISOString() : null);
    const arr = (v: unknown) => (Array.isArray(v) ? (v as unknown[]) : []);
    return {
      id: r.id,
      dealId: r.dealId,
      productId: r.productId,
      product: r.product
        ? { id: r.product.id, name: r.product.name, image: r.product.image }
        : null,
      designOrderId: r.designOrderId,
      designOrder: r.designOrder
        ? {
            id: r.designOrder.id,
            productName: r.designOrder.productName,
            status: r.designOrder.status,
            productId: r.designOrder.productId,
          }
        : null,
      sampleType: r.sampleType,
      responsibleId: r.responsibleId,
      responsible: r.responsible
        ? { id: r.responsible.id, name: r.responsible.name }
        : null,
      assistantId: r.assistantId,
      assistant: r.assistant ? { id: r.assistant.id, name: r.assistant.name } : null,
      status: r.status,
      colorCode: r.colorCode,
      quantity: r.quantity,
      craft: r.craft,
      material: r.material,
      hardness: r.hardness,
      length: num(r.length),
      width: num(r.width),
      height: num(r.height),
      requiredCompletion: iso(r.requiredCompletion),
      orderDate: iso(r.orderDate),
      functionalReq: r.functionalReq,
      packagingImage: arr(r.packagingImage),
      engravingImage: arr(r.engravingImage),
      otherAttachments: arr(r.otherAttachments),
      acceptanceCriteria: r.acceptanceCriteria,
      packagingLength: num(r.packagingLength),
      packagingWidth: num(r.packagingWidth),
      packagingHeight: num(r.packagingHeight),
      sampleFiles: arr(r.sampleFiles),
      trackingNo: r.trackingNo,
      recipient: r.recipient,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}
