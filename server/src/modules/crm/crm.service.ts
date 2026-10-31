import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Priority, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateDealDto } from "./dto/update-deal.dto";
import { CreateDealDto } from "./dto/create-deal.dto";

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  /** 看板数据：阶段（按 position 排序）及其下交易（按 position 排序）。amount 转为 number 便于前端格式化。 */
  async getBoard() {
    const stages = await this.prisma.stage.findMany({
      orderBy: { position: "asc" },
      include: {
        deals: {
          orderBy: { position: "asc" },
        },
      },
    });

    return stages.map((stage) => ({
      ...stage,
      deals: stage.deals.map((deal) => ({
        ...deal,
        amount: deal.amount != null ? deal.amount.toNumber() : null,
      })),
    }));
  }

  /** 新建商机：可内联客户画像 + 产品需求（各自落库），关联后进入第一个阶段（线索到达）。 */
  async createDeal(dto: CreateDealDto) {
    let stageId = dto.stageId;
    if (stageId) {
      const stage = await this.prisma.stage.findUnique({ where: { id: stageId } });
      if (!stage) throw new NotFoundException(`Stage ${stageId} not found`);
    } else {
      const first = await this.prisma.stage.findFirst({ orderBy: { position: "asc" } });
      if (!first) throw new BadRequestException("No stages configured");
      stageId = first.id;
    }

    const title =
      dto.title?.trim() ||
      [dto.customer?.name, dto.product?.name].filter(Boolean).join(" · ") ||
      "新商机";

    // 内联产品带单价时，按 单价×数量 派生商机金额（未显式传 amount 时）
    let amount = dto.amount;
    if (amount == null && dto.product?.price != null) {
      amount = new Prisma.Decimal(dto.product.price)
        .mul(dto.product.quantity ?? 1)
        .toNumber();
    }

    return this.prisma.$transaction(async (tx) => {
      // 内联公司（客户）+ 可选主联系人，二者在同一个事务里落库并关联
      const customer = dto.customer
        ? await tx.customer.create({
            data: dto.contact
              ? { ...dto.customer, contacts: { create: dto.contact } }
              : dto.customer,
          })
        : null;
      const product = dto.product
        ? await tx.product.create({ data: dto.product })
        : null;
      const agg = await tx.deal.aggregate({
        where: { stageId },
        _max: { position: true },
      });

      return tx.deal.create({
        data: {
          title,
          description: dto.description,
          tag: dto.tag,
          priority: dto.priority ?? Priority.medium,
          amount,
          assignee: dto.assignee,
          meta: dto.meta,
          stageId,
          position: (agg._max.position ?? -1) + 1,
          customerId: dto.customerId ?? customer?.id ?? undefined,
          productId: dto.productId ?? product?.id ?? undefined,
        },
      });
    });
  }

  /** 商机详情：含关联阶段、客户（及其联系人）与产品。amount 转为 number。 */
  async getDeal(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        customer: { include: { contacts: { orderBy: { createdAt: "asc" } } } },
        product: true,
      },
    });
    if (!deal) throw new NotFoundException(`Deal ${id} not found`);
    return {
      ...deal,
      amount: deal.amount != null ? deal.amount.toNumber() : null,
      product: deal.product
        ? { ...deal.product, price: deal.product.price?.toNumber() ?? null }
        : null,
    };
  }

  async updateDeal(id: string, dto: UpdateDealDto) {
    const exists = await this.prisma.deal.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Deal ${id} not found`);

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.tag !== undefined) data.tag = dto.tag;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.assignee !== undefined) data.assignee = dto.assignee;
    if (dto.meta !== undefined) data.meta = dto.meta;
    if (dto.stageId !== undefined) data.stageId = dto.stageId;
    if (dto.position !== undefined) data.position = dto.position;

    // 拖拽换列时若未显式给位置，则落到目标列末尾
    if (dto.stageId !== undefined && dto.position === undefined) {
      const agg = await this.prisma.deal.aggregate({
        where: { stageId: dto.stageId },
        _max: { position: true },
      });
      data.position = (agg._max.position ?? -1) + 1;
    }

    return this.prisma.deal.update({ where: { id }, data });
  }
}
