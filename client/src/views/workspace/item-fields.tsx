import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronsUp,
  Minus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useWorkspace } from "src/api/workspace/use-workspace";
import { PmsAssignee, PmsAvatar, PmsPriority, PmsUnassigned } from "./pms";

/**
 * 任务与问题共用的可编辑字段控件（唯一实现）。
 *
 * 项目详情 Tasks / Issues 列表用 variant="field"，阶段详情用 variant="chip"，
 * 展示形态不同但控件、选项、文案与写入方式完全一致：页面只负责把 onChange
 * 接到 updateTask / updateIssue，二者都是同一组 PATCH /api/{tasks,issues}/:id。
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

/** 阶段详情彩色状态 tag 的色板（沿用既有配色，不新增状态色）。 */
export const STATUS_BADGE: Record<string, string> = {
  in_progress: "bg-blue-500/10 text-blue-500",
  review: "bg-orange-400/10 text-orange-500",
  backlog: "bg-amber-300/10 text-amber-500",
  todo: "bg-sky-400/10 text-sky-500",
  done: "bg-teal-400/10 text-teal-500",
  closed: "bg-teal-400/10 text-teal-500",
  completed: "bg-teal-400/10 text-teal-500",
};

/** 优先级下拉：与既有任务列表一致的降序排列与图标。 */
export const PRIORITY_MENU = [
  { value: "urgent", label: "Urgent", icon: ChevronsUp, tone: "text-red-500" },
  { value: "high", label: "High", icon: ArrowUp, tone: "text-orange-500" },
  { value: "medium", label: "Medium", icon: Minus, tone: "text-muted-foreground" },
  { value: "low", label: "Low", icon: ArrowDown, tone: "text-sky-500" },
  { value: "none", label: "none", icon: Minus, tone: "text-muted-foreground" },
] as const;

export function ItemStatusMenu({
  value,
  onChange,
  variant = "field",
  labelMap = STATUS_LABEL,
}: {
  value: string;
  onChange: (status: string) => void;
  variant?: "field" | "chip";
  /** 问题列表把 closed 显示为「已关闭」；任务仍沿用 done 口径的默认值。 */
  labelMap?: Record<string, string>;
}) {
  const { t } = useTranslation();
  const label = t(labelMap[value] ?? "Todo");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Status: ${label}`}
        className={
          variant === "chip"
            ? cn(
                "inline-flex h-5 items-center rounded-[26px] px-2 text-xs font-medium outline-none",
                STATUS_BADGE[value] ?? STATUS_BADGE.backlog
              )
            : "inline-flex h-8 w-30 cursor-pointer items-center justify-between rounded-md border bg-background px-2 text-sm outline-none hover:bg-muted"
        }
      >
        {label}
        {variant === "field" ? <ChevronDown className="size-3.5 text-muted-foreground" /> : null}
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

export function ItemPriorityMenu({
  value,
  onChange,
}: {
  value: string;
  onChange: (priority: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Priority: ${value}`}
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none hover:bg-muted"
      >
        <PmsPriority value={value} className="text-sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("Change priority")}</div>
        {PRIORITY_MENU.map(({ value: priority, label, icon: Icon, tone }) => (
          <DropdownMenuItem key={priority} onClick={() => onChange(priority)}>
            <Icon className={`size-3.5 ${tone}`} />
            {t(label)}
            {value === priority ? <Check className="ml-auto size-4" /> : null}
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
  const { snap, user, userName } = useWorkspace();
  const people = snap?.users ?? [];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Assignee: ${value ? userName(value) : "Unassigned"}`}
        className="flex items-center gap-2 rounded-md px-1 py-0.5 text-sm outline-none hover:bg-muted"
      >
        <PmsAssignee
          name={value ? userName(value) : undefined}
          avatar={value ? user(value)?.avatar : undefined}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("Assign to")}</div>
        <DropdownMenuItem onClick={() => onChange(null)}>
          <PmsUnassigned />
          {!value ? <Check className="ml-auto size-4" /> : null}
        </DropdownMenuItem>
        {people.map((person) => (
          <DropdownMenuItem key={person.id} onClick={() => onChange(person.id)}>
            <PmsAvatar name={person.name} avatar={person.avatar} />
            {person.name}
            {value === person.id ? <Check className="ml-auto size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
