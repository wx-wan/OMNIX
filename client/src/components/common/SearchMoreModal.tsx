"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "cn";
import type { SelectRecord } from "./SearchableSelect";

interface SearchMoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: SelectRecord[];
  /** 当前已选中的记录 id（打开时勾选） */
  selectedId?: string | null;
  /** 点击「选择」确认回调（双击行 = 立即确认） */
  onConfirm?: (record: SelectRecord) => void;
  /** 弹窗标题，如「税项」，展示为「搜索: 税项」 */
  title?: string;
  /** 每页条数，默认 20 */
  pageSize?: number;
}

/**
 * 仿 Odoo「搜索更多」弹窗：
 * - 顶栏「搜索: x」+ 关闭；工具行居中搜索框，右侧 1-N / total 分页与 ‹ › 翻页；
 * - 表格列：复选框、名称、以及记录 details 中的动态列；
 * - 单击行勾选，双击行直接确认；底部「选择 / 关闭」。
 */
export function SearchMoreModal({
  open,
  onOpenChange,
  records,
  selectedId,
  onConfirm,
  title,
  pageSize = 20,
}: SearchMoreModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [checkedId, setCheckedId] = useState<string | null>(null);

  // 每次打开时重置搜索/页码，并勾选当前已选项
  useEffect(() => {
    if (open) {
      setSearch("");
      setPage(0);
      setCheckedId(selectedId ?? null);
    }
  }, [open, selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.sublabel?.toLowerCase().includes(q) ||
        r.details?.some((d) => d.value.toLowerCase().includes(q)),
    );
  }, [search, records]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const start = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const end = Math.min((safePage + 1) * pageSize, filtered.length);

  // 动态列：取所有记录 details 中出现过的字段名（保持首次出现顺序）
  const columns = useMemo(() => {
    const labels: string[] = [];
    for (const r of records) {
      for (const d of r.details ?? []) {
        if (!labels.includes(d.label)) labels.push(d.label);
      }
    }
    return labels;
  }, [records]);

  const checked = records.find((r) => r.id === checkedId) ?? null;

  const confirm = (rec?: SelectRecord) => {
    const target = rec ?? checked;
    if (!target) return;
    onConfirm?.(target);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
        style={{ width: 978, height: 910, maxHeight: "95vh" }}
      >
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>
            {title ? `${t("picker.searchPrefix")}: ${title}` : t("picker.searchMore")}
          </DialogTitle>
        </DialogHeader>

        {/* 搜索框（居中）+ 分页（右侧） */}
        <div className="relative flex items-center justify-center border-b border-border px-4 py-3">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              placeholder={t("picker.searchPlaceholder")}
              className="rounded-full pl-9"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              onKeyDown={(e) => e.key === "Enter" && confirm()}
            />
          </div>
          <div className="absolute right-4 flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
            <span>
              {start}-{end} / {filtered.length}
            </span>
            <Button
              variant="outline"
              size="xs"
              className="px-1"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label={t("common.prev")}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="xs"
              className="px-1"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
              aria-label={t("common.next")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* 记录表格（在固定高度内撑满并滚动） */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {paged.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("picker.noResults")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="w-10 px-3 py-2.5" />
                  <th className="px-3 py-2.5 font-medium">{t("picker.colName")}</th>
                  {columns.map((c) => (
                    <th key={c} className="px-3 py-2.5 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((r) => {
                  const isChecked = checkedId === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setCheckedId(r.id)}
                      onDoubleClick={() => confirm(r)}
                      className={cn(
                        "cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40",
                        isChecked && "bg-primary/5",
                      )}
                    >
                      <td
                        className="px-3 py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => setCheckedId(r.id)}
                          aria-label={r.label}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">
                        <span>{r.label}</span>
                        {r.sublabel && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            {r.sublabel}
                          </span>
                        )}
                      </td>
                      {columns.map((c) => (
                        <td
                          key={c}
                          className="max-w-56 truncate px-3 py-2 text-muted-foreground"
                        >
                          {r.details?.find((d) => d.label === c)?.value}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <Button size="sm" disabled={!checked} onClick={() => confirm()}>
            {t("common.select")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
