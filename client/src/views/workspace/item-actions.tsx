"use client";

import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * 事项「可选操作」：按类型给出预设，选择后只记录到事项的 action 字段。
 * - input 输入：新建联系人 / 产品需求 / 回款单 / 样品单 / 设计单；
 * - output 输出：报价单 / 打样单 / 设计单 / 合同；
 * - prompt 提醒：warning / error / default（对应消息发送格式）。
 *
 * 详情页根据记录的 action 渲染对应字段组件；选择本身不执行创建/消息/跳转。
 */
export type ItemActionKind = "create" | "message";
export type ItemActionPreset = {
  id: string;
  label: string;
  kind: ItemActionKind;
  /** create：下一任务标题与描述。 */
  taskTitle?: string;
  taskDescription?: string;
  /** message：toast tone。 */
  tone?: "warning" | "error" | "default";
};

const INPUT_PRESETS: ItemActionPreset[] = [
  { id: "contact", label: "新建联系人", kind: "create", taskTitle: "新建联系人", taskDescription: "按客户资料新建联系人，补全姓名、公司、联系方式。" },
  { id: "product-requirement", label: "新建产品需求", kind: "create", taskTitle: "新建产品需求", taskDescription: "整理产品规格、数量、认证与包装要求，形成产品需求。" },
  { id: "payment", label: "新建回款单", kind: "create", taskTitle: "新建回款单", taskDescription: "按合同/报价单登记回款金额、方式与到账日期。" },
  { id: "sample-order", label: "新建样品单", kind: "create", taskTitle: "新建样品单", taskDescription: "下发样品制作单，明确样品规格、数量与交期。" },
  { id: "design-order", label: "新建设计单", kind: "create", taskTitle: "新建设计单", taskDescription: "下发设计单，明确设计内容、交付格式与验收标准。" },
];

const OUTPUT_PRESETS: ItemActionPreset[] = [
  { id: "quotation", label: "报价单", kind: "create", taskTitle: "报价单", taskDescription: "基于产品需求生成报价单：单价、数量、含税/不含税与交期。" },
  { id: "sampling", label: "打样单", kind: "create", taskTitle: "打样单", taskDescription: "生成打样单，列明样品规格、打样费用与预计完成时间。" },
  { id: "design", label: "设计单", kind: "create", taskTitle: "设计单", taskDescription: "生成设计单，明确设计稿数量、风格与交付时间。" },
  { id: "contract", label: "合同", kind: "create", taskTitle: "合同", taskDescription: "依据报价与条款生成合同草案，待法务与客户确认。" },
];

const PROMPT_PRESETS: ItemActionPreset[] = [
  { id: "warning", label: "warning", kind: "message", tone: "warning" },
  { id: "error", label: "error", kind: "message", tone: "error" },
  { id: "default", label: "default", kind: "message", tone: "default" },
];

export function presetsForType(type?: string | null): ItemActionPreset[] {
  if (type === "input") return INPUT_PRESETS;
  if (type === "output") return OUTPUT_PRESETS;
  if (type === "prompt") return PROMPT_PRESETS;
  return [];
}

export function ItemActionMenu({
  type,
  value,
  onChange,
}: {
  type?: string | null;
  value?: string | null;
  /** 只记录所选预设 id，不执行任何创建/消息/跳转。 */
  onChange: (actionId: string) => void;
}) {
  const { t } = useTranslation();
  const presets = presetsForType(type);
  if (!presets.length) return <span className="text-xs text-muted-foreground">—</span>;
  const selected = presets.find((preset) => preset.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Actions")}
        className="inline-flex h-8 w-full items-center justify-between gap-1 rounded-md border bg-background px-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={cn("truncate text-xs", selected ? "text-foreground" : "text-muted-foreground")}>
          {selected ? selected.label : t("Actions")}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("Actions")}</div>
        <DropdownMenuSeparator />
        {presets.map((preset) => (
          <DropdownMenuItem key={preset.id} onClick={() => onChange(preset.id)}>
            {preset.label}
            {value === preset.id ? <Check className="ms-auto size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
