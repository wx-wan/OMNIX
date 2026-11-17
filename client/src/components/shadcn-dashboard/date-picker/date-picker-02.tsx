"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { zhCN } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { formatDate } from "src/api/workspace/use-workspace";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

type DateRangePickerProps = {
  id?: string;
  label?: string;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  /** 选完起止后回调，供外部持久化。 */
  onCommit?: (range: DateRange) => void;
  className?: string;
  /** 中文界面：日期按「11月11日」显示，英文按「Nov 11」显示。 */
  zh?: boolean;
  /** 单日模式：只选一天，onCommit 返回 from=to。 */
  single?: boolean;
};

const toISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * 日期范围选择器：触发器为纯文字 + 图标（无按钮边框）。
 * 两段式选择——第一次点选起点，第二次点选终点后提交；全程弹层保持打开。
 */
const DateRangePicker = ({
  id = "date-range",
  label,
  value,
  onChange,
  onCommit,
  className,
  zh = false,
  single = false,
}: DateRangePickerProps) => {
  const [open, setOpen] = React.useState(false);
  const [inner, setInner] = React.useState<DateRange | undefined>(value);
  // 受控值变化（如切换阶段）时同步内部草稿；按时间戳比较避免新对象引用导致循环
  const valueKey = `${value?.from?.getTime() ?? ""}_${value?.to?.getTime() ?? ""}`;
  React.useEffect(() => setInner(value), [valueKey]);
  const date = inner;
  const pickingEnd = Boolean(date?.from && !date?.to);

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    if (single) {
      const next = { from: day, to: day };
      setInner(next);
      onChange?.(next);
      onCommit?.(next);
      setOpen(false);
      return;
    }
    if (!pickingEnd || !date?.from || day < date.from) {
      // 开始新的一段：只设起点
      const next = { from: day, to: undefined };
      setInner(next);
      onChange?.(next);
      return;
    }
    // 正在选终点：晚于起点 → 提交
    const next = { from: date.from, to: day };
    setInner(next);
    onChange?.(next);
    onCommit?.(next);
    setOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      {label ? (
        <Label htmlFor={id} className="text-sm font-medium px-1">
          {label}
        </Label>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              id={id}
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md p-0 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                !date && "text-muted-foreground"
              )}
            />
          }
        >
          {date?.from ? (
            <>
              {formatDate(toISODate(date.from), zh ? "ch" : "en", "short")}
              {date.to && !single
                ? ` – ${formatDate(toISODate(date.to), zh ? "ch" : "en", "short")}`
                : ""}
            </>
          ) : null}
          <CalendarIcon className="size-4 opacity-70" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-muted/20 shadow-xl" align="end">
          <Calendar
            mode="single"
            defaultMonth={date?.from}
            selected={date?.from}
            onSelect={handleSelect}
            numberOfMonths={single ? 1 : 2}
            locale={zh ? zhCN : undefined}
            className="p-3"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export { DateRangePicker };
export default DateRangePicker;
