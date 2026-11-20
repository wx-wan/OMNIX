import useSWR, { mutate as globalMutate } from "swr";
import { getFetcher, putFetcher } from "@/api/global-fetcher";

/** 阶段默认事项：新建项目时按阶段自动创建的任务 / 问题。 */
export type StageDefaultItem = {
  title: string;
  description?: string;
  type?: string;
  action?: string;
  /** 经办职位：按部门解析；缺省用项目负责人。 */
  assigneeRole?: "design" | "art" | "operations" | "shipping" | "purchase" | "engineering" | "lead";
};

export type WorkspaceStageDefault = {
  key: string;
  en: string;
  zh: string;
  /** 阶段描述（设置页第三列）。 */
  description: string;
  days: number | null;
  /** 该阶段默认创建的任务。 */
  defaultTasks: StageDefaultItem[];
  /** 该阶段默认创建的问题。 */
  defaultIssues: StageDefaultItem[];
};

export type WorkspaceDefaults = {
  defaultItemType: string;
  defaultAction: string;
  stages: WorkspaceStageDefault[];
};

const KEY = "/api/settings/workspace";

/** 与后端 DEFAULT_WORKSPACE_DEFAULTS 保持一致；后端不可达时前端兜底。 */
export const FALLBACK_DEFAULTS: WorkspaceDefaults = {
  defaultItemType: "output",
  defaultAction: "",
  stages: [
    { key: "requirement", en: "Requirement", zh: "需求", description: "梳理客户需求与产品要求", days: 2, defaultTasks: [], defaultIssues: [] },
    { key: "quotation", en: "Quotation", zh: "报价", description: "价格核算与报价发送", days: 2, defaultTasks: [], defaultIssues: [] },
    { key: "sample", en: "Sample", zh: "样品", description: "打样、设计与样品确认", days: 7, defaultTasks: [], defaultIssues: [] },
    { key: "order", en: "Order", zh: "订单", description: "下单与合同签署", days: 90, defaultTasks: [], defaultIssues: [] },
    { key: "expense", en: "Expense", zh: "费用", description: "贯穿整个业务的费用记录", days: null, defaultTasks: [], defaultIssues: [] },
    { key: "purchase", en: "Purchase", zh: "采购", description: "物料与辅材采购", days: 7, defaultTasks: [], defaultIssues: [] },
    { key: "production", en: "Production", zh: "生产", description: "大货生产与装配", days: 30, defaultTasks: [], defaultIssues: [] },
    { key: "logistics", en: "Logistics", zh: "物流", description: "发货与物流跟踪", days: 7, defaultTasks: [], defaultIssues: [] },
    { key: "after_sales", en: "After-sales", zh: "售后", description: "售后支持与问题处理", days: null, defaultTasks: [], defaultIssues: [] },
  ],
};

export function useWorkspaceDefaults() {
  const { data, isLoading, error, mutate } = useSWR<WorkspaceDefaults>(KEY, getFetcher, {
    fallbackData: FALLBACK_DEFAULTS,
    revalidateOnFocus: false,
  });
  return { defaults: data ?? FALLBACK_DEFAULTS, isLoading, error, mutate };
}

export async function updateWorkspaceDefaults(input: WorkspaceDefaults) {
  const next = await putFetcher(KEY, input);
  await globalMutate(KEY, next, false);
  return next as WorkspaceDefaults;
}
