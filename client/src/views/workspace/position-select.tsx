import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** 职位（Contact.position）：与部门无关，新建项目时按职位匹配对应成员。 */
export const POSITIONS = ["lead", "design", "art", "operations", "shipping", "purchase", "engineering"] as const;
export type Position = (typeof POSITIONS)[number];

/** 职位对应的中文职位名，写入 Task.assigneeId 前用于匹配 Contact.position。 */
export const POSITION_LABEL: Record<Position, string> = {
  // 负责人：不按职位匹配成员，直接用项目负责人。
  lead: "",
  design: "设计",
  art: "美工",
  operations: "运营",
  shipping: "出运",
  purchase: "采购",
  engineering: "工程对接人",
};

const LABEL_KEYS: Record<Position, string> = {
  lead: "Lead",
  design: "Design",
  art: "Art",
  operations: "Operations",
  shipping: "Shipping",
  purchase: "Purchase",
  engineering: "Engineering",
};

/** shadcn 职位下拉：值为职位 key，经办人按职位匹配成员（不涉及部门）。 */
export function PositionSelect({
  value,
  onChange,
  className,
}: {
  value?: string | null;
  onChange: (position: Position) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const current = POSITIONS.includes(value as Position) ? (value as Position) : undefined;
  return (
    <Select value={current ?? ""} onValueChange={(next) => next && onChange(next as Position)}>
      <SelectTrigger aria-label={t("Position")} className={className}>
        <SelectValue>{current ? t(LABEL_KEYS[current]) : t("Select position")}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {POSITIONS.map((position) => (
          <SelectItem key={position} value={position}>
            {t(LABEL_KEYS[position])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
