"use client";

import { createElement, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type InlineEditProps = {
  /** 当前纯文本（用于判断变化）。 */
  value: string;
  /** 空值占位文字：用 CSS :empty::before 显示，不进入 DOM、不被保存。 */
  placeholder?: string;
  /** blur / Enter 时提交。 */
  onCommit: (value: string) => void;
  /** 元素类型。 */
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** 无障碍标签。 */
  label?: string;
  /** 编辑态底部横线颜色类名（默认 shadcn ring 色）。 */
  underlineClassName?: string;
  className?: string;
};

/**
 * shadcn 风格内联编辑：点击后保持原文本样式（不出现输入框），底部显示灰色横线表示编辑态，
 * 带 shadcn 标准 focus ring；blur / Enter 提交，Escape 取消。
 * 空值占位用 CSS 伪元素，编辑态清空后依然可见，且不污染 DOM/textContent。
 */
export function InlineEdit({
  value,
  placeholder,
  onCommit,
  as = "span",
  label,
  underlineClassName = "border-ring/50",
  className,
}: InlineEditProps) {
  const ref = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState(false);
  const original = useRef(value);
  const canceled = useRef(false);

  const start = () => {
    original.current = value;
    canceled.current = false;
    setEditing(true);
    requestAnimationFrame(() => {
      ref.current?.focus();
      const selection = window.getSelection();
      if (ref.current && selection) {
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
  };

  const commit = () => {
    if (!editing) return;
    setEditing(false);
    if (canceled.current) return; // React 会用 value 重渲染，无需手动改 DOM
    const next = (ref.current?.textContent ?? "").trim();
    if (next !== original.current) onCommit(next);
  };

  return createElement(
    as,
    {
      key: editing ? "editing" : "view",
      ref: ref as never,
      role: "textbox",
      tabIndex: 0,
      "aria-label": label,
      "data-placeholder": placeholder,
      contentEditable: editing,
      suppressContentEditableWarning: true,
      onClick: () => {
        if (!editing) start();
      },
      onBlur: commit,
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          canceled.current = true;
          commit();
        }
      },
      className: cn(
        "rounded-sm outline-none transition-all duration-150",
        // 空值占位：CSS 伪元素，不进入 DOM，编辑态清空后依然可见
        "empty:before:text-muted-foreground/60 empty:before:content-[attr(data-placeholder)]",
        editing
          ? cn(
              "border-b-2 bg-transparent focus-visible:ring-3 focus-visible:ring-ring/20",
              underlineClassName
            )
          : "cursor-pointer hover:bg-accent/60",
        className
      ),
    },
    value
  );
}
