import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = fromISODate(value);
  // 截止日期合理区间：近 5 年 ～ 未来 10 年，避免年份下拉列出近百个选项
  const year = new Date().getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
          />
        }
      >
        {date ? date.toLocaleDateString() : <span>{placeholder}</span>}
        <CalendarIcon className="ml-auto h-4 w-4 opacity-60" />
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
