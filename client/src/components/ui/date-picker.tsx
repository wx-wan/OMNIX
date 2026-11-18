import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "src/api/workspace/use-workspace";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
  id?: string;
  /** ISO 日期字符串 yyyy-mm-dd，与 <input type="date"> 一致 */
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** 表单内为带边框按钮；cell 为表格紧凑样式；inline 为详情页纯文字+图标。 */
  variant?: "field" | "cell" | "inline";
  /** inline 变体的日期按中文/英文短日期展示。 */
  zh?: boolean;
}

const toISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromISODate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined;
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

/**
 * 基于 Popover + Calendar 的日期选择器（shadcn-dashboard 标准做法）。
 * 值以 yyyy-mm-dd 字符串传递，与表单其他字段保持一致，便于落库与回填。
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Select a date",
  className,
  disabled,
  variant = "field",
  zh = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = fromISODate(value);
  // 截止日期合理区间：近 5 年 ～ 未来 10 年，避免年份下拉列出近百个选项
  const year = new Date().getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal outline-none",
              !date && "text-muted-foreground",
              variant === "field"
                ? "inline-flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
                : null,
              variant === "cell"
                ? "inline-flex h-8 w-32 items-center rounded-md border bg-background px-2 text-sm text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                : null,
              variant === "inline"
                ? "inline-flex h-auto w-auto items-center gap-1.5 rounded-md border-0 bg-transparent p-0 font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                : null,
              className
            )}
          />
        }
      >
        {date
          ? variant === "inline"
            ? formatDate(toISODate(date), zh ? "ch" : "en", "short")
            : date.toLocaleDateString()
          : <span>{placeholder}</span>}
        <CalendarIcon
          className={cn(
            "h-4 w-4 opacity-60",
            variant === "inline" ? "ml-0 opacity-70" : "ml-auto"
          )}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          captionLayout="dropdown"
          startMonth={new Date(year - 10, 0, 1)}
          endMonth={new Date(year + 20, 11, 1)}
          onSelect={(selected) => {
            onChange?.(selected ? toISODate(selected) : undefined);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
