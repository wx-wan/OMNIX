"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Search, ChevronsUpDown, ArrowRight, X } from "lucide-react";
import { cn } from "cn";
import { Image } from "@/components/ui/image";
import { SearchMoreModal } from "./SearchMoreModal";

export interface SelectRecord {
  id: string;
  label: string;
  sublabel?: string;
  /** 头像/首字母（如没有则显示放大镜图标） */
  avatarText?: string;
  /** 使用次数，用于「常用纪录」排序 */
  usage?: number;
  /** 弹窗中展示的更多字段 */
  details?: { label: string; value: string }[];
  /** 产品主图 URL（选择器选项可显示缩略图） */
  image?: string;
  /** 是否为需求阶段新建的产品（需求产品），选择器内显示「需求」标 */
  isRequirement?: boolean;
  /** 成本价（元），选品时回填到商机明细行 */
  costPrice?: number;
}

interface SearchableSelectProps {
  records: SelectRecord[];
  value?: string | null;
  onChange?: (record: SelectRecord | null) => void;
  placeholder?: string;
  /** 下拉框默认展示的「使用率最高」条数，默认 5 */
  topN?: number;
  /** 搜索更多弹窗每页条数，默认 8 */
  pageSize?: number;
  searchMoreTitle?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  /** 无边框内嵌形态：去掉输入框边框/背景，便于嵌入到父容器（如表格描述单元格）中 */
  bare?: boolean;
  /** 输入内容变化时的回调（每次按键），用于把自由文本同步给外部（如描述字段） */
  onInputChange?: (text: string) => void;
}

/**
 * 仿 Odoo many2one 的记录选择器：
 * - 可输入可下拉选择；未输入时下拉展示使用率最高的 topN 条；
 * - 下拉底部「搜索更多…」打开弹窗，弹窗内可搜索、翻页，并展示每条记录的更多信息（details）。
 */
export function SearchableSelect({
  records,
  value,
  onChange,
  placeholder,
  topN = 5,
  pageSize = 8,
  searchMoreTitle,
  id,
  className,
  disabled,
  bare,
  onInputChange,
}: SearchableSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
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
    // 下方空间不足且上方充足时向上展开
    const below = window.innerHeight - r.bottom;
    const openUp = below < 340 && r.top > 340;
    return {
      left: r.left,
      width: r.width,
      top: openUp ? undefined : r.bottom + 4,
      bottom: openUp ? window.innerHeight - r.top + 4 : undefined,
    };
  };

  const openDropdown = () => {
    setPos(computePos());
    setOpen(true);
  };

  // 滚动 / 缩放时跟随输入框；portal + fixed 定位，避免被父级 overflow 裁剪
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
  const inputValue = query || selected?.label || "";

  const topRecords = useMemo(
    () =>
      [...records]
        .sort((a, b) => (b.usage ?? 0) - (a.usage ?? 0))
        .slice(0, topN),
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

  const handlePick = (rec: SelectRecord, closeSearch = false) => {
    onChange?.(rec);
    setQuery("");
    setOpen(false);
    if (closeSearch) setSearchOpen(false);
  };

  const openSearchMore = () => {
    setOpen(false);
    setSearchOpen(true);
  };

  const clear = () => {
    onChange?.(null);
    setQuery("");
    setOpen(false);
  };

  return (
    <>
      <div ref={wrapRef} className={cn("relative", className)}>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            value={inputValue}
            disabled={disabled}
            placeholder={placeholder ?? t("picker.placeholder")}
            className={cn(
              "pr-8 pl-8",
              bare &&
                "h-8 border-0 bg-transparent shadow-none focus-visible:ring-0",
            )}
            onClick={openDropdown}
            onChange={(e) => {
              setQuery(e.target.value);
              onInputChange?.(e.target.value);
              openDropdown();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          />
          {selected ? (
            <button
              type="button"
              aria-label={t("picker.clear")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={clear}
              className="absolute top-1/2 right-2.5 flex size-4 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
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
                  width: pos.width,
                }}
              >
                <p className="px-2.5 pt-2 pb-1 text-xs text-muted-foreground">
                  {query.trim()
                    ? t("picker.results")
                    : t("picker.frequent")}
                </p>
                <div className="max-h-60 overflow-y-auto py-1">
                  {filtered.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      {t("picker.noResults")}
                    </p>
                  ) : (
                    filtered.map((r) => (
                      <RecordOption
                        key={r.id}
                        record={r}
                        active={selected?.id === r.id}
                        showUsage={!query.trim()}
                        onClick={() => handlePick(r)}
                      />
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={openSearchMore}
                  className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
                >
                  <Search className="size-4" />
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
        onConfirm={(rec) => handlePick(rec, true)}
      />
    </>
  );
}

function RecordOption({
  record,
  active,
  showUsage,
  onClick,
}: {
  record: SelectRecord;
  active: boolean;
  showUsage: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-accent",
        active && "bg-accent",
      )}
    >
      {record.image ? (
        <Image
          src={record.image}
          alt={record.label}
          ratio="1/1"
          className="size-7 rounded-md"
        />
      ) : record.avatarText ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
          {record.avatarText}
        </span>
      ) : (
        <Search className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{record.label}</span>
        {record.sublabel && (
          <span className="block truncate text-xs text-muted-foreground">
            {record.sublabel}
          </span>
        )}
      </span>
      {showUsage && record.usage != null && record.usage > 0 && (
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {record.usage}
        </span>
      )}
    </button>
  );
}
