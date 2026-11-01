"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronsUpDown, Search, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "cn";
import { userInitials } from "@/lib/auth";
import { SearchMoreModal } from "./SearchMoreModal";
import type { SelectRecord } from "./SearchableSelect";

export interface SalesPerson {
  id: string;
  name: string;
  email?: string;
}

export interface SalespersonPickerProps {
  users: SalesPerson[];
  /** 当前选中用户 id（默认应为当前登录用户） */
  value: string;
  onChange: (id: string) => void;
  /** 搜索更多弹窗标题 */
  searchMoreTitle?: string;
  className?: string;
}

/**
 * 业务员（负责人）头像选择器：
 * - 触发器为胶囊，显示当前负责人头像 + 姓名 + 下拉箭头（仿「头像 + 负责人名称 + 点击下拉」）；
 * - 点击打开浮层，列出可选业务员（头像 + 姓名）；底部「搜索更多」与 SearchableSelect 一致——
 *   点击打开搜索弹窗，弹窗内可搜索/翻页并显示全部用户，选中即生效；
 * - 默认由父级传入当前登录用户作为初始负责人，同时承担「创建人 + 负责人」角色。
 */
export function SalespersonPicker({
  users,
  value,
  onChange,
  searchMoreTitle,
  className,
}: SalespersonPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const selected = users.find((u) => u.id === value) ?? users[0] ?? null;

  // 搜索更多弹窗的数据：复用 SelectRecord，头像用姓名首字母
  const records: SelectRecord[] = users.map((u) => ({
    id: u.id,
    label: u.name,
    sublabel: u.email,
    avatarText: userInitials(u.name),
  }));

  const openSearchMore = () => {
    setOpen(false);
    setSearchOpen(true);
  };

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
        }}
      >
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label={t("crm.salesperson")}
              className={cn(
                "flex items-center gap-2 rounded-full border border-border bg-background py-1 pr-2 pl-1 text-sm hover:bg-accent/50",
                className,
              )}
            />
          }
        >
          {selected ? (
            <>
              <Avatar size="sm">
                <AvatarFallback>{userInitials(selected.name)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{selected.name}</span>
            </>
          ) : (
            <span className="px-2 text-muted-foreground">{t("crm.salesperson")}</span>
          )}
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56">
          <p className="px-1 pb-1.5 text-xs text-muted-foreground">
            {t("crm.selectSalesperson")}
          </p>
          <div className="flex max-h-60 flex-col overflow-y-auto">
            {users.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                {t("crm.noMatch")}
              </p>
            ) : (
              users.map((u) => {
                const active = u.id === value;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onChange(u.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent",
                      active && "bg-primary/5",
                    )}
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{userInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm">{u.name}</span>
                    {active && <span className="text-xs text-primary">✓</span>}
                  </button>
                );
              })
            )}
          </div>
          <button
            type="button"
            onClick={openSearchMore}
            className="mt-1 flex w-full items-center gap-2 border-t border-border px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
          >
            <Search className="size-4" />
            {t("picker.searchMore")}
            <ArrowRight className="ml-auto size-4" />
          </button>
        </PopoverContent>
      </Popover>

      <SearchMoreModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        records={records}
        selectedId={value}
        title={searchMoreTitle ?? t("crm.selectSalesperson")}
        onConfirm={(rec) => {
          onChange(rec.id);
          setSearchOpen(false);
        }}
      />
    </>
  );
}
