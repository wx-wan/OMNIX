/**
 * PMS Workspace 数据模型类型
 * 字段与 pms-audit/api/mock-data/dataset_00..14.json 一一对应。
 * 日期字段保留线上原始的相对占位符（RELATIVE_DAYS_PLUS30 等），
 * 由 src/api/workspace/use-workspace.ts 的 resolveDate() 在渲染时换算。
 */

export interface WsUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface WsTeam {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  leadId: string;
  createdAt: string;
}

export interface WsLabel {
  id: string;
  name: string;
  color: string;
}

export interface WsProject {
  id: string;
  name: string;
  description: string;
  cover: string;
  status: string;
  priority: string;
  dueDate: string;
  /** 项目当前所处阶段（九阶段 key），后端 Project.stage 落库。 */
  stage?: string;
  /** 项目编号（如 #2611001），后端 Project.no 落库。 */
  no?: string;
  memberIds: string[];
  leadId: string;
  progress: number;
  archived: boolean;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WsIssue {
  id: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  severity: string;
  /** 创建人：后端按创建时的登录会话写入（存量数据可能为 null）。 */
  reporterId: string | null;
  assigneeId: string | null;
  sprintId: string | null;
  milestone: string | null;
  labelIds: string[];
  attachmentIds: string[];
  commentIds: string[];
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WsTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  labelIds: string[];
  assigneeId: string | null;
  dueDate: string | null;
  sprintId: string | null;
  estimate: number | null;
  projectId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WsSprint {
  id: string;
  name: string;
  goal: string;
  status: string;
  startDate: string;
  endDate: string;
  projectId: string;
  issueIds: string[];
  completedAt: string | null;
  createdAt: string;
}

export interface WsEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string | null;
  type: string;
  projectId: string | null;
  assigneeId: string | null;
  allDay: boolean;
}

export interface WsMilestone {
  id: string;
  title: string;
  description: string;
  date: string;
  projectId: string;
  completed: boolean;
  createdAt: string;
}

export interface WsFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedById: string;
  version: number;
  projectId: string;
  createdAt: string;
}

export interface WsComment {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  attachmentIds: string[];
}

export interface WsActivity {
  id: string;
  type: string;
  message: string;
  userId: string;
  targetId: string;
  targetType: string;
  projectId: string;
  timestamp: string;
}

export interface WorkspaceSnapshot {
  users: WsUser[];
  teams: WsTeam[];
  labels: WsLabel[];
  projects: WsProject[];
  issues: WsIssue[];
  tasks: WsTask[];
  sprints: WsSprint[];
  events: WsEvent[];
  milestones: WsMilestone[];
  files: WsFile[];
  comments: WsComment[];
  activities: WsActivity[];
}
