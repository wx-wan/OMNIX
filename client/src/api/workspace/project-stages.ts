import { useSyncExternalStore } from "react";
import type {
  WorkspaceSnapshot,
  WsActivity,
  WsEvent,
  WsFile,
  WsIssue,
  WsMilestone,
  WsProject,
  WsSprint,
  WsTask,
  WsTeam,
} from "src/types/apps/workspace";
import { CURRENT_USER_ID } from "./constants";
import {
  createProject as apiCreateProject,
  removeProject as apiRemoveProject,
  updateProject as apiUpdateProject,
  type ProjectInput,
} from "../projects/use-projects";

/**
 * 业务工作区的「项目制」持久化仓库。
 *
 * 项目 / 任务 / 用户均由后端 API（/api/projects、/api/tasks、/api/auth/users）提供，
 * 无 MSW 示例数据；本仓库仅以 overlay 记录尚未落库的项目制子记录写操作：
 * 九阶段流转、项目号、概览/问题/迭代/成员/文件/动态等记录、需求阶段表单。
 * 读取侧由 useWorkspace() 合并后端基线 + overlay，所有工作区页面共享同一份状态，
 * 任何操作都会自动落到项目的 Activity 时间线。
 */
export const STAGES = [
  { key: "requirement", en: "Requirement", zh: "需求" },
  { key: "quotation", en: "Quotation", zh: "报价" },
  { key: "sample", en: "Sample", zh: "样品" },
  { key: "order", en: "Order", zh: "订单" },
  { key: "expense", en: "Expense", zh: "费用" },
  { key: "purchase", en: "Purchase", zh: "采购" },
  { key: "production", en: "Production", zh: "生产" },
  { key: "logistics", en: "Logistics", zh: "物流" },
  { key: "after_sales", en: "After-sales", zh: "售后" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];
export const STAGE_KEYS: StageKey[] = STAGES.map((stage) => stage.key);

export const stageLabel = (key: StageKey, zh: boolean) => {
  const stage = STAGES.find((item) => item.key === key) ?? STAGES[0];
  return zh ? stage.zh : stage.en;
};

/** 各阶段默认持续天数；费用/售后贯穿整个业务阶段，无固定周期。 */
export const STAGE_DAYS: Record<string, number | null> = {
  requirement: 2,
  quotation: 2,
  sample: 7,
  order: 90,
  expense: null,
  purchase: 7,
  production: 30,
  logistics: 7,
  after_sales: null,
};
/** 费用/售后无固定周期，不展示时间。 */
export const STAGE_NO_TIME = new Set(["expense", "after_sales"]);

export type StageScheduleEntry = {
  estimatedStart?: string;
  estimatedEnd?: string;
  completedAt?: string;
};
export type StageSchedule = Record<string, StageScheduleEntry>;

/** 解析阶段日期：兼容 ISO(yyyy-mm-dd) 与英文长日期(April 1, 2025)。 */
export const parseStageDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** 本地日历日 key，用于预估结束 vs 实际完成的「提前/相符/延后」比较。 */
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export type StageDateInfo = {
  /** 本阶段开始：人工预估开始优先，否则 = 上一阶段完成时间（链式）。 */
  start: Date;
  /** 本阶段预估结束：人工预估结束优先，否则 = 开始 + 本阶段天数。 */
  estimatedEnd: Date;
  /** 实际完成时间（点击完成阶段时写入），未完成为 null。 */
  completedAt: Date | null;
  /** 按日历日比较实际完成 vs 预估结束：提前 -1 / 相符 0 / 延后 1 / 未完成 null。 */
  variance: -1 | 0 | 1 | null;
};

/**
 * 阶段日期统一推导：需求阶段 = 创建时间 ~ +2 天；后续阶段起点 = 上一阶段完成时间
 * （未完成时按上一阶段预估结束时间）~ + 本阶段天数。人工填写的预估起止优先。
 * 费用/售后无固定周期，返回 null 且不占用游标天数。
 */
export function stageDateInfo(
  stageKey: string,
  createdAt: string,
  schedule?: StageSchedule | null
): StageDateInfo | null {
  if (STAGE_DAYS[stageKey] == null) return null;
  const base = new Date(createdAt).getTime();
  if (Number.isNaN(base)) return null;

  let cursor = base;
  for (const stage of STAGES) {
    const stageDays = STAGE_DAYS[stage.key];
    if (stageDays == null) {
      if (stage.key === stageKey) return null;
      continue;
    }

    const entry = schedule?.[stage.key];
    const estimatedStart = parseStageDate(entry?.estimatedStart);
    const estimatedEnd = parseStageDate(entry?.estimatedEnd);
    const completedAt = parseStageDate(entry?.completedAt);
    const start = estimatedStart ?? new Date(cursor);
    const end = estimatedEnd ?? new Date(start.getTime() + stageDays * 86_400_000);

    if (stage.key === stageKey) {
      let variance: -1 | 0 | 1 | null = null;
      if (completedAt) {
        const actualKey = dayKey(completedAt);
        const estimatedKey = dayKey(end);
        variance = actualKey < estimatedKey ? -1 : actualKey > estimatedKey ? 1 : 0;
      }
      return { start, estimatedEnd: end, completedAt, variance };
    }

    cursor = completedAt ? completedAt.getTime() : end.getTime();
  }
  return null;
}

export const stageIndexOf = (key: StageKey) => STAGE_KEYS.indexOf(key);
export const nextStage = (key: StageKey): StageKey =>
  STAGE_KEYS[Math.min(stageIndexOf(key) + 1, STAGE_KEYS.length - 1)] ?? "requirement";

/** #年月第几票单子，例：#2611002 = 2026 年 11 月第 002 票。 */
const ticketNo = (date: Date, sequence: number) => {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `#${yy}${mm}${String(sequence).padStart(3, "0")}`;
};

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const nowIso = () => new Date().toISOString();

export type StageFormItem = { id: string; name: string; units: number; price: number };
export type StageForm = {
  billFrom: string;
  billTo: string;
  createDate: string;
  dueDate: string;
  status: string;
  notes: string;
  items: StageFormItem[];
  updatedAt: string;
};

export const OVERLAY_TABLES = [
  "issues",
  "tasks",
  "sprints",
  "events",
  "milestones",
  "files",
  "activities",
  "teams",
] as const;
export type OverlayTable = (typeof OVERLAY_TABLES)[number];

type OverlayTables = {
  issues: WsIssue[];
  tasks: WsTask[];
  sprints: WsSprint[];
  events: WsEvent[];
  milestones: WsMilestone[];
  files: WsFile[];
  activities: WsActivity[];
  teams: WsTeam[];
};

/** 迭代视图：卡片显示顺序 + 已隐藏的阶段卡片。 */
export type StageView = { order: string[]; hidden: string[] };

export type WorkspaceState = OverlayTables & {
  projects: WsProject[];
  stages: Record<string, StageKey>;
  /** 项目 → 阶段日程（预估起止 + 实际完成）；与表单计划到期日 dueDate 分开存储。 */
  completions: Record<string, Record<string, string>>;
  schedules: Record<string, StageSchedule>;
  nos: Record<string, string>;
  forms: Record<string, StageForm>;
  projectEdits: Record<string, Partial<WsProject>>;
  recordEdits: Partial<Record<OverlayTable, Record<string, Record<string, unknown>>>>;
  removed: Partial<Record<OverlayTable | "projects", string[]>>;
  stageViews: Record<string, StageView>;
};

const STORAGE_KEY = "omnix-workspace-project-stages-v1";
const EMPTY_STATE: WorkspaceState = {
  projects: [],
  stages: {},
  completions: {},
  schedules: {},
  nos: {},
  forms: {},
  projectEdits: {},
  recordEdits: {},
  removed: {},
  stageViews: {},
  issues: [],
  tasks: [],
  sprints: [],
  events: [],
  milestones: [],
  files: [],
  activities: [],
  teams: [],
};

const readState = (): WorkspaceState => {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    const list = <K extends OverlayTable>(key: K): WorkspaceState[K] =>
      Array.isArray(parsed[key]) ? (parsed[key] as WorkspaceState[K]) : ([] as unknown as WorkspaceState[K]);
    return {
      ...EMPTY_STATE,
      ...parsed,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      stages: parsed.stages ?? {},
      completions: parsed.completions ?? {},
      schedules: parsed.schedules ?? {},
      nos: parsed.nos ?? {},
      forms: parsed.forms ?? {},
      projectEdits: parsed.projectEdits ?? {},
      recordEdits: parsed.recordEdits ?? {},
      removed: parsed.removed ?? {},
      stageViews: parsed.stageViews ?? {},
      issues: list("issues"),
      tasks: list("tasks"),
      sprints: list("sprints"),
      events: list("events"),
      milestones: list("milestones"),
      files: list("files"),
      activities: list("activities"),
      teams: list("teams"),
    };
  } catch {
    return EMPTY_STATE;
  }
};

let state: WorkspaceState = readState();
const listeners = new Set<() => void>();

let persistTimer: ReturnType<typeof setTimeout> | null = null;
const persistNow = () => {
  persistTimer = null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 隐私模式下不持久化，仅保留内存态 */
  }
};

const commit = (next: WorkspaceState) => {
  state = next;
  // 持久化改为空闲时合并写入，避免每次写入同步序列化整个（持续增大的）state 阻塞主线程导致点击卡顿。
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(persistNow, 200);
  listeners.forEach((listener) => listener());
};

/** 多标签页自动同步：其它标签写入后本页立即重读，无需用户刷新。 */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || event.newValue === null) return;
    state = readState();
    listeners.forEach((listener) => listener());
  });
  window.addEventListener("beforeunload", () => {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistNow();
    }
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;

export const useProjectStageStore = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

/** 语义化别名：所有页面通过同一个订阅源读取项目制状态。 */
export const useWorkspaceStore = useProjectStageStore;
export const workspaceState = () => state;
export const extraProjects = () => state.projects;

/**
 * 存量项目在首次拿到线上快照时一次性固化编号与阶段。
 * 固化后不再依赖数组下标，删除、归档、筛选、跨月都不会让票号/阶段漂移，
 * 阶段表单 URL 与项目动态归属也随之稳定。
 */
export const hydrateSeedProjects = (projects: WsProject[]) => {
  if (!projects.length) return;
  const nos = { ...state.nos };
  const stages = { ...state.stages };
  const today = new Date();
  let changed = false;
  projects.forEach((project, index) => {
    if (!nos[project.id]) {
      nos[project.id] = ticketNo(today, index + 1);
      changed = true;
    }
    if (!stages[project.id]) {
      stages[project.id] = STAGE_KEYS[index % STAGE_KEYS.length] ?? "requirement";
      changed = true;
    }
  });
  if (changed) commit({ ...state, nos, stages });
};

/**
 * 后端项目（/api/projects）拉取后，把每个项目的阶段与编号同步进本地 stages/nos 缓存，
 * 使 projectStage / projectNo 保持同步读取（数据源已切到 PostgreSQL）。
 */
export const hydrateBackendProjects = (
  projects: Array<{ id: string; stage?: string; no?: string }>
) => {
  if (!projects.length) return;
  const nos = { ...state.nos };
  const stages = { ...state.stages };
  let changed = false;
  projects.forEach((project) => {
    if (project.stage && stages[project.id] !== project.stage) {
      stages[project.id] = project.stage as StageKey;
      changed = true;
    }
    if (project.no && nos[project.id] !== project.no) {
      nos[project.id] = project.no;
      changed = true;
    }
  });
  if (changed) commit({ ...state, nos, stages });
};

/** 当前项目上下文：进入任一项目详情即自动记录，跨模块新建记录时自动归属。 */
const ACTIVE_PROJECT_KEY = "omnix-workspace-active-project";
let activeProjectId =
  typeof window === "undefined" ? "p1" : window.localStorage.getItem(ACTIVE_PROJECT_KEY) ?? "p1";

export const setActiveProject = (id: string) => {
  if (!id || activeProjectId === id) return;
  activeProjectId = id;
  try {
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch {
    /* 隐私模式下仅保留内存态 */
  }
};

export const getActiveProject = () => activeProjectId;

export const projectStage = (id: string, index: number): StageKey =>
  state.stages[id] ?? STAGE_KEYS[index % STAGE_KEYS.length] ?? "requirement";

export const projectNo = (id: string, index: number): string =>
  state.nos[id] ?? ticketNo(new Date(), index + 1);

/** 编号去掉 # 后的数字部分，用于 URL 参数。 */
export const projectNoParam = (no: string) => no.replace("#", "");

/** 由 URL 里的项目编号反查项目 id，便于把阶段表单写入项目动态。 */
export const projectIdByNo = (no: string) => {
  const normalized = no.startsWith("#") ? no : `#${no}`;
  return Object.entries(state.nos).find(([, value]) => value === normalized)?.[0];
};

/** 合并只读快照与本地 overlay：所有页面看到的都是同一份项目制数据。 */
export const mergeWorkspaceSnapshot = (
  base: WorkspaceSnapshot | undefined,
  overlay: WorkspaceState
): WorkspaceSnapshot => {
  const empty: WorkspaceSnapshot = {
    users: [],
    teams: [],
    labels: [],
    projects: [],
    issues: [],
    tasks: [],
    sprints: [],
    events: [],
    milestones: [],
    files: [],
    comments: [],
    activities: [],
  };
  const b = base ?? empty;
  const mergeTable = <T extends { id: string }>(
    key: OverlayTable,
    seed: T[],
    extra: T[]
  ): T[] => {
    const edits = overlay.recordEdits[key] ?? {};
    const gone = new Set(overlay.removed[key] ?? []);
    const patch = (item: T) => ({ ...item, ...edits[item.id] }) as T;
    return [...seed.map(patch), ...extra.map(patch)].filter((item) => !gone.has(item.id));
  };
  const goneProjects = new Set(overlay.removed.projects ?? []);
  /** 项目被删除时，其下所有记录自动一并隐藏，不留孤儿数据。 */
  const related = <T extends { projectId?: string | null }>(list: T[]) =>
    goneProjects.size
      ? list.filter((item) => !item.projectId || !goneProjects.has(item.projectId))
      : list;
  const issues = related(mergeTable("issues", b.issues, overlay.issues));
  const tasks = related(mergeTable("tasks", b.tasks, overlay.tasks));

  /** 新建项目的进度由记录完成度自动推导，用户不必手动维护百分比。 */
  const deriveProgress = (id: string) => {
    const items = [
      ...issues.filter((item) => item.projectId === id),
      ...tasks.filter((item) => item.projectId === id),
    ];
    if (!items.length) return 0;
    const done = items.filter((item) =>
      ["done", "closed", "completed"].includes(item.status)
    ).length;
    return Math.round((done / items.length) * 100);
  };
  const patchProject = (item: WsProject, created: boolean): WsProject => {
    const edits = overlay.projectEdits[item.id];
    const local = overlay.schedules[item.id] ?? {};
    const backend = item.stageSchedule ?? {};
    const merged: StageSchedule = { ...backend };
    Object.entries(local).forEach(([stage, entry]) => {
      merged[stage] = { ...merged[stage], ...entry };
    });
    Object.entries(overlay.completions[item.id] ?? {}).forEach(([stage, completedAt]) => {
      merged[stage] = { ...merged[stage], completedAt };
    });
    const patched = {
      ...item,
      ...edits,
      stageSchedule: merged,
      stageCompletedAt: overlay.completions[item.id] ?? {},
    };
    if (!created || edits?.progress !== undefined) return patched;
    return { ...patched, progress: deriveProgress(item.id) };
  };

  /** 软删除 issue 后自动从迭代里摘除；新建迭代自动纳入项目未关闭的 issue。 */
  const removedIssues = new Set(overlay.removed.issues ?? []);
  const newSprintIds = new Set(overlay.sprints.map((sprint) => sprint.id));
  const openIssuesByProject = new Map<string, string[]>();
  issues.forEach((issue) => {
    if (["done", "closed"].includes(issue.status)) return;
    const list = openIssuesByProject.get(issue.projectId) ?? [];
    list.push(issue.id);
    openIssuesByProject.set(issue.projectId, list);
  });
  const sprints = related(mergeTable("sprints", b.sprints, overlay.sprints)).map((sprint) => {
    const issueIds = sprint.issueIds.filter((id) => !removedIssues.has(id));
    if (issueIds.length || !newSprintIds.has(sprint.id)) return { ...sprint, issueIds };
    return { ...sprint, issueIds: openIssuesByProject.get(sprint.projectId) ?? [] };
  });

  return {
    users: b.users,
    labels: b.labels,
    comments: b.comments,
    teams: mergeTable("teams", b.teams, overlay.teams),
    /**
     * 项目已全部落库（/api/projects），列表唯一事实源就是后端。
     * overlay.projects 是迁移前的本地遗留，若拼进来会与后端同名项目重复，
     * 且遗留项带 MSW 假 id（leadId/memberIds），会显示成「? / 头像裂图」。
     * 故此处完全忽略 overlay.projects，仅透视后端项目 + 本地软删 + projectEdits。
     */
    projects: b.projects
      .map((item) => patchProject(item, false))
      .filter((item) => !goneProjects.has(item.id)),
    issues,
    tasks,
    sprints,
    events: related(mergeTable("events", b.events, overlay.events)),
    milestones: related(mergeTable("milestones", b.milestones, overlay.milestones)),
    files: related(mergeTable("files", b.files, overlay.files)),
    activities: related(mergeTable("activities", b.activities, overlay.activities)),
  };
};

/** 每次写操作都留下一条项目动态，保证 Activity tab 与操作链路自洽。 */
const activity = (
  projectId: string,
  message: string,
  targetId: string,
  targetType: string,
  type = "updated"
): WsActivity => ({
  id: `a-new-${uid()}`,
  type,
  message,
  userId: CURRENT_USER_ID,
  targetId,
  targetType,
  projectId,
  timestamp: nowIso(),
});

const withLog = (next: WorkspaceState, log?: WsActivity): WorkspaceState =>
  log ? { ...next, activities: [...next.activities, log] } : next;

/* -------------------------------- 项目生命周期 -------------------------------- */

/** 当月票号自动取已用最大序号 +1，不受归档、删除、筛选影响。 */
export const nextTicketNo = () => {
  const prefix = ticketNo(new Date(), 0).slice(0, 5);
  const used = Object.values(state.nos)
    .filter((value) => value.startsWith(prefix))
    .map((value) => Number(value.slice(prefix.length)) || 0);
  return ticketNo(new Date(), Math.max(0, ...used) + 1);
};

/**
 * 新建项目预置任务：按阶段初始化，经办人按「角色」自动分配。
 * - lead：项目负责人（当前创建人）
 * - design：设计部成员；engineering：技术部成员；purchase：采购负责人（暂无采购部则回退 lead）
 * 任务真实入库 PostgreSQL，由 projects/index.tsx 创建项目后通过 /api/tasks 写入。
 */
export type SeedAssigneeRole = "lead" | "design" | "purchase" | "engineering";
export type SeedTask = {
  stage: StageKey;
  title: string;
  description: string;
  assigneeRole: SeedAssigneeRole;
  /** 事项类型预设：默认 output；建立客户画像为 input。 */
  type?: "input" | "output" | "prompt";
  /** 操作记录预设：建立客户画像记录「新建联系人」。 */
  action?: string;
};

export const SEED_TASKS: SeedTask[] = [
  // ── 需求阶段：经办人默认负责人 ──
  {
    stage: "requirement",
    title: "建立客户画像",
    description:
      "梳理目标客户的行业背景、采购角色与决策链路，明确关键诉求与痛点，为后续方案与报价提供依据。",
    assigneeRole: "lead",
    type: "input",
    action: "contact",
  },
  {
    stage: "requirement",
    title: "梳理产品需求",
    description:
      "汇总客户对功能、规格、交付与验收的期望，形成可追踪的需求清单，作为打样与生产的输入。",
    assigneeRole: "lead",
  },
  // ── 报价阶段：经办人负责人 ──
  {
    stage: "quotation",
    title: "价格核算",
    description: "核算材料、模具、人工与物流成本，形成报价基准。",
    assigneeRole: "lead",
  },
  {
    stage: "quotation",
    title: "发送报价",
    description: "向客户正式发送报价单并确认接收。",
    assigneeRole: "lead",
  },
  {
    stage: "quotation",
    title: "报价反馈",
    description: "跟进客户对报价的反馈并记录调整意见。",
    assigneeRole: "lead",
  },
  // ── 样品阶段 · 经办人负责人 ──
  { stage: "sample", title: "收取样品费用", description: "确认并收取客户样品费用。", assigneeRole: "lead" },
  { stage: "sample", title: "下发设计单", description: "向设计团队下达设计任务单。", assigneeRole: "lead" },
  { stage: "sample", title: "设计确认", description: "审核并确认设计方案。", assigneeRole: "lead" },
  { stage: "sample", title: "下发工程单", description: "向工程团队下达工程任务单。", assigneeRole: "lead" },
  { stage: "sample", title: "寄样", description: "安排样品寄送并跟踪物流。", assigneeRole: "lead" },
  { stage: "sample", title: "客户确认", description: "跟进客户对样品的确认结果。", assigneeRole: "lead" },
  // ── 样品阶段 · 经办人设计角色 ──
  { stage: "sample", title: "画图+渲染", description: "完成产品结构设计图与效果图渲染。", assigneeRole: "design" },
  { stage: "sample", title: "安排3D打印", description: "根据设计图安排 3D 打印验证。", assigneeRole: "design" },
  { stage: "sample", title: "移交模具店", description: "将确认的设计移交模具供应商。", assigneeRole: "design" },
  { stage: "sample", title: "安排下缸", description: "安排下缸试产并跟进首件。", assigneeRole: "design" },
  { stage: "sample", title: "通知模种到厂", description: "协调模种到厂时间并通知相关方。", assigneeRole: "design" },
  // ── 样品阶段 · 经办人采购角色 ──
  { stage: "sample", title: "采购大货模", description: "采购大货生产所需模具。", assigneeRole: "purchase" },
  { stage: "sample", title: "采购夹具", description: "采购生产夹具。", assigneeRole: "purchase" },
  { stage: "sample", title: "采购钢板", description: "采购所需钢板原材料。", assigneeRole: "purchase" },
  { stage: "sample", title: "包装辅材采购", description: "采购包装辅料。", assigneeRole: "purchase" },
  { stage: "sample", title: "组装辅材采购", description: "采购组装所需辅料。", assigneeRole: "purchase" },
  // ── 样品阶段 · 经办人工程角色 ──
  { stage: "sample", title: "安排打样", description: "安排工程打样并跟进进度。", assigneeRole: "engineering" },
  { stage: "sample", title: "创建成品档案", description: "建立成品技术档案。", assigneeRole: "engineering" },
  { stage: "sample", title: "创建成品装配清单", description: "编制成品 BOM 与装配清单。", assigneeRole: "engineering" },
];

export const createProject = async (
  name: string,
  description: string,
  stage: StageKey = "requirement",
  extra?: { status?: string; priority?: string; dueDate?: string; memberIds?: string[] }
): Promise<WsProject> => {
  const id = `p-new-${uid()}`;
  const no = nextTicketNo();
  // 项目真实落库后端（含阶段与编号），activity 仍留在本地 overlay 承载时间线
  const created = await apiCreateProject({
    id,
    name,
    description,
    cover: "",
    status: extra?.status || "active",
    priority: extra?.priority || "medium",
    // 新建不设截止/下单日期（未下单）；仅创建副本时沿用原项目 dueDate。
    dueDate: extra?.dueDate ?? null,
    // 经办人由创建方按角色分配后传入；未传时至少含创建人。
    memberIds: extra?.memberIds?.length
      ? Array.from(new Set([CURRENT_USER_ID, ...extra.memberIds]))
      : [CURRENT_USER_ID],
    leadId: CURRENT_USER_ID,
    progress: 0,
    archived: false,
    stage,
    no,
  });
  commit(withLog({ ...state }, activity(id, "created the project", id, "project", "created")));
  return created;
};

export const updateProject = async (
  id: string,
  patch: Partial<WsProject>,
  message = "updated project details"
) => {
  await apiUpdateProject(id, patch as Partial<ProjectInput>);
  commit(withLog({ ...state }, activity(id, message, id, "project")));
};

export const archiveProject = (id: string) =>
  updateProject(id, { archived: true }, "archived the project");

export const restoreProject = (id: string) =>
  updateProject(id, { archived: false }, "restored the project");

export const deleteProject = async (id: string) => {
  await apiRemoveProject(id);
  const gone = new Set(state.removed.projects ?? []);
  gone.add(id);
  const completions = { ...state.completions };
  delete completions[id];
  const schedules = { ...state.schedules };
  delete schedules[id];
  commit({ ...state, completions, schedules, removed: { ...state.removed, projects: [...gone] } });
};

export const setProjectStage = async (
  id: string,
  stage: StageKey,
  message?: string,
  completedStage?: StageKey
) => {
  /** 阶段推进时记录「离开的阶段」实际完成时间，并同步到后端 stageSchedule。 */
  const completedAt = completedStage ? nowIso() : null;
  const scheduleEntry = completedStage
    ? { ...state.schedules[id]?.[completedStage], completedAt: completedAt! }
    : null;
  const patch: Partial<ProjectInput> = { stage };
  if (completedStage && scheduleEntry) {
    patch.stageSchedule = {
      ...state.schedules[id],
      [completedStage]: scheduleEntry,
    };
  }
  await apiUpdateProject(id, patch);

  const completions = completedAt && completedStage
    ? {
        ...state.completions,
        [id]: { ...state.completions[id], [completedStage]: completedAt },
      }
    : state.completions;
  const schedules = scheduleEntry && completedStage
    ? {
        ...state.schedules,
        [id]: { ...state.schedules[id], [completedStage]: scheduleEntry },
      }
    : state.schedules;
  commit(
    withLog(
      { ...state, completions, schedules },
      activity(id, message ?? `set stage to ${stageLabel(stage, false)}`, id, "project", "stage")
    )
  );
};

export const setProjectMembers = (
  id: string,
  memberIds: string[],
  message = "updated project members"
) => updateProject(id, { memberIds }, message);

/* -------------------------------- 项目下七类记录 -------------------------------- */

export const addIssue = (
  projectId: string,
  input: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    type?: string;
    action?: string | null;
    severity?: string;
    assigneeId?: string | null;
    number?: number;
  }
) => {
  const id = `i-new-${uid()}`;
  const now = nowIso();
  const record: WsIssue = {
    id,
    number: input.number ?? 100 + state.issues.length + 1,
    title: input.title,
    description: input.description ?? "",
    status: input.status ?? "todo",
    priority: input.priority ?? "medium",
    type: input.type ?? "output",
    action: input.action ?? "",
    severity: input.severity ?? "minor",
    reporterId: CURRENT_USER_ID,
    assigneeId: input.assigneeId ?? null,
    sprintId: null,
    milestone: null,
    labelIds: [],
    attachmentIds: [],
    commentIds: [],
    projectId,
    createdAt: now,
    updatedAt: now,
  };
  commit(
    withLog(
      { ...state, issues: [...state.issues, record] },
      activity(projectId, `created issue #Q${record.number} ${record.title}`, id, "issue", "created")
    )
  );
  return record;
};

export const addTask = (
  projectId: string,
  input: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    type?: string;
    action?: string | null;
    assigneeId?: string | null;
    dueDate?: string | null;
    estimate?: number | null;
  }
) => {
  const id = `task-new-${uid()}`;
  const now = nowIso();
  const record: WsTask = {
    id,
    title: input.title,
    description: input.description ?? "",
    status: input.status ?? "todo",
    priority: input.priority ?? "medium",
    type: input.type ?? "output",
    action: input.action ?? "",
    labelIds: [],
    assigneeId: input.assigneeId ?? null,
    dueDate: input.dueDate || "RELATIVE_DAYS_PLUS7",
    sprintId: null,
    estimate: input.estimate ?? null,
    projectId,
    parentId: null,
    createdAt: now,
    updatedAt: now,
  };
  commit(
    withLog(
      { ...state, tasks: [...state.tasks, record] },
      activity(projectId, `created task ${record.title}`, id, "task", "created")
    )
  );
  return record;
};

export const addSprint = (
  projectId: string,
  input: { name: string; goal?: string; startDate?: string; endDate?: string; status?: string }
) => {
  const id = `s-new-${uid()}`;
  const record: WsSprint = {
    id,
    name: input.name,
    goal: input.goal ?? "",
    status: input.status ?? "planning",
    startDate: input.startDate ?? "RELATIVE_DAYS_MINUS0",
    endDate: input.endDate ?? "RELATIVE_DAYS_PLUS14",
    projectId,
    issueIds: [],
    completedAt: null,
    createdAt: nowIso(),
  };
  commit(
    withLog(
      { ...state, sprints: [...state.sprints, record] },
      activity(projectId, `created iteration ${record.name}`, id, "sprint", "created")
    )
  );
  return record;
};

export const addFile = (
  projectId: string,
  input: { name: string; type?: string; size?: number }
) => {
  const id = `f-new-${uid()}`;
  const record: WsFile = {
    id,
    name: input.name,
    url: "",
    size: input.size ?? 0,
    type: input.type ?? input.name.split(".").pop() ?? "file",
    uploadedById: CURRENT_USER_ID,
    version: 1,
    projectId,
    createdAt: nowIso(),
  };
  commit(
    withLog(
      { ...state, files: [...state.files, record] },
      activity(projectId, `uploaded file ${record.name}`, id, "file", "created")
    )
  );
  return record;
};

export const addMilestone = (
  projectId: string,
  input: { title: string; description?: string; date?: string }
) => {
  const id = `m-new-${uid()}`;
  const record: WsMilestone = {
    id,
    title: input.title,
    description: input.description ?? "",
    date: input.date ?? "RELATIVE_DAYS_PLUS14",
    projectId,
    completed: false,
    createdAt: nowIso(),
  };
  commit(
    withLog(
      { ...state, milestones: [...state.milestones, record] },
      activity(projectId, `added milestone ${record.title}`, id, "milestone", "created")
    )
  );
  return record;
};

export const addEvent = (
  projectId: string | null,
  input: {
    title: string;
    description?: string;
    date?: string;
    type?: string;
    assigneeId?: string | null;
    allDay?: boolean;
    endDate?: string | null;
  }
) => {
  const id = `e-new-${uid()}`;
  const record: WsEvent = {
    id,
    title: input.title,
    description: input.description ?? "",
    date: input.date ?? "RELATIVE_DAYS_PLUS0",
    endDate: input.endDate ?? null,
    type: input.type ?? "meeting",
    projectId,
    assigneeId: input.assigneeId ?? null,
    allDay: input.allDay ?? false,
  };
  commit({
    ...state,
    events: [...state.events, record],
    activities: projectId
      ? [
          ...state.activities,
          activity(projectId, `added calendar event ${record.title}`, id, "event", "created"),
        ]
      : state.activities,
  });
  return record;
};

export const addTeam = (input: {
  name: string;
  description?: string;
  leadId?: string;
  memberIds?: string[];
}) => {
  const id = `t-new-${uid()}`;
  const leadId = input.leadId || CURRENT_USER_ID;
  const record: WsTeam = {
    id,
    name: input.name,
    description: input.description ?? "",
    memberIds: input.memberIds ?? [leadId],
    leadId,
    createdAt: nowIso(),
  };
  commit({ ...state, teams: [...state.teams, record] });
  return record;
};

export const addActivityNote = (projectId: string, message: string) => {
  commit({
    ...state,
    activities: [...state.activities, activity(projectId, message, projectId, "note", "comment")],
  });
};

export const updateRecord = (
  table: OverlayTable,
  id: string,
  patch: Record<string, unknown>,
  projectId?: string
) => {
  const edits = state.recordEdits[table] ?? {};
  commit(
    withLog(
      {
        ...state,
        recordEdits: {
          ...state.recordEdits,
          [table]: { ...edits, [id]: { ...edits[id], ...patch } },
        },
      },
      projectId
        ? activity(projectId, `updated ${table.replace(/s$/, "")}`, id, table, "updated")
        : undefined
    )
  );
};

export const removeRecord = (
  table: OverlayTable,
  id: string,
  projectId?: string,
  message?: string
) => {
  const gone = new Set(state.removed[table] ?? []);
  gone.add(id);
  commit(
    withLog(
      { ...state, removed: { ...state.removed, [table]: [...gone] } },
      projectId
        ? activity(projectId, message ?? `removed ${table.replace(/s$/, "")}`, id, table, "deleted")
        : undefined
    )
  );
};

/* -------------------------------- 阶段表单 -------------------------------- */

export const stageFormKey = (projectNo: string, stage: StageKey) =>
  `${projectNoParam(projectNo)}_${stage}`;

export const getStageForm = (key: string): StageForm | undefined => state.forms[key];

/** 保存阶段的预估起止：写本地表单 + 同步后端 stageSchedule 的 estimatedStart/estimatedEnd。 */
export const saveStageEstimatedDates = (
  projectId: string,
  stage: StageKey,
  estimatedStart: string,
  estimatedEnd: string
) => {
  const entry: StageScheduleEntry = {
    ...state.schedules[projectId]?.[stage],
    estimatedStart,
    estimatedEnd,
  };
  const schedules = {
    ...state.schedules,
    [projectId]: { ...state.schedules[projectId], [stage]: entry },
  };
  commit(withLog({ ...state, schedules }, undefined));
  void apiUpdateProject(projectId, { stageSchedule: schedules[projectId] });
};

export const saveStageForm = (
  key: string,
  form: StageForm,
  projectId?: string,
  log = true
) => {
  commit(
    withLog(
      { ...state, forms: { ...state.forms, [key]: { ...form, updatedAt: nowIso() } } },
      log && projectId
        ? activity(projectId, `saved the ${key} stage form`, key, "form")
        : undefined
    )
  );
};

/**
 * 阶段表单确认后自动把项目推进到下一阶段：
 * 用户填完一个阶段无需再手动流转；项目列表看板卡片仍保留快速流转入口。
 */
export const completeStageForm = (key: string, form: StageForm, projectId?: string) => {
  saveStageForm(key, form, projectId);
  if (!projectId) return;
  const stage = STAGE_KEYS.find((item) => key.endsWith(`_${item}`));
  if (!stage) return;
  const current = projectStage(projectId, 0);
  /** 补填历史阶段不倒退；提交当前或未来阶段的表单，项目自动前进一阶段。 */
  if (stageIndexOf(stage) < stageIndexOf(current)) return;
  const target = nextStage(current);
  if (target === current) return;
  setProjectStage(
    projectId,
    target,
    `auto-advanced to ${stageLabel(target, false)} after ${key} form`,
    current
  );
};

/* ------------------------------ 迭代卡片视图 ------------------------------ */

export const getStageView = (projectId: string): StageView =>
  state.stageViews[projectId] ?? { order: [], hidden: [] };

/** 拖动阶段卡片后固化顺序；未出现在顺序里的新卡片自动排在末尾。 */
export const saveStageOrder = (projectId: string, order: string[]) => {
  const view = getStageView(projectId);
  commit({
    ...state,
    stageViews: { ...state.stageViews, [projectId]: { ...view, order } },
  });
};

/** 从迭代视图隐藏某个阶段卡片，流程阶段本身保持不变。 */
export const hideStageCard = (projectId: string, key: string) => {
  const view = getStageView(projectId);
  if (view.hidden.includes(key)) return;
  commit({
    ...state,
    stageViews: {
      ...state.stageViews,
      [projectId]: { ...view, hidden: [...view.hidden, key] },
    },
  });
};

/** 审计/演示用：清空全部本地写入，回到线上快照基线。 */
export const resetWorkspace = () => commit(EMPTY_STATE);
