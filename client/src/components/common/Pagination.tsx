"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

export interface PaginationProps {
  /** 当前页（0 基，即第一页为 0） */
  page: number;
  /** 总页数（>=1） */
  pageCount: number;
  onPageChange: (page: number) => void;
  /** 总条数（与 pageSize 配合展示「start–end / total」信息） */
  total?: number;
  /** 每页条数（配合 total） */
  pageSize?: number;
  /** 当前页两侧显示的页码数，默认 1 */
  siblingCount?: number;
  className?: string;
}

/** 生成带省略号的页码序列（0 基） */
function buildPages(current: number, count: number, sibling: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [];
  const windowSize = sibling * 2 + 1;
  // 总数较少时直接全部展示
  if (count <= windowSize + 4) {
    for (let i = 0; i < count; i++) pages.push(i);
    return pages;
  }
  const start = Math.max(1, current - sibling);
  const end = Math.min(count - 2, current + sibling);
  pages.push(0);
  if (start > 1) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < count - 2) pages.push("ellipsis");
  pages.push(count - 1);
  return pages;
}

/**
 * 通用分页器：首页 / 上一页 / 页码（带省略号）/ 下一页 / 末页，
 * 左侧展示条数区间（传入 total + pageSize 时）或「第 x / y 页」。
 * 与项目 Button（variant=outline / size=icon-xs）风格统一。
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  total,
  pageSize,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const { t } = useTranslation();
  const count = Math.max(1, pageCount);
  const safePage = Math.min(Math.max(0, page), count - 1);
  const pages = buildPages(safePage, count, siblingCount);

  const showInfo = total != null && pageSize != null;
  const start = showInfo ? (total === 0 ? 0 : safePage * pageSize + 1) : null;
  const end = showInfo ? Math.min((safePage + 1) * pageSize, total) : null;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="text-xs tabular-nums text-muted-foreground">
        {showInfo && start != null && end != null
          ? t("common.pageInfo", { start, end, total })
          : t("common.pageOf", { page: safePage + 1, count })}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          className="px-1"
          disabled={safePage === 0}
          aria-label={t("common.first")}
          onClick={() => onPageChange(0)}
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          className="px-1"
          disabled={safePage === 0}
          aria-label={t("common.prev")}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft />
        </Button>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e${i}`} className="px-1 text-xs text-muted-foreground" aria-hidden>
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === safePage ? "default" : "outline"}
              size="icon-xs"
              aria-current={p === safePage ? "page" : undefined}
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon-xs"
          className="px-1"
          disabled={safePage >= count - 1}
          aria-label={t("common.next")}
          onClick={() => onPageChange(safePage + 1)}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          className="px-1"
          disabled={safePage >= count - 1}
          aria-label={t("common.last")}
          onClick={() => onPageChange(count - 1)}
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}
