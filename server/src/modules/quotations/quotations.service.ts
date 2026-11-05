import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Quotation } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CrmService } from "../crm/crm.service";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import { UpdateQuotationDto } from "./dto/update-quotation.dto";

const SEQ_KEY = "quotation.seq";

/** 明细行（与前端 OrderLine 对齐，用于派生金额）。 */
interface LineLike {
  type?: string;
  quantity?: number | "";
  price?: number;
  discount?: number;
}

/** 由明细派生合计：Σ 单价×数量×(1-折扣%)（仅产品行），两位小数。 */
function deriveAmount(linesJson: string | null | undefined): number | null {
  if (!linesJson) return null;
  try {
    const rows = JSON.parse(linesJson) as LineLike[];
    if (!Array.isArray(rows)) return null;
    let sum = 0;
    for (const l of rows) {
      if (l.type !== "product") continue;
      const qty = typeof l.quantity === "number" ? l.quantity : 0;
      const price = l.price ?? 0;
      const discount = l.discount ?? 0;
      sum += price * qty * (1 - discount / 100);
    }
    return Math.round(sum * 100) / 100;
  } catch {
    return null;
  }
}

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crm: CrmService,
  ) {}

  /**
   * 从商机生成报价单（一商多单）：
   * - 客户引用商机选中的客户（与商机同步展示）
   * - 订单明细 = 商机产品需求快照
   * - 收货地址预填客户国家；有效期默认 +14 天
   * - 若商机尚未到达「报价」阶段，同时把商机推进到该阶段（复用 updateDeal 的停留日志与 Chatter 记录）
   */
  async createFromDeal(dto: CreateQuotationDto, actorId?: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dto.dealId },
      include: { contact: true, stage: true },
    });
    if (!deal) throw new NotFoundException(`Deal ${dto.dealId} not found`);

    const quoteStage = await this.prisma.stage.findUnique({ where: { key: "quote" } });
    if (!quoteStage) throw new BadRequestException("未配置「报价」阶段（stage key=quote）");

    const actor = await this.crm.getActorName(actorId);

    // 单号自增：Setting KV 计数（单实例部署，事务内读改写足够）
    const created = await this.prisma.$transaction(async (tx) => {
      const seqRow = await tx.setting.findUnique({ where: { key: SEQ_KEY } });
      const seq = (Number(seqRow?.value) || 0) + 1;
      await tx.setting.upsert({
        where: { key: SEQ_KEY },
        create: { key: SEQ_KEY, value: String(seq) },
        update: { value: String(seq) },
      });
      const number = `S${String(seq).padStart(5, "0")}`;
      const linesJson = deal.linesJson ?? null;
      return tx.quotation.create({
        data: {
          number,
          dealId: deal.id,
          contactId: deal.contactId,
          shippingAddress: deal.contact?.country ?? null,
          // 默认有效期：创建日期后延一个日历月
          validUntil: (() => {
            const d = new Date();
            d.setMonth(d.getMonth() + 1);
            return d;
          })(),
          priceIncludeTax: dto.priceIncludeTax ?? deal.priceIncludeTax,
          linesJson,
          amount: deriveAmount(linesJson),
        },
      });
    });

    // 商机未到「报价」阶段时先推进（避免回退已过阶段），且须排在「创建报价单」记录之前，
    // 使 chatter 时间线为「推进到报价阶段」在前、「创建了报价单」在后。
    if (
      deal.stageId !== quoteStage.id &&
      deal.stage.position < quoteStage.position
    ) {
      await this.crm.updateDeal(deal.id, { stageId: quoteStage.id }, actorId);
    }

    // 共用商机讨论线程：在所属商机 Chatter 留下产物轨迹（不再写报价单自身线程，避免重复/孤儿数据）
    await this.crm.recordEvent(deal.id, `${actor} 创建了报价单「${created.number}」`);

    return this.getOne(created.id);
  }

  /** 报价单列表（可按商机过滤），含商机与客户摘要。 */
  async list(dealId?: string) {
    const rows = await this.prisma.quotation.findMany({
      where: dealId ? { dealId } : undefined,
      include: {
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, name: true, country: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((q) => this.toListDto(q));
  }

  /** 报价单详情：含商机、客户。 */
  async getOne(id: string) {
    const q = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        deal: { select: { id: true, title: true, amount: true } },
        contact: {
          include: { parent: { select: { id: true, name: true } } },
        },
      },
    });
    if (!q) throw new NotFoundException(`Quotation ${id} not found`);
    return {
      ...this.toListDto(q),
      deal: q.deal ? { id: q.deal.id, title: q.deal.title } : null,
      contact: q.contact
        ? {
            id: q.contact.id,
            name: q.contact.name,
            company: q.contact.company,
            email: q.contact.email,
            phone: q.contact.phone,
            country: q.contact.country,
            parent: q.contact.parent
              ? { id: q.contact.parent.id, name: q.contact.parent.name }
              : null,
          }
        : null,
      shippingAddress: q.shippingAddress,
      paymentTerms: q.paymentTerms,
      tradeTerms: q.tradeTerms,
      notes: q.notes,
      templateId: q.templateId,
      documentJson: q.documentJson,
    };
  }

  /** 更新报价单（条款/地址/备注/明细）。明细变更时重算金额并写一条 Chatter 记录。 */
  async update(id: string, dto: UpdateQuotationDto, actorId?: string) {
    const exists = await this.prisma.quotation.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Quotation ${id} not found`);

    const linesJson =
      dto.lines !== undefined ? JSON.stringify(dto.lines) : undefined;
    const amount =
      linesJson !== undefined ? deriveAmount(linesJson) : undefined;

    await this.prisma.quotation.update({
      where: { id },
      data: {
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        paymentTerms: dto.paymentTerms,
        tradeTerms: dto.tradeTerms,
        shippingAddress: dto.shippingAddress,
        notes: dto.notes,
        priceIncludeTax: dto.priceIncludeTax,
        linesJson,
        amount,
        templateId: dto.templateId,
        documentJson: dto.documentJson,
      },
    });

    if (linesJson !== undefined) {
      const actor = await this.crm.getActorName(actorId);
      // 写入所属商机线程，保证统一讨论下的审计轨迹完整可见
      await this.crm.recordEvent(
        exists.dealId,
        `${actor} 更新了报价单「${exists.number}」的订单明细`,
        "deal",
      );
    }
    return this.getOne(id);
  }

  private toListDto(q: Quotation & {
    deal: { id: string; title: string } | null;
    contact: { id: string; name: string; country: string | null } | null;
  }) {
    return {
      id: q.id,
      number: q.number,
      dealId: q.dealId,
      contactId: q.contactId,
      amount: q.amount != null ? q.amount.toNumber() : null,
      validUntil: q.validUntil?.toISOString() ?? null,
      deliveryDate: q.deliveryDate?.toISOString() ?? null,
      linesJson: q.linesJson,
      priceIncludeTax: q.priceIncludeTax,
      createdAt: q.createdAt.toISOString(),
      deal: q.deal,
      contact: q.contact,
    };
  }
}
