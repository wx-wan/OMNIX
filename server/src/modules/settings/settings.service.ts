import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { networkInterfaces } from "os";
import { PrismaService } from "../../prisma/prisma.service";

const KEY_ENABLED = "mcp.enabled";
const KEY_TOKEN = "mcp.token";
const KEY_DESIGN_AUTO_DECOMPOSE = "design.auto_decompose";
const KEY_WORKSPACE_DEFAULTS = "workspace.defaults";
/** 迁移标记：已有 KV 首次读取时把内置预置任务合入空阶段，之后完全以用户配置为准。 */
const KEY_WORKSPACE_DEFAULTS_SEEDED = "workspace.defaults.seeded";

/** 阶段默认事项：新建项目时按阶段自动创建的任务 / 问题。 */
export type SeedAssigneeRole =
  | "design"
  | "art"
  | "operations"
  | "shipping"
  | "purchase"
  | "engineering"
  | "lead";

const ASSIGNEE_ROLES: SeedAssigneeRole[] = [
  "design", "art", "operations", "shipping", "purchase", "engineering", "lead",
];

export interface StageDefaultItem {
  title: string;
  description?: string;
  type?: string;
  action?: string;
  /** 经办角色：按部门解析（设计/技术/采购），缺省或 lead 用项目负责人。 */
  assigneeRole?: SeedAssigneeRole;
}

/** 工作区默认值：事项类型 / 操作 / 阶段（描述、天数、默认 task/issue），JSON 存 KV。 */
export interface WorkspaceDefaults {
  defaultItemType: string;
  defaultAction: string;
  stages: {
    key: string;
    en: string;
    zh: string;
    description: string;
    days: number | null;
    defaultTasks: StageDefaultItem[];
    defaultIssues: StageDefaultItem[];
  }[];
}

/** 新建项目时的预置任务（原前端 SEED_TASKS，现由首选项托管、后端创建时读取）。 */
type SeededTask = StageDefaultItem & { stage: string };
const SEED_TASKS: SeededTask[] = [
  { stage: "requirement", title: "建立客户画像", description: "梳理目标客户的行业背景、采购角色与决策链路，明确关键诉求与痛点，为后续方案与报价提供依据。", assigneeRole: "lead", type: "input", action: "contact" },
  { stage: "requirement", title: "梳理产品需求", description: "汇总客户对功能、规格、交付与验收的期望，形成可追踪的需求清单，作为打样与生产的输入。", assigneeRole: "lead" },
  { stage: "quotation", title: "价格核算", description: "核算材料、模具、人工与物流成本，形成报价基准。", assigneeRole: "lead" },
  { stage: "quotation", title: "发送报价", description: "向客户正式发送报价单并确认接收。", assigneeRole: "lead" },
  { stage: "quotation", title: "报价反馈", description: "跟进客户对报价的反馈并记录调整意见。", assigneeRole: "lead" },
  { stage: "sample", title: "收取样品费用", description: "确认并收取客户样品费用。", assigneeRole: "lead" },
  { stage: "sample", title: "下发设计单", description: "向设计团队下达设计任务单。", assigneeRole: "lead" },
  { stage: "sample", title: "设计确认", description: "审核并确认设计方案。", assigneeRole: "lead" },
  { stage: "sample", title: "下发工程单", description: "向工程团队下达工程任务单。", assigneeRole: "lead" },
  { stage: "sample", title: "寄样", description: "安排样品寄送并跟踪物流。", assigneeRole: "lead" },
  { stage: "sample", title: "客户确认", description: "跟进客户对样品的确认结果。", assigneeRole: "lead" },
  { stage: "sample", title: "画图+渲染", description: "完成产品结构设计图与效果图渲染。", assigneeRole: "design" },
  { stage: "sample", title: "安排3D打印", description: "根据设计图安排 3D 打印验证。", assigneeRole: "design" },
  { stage: "sample", title: "移交模具店", description: "将确认的设计移交模具供应商。", assigneeRole: "design" },
  { stage: "sample", title: "安排下缸", description: "安排下缸试产并跟进首件。", assigneeRole: "design" },
  { stage: "sample", title: "通知模种到厂", description: "协调模种到厂时间并通知相关方。", assigneeRole: "design" },
  { stage: "sample", title: "采购大货模", description: "采购大货生产所需模具。", assigneeRole: "purchase" },
  { stage: "sample", title: "采购夹具", description: "采购生产夹具。", assigneeRole: "purchase" },
  { stage: "sample", title: "采购钢板", description: "采购所需钢板原材料。", assigneeRole: "purchase" },
  { stage: "sample", title: "包装辅材采购", description: "采购包装辅料。", assigneeRole: "purchase" },
  { stage: "sample", title: "组装辅材采购", description: "采购组装所需辅料。", assigneeRole: "purchase" },
  { stage: "sample", title: "安排打样", description: "安排工程打样并跟进进度。", assigneeRole: "engineering" },
  { stage: "sample", title: "创建成品档案", description: "建立成品技术档案。", assigneeRole: "engineering" },
  { stage: "sample", title: "创建成品装配清单", description: "编制成品 BOM 与装配清单。", assigneeRole: "engineering" },
];

const seedTasksFor = (stageKey: string): StageDefaultItem[] =>
  SEED_TASKS.filter((task) => task.stage === stageKey).map(({ stage: _stage, ...item }) => item);

export const DEFAULT_WORKSPACE_DEFAULTS: WorkspaceDefaults = {
  defaultItemType: "output",
  defaultAction: "",
  stages: [
    { key: "requirement", en: "Requirement", zh: "需求", description: "梳理客户需求与产品要求", days: 2, defaultTasks: seedTasksFor("requirement"), defaultIssues: [] },
    { key: "quotation", en: "Quotation", zh: "报价", description: "价格核算与报价发送", days: 2, defaultTasks: seedTasksFor("quotation"), defaultIssues: [] },
    { key: "sample", en: "Sample", zh: "样品", description: "打样、设计与样品确认", days: 7, defaultTasks: seedTasksFor("sample"), defaultIssues: [] },
    { key: "order", en: "Order", zh: "订单", description: "下单与合同签署", days: 90, defaultTasks: [], defaultIssues: [] },
    { key: "expense", en: "Expense", zh: "费用", description: "贯穿整个业务的费用记录", days: null, defaultTasks: [], defaultIssues: [] },
    { key: "purchase", en: "Purchase", zh: "采购", description: "物料与辅材采购", days: 7, defaultTasks: [], defaultIssues: [] },
    { key: "production", en: "Production", zh: "生产", description: "大货生产与装配", days: 30, defaultTasks: [], defaultIssues: [] },
    { key: "logistics", en: "Logistics", zh: "物流", description: "发货与物流跟踪", days: 7, defaultTasks: [], defaultIssues: [] },
    { key: "after_sales", en: "After-sales", zh: "售后", description: "售后支持与问题处理", days: null, defaultTasks: [], defaultIssues: [] },
  ],
};

/** 逐条清洗阶段默认事项，避免脏数据落库。 */
const normalizeItems = (items: unknown): StageDefaultItem[] =>
  Array.isArray(items)
    ? items
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          title: String(item.title ?? "").trim(),
          description: String(item.description ?? ""),
          type: item.type == null ? undefined : String(item.type),
          action: item.action == null ? undefined : String(item.action),
          assigneeRole: ASSIGNEE_ROLES.includes(item.assigneeRole as SeedAssigneeRole)
            ? (item.assigneeRole as SeedAssigneeRole)
            : undefined,
        }))
        .filter((item) => item.title.length > 0)
    : [];

export interface McpSettings {
  enabled: boolean;
  token: string | null;
  /** 本机局域网 IPv4（如 192.168.1.50）；供「同 WiFi 设备」直连提示。 */
  lanIp: string | null;
}

/** 取第一块非内部 IPv4 网卡地址（en0 / eth0 等真实局域网接口）。 */
function detectLanIp(): string | null {
  const nets = networkInterfaces();
  for (const infos of Object.values(nets)) {
    for (const n of infos ?? []) {
      if (n.family === "IPv4" && !n.internal) return n.address;
    }
  }
  return null;
}

/**
 * 系统设置读写。MCP 相关：
 * - mcp.enabled：是否启用 /mcp 端点（默认 true，保持现有行为不退化）
 * - mcp.token：Bearer 令牌；为空时回退到环境变量 MCP_TOKEN（再为空则开发免鉴权）
 */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMcpSettings(): Promise<McpSettings> {
    const [enabledRow, tokenRow] = await this.prisma.$transaction([
      this.prisma.setting.findUnique({ where: { key: KEY_ENABLED } }),
      this.prisma.setting.findUnique({ where: { key: KEY_TOKEN } }),
    ]);
    const enabled = enabledRow ? enabledRow.value === "true" : true;
    const token = tokenRow?.value || process.env.MCP_TOKEN || null;
    return { enabled, token, lanIp: detectLanIp() };
  }

  async updateMcpSettings(input: {
    enabled?: boolean;
    token?: string;
  }): Promise<McpSettings> {
    if (input.enabled !== undefined) {
      await this.prisma.setting.upsert({
        where: { key: KEY_ENABLED },
        create: { key: KEY_ENABLED, value: String(input.enabled) },
        update: { value: String(input.enabled) },
      });
    }
    if (input.token !== undefined) {
      await this.prisma.setting.upsert({
        where: { key: KEY_TOKEN },
        create: { key: KEY_TOKEN, value: input.token },
        update: { value: input.token },
      });
    }
    return this.getMcpSettings();
  }

  async regenerateMcpToken(): Promise<{ token: string }> {
    const token = randomBytes(24).toString("hex");
    await this.prisma.setting.upsert({
      where: { key: KEY_TOKEN },
      create: { key: KEY_TOKEN, value: token },
      update: { value: token },
    });
    return { token };
  }

  // —— 设计偏好：进入设计单页是否自动为本商机所有产品需求建草稿设计单 ——
  async getDesignSettings(): Promise<{ autoDecompose: boolean }> {
    const row = await this.prisma.setting.findUnique({
      where: { key: KEY_DESIGN_AUTO_DECOMPOSE },
    });
    return { autoDecompose: row ? row.value === "true" : false };
  }

  async updateDesignSettings(input: {
    autoDecompose?: boolean;
  }): Promise<{ autoDecompose: boolean }> {
    if (input.autoDecompose !== undefined) {
      await this.prisma.setting.upsert({
        where: { key: KEY_DESIGN_AUTO_DECOMPOSE },
        create: { key: KEY_DESIGN_AUTO_DECOMPOSE, value: String(input.autoDecompose) },
        update: { value: String(input.autoDecompose) },
      });
    }
    return this.getDesignSettings();
  }

  // —— 工作区默认值：事项类型 / 操作 / 阶段与天数 ——
  async getWorkspaceDefaults(): Promise<WorkspaceDefaults> {
    const [row, seeded] = await this.prisma.$transaction([
      this.prisma.setting.findUnique({ where: { key: KEY_WORKSPACE_DEFAULTS } }),
      this.prisma.setting.findUnique({ where: { key: KEY_WORKSPACE_DEFAULTS_SEEDED } }),
    ]);
    if (!row) return DEFAULT_WORKSPACE_DEFAULTS;
    try {
      const parsed = JSON.parse(row.value) as Partial<WorkspaceDefaults>;
      return {
        defaultItemType: typeof parsed.defaultItemType === "string" ? parsed.defaultItemType : DEFAULT_WORKSPACE_DEFAULTS.defaultItemType,
        defaultAction: typeof parsed.defaultAction === "string" ? parsed.defaultAction : "",
        stages: Array.isArray(parsed.stages) && parsed.stages.length
          ? parsed.stages.map((s) => ({
              key: String(s.key),
              en: String(s.en ?? s.key),
              zh: String(s.zh ?? s.key),
              // 兼容早期 KV：没有 description 时按内置阶段补默认描述。
              description:
                String(s.description ?? "") ||
                DEFAULT_WORKSPACE_DEFAULTS.stages.find((builtIn) => builtIn.key === s.key)?.description ||
                "",
              days: s.days == null ? null : Number(s.days),
              // 首次读取旧 KV：空阶段补内置预置任务（之后以用户保存为准）。
              defaultTasks:
                !seeded && !(s.defaultTasks ?? []).length
                  ? seedTasksFor(String(s.key))
                  : normalizeItems(s.defaultTasks),
              defaultIssues: normalizeItems(s.defaultIssues),
            }))
          : DEFAULT_WORKSPACE_DEFAULTS.stages,
      };
    } catch {
      return DEFAULT_WORKSPACE_DEFAULTS;
    }
  }

  async updateWorkspaceDefaults(input: WorkspaceDefaults): Promise<WorkspaceDefaults> {
    const value = JSON.stringify({
      defaultItemType: String(input.defaultItemType ?? "output"),
      defaultAction: String(input.defaultAction ?? ""),
      stages: (input.stages ?? []).map((s) => ({
        key: String(s.key),
        en: String(s.en ?? s.key),
        zh: String(s.zh ?? s.key),
        description: String(s.description ?? ""),
        days: s.days == null ? null : Number(s.days),
        defaultTasks: normalizeItems(s.defaultTasks),
        defaultIssues: normalizeItems(s.defaultIssues),
      })),
    });
    await this.prisma.$transaction([
      this.prisma.setting.upsert({
        where: { key: KEY_WORKSPACE_DEFAULTS },
        create: { key: KEY_WORKSPACE_DEFAULTS, value },
        update: { value },
      }),
      this.prisma.setting.upsert({
        where: { key: KEY_WORKSPACE_DEFAULTS_SEEDED },
        create: { key: KEY_WORKSPACE_DEFAULTS_SEEDED, value: "true" },
        update: { value: "true" },
      }),
    ]);
    return this.getWorkspaceDefaults();
  }
}
