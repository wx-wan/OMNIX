"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type SearchFieldProps = React.ComponentProps<typeof Input> & {
  /** 容器类名（控制宽度），输入框类名用 inputClassName。 */
  containerClassName?: string;
  inputClassName?: string;
};

/**
 * 带搜索图标的输入框（全项目唯一实现）。
 *
 * 关键点：左内边距必须用 `!` 强制覆盖主题 CSS `.cn-input` 的 `px-2.5`，
 * 否则图标会压在占位文字上（历史 bug）。用逻辑属性 ps/start 兼容 RTL。
 */
export function SearchField({
  containerClassName,
  inputClassName,
  className,
  ...props
}: SearchFieldProps) {
  return (
    <div className={cn("relative w-full", containerClassName)}>
      <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        {...props}
        className={cn("ps-9!", className, inputClassName)}
      />
    </div>
  );
}
