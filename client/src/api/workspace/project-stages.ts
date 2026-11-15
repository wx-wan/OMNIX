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

/**
 * 业务工作区的「项目制」持久化仓库。
 *
 * 线上 PMS 快照由 /api/workspace/snapshot（MSW，只读）提供，作为存量基线；
 * 本仓库以 overlay 的形式记录所有写操作：新建/编辑/归档项目、九阶段流转、
 * 项目号、概览/问题/任务/迭代/成员/文件/动态七类项目记录、需求阶段表单。
 * 读取侧由 useWorkspace() 合并 base + overlay，因此所有工作区页面共享同一份状态，
 * 写入 localStorage 后刷新保留，任何操作都会自动落到项目的 Activity 时间线。
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
    const patched = { ...item, ...edits };
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
    projects: [
      ...b.projects.map((item) => patchProject(item, false)),
      ...overlay.projects.map((item) => patchProject(item, true)),
    ].filter((item) => !goneProjects.has(item.id)),
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

export const createProject = (
  name: string,
  description: string,
  stage: StageKey = "requirement",
  extra?: { status?: string; priority?: string; dueDate?: string }
) => {
  const id = `p-new-${uid()}`;
  const now = nowIso();
  const project: WsProject = {
    id,
    name,
    description,
    cover: "",
    status: extra?.status || "active",
    priority: extra?.priority || "medium",
    dueDate: extra?.dueDate || "RELATIVE_DAYS_PLUS30",
    memberIds: [CURRENT_USER_ID],
    leadId: CURRENT_USER_ID,
    progress: 0,
    archived: false,
    teamId: "t1",
    createdAt: now,
    updatedAt: now,
  };
  const no = nextTicketNo();
  commit(
    withLog(
      {
        ...state,
        projects: [...state.projects, project],
        stages: { ...state.stages, [id]: stage },
        nos: { ...state.nos, [id]: no },
      },
      activity(id, "created the project", id, "project", "created")
    )
  );
  return project;
};

export const updateProject = (
  id: string,
  patch: Partial<WsProject>,
  message = "updated project details"
) => {
  commit(
    withLog(
      {
        ...state,
        projectEdits: {
          ...state.projectEdits,
          [id]: {
            ...state.projectEdits[id],
            ...patch,
            updatedAt: nowIso(),
          },
        },
      },
      activity(id, message, id, "project")
    )
  );
};

export const archiveProject = (id: string) =>
  updateProject(id, { archived: true }, "archived the project");

export const restoreProject = (id: string) =>
  updateProject(id, { archived: false }, "restored the project");

export const deleteProject = (id: string) => {
  const gone = new Set(state.removed.projects ?? []);
  gone.add(id);
  commit({ ...state, removed: { ...state.removed, projects: [...gone] } });
};

export const setProjectStage = (id: string, stage: StageKey, message?: string) => {
  if (state.stages[id] === stage && !message) return;
  commit(
    withLog(
      { ...state, stages: { ...state.stages, [id]: stage } },
      activity(id, message ?? `set stage to ${stageLabel(stage, false)}`, id, "project", "stage")
    )
  );
};

export const advanceStage = (id: string, current: StageKey) => {
  const target = nextStage(current);
  if (target === current) return;
  setProjectStage(id, target, `moved the project to ${stageLabel(target, false)}`);
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
      activity(projectId, `created issue #${record.number} ${record.title}`, id, "issue", "created")
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
    `auto-advanced to ${stageLabel(target, false)} after ${key} form`
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
