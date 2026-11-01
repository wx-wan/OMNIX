import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Priority, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateDealDto } from "./dto/update-deal.dto";
import { CreateDealDto } from "./dto/create-deal.dto";

// 字段中文标签：把「字段级修改」翻译成可读的操作历史
const FIELD_LABELS: Record<string, string> = {
  title: "标题",
  description: "备注",
  tag: "标签",
  priority: "优先级",
  amount: "金额",
  assignee: "负责人",
  source: "来源",
  meta: "其他信息",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  // 系统机器人（ominXBot）缓存：负责把操作历史写入各单据 Chatter
  private botId?: string;
  private botName = "ominXBot";

  private async getBot(): Promise<{ id?: string; name: string }> {
    if (this.botId === undefined) {
      const bot = await this.prisma.contact.findFirst({ where: { isSystem: true } });
      this.botId = bot?.id;
      this.botName = bot?.name ?? "ominXBot";
    }
    return { id: this.botId, name: this.botName };
  }

  /** 以系统机器人身份记录一条操作历史（写入 Chatter） */
  private async recordEvent(resId: string, body: string): Promise<void> {
    const bot = await this.getBot();
    await this.prisma.chatterMessage.create({
      data: {
        resModel: "deal",
        resId,
        authorId: bot.id ?? null,
        authorName: bot.name,
        authorIsBot: true,
        body,
      },
    });
  }

  /** 解析操作者名字（用于把创建者/修改人写进操作记录）。无操作者时回退「用户」。 */
  private async getActorName(actorId?: string): Promise<string> {
    if (!actorId) return "用户";
    const u = await this.prisma.contact.findUnique({ where: { id: actorId } });
    return u?.name ?? "用户";
  }

  private formatTs(d: Date): string {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

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
  async createDeal(dto: CreateDealDto, actorId?: string) {
    const stage = dto.stageId
      ? await this.prisma.stage.findUnique({ where: { id: dto.stageId } })
      : await this.prisma.stage.findFirst({ orderBy: { position: "asc" } });
    if (!stage) throw new BadRequestException("No stages configured");
    const stageId = stage.id;

    const title =
      dto.title?.trim() ||
      [dto.contact?.name, dto.product?.description].filter(Boolean).join(" · ") ||
      "新商机";

    // 内联产品带单价时，按 单价×数量 派生商机金额（未显式传 amount 时）
    let amount = dto.amount;
    if (amount == null && dto.product?.price != null) {
      amount = new Prisma.Decimal(dto.product.price)
        .mul(dto.product.quantity ?? 0)
        .toNumber();
    }

    const deal = await this.prisma.$transaction(async (tx) => {
      // 内联往来单位 / 联系人（默认 type=customer）落库 contacts 表。
      // 同邮箱视为同一联系人：复用已有记录（CRM 去重），避免 email 唯一约束冲突（P2002）。
      const existingContact = dto.contact
        ? await tx.contact.findUnique({ where: { email: dto.contact.email } })
        : null;
      const contact = existingContact ?? (dto.contact
        ? await tx.contact.create({ data: dto.contact })
        : null);
      const product = dto.product
        ? await tx.product.create({ data: dto.product })
        : null;
      const agg = await tx.deal.aggregate({
        where: { stageId },
        _max: { position: true },
      });

      const deal = await tx.deal.create({
        data: {
          title,
          description: dto.description,
          tag: dto.tag,
          priority: dto.priority ?? Priority.medium,
          amount,
          assignee: dto.assignee,
          meta: dto.meta,
          source: dto.source,
          stageId,
          position: (agg._max.position ?? -1) + 1,
          contactId: dto.contactId ?? contact?.id ?? undefined,
          productId: dto.productId ?? product?.id ?? undefined,
        },
      });
      // 记录进入初始阶段的停留日志
      await tx.dealStageLog.create({
        data: {
          dealId: deal.id,
          stageId: stage.id,
          stageKey: stage.key,
          stageTitle: stage.title,
          enteredAt: new Date(),
        },
      });
      return deal;
    });

    // 系统机器人记录「创建商机」操作历史（署创建者）。
    // 注意：创建过程中的「正在创建」仅作为前端本地占位展示，不写入记录；
    // 创建完毕后只落一条「xx 创建了商机「xxx」」，由前端拉取后替换本地占位。
    const actor = await this.getActorName(actorId);
    await this.recordEvent(deal.id, `${actor} 创建了商机「${deal.title}」`);
    return deal;
  }

  /** 商机详情：含关联阶段、往来单位（联系人）与产品。amount 转为 number。 */
  async getDeal(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        contact: true,
        product: true,
        stageLogs: { orderBy: { enteredAt: "asc" } },
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

  /** Chatter 操作/讨论记录：按业务记录取消息流（机器人操作历史 + 人工评论），升序。 */
  async listChatter(resId: string) {
    const msgs = await this.prisma.chatterMessage.findMany({
      where: { resModel: "deal", resId },
      orderBy: { createdAt: "asc" },
    });
    return msgs.map((m) => ({
      id: m.id,
      author: m.authorName,
      initials: m.authorIsBot ? "🤖" : m.authorName.slice(0, 1).toUpperCase(),
      body: m.body,
      timestamp: this.formatTs(m.createdAt),
      isBot: m.authorIsBot,
    }));
  }

  /** 人工发布一条 Chatter 评论（区别于机器人操作记录）。authorId 为空时按匿名处理。 */
  async addComment(resId: string, body: string, authorId?: string) {
    let authorName = "用户";
    if (authorId) {
      const u = await this.prisma.contact.findUnique({ where: { id: authorId } });
      if (u) authorName = u.name;
    }
    const msg = await this.prisma.chatterMessage.create({
      data: {
        resModel: "deal",
        resId,
        authorId: authorId ?? null,
        authorName,
        authorIsBot: false,
        body,
      },
    });
    return {
      id: msg.id,
      author: msg.authorName,
      initials: msg.authorName.slice(0, 1).toUpperCase(),
      body: msg.body,
      timestamp: this.formatTs(msg.createdAt),
      isBot: msg.authorIsBot,
    };
  }

  async updateDeal(id: string, dto: UpdateDealDto, actorId?: string) {
    const exists = await this.prisma.deal.findUnique({
      where: { id },
      include: { stage: true },
    });
    if (!exists) throw new NotFoundException(`Deal ${id} not found`);

    const actor = await this.getActorName(actorId);

    const stageChanged =
      dto.stageId !== undefined && dto.stageId !== exists.stageId;
    const newStage = stageChanged
      ? await this.prisma.stage.findUnique({ where: { id: dto.stageId } })
      : null;
    if (stageChanged && !newStage)
      throw new NotFoundException(`Stage ${dto.stageId} not found`);

    const data: Prisma.DealUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.tag !== undefined) data.tag = dto.tag;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.assignee !== undefined) data.assignee = dto.assignee;
    if (dto.meta !== undefined) data.meta = dto.meta;
    if (dto.source !== undefined) data.source = dto.source;
    if (dto.stageId !== undefined) data.stage = { connect: { id: dto.stageId } };
    if (dto.position !== undefined) data.position = dto.position;

    // 拖拽换列时若未显式给位置，则落到目标列末尾
    if (dto.stageId !== undefined && dto.position === undefined) {
      const agg = await this.prisma.deal.aggregate({
        where: { stageId: dto.stageId },
        _max: { position: true },
      });
      data.position = (agg._max.position ?? -1) + 1;
    }

    // 内联产品改单价时，按 单价×数量 重新派生金额（未显式传 amount）
    if (dto.product?.price != null && dto.amount === undefined) {
      data.amount = new Prisma.Decimal(dto.product.price)
        .mul(dto.product.quantity ?? 0)
        .toNumber();
    }

    // 计算字段级修改（与旧值对比），供机器人记录「文本修改记录」
    const changeEvents: string[] = [];
    for (const key of Object.keys(FIELD_LABELS)) {
      const next = (dto as Record<string, unknown>)[key];
      if (next === undefined) continue;
      const prevRaw =
        key === "amount"
          ? exists.amount != null
            ? exists.amount.toNumber()
            : null
          : (exists as Record<string, unknown>)[key];
      const norm = (v: unknown) =>
        key === "priority" && typeof v === "string" ? PRIORITY_LABELS[v] ?? v : v;
      const prevN = prevRaw == null ? "" : String(norm(prevRaw));
      const nextN = next == null ? "" : String(norm(next));
      if (prevN !== nextN) {
        const render = (v: unknown) =>
          v == null || v === "" ? "（空）" : String(norm(v));
        changeEvents.push(
          `${actor} 修改了${FIELD_LABELS[key]}：${render(prevRaw)} → ${render(next)}`,
        );
      }
    }
    if (stageChanged && newStage && exists.stage) {
      changeEvents.push(
        `${actor} 将阶段由「${exists.stage.title}」推进到「${newStage.title}」`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // 同步更新关联的往来单位 / 联系人
      if (dto.contact && exists.contactId) {
        await tx.contact.update({ where: { id: exists.contactId }, data: dto.contact });
      }
      // 同步更新关联的产品需求
      if (dto.product && exists.productId) {
        const pd: Prisma.ProductUpdateInput = { ...dto.product };
        for (const key of ["price", "costPrice", "tax"] as const) {
          const v = (pd as Record<string, unknown>)[key];
          if (v != null && typeof v === "number") {
            (pd as Record<string, unknown>)[key] = new Prisma.Decimal(v);
          }
        }
        await tx.product.update({ where: { id: exists.productId }, data: pd });
      }
      if (stageChanged && newStage) {
        // 关闭当前阶段日志，记录进入新阶段的日志
        await tx.dealStageLog.updateMany({
          where: { dealId: id, leftAt: null },
          data: { leftAt: new Date() },
        });
        await tx.dealStageLog.create({
          data: {
            dealId: id,
            stageId: newStage.id,
            stageKey: newStage.key,
            stageTitle: newStage.title,
            enteredAt: new Date(),
          },
        });
      }
      return tx.deal.update({ where: { id }, data });
    });

    // 系统机器人把本次操作历史写入 Chatter（字段修改 + 阶段变更）
    for (const body of changeEvents) {
      await this.recordEvent(id, body);
    }

    return this.getDeal(id);
  }
}
