"use client";

import { cn } from "cn";

export interface PillToggleOption {
  value: string;
  label: string;
}

export interface PillToggleProps {
  options: PillToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * 胶囊分段切换组件（rounded-full 容器 + 选中段高亮）：
 * 用于二选一或少量互斥选项，如「含税 / 不含税」。
 */
export function PillToggle({
  options,
  value,
  onChange,
  className,
}: PillToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/50 p-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
