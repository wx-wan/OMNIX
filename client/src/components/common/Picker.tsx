"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X, ChevronsUpDown, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import type { SelectRecord } from "./SearchableSelect";
import { SearchMoreModal } from "./SearchMoreModal";

export interface PickerProps {
  records: SelectRecord[];
  /** 当前选中记录 id */
  value?: string | null;
  /** 选中 / 清空回调（清空时回调 null） */
  onChange?: (record: SelectRecord | null) => void;
  /** 输入内容变化（每次按键），用于把自由文本同步给外部（如描述字段） */
  onInputChange?: (text: string) => void;
  placeholder?: string;
  /** 无输入时展示的「常用」条数，默认 5 */
  topN?: number;
  /** 「搜索更多」弹窗标题（字段名），展示为「搜索: x」 */
  searchMoreTitle?: string;
  /** 「搜索更多」弹窗每页条数，默认 20 */
  pageSize?: number;
  /** 当 value 在 records 中找不到时的补充展示文本，例如历史仅存税率 "13%" */
  fallbackText?: string;
  /** 无边框内嵌态：去掉边框/背景，便于嵌入表格单元格（如税项列） */
  bare?: boolean;
  id?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * 通用记录选择器（基础组件，仿 Odoo many2one）：
 * - 输入框内直接打字，下拉实时联想（按 label / sublabel 过滤）；
 * - 无输入时展示使用率最高的 topN 条（默认 5 项最常用）；
 * - 键盘 ↑/↓ 选择、Enter 选中、Esc 关闭；点击选项即选中并带回数据；
 * - 下拉底部「搜索更多…」打开弹窗（居中搜索 + 分页表格 + 复选框，「搜索: x」标题）；
 * - 支持 bare（无边框）态，便于嵌入表格单元格；
 * - 下拉通过 portal + fixed 定位，避免被父级 overflow 裁剪。
 */
export function Picker({
  records,
  value,
  onChange,
  onInputChange,
  placeholder,
  topN = 5,
  searchMoreTitle,
  pageSize,
  fallbackText,
  bare,
  id,
  className,
  disabled,
}: PickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    width: number;
  } | null>(null);

  const computePos = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return null;
    const below = window.innerHeight - r.bottom;
    const openUp = below < 320 && r.top > 320;
    return {
      left: r.left,
      width: r.width,
      top: openUp ? undefined : r.bottom + 4,
      bottom: openUp ? window.innerHeight - r.top + 4 : undefined,
    };
  };

  const openDropdown = () => {
    setPos(computePos());
    setActive(0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const update = () => setPos(computePos());
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selected = records.find((r) => r.id === value) ?? null;
  const inputValue = query || selected?.label || fallbackText || "";

  const topRecords = useMemo(
    () => [...records].sort((a, b) => (b.usage ?? 0) - (a.usage ?? 0)).slice(0, topN),
    [records, topN],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topRecords;
    return records.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.sublabel?.toLowerCase().includes(q),
    );
  }, [query, records, topRecords]);

  const handlePick = (rec: SelectRecord) => {
    onChange?.(rec);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange?.(null);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return openDropdown();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && filtered[active]) {
        e.preventDefault();
        handlePick(filtered[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      <div ref={wrapRef} className={cn("group relative", className)}>
        <div className="relative">
          <Input
            id={id}
            value={inputValue}
            disabled={disabled}
            placeholder={placeholder ?? t("picker.placeholder")}
            className={cn(
              "pl-3 pr-8",
              bare &&
                "!border-0 !bg-transparent dark:!bg-transparent shadow-none focus-visible:!ring-0",
            )}
            onFocus={openDropdown}
            onChange={(e) => {
              setQuery(e.target.value);
              onInputChange?.(e.target.value);
              openDropdown();
            }}
            onKeyDown={onKeyDown}
          />
          {selected || fallbackText ? (
            <button
              type="button"
              aria-label={t("picker.clear")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={clear}
              className="absolute top-1/2 right-2.5 flex size-4 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
        </div>

        {open &&
          pos &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <div
                className="fixed z-50 max-h-80 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
                style={{
                  left: pos.left,
                  top: pos.top,
                  bottom: pos.bottom,
                  width: Math.max(
                    pos.width,
                    Math.min(
                      360,
                      (typeof window !== "undefined"
                        ? window.innerWidth
                        : 1200) - pos.left - 12,
                    ),
                  ),
                }}
              >
                <p className="px-2.5 pt-2 pb-1 text-xs text-muted-foreground">
                  {query.trim() ? t("picker.results") : t("picker.frequent")}
                </p>
                <div className="max-h-60 overflow-y-auto py-1">
                  {filtered.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      {t("picker.noResults")}
                    </p>
                  ) : (
                    filtered.map((r, i) => (
                      <button
                        key={r.id}
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => handlePick(r)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2 text-left",
                          i === active && "bg-accent",
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {r.label}
                          </span>
                          {r.sublabel && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {r.sublabel}
                            </span>
                          )}
                        </span>
                        {typeof r.usage === "number" && !query.trim() && (
                          <span className="text-[10px] tabular-nums text-muted-foreground">
                            {r.usage}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSearchOpen(true);
                  }}
                  className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
                >
                  {t("picker.searchMore")}
                  <ArrowRight className="ml-auto size-4" />
                </button>
              </div>
            </>,
            document.body,
          )}
      </div>

      <SearchMoreModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        records={records}
        selectedId={value}
        pageSize={pageSize}
        title={searchMoreTitle}
        onConfirm={(rec) => handlePick(rec)}
      />
    </>
  );
}
