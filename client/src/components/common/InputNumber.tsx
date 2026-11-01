"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";

export interface InputNumberProps {
  /** 当前值；传 "" 表示空（未填写） */
  value: number | "";
  onChange: (v: number | "") => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  /** 输入框后缀（如 "%"），渲染在框内右侧 */
  suffix?: string;
  /** 无边框内嵌态（用于表格单元格，与其他输入框视觉统一） */
  bare?: boolean;
  disabled?: boolean;
  className?: string;
}

const sanitize = (raw: string) => raw.replace(/[^0-9.]/g, "");
const toNumber = (raw: string): number | "" => {
  const cleaned = sanitize(raw);
  if (cleaned === "" || cleaned === ".") return "";
  const n = Number(cleaned);
  return Number.isNaN(n) ? "" : n;
};

/**
 * 数字输入框（仿 Odoo）：
 * - 纯数字输入，允许空值（""），便于「默认为空」的场景；
 * - 输入时实时剥离前导零（如 0900 → 900），失焦再次规整；
 * - 可选 suffix 后缀（如 "%"），渲染在框内右侧；
 * - bare 态去掉边框/背景，内嵌到表格单元格；聚焦时显示圆角焦点环。
 */
export function InputNumber({
  value,
  onChange,
  min,
  max,
  placeholder,
  suffix,
  bare = false,
  disabled,
  className,
}: InputNumberProps) {
  const [text, setText] = useState<string>(value === "" ? "" : String(value));

  // 外部 value 变化时同步到本地文本（如回填、步进等）
  useEffect(() => {
    setText(value === "" ? "" : String(value));
  }, [value]);

  const emit = (n: number | "") => {
    let v = n;
    if (v !== "" && min != null && v < min) v = min;
    if (v !== "" && max != null && v > max) v = max;
    onChange(v);
  };

  return (
    <div
      className={cn(
        "flex h-8 items-center",
        !bare && "rounded-md border border-input bg-background",
        className,
      )}
    >
      <input
        type="text"
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const cleaned = sanitize(e.target.value);
          setText(cleaned);
          emit(toNumber(cleaned));
        }}
        onBlur={() => {
          const n = toNumber(text);
          emit(n);
          setText(n === "" ? "" : String(n));
        }}
        className={cn(
          "h-8 min-w-0 flex-1 bg-transparent text-right text-sm tabular-nums outline-none",
          bare
            ? "rounded-md px-1 focus-visible:ring-1 focus-visible:ring-primary"
            : "px-2 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary",
        )}
      />
      {suffix && (
        <span className="select-none pr-2 text-sm text-muted-foreground">{suffix}</span>
      )}
    </div>
  );
}
