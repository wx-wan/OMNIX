"use client"

import * as React from "react"
import { cn } from "cn"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"

export interface CalendarProps {
  /** 当前选中日期（受控） */
  value?: Date | null
  /** 选择某天回调 */
  onSelect?: (date: Date) => void
  /** 禁用判定（返回 true 则该天不可选） */
  disabled?: (date: Date) => boolean
  /** 可选最小日期（含当天） */
  minDate?: Date
  /** 可选最大日期（含当天） */
  maxDate?: Date
  /** 每周起始日：0=周日，1=周一（默认周一） */
  weekStartsOn?: 0 | 1
  className?: string
}

const WEEKDAY_LABELS: Record<number, string[]> = {
  0: ["日", "一", "二", "三", "四", "五", "六"],
  1: ["一", "二", "三", "四", "五", "六", "日"],
}

/**
 * 基础日历网格：月视图 + 上/下月导航 + 单选。
 * 仅负责日期网格渲染，不含触发控件（由 DatePicker 包裹）。
 */
export function Calendar({
  value,
  onSelect,
  disabled,
  minDate,
  maxDate,
  weekStartsOn = 1,
  className,
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(
    value ? startOfMonth(value) : startOfMonth(new Date()),
  )

  // 外部值变化时，若不在当前展示月则跟随跳转
  React.useEffect(() => {
    if (value) setMonth(startOfMonth(value))
  }, [value])

  const days = React.useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn })
    const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [month, weekStartsOn])

  const labels = WEEKDAY_LABELS[weekStartsOn]

  const isDisabled = (day: Date): boolean => {
    const d = startOfDay(day)
    if (disabled?.(d)) return true
    if (minDate && isBefore(d, startOfDay(minDate))) return true
    if (maxDate && isAfter(d, startOfDay(maxDate))) return true
    return false
  }

  const canPrev = !minDate || isAfter(startOfMonth(month), startOfMonth(minDate))
  const canNext = !maxDate || isBefore(startOfMonth(month), startOfMonth(maxDate))

  return (
    <div className={cn("w-full select-none", className)}>
      {/* 头部：上/下月 + 年月标题 */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="上个月"
          disabled={!canPrev}
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-heading text-sm font-semibold tracking-tight text-foreground">
          {format(month, "yyyy 年 M 月")}
        </span>
        <button
          type="button"
          aria-label="下个月"
          disabled={!canNext}
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* 星期表头 */}
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {labels.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const outside = !isSameMonth(day, month)
          const selected = value ? isSameDay(day, value) : false
          const today = isSameDay(day, new Date())
          const dDisabled = isDisabled(day)
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={dDisabled}
              aria-pressed={selected}
              aria-label={format(day, "yyyy-MM-dd")}
              onClick={() => onSelect?.(day)}
              className={cn(
                "relative flex size-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors",
                "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                outside && "text-muted-foreground/40",
                !outside && !selected && "text-foreground",
                selected && "bg-primary text-primary-foreground font-medium hover:bg-primary",
                today && !selected && "ring-1 ring-ring",
                dDisabled && "pointer-events-none opacity-40",
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}
