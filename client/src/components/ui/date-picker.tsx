"use client"

import * as React from "react"
import { cn } from "cn"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

export interface DatePickerProps {
  /** 选中日期（受控）；null/undefined 表示未选 */
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  /** true 时整体禁用；或传函数作为日历禁用判定 */
  disabled?: boolean | ((date: Date) => boolean)
  minDate?: Date
  maxDate?: Date
  /** 触发按钮宽度类（默认 w-full） */
  className?: string
  /** 展示格式（默认 yyyy-MM-dd） */
  formatStr?: string
}

/**
 * 基础日期选择组件：Popover 触发 + 月历单选。
 * 触发按钮视觉对齐 Input（h-9 / 圆角 / 边框 / 焦点环），未选时显示占位符。
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "选择日期",
  disabled,
  minDate,
  maxDate,
  className,
  formatStr = "yyyy-MM-dd",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const isDisabledFn = typeof disabled === "function" ? disabled : undefined
  const triggerDisabled = typeof disabled === "boolean" ? disabled : false

  const handleSelect = (date: Date) => {
    onChange?.(date)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(o) => setOpen(Boolean(o))}>
      <PopoverTrigger
        disabled={triggerDisabled}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors outline-none",
          "hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{value ? format(value, formatStr) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto">
        <Calendar
          value={value}
          onSelect={handleSelect}
          disabled={isDisabledFn}
          minDate={minDate}
          maxDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  )
}
