"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "cn";
import { userInitials } from "@/lib/auth";

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
  className?: string;
}

/**
 * 业务员（负责人）头像选择器：
 * - 触发器为胶囊，显示当前负责人头像 + 姓名 + 下拉箭头；
 * - 点击打开浮层，列出可选业务员（头像 + 姓名），选中即生效；
 * - 默认由父级传入当前登录用户作为初始负责人，同时承担「创建人 + 负责人」角色。
 */
export function SalespersonPicker({
  users,
  value,
  onChange,
  className,
}: SalespersonPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selected = users.find((u) => u.id === value) ?? users[0] ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <div className="flex flex-col">
          {users.map((u) => {
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
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
