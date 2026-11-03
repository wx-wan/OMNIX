import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { Priority, Prisma, type ChatterMessage } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateDealDto } from "./dto/update-deal.dto";
import { CreateDealDto } from "./dto/create-deal.dto";
import { DealLineDto } from "./dto/deal-line.dto";

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
  private botAvatar?: string | null;

  private async getBot(): Promise<{ id?: string; name: string; avatarUrl?: string | null }> {
    if (this.botId === undefined) {
      // 锚定 bot 账号（bot@omnix.dev），避免与同为 isSystem 的 Accio work 等代理用户冲突
      const bot = await this.prisma.contact.findUnique({ where: { email: "bot@omnix.dev" } });
      this.botId = bot?.id;
      this.botName = bot?.name ?? "ominXBot";
      this.botAvatar = bot?.avatarUrl ?? null;
    }
    return { id: this.botId, name: this.botName, avatarUrl: this.botAvatar };
  }

  /** 以系统机器人身份记录一条操作历史（写入 Chatter）。resModel 缺省为 deal，供其他单据复用。 */
  async recordEvent(resId: string, body: string, resModel = "deal"): Promise<void> {
    const bot = await this.getBot();
    await this.prisma.chatterMessage.create({
      data: {
        resModel,
        resId,
        authorId: bot.id ?? null,
        authorName: bot.name,
        authorIsBot: true,
        authorAvatar: bot.avatarUrl ?? null,
        body,
      },
    });
  }

  /** 解析操作者名字（用于把创建者/修改人写进操作记录）。无操作者时回退「用户」。 */
  async getActorName(actorId?: string): Promise<string> {
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
          // 看板卡片需展示往来单位 / 联系人，故携带精简的联系人信息
          include: { contact: true },
          orderBy: { position: "asc" },
        },
      },
    });

    return stages.map((stage) => ({
      ...stage,
      deals: stage.deals.map((deal) => ({
        ...deal,
        amount: deal.amount != null ? deal.amount.toNumber() : null,
        contact: deal.contact
          ? {
              name: deal.contact.name,
              company: deal.contact.company,
              type: deal.contact.type,
            }
          : null,
      })),
    }));
  }

  /** 统计同一客户（往来单位/联系人，按 contactId）下的商机数量，可排除指定商机。用于商机详情「类似商机」展示。 */
  async countDealsByContact(
    contactId: string,
    excludeDealId?: string,
  ): Promise<number> {
    return this.prisma.deal.count({
      where: {
        contactId,
        ...(excludeDealId ? { id: { not: excludeDealId } } : {}),
      },
    });
  }

  /**
   * 同步订单明细：整张 lines 存为商机明细 JSON（行级数量/折扣/单价随行，不进产品表），
   * 并对「空 productId 的产品行」在产品库新建一条（图片/描述/单位/税项/成本价落产品库，便于复用）。
   * 注意：单价(售价)只留在商机明细行，不写产品库；成本价归属产品库。
   * 返回明细 JSON 与首个产品 id（用于回退兼容单产品关联）。
   */
  private async syncOrderLines(
    tx: Prisma.TransactionClient,
    lines: DealLineDto[] | undefined,
  ): Promise<{ linesJson: string | null; firstProductId: string | undefined }> {
    if (!lines || lines.length === 0) {
      return { linesJson: null, firstProductId: undefined };
    }
    const productLines = lines.filter(
      (l) => l.type !== "combo" && l.type !== "note",
    );
    let firstProductId: string | undefined;
    for (const l of productLines) {
      let resolvedId: string | undefined;
      if (l.productId) {
        const base = await tx.product.findUnique({ where: { id: l.productId } });
        const desc = l.description?.trim() ?? "";
        // 已选产品但描述被改 → 以原产品为模板生成一条变体(SKU)入库，便于复用。
        // 例外：需求产品(isRequirement)本身即「需求阶段描述」载体——有 productId 时改描述
        // 只在商机明细行生效，不触发新建变体（避免需求产品间无限裂变）。
        if (
          base &&
          desc &&
          desc !== (base.description ?? "") &&
          !base.isRequirement
        ) {
          const variant = await tx.product.create({
            data: {
              description: desc,
              mode: base.mode,
              process: base.process,
              audience: base.audience,
              category: base.category,
              price: base.price,
              // 成本价取本行录入（需求阶段成本），否则继承来源产品成本
              costPrice:
                l.costPrice != null
                  ? new Prisma.Decimal(l.costPrice)
                  : base.costPrice,
              tax: base.tax,
              image: base.image,
              unit: base.unit,
              parentId: base.id,
              isRequirement: true, // 需求阶段改描述生成的变体同样打标
            },
          });
          l.productId = variant.id; // 回填 → 幂等，后续保存不再重复建
          resolvedId = variant.id;
        } else {
          resolvedId = l.productId; // 描述未改：维持原产品关联，不碰产品库
        }
      } else {
        // 新产品：先按描述去重（同一需求产品被多次询盘/多客户引用时复用，避免产品库膨胀）；
        // 空描述（落为「未命名产品」）不去重。复用时行上的图片/单价保留在商机行，不覆盖产品库。
        const desc = l.description?.trim();
        const existingProduct = desc
          ? await tx.product.findFirst({
              where: { description: { equals: desc, mode: "insensitive" } },
              orderBy: { id: "asc" },
            })
          : null;
        if (existingProduct) {
          l.productId = existingProduct.id; // 回填 → 幂等，后续保存不再重复建
          resolvedId = existingProduct.id;
        } else {
          // 在产品库新建（图片/描述/单位/税项/成本价落产品库；单价只留商机行）
          const created = await tx.product.create({
            data: {
              description: desc || "未命名产品",
              unit: l.unit?.trim() || undefined,
              // 单价(售价)只留在商机明细行，不写产品库；成本价归属产品库
              costPrice: l.costPrice != null ? new Prisma.Decimal(l.costPrice) : null,
              tax: l.taxRate != null ? new Prisma.Decimal(l.taxRate) : null,
              image: l.image || undefined,
              isRequirement: true, // 需求阶段新建的产品打标
            },
          });
          l.productId = created.id; // 回填并写回 JSON，避免后续保存重复新建
          resolvedId = created.id;
        }
      }
      if (!firstProductId) firstProductId = resolvedId;
    }
    return { linesJson: JSON.stringify(lines), firstProductId };
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
      // 已传 contactId（手动建单选中的公司/联系人）→ 直接更新该往来单位；
      // 否则按邮箱去重复用或新建（MCP 无邮箱时直接新建）。
      let contactId = dto.contactId ?? null;
      let contact: { id: string } | null = null;
      if (contactId) {
        contact = await tx.contact.update({
          where: { id: contactId },
          data: { ...(dto.contact ?? {}) },
        });
      } else if (dto.contact) {
        // 去重复用：① 同邮箱精确匹配；② 无邮箱时按客户名（忽略大小写）匹配，
        // 避免 MCP/手动建单对同一客户反复新建（同一 "Alex Mohamed" 出现多条）。
        // 复用时仅补全空字段，不覆盖已有信息，也不改写 aiGenerated（保持原核实状态）。
        const existingContact = dto.contact.email
          ? await tx.contact.findUnique({ where: { email: dto.contact.email } })
          : await tx.contact.findFirst({
              where: {
                name: { equals: dto.contact.name.trim(), mode: "insensitive" },
                isSystem: false,
              },
              orderBy: { createdAt: "asc" },
            });
        if (existingContact) {
          const patch: Prisma.ContactUpdateInput = {};
          const incoming = dto.contact as unknown as Record<string, unknown>;
          for (const key of [
            "email",
            "phone",
            "company",
            "country",
            "website",
            "customerType",
          ] as const) {
            const v = incoming[key];
            if (
              v != null &&
              String(v).trim() !== "" &&
              !existingContact[key]
            ) {
              (patch as Record<string, unknown>)[key] = v;
            }
          }
          contact =
            Object.keys(patch).length > 0
              ? await tx.contact.update({
                  where: { id: existingContact.id },
                  data: patch,
                })
              : existingContact;
        } else {
          contact = await tx.contact.create({ data: dto.contact });
        }
        contactId = contact.id;
      }
      const hasLines = !!(dto.lines && dto.lines.length);
      // 有明细时不再单独建遗留单产品，避免重复；明细里的新产品行会在下方 syncOrderLines 建库
      const product = !hasLines && dto.product
        ? await tx.product.create({ data: dto.product })
        : null;
      const { linesJson, firstProductId } = await this.syncOrderLines(tx, dto.lines);
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
          contactId: contactId ?? undefined,
          productId: dto.productId ?? firstProductId ?? product?.id ?? undefined,
          linesJson,
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

  /** Chatter 操作/讨论记录：分页取消息流（机器人操作历史 + 人工评论）。
   * - 无 before：取最新 limit 条（asc 返回），hasMore 表示是否还有更早消息；
   * - 有 before（最旧已加载消息的 createdAt）：取该时间之前的更早 limit 条（asc）。
   * 前端瀑布流：初始拉最新一屏，滚动到顶时加载更早。 */
  async listChatter(
    resId: string,
    opts?: { limit?: number; before?: string },
    resModel = "deal",
  ) {
    const limit = Math.min(Math.max(opts?.limit ?? 30, 1), 100);
    const where: Prisma.ChatterMessageWhereInput = { resModel, resId };
    let rows: ChatterMessage[];
    if (opts?.before) {
      rows = await this.prisma.chatterMessage.findMany({
        where: { ...where, createdAt: { lt: new Date(opts.before) } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      });
    } else {
      rows = await this.prisma.chatterMessage.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      });
    }
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit).reverse(); // asc：最旧在前、最新在后
    return { messages: page.map((m) => this.toChatterDto(m)), hasMore };
  }

  private toChatterDto(m: ChatterMessage) {
    return {
      id: m.id,
      author: m.authorName,
      initials: m.authorIsBot ? "🤖" : m.authorName.slice(0, 1).toUpperCase(),
      body: m.body,
      timestamp: this.formatTs(m.createdAt),
      isBot: m.authorIsBot,
      isRecall: m.isRecall,
      authorId: m.authorId,
      authorAvatar: m.authorAvatar ?? null,
      createdAt: m.createdAt.toISOString(),
    };
  }

  /** 人工发布一条 Chatter 评论（区别于机器人操作记录）。authorId 为空时按匿名处理。 */
  async addComment(resId: string, body: string, authorId?: string, resModel = "deal") {
    let authorName = "用户";
    let authorAvatar: string | null = null;
    if (authorId) {
      const u = await this.prisma.contact.findUnique({ where: { id: authorId } });
      if (u) {
        authorName = u.name;
        authorAvatar = u.avatarUrl ?? null;
      }
    }
    const msg = await this.prisma.chatterMessage.create({
      data: {
        resModel,
        resId,
        authorId: authorId ?? null,
        authorName,
        authorAvatar,
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
      isRecall: msg.isRecall,
      authorId: msg.authorId,
      createdAt: msg.createdAt.toISOString(),
    };
  }

  /** 撤回一条 Chatter 消息：仅本人发送、且距发送不超过 3 分钟可撤回，删除后持久化。 */
  async deleteChatter(resId: string, msgId: string, actorId?: string, resModel = "deal") {
    const msg = await this.prisma.chatterMessage.findFirst({
      where: { id: msgId, resModel, resId },
    });
    if (!msg) throw new NotFoundException("消息不存在");
    if (!actorId || msg.authorId !== actorId) {
      throw new ForbiddenException("只能撤回自己发送的消息");
    }
    if (Date.now() - msg.createdAt.getTime() > 3 * 60 * 1000) {
      throw new ForbiddenException("只能撤回 3 分钟内的消息");
    }
    // 仿微信：不物理删除，而是把该消息转为「撤回」系统记录，保留一条提示
    await this.prisma.chatterMessage.update({
      where: { id: msgId },
      data: {
        isRecall: true,
        body: `${msg.authorName} 撤回了一条信息`,
      },
    });
    return { ok: true };
  }

  async updateDeal(id: string, dto: UpdateDealDto, actorId?: string) {
    const exists = await this.prisma.deal.findUnique({
      where: { id },
      include: { stage: true },
    });
    if (!exists) throw new NotFoundException(`Deal ${id} not found`);

    const actor = await this.getActorName(actorId);
    const hasLines = !!(dto.lines && dto.lines.length);

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
      // 线索确认（线索到达 → 需求确认）时，写一条更友好的系统提示
      if (exists.stage.key === "lead" && newStage.key === "qualify") {
        changeEvents.push("当前线索已确认为有效商机，离成功更近一步了呢～");
      } else {
        changeEvents.push(
          `${actor} 将阶段由「${exists.stage.title}」推进到「${newStage.title}」`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // 同步更新关联的往来单位 / 联系人：优先用提交上来的 contactId（可换公司/联系人）
      if (dto.contactId) {
        await tx.deal.update({ where: { id }, data: { contactId: dto.contactId } });
        if (dto.contact) {
          await tx.contact.update({ where: { id: dto.contactId }, data: dto.contact });
        }
      } else if (dto.contact && exists.contactId) {
        await tx.contact.update({ where: { id: exists.contactId }, data: dto.contact });
      }
      // 同步更新关联的产品需求
      if (dto.product && exists.productId && !hasLines) {
        const pd: Prisma.ProductUpdateInput = { ...dto.product };
        for (const key of ["price", "costPrice", "tax"] as const) {
          const v = (pd as Record<string, unknown>)[key];
          if (v != null && typeof v === "number") {
            (pd as Record<string, unknown>)[key] = new Prisma.Decimal(v);
          }
        }
        await tx.product.update({ where: { id: exists.productId }, data: pd });
      }
      // 订单明细：随商机保存；空 productId 的产品行在产品库新建
      const { linesJson, firstProductId } = await this.syncOrderLines(tx, dto.lines);
      if (linesJson !== null) {
        data.linesJson = linesJson;
        if (firstProductId) data.product = { connect: { id: firstProductId } };
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

  /** 删除商机：报价单/阶段日志按 onDelete:Cascade 级联删除；Chatter 无外键，按引用清理。 */
  async deleteDeal(id: string) {
    const exists = await this.prisma.deal.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Deal ${id} not found`);
    await this.prisma.chatterMessage.deleteMany({
      where: { resModel: "deal", resId: id },
    });
    await this.prisma.deal.delete({ where: { id } });
    return { ok: true };
  }
}
