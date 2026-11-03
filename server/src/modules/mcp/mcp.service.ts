import { Injectable, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { extname, join } from "path";
import { CrmService } from "../crm/crm.service";
import { DealLineDto } from "../crm/dto/deal-line.dto";
import { OauthService } from "../oauth/oauth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { UPLOAD_DIR } from "../upload/upload.controller";

/**
 * OMNIX MCP Server（最小可用实现，符合 MCP Streamable HTTP 规范）。
 *
 * 设计要点：
 * - 不依赖官方 MCP SDK（项目 tsconfig 为 commonjs + 经典 node 解析，引入 SDK 的 .js 子路径会触发类型解析/构建问题）。
 * - 直接用 JSON-RPC 2.0 分发 + 手写工具注册，Accio Work 作为 MCP Client 通过 HTTP 连入。
 * - 鉴权用 Bearer Token（MCP_TOKEN 环境变量），与 OMNIX 自身的 cookie session 体系解耦。
 * - 所有请求经 McpModule 的中间件挂载到 /mcp，在全局 session 守卫之前短路，因此不会被拦截。
 *
 * 暴露的工具（首期最小集）：
 * - create_lead      在「线索到达」阶段新建商机（含内联往来单位/产品/明细 + 幂等去重）
 * - search_contacts  按名称/邮箱/公司模糊搜索往来单位
 * - get_board        获取 CRM 看板（各阶段及旗下商机）
 * - get_deal         按 id 获取商机详情
 * - add_lead_note    向某商机的 Chatter 追加一条 AI 备注
 */

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_NAME = "omnix-mcp";
const SERVER_VERSION = "1.0.0";

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: { name?: string; arguments?: Record<string, unknown> };
}

interface McpToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  // 会话表：sessionId -> 已协商的能力（首期只记录存在性，逻辑无状态）
  private readonly sessions = new Map<string, { createdAt: number }>();

  // accio 服务账号 id 缓存（用于商机操作归因与 Chatter 署名）
  private accioUserId: string | null | undefined;

  /** Accio work 的 web 头像 URL（不展示的系统用户，用于 Chatter 署名头像，区别于系统机器人 ominXBot）。 */
  private static readonly ACCIO_AVATAR_URL = "/accio-avatar.ico";

  /** 店铺账号 → 系统来源（门店名）。espdzi=国际站寿春店，weitapet=国际站微它店 */
  private static readonly SHOP_TO_SOURCE: Record<string, string> = {
    espdzi: "国际站寿春店",
    weitapet: "国际站微它店",
  };

  /** 国家/地区 → 系统选项（DEAL_COUNTRY_RECORDS）的转译表（含中英文别名） */
  private static readonly COUNTRY_NORMALIZE: Record<string, string> = {
    "中国": "中国",
    "中国香港": "中国香港",
    "中国台湾": "中国台湾",
    "香港": "中国香港",
    "台湾": "中国台湾",
    "美国": "美国",
    "usa": "美国",
    "united states": "美国",
    "us": "美国",
    "加拿大": "加拿大",
    "canada": "加拿大",
    "墨西哥": "墨西哥",
    "mexico": "墨西哥",
    "巴西": "巴西",
    "brazil": "巴西",
    "德国": "德国",
    "germany": "德国",
    "英国": "英国",
    "uk": "英国",
    "united kingdom": "英国",
    "britain": "英国",
    "法国": "法国",
    "france": "法国",
  };

  /** 客户类型 → 系统选项（DEAL_CUSTOMER_TYPE_RECORDS）的转译表 */
  private static readonly CUSTOMER_TYPE_NORMALIZE: Record<string, string> = {
    "跨境电商": "跨境电商类型",
    "跨境电商类型": "跨境电商类型",
    "传统商超": "传统商超类型",
    "品牌": "品牌 & 代工类型",
    "代工": "品牌 & 代工类型",
    "教育": "教育文旅类型",
    "文旅": "教育文旅类型",
    "渠道": "渠道分销 & 代理类",
    "分销": "渠道分销 & 代理类",
    "代理": "渠道分销 & 代理类",
    "政企": "政企 & 单位采购类",
    "单位采购": "政企 & 单位采购类",
    "贸易": "传统贸易类型",
    "传统贸易": "传统贸易类型",
  };

  constructor(
    private readonly crm: CrmService,
    private readonly oauth: OauthService,
    private readonly prisma: PrismaService,
  ) {}

  // ---------- 中间件入口 ----------

  async handle(req: Request, res: Response): Promise<void> {
    if (!(await this.checkAuth(req, res))) return;

    switch (req.method) {
      case "POST":
        await this.handlePost(req, res);
        return;
      case "GET":
        this.handleGet(res);
        return;
      case "DELETE":
        this.handleDelete(req, res);
        return;
      default:
        res.status(405).json(this.error(null, -32601, "Method not allowed"));
        return;
    }
  }

  // ---------- 鉴权 ----------

  /**
   * 从 settings 表读取启用状态与令牌，环境变量 MCP_TOKEN 作为兜底。
   * 优先级：DB 中 mcp.token > 环境变量 MCP_TOKEN；两者皆空则开发免鉴权（仅告警）。
   */
  private async checkAuth(req: Request, res: Response): Promise<boolean> {
    const [enabledRow, tokenRow] = await this.prisma.$transaction([
      this.prisma.setting.findUnique({ where: { key: "mcp.enabled" } }),
      this.prisma.setting.findUnique({ where: { key: "mcp.token" } }),
    ]);
    const enabled = enabledRow ? enabledRow.value === "true" : true;
    const token = tokenRow?.value || process.env.MCP_TOKEN || "";

    if (!enabled) {
      res.status(403).json(this.error(null, -32000, "MCP server is disabled"));
      return false;
    }

    const header = (req.headers["authorization"] as string | undefined) ?? "";
    const bearer = header.toLowerCase().startsWith("bearer ")
      ? header.slice(7).trim()
      : null;

    // 1) 静态令牌（设置页生成 / MCP_TOKEN 环境变量），保持原有精确匹配
    if (bearer && token && bearer === token) return true;
    // 2) OAuth 访问令牌（浏览器授权流程发放）
    if (bearer && (await this.oauth.validateAccessToken(bearer))) return true;

    // 鉴权失败：返回 401 并声明 OAuth 资源元数据，便于客户端自动发现授权端点
    const host = req.get("x-forwarded-host") || req.get("host");
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const origin = `${proto}://${host}`;
    res.setHeader(
      "WWW-Authenticate",
      `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
    );
    if (bearer) {
      res.status(401).json(this.error(null, -32001, "Unauthorized: invalid MCP token"));
      return false;
    }
    if (token) {
      res.status(401).json(this.error(null, -32001, "Unauthorized: missing MCP token"));
      return false;
    }
    // 完全未配置令牌：开发便捷放行（仅告警，生产环境切勿如此）
    this.logger.warn("MCP 未配置令牌，/mcp 处于无鉴权状态，生产环境请勿如此部署");
    return true;
  }

  // ---------- POST：JSON-RPC 分发 ----------

  private async handlePost(req: Request, res: Response): Promise<void> {
    const body = await this.readBody(req);

    // 批量请求
    if (Array.isArray(body)) {
      const results: unknown[] = [];
      for (const item of body as any[]) {
        results.push(await this.dispatch(item as JsonRpcRequest, req));
      }
      res.status(200).json(results);
      return;
    }

    const rpc = body as JsonRpcRequest;

    // 通知类（无 id）只回 202
    if (rpc.id === undefined || rpc.id === null) {
      if (rpc.method === "initialize") {
        // 部分客户端把 initialize 当通知发，仍回包
      } else {
        res.status(202).end();
        return;
      }
    }

    const isInit = rpc.method === "initialize";
    const result = await this.dispatch(rpc, req);

    // initialize 需在响应头带回 sessionId
    if (isInit) {
      const sid = randomUUID();
      this.sessions.set(sid, { createdAt: Date.now() });
      res.setHeader("Mcp-Session-Id", sid);
    }
    res.status(200).json(result);
  }

  private async dispatch(rpc: JsonRpcRequest, req: Request): Promise<unknown> {
    const id = rpc.id ?? null;
    try {
      switch (rpc.method) {
        case "initialize":
          return this.jsonrpc(id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
          });
        case "ping":
          return this.jsonrpc(id, {});
        case "tools/list":
          return this.jsonrpc(id, { tools: this.listTools() });
        case "tools/call":
          return await this.callTool(rpc, req);
        default:
          return this.error(id, -32601, `Method not found: ${rpc.method}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`MCP dispatch error: ${msg}`);
      return this.error(id, -32603, msg);
    }
  }

  // ---------- GET：SSE 流（服务端→客户端通知，首期保持空流） ----------

  private handleGet(res: Response): void {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    // 心跳，避免代理过早断开；首期不推送业务通知
    const timer = setInterval(() => res.write(": keep-alive\n\n"), 15000);
    res.on("close", () => clearInterval(timer));
  }

  // ---------- DELETE：会话终止 ----------

  private handleDelete(req: Request, res: Response): void {
    const sid = req.headers["mcp-session-id"] as string | undefined;
    if (sid) this.sessions.delete(sid);
    res.status(200).json({ jsonrpc: "2.0", result: {}, id: null });
  }

  // ---------- 工具定义 ----------

  private listTools(): McpToolDef[] {
    return [
      {
        name: "create_lead",
        description:
          "在 OMNIX 新建一条「线索到达」阶段的商机（来自 Accio 抓取的店铺询盘）。按字段逻辑拆分：客户画像（公司/联系人/邮箱/电话/来源/客户类型/国家地区/官网）落入往来单位；产品需求拆解为 OMNIX 的订单明细 JSON 补充到商机；AI 初判写入 Chatter 并署名「Accio work」。支持按 inquiryId 幂等去重。\n图片接入：products[].image 直接传「外部图床 URL」即可（如店铺/阿里 CDN 上的产品图）——服务端会自动下载并转存到本地 /uploads 后替换，浏览器无需直连图床（规避防盗链 403），抓不到时保留原 URL 不阻断建单。\n数量拆解：从询盘标题/正文拆解每条产品的数量与单位（如 \"PET feeder, 1000pcs\" → quantity=1000、unit=\"pcs\"）。\n【重要】字段取值纪律：询盘里没有的信息一律【直接省略该字段】，严禁传 \"undefined\"/\"null\"/\"@image:image.png\" 之类的占位值或附件引用；没有图片就不传 image。客户类型仅在能明确归类时填写真实业务类型（如 跨境电商类型），判断不出就省略（留空）——不要传「待完善」：「待完善」是系统对「由 Accio AI 抓取生成、信息不保真」的客户打的“信息待核实”标记，按来源自动打，无需也不应传。\n【中文翻译】所有文本字段必须先翻译成【简体中文】再入库：contact 的 name/company、products 的 name/description、country、source、aiSummary 等一律中文；仅保留不可译的专有名词——品牌名、型号/货号、规格数字、单位代号（pcs 等）、邮箱/网址/电话号码保持原文；金额与数量保持数字不变。\n【入库标准复核】建单前逐项自检：① 必填：contact.name（往来单位/联系人名称）必须有，缺失则不要调用本工具；邮箱非必填——没有就不传 email 字段，绝不编造/猜测邮箱地址（客户无邮箱也能正常建单）;② customerType 只能是真实业务类型之一（跨境电商类型 / 传统商超类型 / 品牌 & 代工类型 / 教育文旅类型 / 渠道分销 & 代理类 / 政企 & 单位采购类 / 传统贸易类型），拿不准就省略（留空，绝不传「待完善」——那是系统对 AI 生成客户的信息待核实标记，按来源自动打）；绝不能自造类型；③ country 用中文国家/地区名（服务端会转译为系统选项），无法对应就省略；④ source 用系统来源名（店铺映射或 Accio），不确定就省略；⑤ products 每条至少要有 name 或 description，quantity/price 仅在询盘【明确给出】时才填数字、不要臆测，unit 用 pcs/个/套等系统常见值，image 仅真实图床 URL；⑥ 商机「描述」字段由系统按产品名称自动生成，【不要】把整段询盘总结塞进 description——总结/初判等其余内容统一写进 aiSummary 字段（自动进入 Chatter 备注）；⑦ 以上任一项不合规但字段存在时，先修正再传，仍无法合规则从简（省略该字段），绝不以占位值塞入。",
        inputSchema: {
          type: "object",
          properties: {
            inquiryId: {
              type: "string",
              description: "外部线索唯一 ID（如 Accio 的 inquiry id），用于幂等去重",
            },
            shop: {
              type: "string",
              enum: ["espdzi", "weitapet"],
              description:
                "来源店铺账号：espdzi→国际站寿春店，weitapet→国际站微它店（映射为商机来源）",
            },
            contact: {
              type: "object",
              description: "线索对应的客户画像 / 联系人",
              properties: {
                name: { type: "string", description: "往来单位/联系人名称（必填，请用中文）" },
                email: { type: "string", description: "电子邮箱（选填：有就填。系统按邮箱或客户名自动去重复用已有客户，不会重复建档；没有就不传该字段，客户仍可正常建单）" },
                phone: { type: "string", description: "电话号码" },
                company: { type: "string", description: "所属公司（请用中文）" },
                country: { type: "string", description: "国家地区（请翻译成中文，服务端转译为系统选项）" },
                website: { type: "string", description: "官网" },
              },
              required: ["name"],
            },
            customerType: {
              type: "string",
              description:
                "客户业务类型（会转译为系统选项，如 跨境电商类型 / 传统商超类型）；仅在能明确归类时填写，判断不出就省略（留空）。注意：不要传「待完善」——那是系统对 AI 生成客户的信息待核实标记，自动打，无需传",
            },
            source: {
              type: "string",
              description: "来源（请翻译成中文，如 跨境电商；若传则优先于 shop 映射，否则用 shop 映射门店名，再否则 Accio）",
            },
            products: {
              type: "array",
              description: "产品需求列表，每条拆解为 OMNIX 订单明细行（type=product）。每条可附 productUrl（引流来源链接）与 productId（店铺商品 ID），系统随商机明细存储，用于审计「客户由该链接引流进来」",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "产品名称（请用中文；不可译的型号/货号保留原文）" },
                  description: { type: "string", description: "产品需求描述（必填，请用中文）" },
                  quantity: {
                    type: "number",
                    description:
                      "数量：从询盘标题/正文拆解（如 \"1000pcs\" → 1000、\"2千个\" → 2000）；询盘确实没提数量就【省略该字段】，严禁传 \"undefined\" 等占位值",
                  },
                  unit: {
                    type: "string",
                    description: "单位（如 pcs/个/套，随数量一并拆解）；无则省略该字段",
                  },
                  price: {
                    type: "number",
                    description: "单价（元）；询盘未给出报价就省略该字段，不要估一个数",
                  },
                  costPrice: { type: "number", description: "成本价（元），无则省略" },
                  taxRate: { type: "number", description: "税率（如 13 表示 13%）；缺省由系统按 13% 货 专票默认填入，仅当询盘明确其他税率时才覆盖" },
                  image: {
                    type: "string",
                    description:
                      "产品图片 URL：仅当询盘带真实可访问的图床/CDN 链接时传入（服务端自动下载转存到本地 /uploads，规避防盗链 403）；没有图片就【省略该字段】，严禁传 \"@image:image.png\" 之类的附件引用、占位符或 \"undefined\"",
                  },
                  productUrl: {
                    type: "string",
                    description:
                      "产品链接 / 引流来源链接（如店铺商品详情页 URL）。记录客户是由该链接引流进来的，用于来源归因与审计；没有就省略",
                  },
                  productId: {
                    type: "string",
                    description:
                      "店铺商品 ID（外部平台商品编号，区别于 OMNIX 内部产品 id）。随产品链接一并记录，便于回溯询盘来源；没有就省略",
                  },
                },
              },
            },
            title: {
              type: "string",
              description:
                "【不要传】商机标题由系统按命名逻辑自动组成（产品描述 数量 国家），与手动建单一致；传入的标题会被忽略",
            },
            description: {
              type: "string",
              description:
                "【系统自动填充】商机描述 = 产品名称（多产品用、分隔），无需传；如需记录总结/初判等其余内容，请填 aiSummary 字段（自动写入 Chatter 备注）",
            },
            tag: { type: "string", description: "标签，如 新签/续约" },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            amount: { type: "number", description: "金额（元）；缺省由产品需求明细派生" },
            assignee: { type: "string", description: "业务员" },
            aiSummary: {
              type: "string",
              description: "AI 对线索的初判/摘要（请用中文，写入 Chatter，署名 Accio work）",
            },
          },
          required: ["contact"],
        },
      },
      {
        name: "search_contacts",
        description: "按名称 / 邮箱 / 公司模糊搜索 OMNIX 往来单位或联系人，用于判重或补全。",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            limit: { type: "number", description: "返回条数上限，默认 5" },
          },
          required: ["query"],
        },
      },
      {
        name: "get_board",
        description: "获取 CRM 看板：各阶段（含「线索到达」）及旗下商机，用于查询当前线索。",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_deal",
        description: "按 id 获取商机详情（含关联往来单位、产品、阶段日志）。",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
      {
        name: "add_lead_note",
        description: "向某商机的 Chatter 追加一条 AI 备注（如初判、拟回复、下一步建议）。",
        inputSchema: {
          type: "object",
          properties: {
            dealId: { type: "string" },
            text: { type: "string", description: "备注正文" },
          },
          required: ["dealId", "text"],
        },
      },
    ];
  }

  // ---------- 工具调用 ----------

  private async callTool(rpc: JsonRpcRequest, req: Request): Promise<unknown> {
    const id = rpc.id ?? null;
    const name = rpc.params?.name;
    const args = rpc.params?.arguments ?? {};
    if (!name) return this.error(id, -32602, "Missing tool name");

    try {
      const content = await this.runTool(name, args, req);
      return this.jsonrpc(id, { content, isError: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`tool ${name} failed: ${msg}`);
      return this.jsonrpc(id, {
        content: [{ type: "text", text: `工具执行失败：${msg}` }],
        isError: true,
      });
    }
  }

  private async runTool(
    name: string,
    args: Record<string, unknown>,
    req: Request,
  ): Promise<Array<{ type: "text"; text: string }>> {
    switch (name) {
      case "create_lead":
        return [await this.createLead(args, req)];
      case "search_contacts":
        return [await this.searchContacts(args)];
      case "get_board":
        return [await this.getBoard()];
      case "get_deal":
        return [await this.getDeal(args)];
      case "add_lead_note":
        return [await this.addLeadNote(args)];
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async createLead(
    args: Record<string, unknown>,
    req: Request,
  ): Promise<{ type: "text"; text: string }> {
    const inquiryId = args.inquiryId as string | undefined;
    const contact = args.contact as Record<string, unknown> | undefined;
    if (!contact || !contact.name) throw new Error("contact.name 必填");

    // 当前登录用户（仅 OAuth 授权流程能识别；静态令牌无用户上下文则为 null）。
    // MCP 走「浏览器授权登录」时，新建商机的负责人默认归属该用户。
    const currentUserId = await this.resolveCurrentUserId(req);
    // 负责人：显式 assignee 优先；缺省时若已登录则归属当前用户（否则为 Accio 引入、负责人留空）
    let assignee: string | undefined =
      args.assignee != null ? String(args.assignee).trim() || undefined : undefined;
    if (!assignee && currentUserId) {
      const u = await this.prisma.contact.findUnique({ where: { id: currentUserId } });
      assignee = u?.name ?? undefined;
    }

    // 幂等去重：相同 inquiryId 已建单则直接返回
    if (inquiryId) {
      const existing = await this.prisma.deal.findFirst({
        where: { meta: `accio:ref=${inquiryId}` },
        select: { id: true, title: true },
      });
      if (existing) {
        return this.text(
          JSON.stringify(
            { dealId: existing.id, title: existing.title, stage: "lead", status: "existing", note: "幂等命中：该 inquiryId 已建单" },
            null,
            2,
          ),
        );
      }
    }

    // 来源：显式 source > 店铺映射门店名 > Accio
    const shop = args.shop as string | undefined;
    const source =
      (typeof args.source === "string" && args.source.trim()) ||
      (shop && McpService.SHOP_TO_SOURCE[shop]) ||
      "Accio";

    // 客户画像：拆分到往来单位字段（来源/客户类型/国家地区按系统选项转译）
    const contactDto = {
      name: String(contact.name).trim(),
      email: contact.email ? String(contact.email).trim() : undefined,
      phone: contact.phone ? String(contact.phone).trim() : undefined,
      company: contact.company ? String(contact.company).trim() : undefined,
      country: this.normalizeCountry(contact.country as string | undefined),
      website: contact.website ? String(contact.website).trim() : undefined,
      customerType:
        this.normalizeCustomerType(args.customerType as string | undefined) ?? undefined,
      // 由 Accio AI 抓取生成的客户：信息不保真，标记待核实（前端展示「待完善」徽标）。
      // 仅新建客户时写入 true；按邮箱复用的存量客户不会被改写（保持原核实状态）。
      aiGenerated: true,
    };

    // 产品需求 → OMNIX 订单明细 JSON（补充到商机产品需求）
    const lines = this.toDealLines(args);
    // 外部图床（Accio 抓取的询盘图常带防盗链，浏览器直连 403）→ 转存本地 /uploads
    await this.localizeLineImages(lines);
    const amount =
      args.amount != null ? Number(args.amount) : this.amountFromLines(lines);

    const dto: Record<string, unknown> = {
      // 标题：按系统命名逻辑自动组成「产品描述(+等) 数量 国家」，与手动建单一致；
      // 不采纳 Accio 传入的 title（询盘标题不符合系统命名规范，会导致看板显示混乱）
      title: this.composeDealTitle(lines, contactDto.country),
      // 描述：仅保留产品名称（多产品用、分隔），其余总结/初判内容统一进 Chatter 备注（aiSummary）。
      // 不采纳 Accio 传入的 description，避免把整段询盘总结塞进描述导致看板/详情混乱。
      description: this.composeDescription(lines),
      tag: args.tag,
      priority: args.priority,
      amount,
      // 负责人：显式 assignee 优先；MCP 走 OAuth 登录授权时缺省归属当前登录用户（否则为 Accio 引入、负责人留空）
      assignee,
      source,
      meta: inquiryId ? `accio:ref=${inquiryId}` : undefined,
      contact: contactDto,
      lines: lines.length ? lines : undefined,
    };

    // 署名用「Accio work」隐藏系统用户（web 头像）
    const actorId = await this.ensureAccioUser();
    const deal = await this.crm.createDeal(dto as never, actorId);

    const aiSummary = args.aiSummary as string | undefined;
    if (aiSummary) {
      await this.crm.addComment(deal.id, aiSummary, actorId ?? undefined);
    }

    return this.text(
      JSON.stringify(
        { dealId: deal.id, title: deal.title, stage: "lead", status: "created", source },
        null,
        2,
      ),
    );
  }

  /**
   * 按系统命名逻辑组成商机标题（与前端 DealForm composedTitle 一致）：
   * 「首个产品描述(多产品加"等") 总数量 国家」，空段跳过，空格连接。
   * 例：定制 PU 减压球电话支架 1000 中国 / PET feeder 1000pcs 1000 美国。
   */
  private composeDealTitle(lines: DealLineDto[], country?: string): string | undefined {
    const productLines = lines.filter((l) => l.type === "product");
    const primary = productLines[0];
    if (!primary) return undefined;
    const desc = (primary.description ?? "").trim();
    const titleDesc = desc + (productLines.length > 1 ? "等" : "");
    const totalQty = productLines.reduce((s, l) => s + (typeof l.quantity === "number" ? l.quantity : 0), 0);
    return [titleDesc, totalQty ? String(totalQty) : "", (country ?? "").trim()]
      .filter(Boolean)
      .join(" ")
      .trim() || undefined;
  }

  /**
   * 商机描述：仅含产品名称（多产品用、分隔），不含数量/国家/总结内容。
   * 其余总结与 AI 初判统一进 Chatter 备注（aiSummary 字段）。
   */
  private composeDescription(lines: DealLineDto[]): string | undefined {
    const names = lines
      .filter((l) => l.type === "product" && l.name)
      .map((l) => l.name as string);
    const text = names.join("、").trim();
    return text || undefined;
  }

  /** 从请求解析当前登录用户 id：仅 OAuth 授权流程（浏览器登录）能识别，静态令牌返回 null。 */
  private async resolveCurrentUserId(req: Request): Promise<string | null> {
    const header = (req.headers["authorization"] as string | undefined) ?? "";
    const bearer = header.toLowerCase().startsWith("bearer ")
      ? header.slice(7).trim()
      : null;
    if (!bearer) return null;
    return this.oauth.validateAccessToken(bearer);
  }

  /** 转译国家/地区为系统选项（不区分大小写；未命中回退原值）。 */
  private normalizeCountry(input?: string): string | undefined {
    if (!input) return undefined;
    const key = input.trim().toLowerCase();
    return McpService.COUNTRY_NORMALIZE[key] ?? McpService.COUNTRY_NORMALIZE[input.trim()] ?? input.trim();
  }

  /** 转译客户类型为系统选项；未命中回退原值。 */
  private normalizeCustomerType(input?: string): string | undefined {
    if (!input) return undefined;
    const key = input.trim().toLowerCase();
    return (
      McpService.CUSTOMER_TYPE_NORMALIZE[key] ??
      McpService.CUSTOMER_TYPE_NORMALIZE[input.trim()] ??
      input.trim()
    );
  }

  /** 把产品需求拆解为 OMNIX 订单明细行（type=product）。name 遵循系统命名逻辑：有则取，无则空。 */
  private toDealLines(args: Record<string, unknown>): DealLineDto[] {
    const lines: DealLineDto[] = [];
    const products = Array.isArray(args.products) ? (args.products as Record<string, unknown>[]) : [];
    for (const p of products) {
      const name = this.cleanStr(p.name) ?? "";
      const description = (this.cleanStr(p.description) ?? name).trim();
      // 数量拆解：显式 quantity 优先，其次从名称/描述文本解析（如 "1000pcs"）
      const parsed = this.parseQuantity(`${name} ${description}`);
      const quantity = this.toNum(p.quantity) ?? parsed?.quantity;
      const unit = this.cleanStr(p.unit) ?? parsed?.unit;
      // 图片：仅接受真实 URL（http/https 或本地 /uploads），"@image:..." 等附件引用/占位符一律丢弃
      const rawImage = this.cleanStr(p.image);
      const image = rawImage && /^(https?:\/\/|\/)/i.test(rawImage) ? rawImage : undefined;
      // 税项：默认 13% 货 专票（与前端 OrderLinesTable 新建行的默认值一致），
      // 缺省不传税率时由系统补齐，确保 MCP 创建的产品需求行也带默认税率。
      const taxRate = this.toNum(p.taxRate) ?? 13;
      const taxId = this.cleanStr(p.taxId) ?? "tax-13g-s";
      // 询盘引流来源（外部标识，区别于内部 productId）：记录客户是由该链接引流进来的，用于来源归因/审计
      const sourceProductUrl = this.cleanStr(p.productUrl) ?? undefined;
      const sourceProductId = this.cleanStr(p.productId) ?? undefined;
      lines.push({
        type: "product",
        name: name || undefined,
        description: description || undefined,
        quantity,
        unit,
        price: this.toNum(p.price),
        costPrice: this.toNum(p.costPrice),
        taxRate,
        taxId,
        image,
        sourceProductUrl,
        sourceProductId,
      });
    }
    // 兼容旧调用：单产品 product 对象
    if (lines.length === 0 && args.product && typeof args.product === "object") {
      return this.toDealLines({ products: [args.product as Record<string, unknown>] });
    }
    return lines;
  }

  /** 清洗字符串：「空 / undefined / null / 无 / -」等一律视为未提供（返回 undefined）。 */
  private cleanStr(v: unknown): string | undefined {
    if (v == null) return undefined;
    const s = String(v).trim();
    if (!s) return undefined;
    const low = s.toLowerCase();
    if (["undefined", "null", "none", "n/a", "na", "无", "-"].includes(low)) return undefined;
    return s;
  }

  /** 数量/价格清洗：接受 number 或数字字符串（容忍 "1,000" / "约1000pcs"），无效返回 undefined。 */
  private toNum(v: unknown): number | undefined {
    if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
    const s = this.cleanStr(v);
    if (!s) return undefined;
    const m = s.replace(/[,，]/g, "").match(/-?\d+(?:\.\d+)?/);
    if (!m) return undefined;
    const n = Number(m[0]);
    return Number.isFinite(n) ? n : undefined;
  }

  /**
   * 从询盘文本拆解数量与单位（如 "PET feeder, 1000pcs" → 1000 + "pcs"，"2千个" → 2000 + "个"）。
   * 优先匹配「数量：1000」类显式标注；否则匹配「数字紧贴单位」；裸数字不带单位不误判。
   */
  private parseQuantity(text: string): { quantity: number; unit?: string } | undefined {
    if (!text) return undefined;
    const NUM = String.raw`(\d[\d,，]*(?:\.\d+)?)`;
    const MULT = String.raw`(千|[kK]|[wW]|万)?`;
    const UNIT = String.raw`(?:\s*(pcs\.?|pieces?|units?|sets?|pairs?|个|只|件|套|台|支|包|箱|双|枚|卷|张|盒|条|米))?`;
    // 1) 显式标注：「数量：1000」/「数量 1000pcs」
    let m =
      text.match(new RegExp(`数量[^\\d]{0,4}${NUM}${MULT}${UNIT}`)) ??
      text.match(new RegExp(`${NUM}${MULT}${UNIT}`, "i"));
    if (!m) return undefined;
    let n = Number(m[1].replace(/[,，]/g, ""));
    if (!Number.isFinite(n) || n <= 0) return undefined;
    const mult = (m[2] ?? "").toLowerCase();
    if (mult === "k" || mult === "千") n *= 1000;
    else if (mult === "w" || mult === "万") n *= 10000;
    const rawUnit = (m[3] ?? "").trim().replace(/\.$/, "");
    const unit = rawUnit ? (/[a-z]/i.test(rawUnit) ? rawUnit.toLowerCase() : rawUnit) : undefined;
    return { quantity: n, unit: unit || undefined };
  }

  /** 由明细行派生金额（Σ 单价×数量），无明细返回 undefined。 */
  private amountFromLines(lines: DealLineDto[]): number | undefined {
    let sum = 0;
    let any = false;
    for (const l of lines) {
      if (l.type && l.type !== "product") continue;
      const qty = typeof l.quantity === "number" ? l.quantity : 0;
      const price = typeof l.price === "number" ? l.price : 0;
      if (price || qty) any = true;
      sum += price * qty;
    }
    return any ? Math.round(sum * 100) / 100 : undefined;
  }

  /** 把明细行里的外部图片 URL 抓取转存为本地 /uploads/...（失败保留原 URL，不阻断建单）。 */
  private async localizeLineImages(lines: DealLineDto[]): Promise<void> {
    await Promise.all(
      lines.map(async (l) => {
        if (!l.image || !/^https?:\/\//i.test(l.image)) return;
        try {
          l.image = await this.fetchImageToLocal(l.image);
        } catch (e) {
          this.logger.warn(`外部产品图转存失败，保留原 URL：${l.image}（${String(e)}）`);
        }
      }),
    );
  }

  /** 下载单张外部图片并落盘到 UPLOAD_DIR，返回可访问的本地 URL。 */
  private async fetchImageToLocal(url: string): Promise<string> {
    // 防盗链：多数图床（阿里/淘宝 CDN 等）按 Referer 拦截「空引用」直连。
    // 先用「带上来源域名 Referer」抓取；若仍失败（部分 CDN 拒绝外来 Referer），再退回无 Referer 重试。
    const origin = (() => {
      try {
        return new URL(url).origin + "/";
      } catch {
        return "https://www.taobao.com/";
      }
    })();
    const headerVariants: Record<string, string>[] = [
      {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: origin,
      },
      {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    ];

    let lastErr: unknown;
    for (const headers of headerVariants) {
      try {
        const res = await fetch(url, {
          headers,
          redirect: "follow",
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
          lastErr = new Error(`HTTP ${res.status}`);
          continue;
        }
        const type = (res.headers.get("content-type") ?? "").toLowerCase();
        if (!type.startsWith("image/")) {
          lastErr = new Error(`非图片类型：${type || "未知"}`);
          continue;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength > 5 * 1024 * 1024) {
          lastErr = new Error("超过 5MB 上限");
          continue;
        }
        const sub = type.split("/")[1]?.split(";")[0]; // jpeg / png / webp ...
        let ext = extname(new URL(url).pathname).toLowerCase();
        if (!ext || ext.length > 5) ext = sub ? `.${sub === "jpeg" ? "jpg" : sub}` : ".png";
        if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
        const name = `${randomUUID()}${ext}`;
        await writeFile(join(UPLOAD_DIR, name), buf);
        return `/uploads/${name}`;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  private async searchContacts(args: Record<string, unknown>): Promise<{ type: "text"; text: string }> {
    const query = (args.query as string) ?? "";
    const limit = typeof args.limit === "number" ? args.limit : 5;
    const rows = await this.prisma.contact.findMany({
      where: {
        isSystem: false,
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { company: { contains: query } },
        ],
      },
      take: limit,
      select: { id: true, name: true, email: true, company: true, country: true },
    });
    return this.text(JSON.stringify(rows, null, 2));
  }

  private async getBoard(): Promise<{ type: "text"; text: string }> {
    const stages = await this.prisma.stage.findMany({
      orderBy: { position: "asc" },
      include: {
        deals: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            amount: true,
            assignee: true,
            source: true,
            contactId: true,
          },
        },
      },
    });
    const payload = stages.map((s) => ({
      ...s,
      deals: s.deals.map((d) => ({ ...d, amount: d.amount?.toNumber() ?? null })),
    }));
    return this.text(JSON.stringify(payload, null, 2));
  }

  private async getDeal(args: Record<string, unknown>): Promise<{ type: "text"; text: string }> {
    const id = args.id as string;
    if (!id) throw new Error("id 必填");
    const deal = await this.crm.getDeal(id);
    return this.text(JSON.stringify(deal, null, 2));
  }

  private async addLeadNote(args: Record<string, unknown>): Promise<{ type: "text"; text: string }> {
    const dealId = args.dealId as string;
    const text = args.text as string;
    if (!dealId || !text) throw new Error("dealId 与 text 必填");
    const actorId = await this.ensureAccioUser();
    const msg = await this.crm.addComment(dealId, text, actorId ?? undefined);
    return this.text(JSON.stringify(msg, null, 2));
  }

  // ---------- 辅助 ----------

  /**
   * 确保「Accio work」系统用户存在（不展示的 MCP 代理用户，用于 Chatter 署名 + web 头像）。
   * 复用 seed 已建的 accio@omnix.dev 账号：置为 isSystem（不在联系人列表出现）、改名 Accio work、补头像。
   */
  private async ensureAccioUser(): Promise<string> {
    const EMAIL = "accio@omnix.dev";
    let u = await this.prisma.contact.findUnique({ where: { email: EMAIL } });
    if (!u) {
      u = await this.prisma.contact.create({
        data: {
          email: EMAIL,
          name: "Accio work",
          type: "user",
          role: "user",
          isSystem: true,
          avatarUrl: McpService.ACCIO_AVATAR_URL || null,
        },
      });
    } else if (!u.isSystem || u.name !== "Accio work" || !u.avatarUrl) {
      u = await this.prisma.contact.update({
        where: { id: u.id },
        data: {
          isSystem: true,
          name: "Accio work",
          avatarUrl: u.avatarUrl ?? (McpService.ACCIO_AVATAR_URL || null),
        },
      });
    }
    this.accioUserId = u.id;
    return u.id;
  }

  private async readBody(req: Request): Promise<any> {
    if ((req as { body?: unknown }).body) return (req as { body: unknown }).body;
    return new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch {
          resolve({});
        }
      });
    });
  }

  private text(s: string): { type: "text"; text: string } {
    return { type: "text", text: s };
  }

  private jsonrpc(id: string | number | null, result: unknown) {
    return { jsonrpc: "2.0", id, result };
  }

  private error(id: string | number | null, code: number, message: string) {
    return { jsonrpc: "2.0", id, error: { code, message } };
  }
}
