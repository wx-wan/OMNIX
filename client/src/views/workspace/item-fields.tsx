import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useWorkspace } from "src/api/workspace/use-workspace";
import { PriorityMenu } from "./pms";
import { PeopleField } from "./people-field";

/**
 * 任务与问题共用的可编辑字段控件（唯一实现）。
 *
 * 项目详情 Tasks / Issues 与阶段详情列表使用完全相同的控件、选项、文案与写入方式：
 * 页面只负责把 onChange 接到 updateTask / updateIssue，二者都是同一组
 * PATCH /api/{tasks,issues}/:id。
 */

/** 状态流转顺序与展示文案：三处列表共用，closed 与 done 同属「完成」。 */
export const STATUS_ORDER = ["backlog", "todo", "in_progress", "review", "done", "closed"];

export const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
  closed: "Done",
};

/** 下拉里的独立文案：closed 需与 done 区分。 */
export const STATUS_MENU_LABEL: Record<string, string> = {
  ...STATUS_LABEL,
  closed: "Closed",
};

/** 问题列表口径：closed 显示「已关闭」而非任务的「完成」。 */
export const ISSUE_STATUS_LABEL: Record<string, string> = {
  ...STATUS_LABEL,
  closed: "Closed",
};

export function ItemStatusMenu({
  value,
  onChange,
  labelMap = STATUS_LABEL,
}: {
  value: string;
  onChange: (status: string) => void;
  /** 问题列表把 closed 显示为「已关闭」；任务仍沿用 done 口径的默认值。 */
  labelMap?: Record<string, string>;
}) {
  const { t } = useTranslation();
  const label = t(labelMap[value] ?? "Todo");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Status: ${label}`}
        className="inline-flex h-8 w-30 cursor-pointer items-center justify-between rounded-md border bg-background px-2 text-sm outline-none hover:bg-muted"
      >
        {label}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("Change status")}</div>
        {STATUS_ORDER.map((status) => (
          <DropdownMenuItem key={status} onClick={() => onChange(status)}>
            {t(STATUS_MENU_LABEL[status])}
            {value === status ? <Check className="ml-auto size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** 可编辑优先级：委托给唯一实现 PriorityMenu，保留导出名供任务 / 问题 / 阶段详情调用。 */
export function ItemPriorityMenu({
  value,
  onChange,
}: {
  value: string;
  onChange: (priority: string) => void;
}) {
  return <PriorityMenu value={value} onChange={onChange} />;
}

/** 经办人单选：统一委托给 PeopleField，保留此导出名供列表调用。 */
/** 事项类型：输出 / 提示 / 输入。三种色板沿用既有状态色，不新增配色。 */
export const ITEM_TYPES = ["output", "prompt", "input"] as const;
export const ITEM_TYPE_LABEL: Record<string, string> = {
  output: "Output",
  prompt: "Prompt",
  input: "Input",
};
const ITEM_TYPE_TONE: Record<string, string> = {
  output: "bg-blue-500/10 text-blue-500",
  prompt: "bg-amber-400/10 text-amber-500",
  input: "bg-teal-400/10 text-teal-500",
};

export function ItemTypeTag({ value }: { value?: string | null }) {
  const { t } = useTranslation();
  const key = value ?? "output";
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-4xl px-2 text-[11px] font-medium whitespace-nowrap",
        ITEM_TYPE_TONE[key] ?? ITEM_TYPE_TONE.output
      )}
    >
      {t(ITEM_TYPE_LABEL[key] ?? ITEM_TYPE_LABEL.output)}
    </span>
  );
}

export function ItemTypeMenu({
  value,
  onChange,
}: {
  value: string;
  onChange: (type: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Type: ${value}`}
        className="rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ItemTypeTag value={value} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {ITEM_TYPES.map((type) => (
          <DropdownMenuItem key={type} onClick={() => onChange(type)}>
            <ItemTypeTag value={type} />
            {value === type ? <Check className="ms-auto size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ItemAssigneeMenu({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (assigneeId: string | null) => void;
}) {
  const { t } = useTranslation();
  const { snap } = useWorkspace();
  return (
    <PeopleField
      users={snap?.users ?? []}
      value={value}
      onChange={(next) => onChange((next as string | null) ?? null)}
      editable
      label={t("Assignee")}
      align="end"
    />
  );
}
