import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Priority } from "@prisma/client";
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

  /** 新建商机：不传 stageId 时默认落入第一个阶段（线索到达），位置为该列末尾。 */
  async createDeal(dto: CreateDealDto) {
    const title = dto.title?.trim();
    if (!title) throw new BadRequestException("title is required");

    let stageId = dto.stageId;
    if (stageId) {
      const stage = await this.prisma.stage.findUnique({ where: { id: stageId } });
      if (!stage) throw new NotFoundException(`Stage ${stageId} not found`);
    } else {
      const first = await this.prisma.stage.findFirst({ orderBy: { position: "asc" } });
      if (!first) throw new BadRequestException("No stages configured");
      stageId = first.id;
    }

    const agg = await this.prisma.deal.aggregate({
      where: { stageId },
      _max: { position: true },
    });

    return this.prisma.deal.create({
      data: {
        title,
        description: dto.description,
        tag: dto.tag,
        priority: dto.priority ?? Priority.medium,
        amount: dto.amount,
        assignee: dto.assignee,
        meta: dto.meta,
        stageId,
        position: (agg._max.position ?? -1) + 1,
      },
    });
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
