import { Injectable, NotFoundException } from "@nestjs/common";
import type { Fee, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CrmService } from "../crm/crm.service";
import { CreateFeeDto } from "./dto/create-fee.dto";
import { UpdateFeeDto } from "./dto/update-fee.dto";

/** 费用单中用于「样品」阶段校验的特型费用 key。 */
export const SAMPLE_FEE_TYPE = "样品费";

@Injectable()
export class FeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crm: CrmService,
  ) {}

  /** 费用列表（按商机过滤），按创建时间倒序。 */
  async list(dealId?: string) {
    const rows = await this.prisma.fee.findMany({
      where: dealId ? { dealId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((f) => this.toDto(f));
  }

  async getOne(id: string) {
    const f = await this.prisma.fee.findUnique({ where: { id } });
    if (!f) throw new NotFoundException(`Fee ${id} not found`);
    return this.toDto(f);
  }

  async create(dto: CreateFeeDto, actorId?: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dto.dealId } });
    if (!deal) throw new NotFoundException(`Deal ${dto.dealId} not found`);
    const created = await this.prisma.fee.create({
      data: {
        dealId: dto.dealId,
        type: dto.type,
        amount: dto.amount,
        note: dto.note,
        voucherUrl: dto.voucherUrl,
        attachments: (dto.attachments ?? []) as unknown as Prisma.InputJsonValue,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : null,
        fundAccount: dto.fundAccount,
        refType: dto.refType ?? null,
        refId: dto.refId ?? null,
      },
    });
    const actor = await this.crm.getActorName(actorId);
    await this.crm.recordEvent(
      dto.dealId,
      `${actor} 添加了费用「${dto.type}」（¥${dto.amount.toFixed(2)}）`,
      "deal",
    );
    return this.toDto(created);
  }

  async update(id: string, dto: UpdateFeeDto, actorId?: string) {
    const exists = await this.prisma.fee.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Fee ${id} not found`);
    const updated = await this.prisma.fee.update({
      where: { id },
      data: {
        type: dto.type,
        amount: dto.amount,
        note: dto.note,
        voucherUrl: dto.voucherUrl,
        attachments: dto.attachments
          ? (dto.attachments as unknown as Prisma.InputJsonValue)
          : undefined,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        fundAccount: dto.fundAccount,
        ...(dto.refType !== undefined ? { refType: dto.refType } : {}),
        ...(dto.refId !== undefined ? { refId: dto.refId } : {}),
      },
    });
    const actor = await this.crm.getActorName(actorId);
    await this.crm.recordEvent(exists.dealId, `${actor} 更新了费用「${updated.type}」`, "deal");
    return this.toDto(updated);
  }

  async remove(id: string, actorId?: string) {
    const exists = await this.prisma.fee.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Fee ${id} not found`);
    await this.prisma.fee.delete({ where: { id } });
    const actor = await this.crm.getActorName(actorId);
    await this.crm.recordEvent(exists.dealId, `${actor} 删除了费用「${exists.type}」`, "deal");
    return { id };
  }

  private toDto(f: Fee) {
    return {
      id: f.id,
      dealId: f.dealId,
      type: f.type,
      amount: f.amount.toNumber(),
      note: f.note,
      voucherUrl: f.voucherUrl,
      // 兼容历史单图凭证：无 attachments 时回退为单元素数组
      attachments: Array.isArray(f.attachments)
        ? f.attachments
        : f.voucherUrl
          ? [{ name: f.type, url: f.voucherUrl }]
          : [],
      paidAt: f.paidAt ? f.paidAt.toISOString() : null,
      fundAccount: f.fundAccount,
      refType: f.refType,
      refId: f.refId,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    };
  }
}
