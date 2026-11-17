"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PmsAvatar } from "../pms";
import { roleLabelKey } from "./role-label";
import type { WsUser } from "src/types/apps/workspace";

/** 负责人选择器：点击头像/名称弹出下拉（仿 shadcn 风格），单选并回调。 */
export function LeadSelect({
  users,
  value,
  onChange,
}: {
  users: WsUser[];
  value?: string | null;
  onChange: (userId: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const lead = users.find((u) => u.id === value);
  const roleOf = (role?: string) => (role ? t(roleLabelKey(role)) : "");

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={t("Change lead")}
        className="group flex items-center gap-2 rounded-md px-1 py-0.5 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronDown className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-popup-open:opacity-100" />
        <span className="truncate">{lead?.name ?? "—"}</span>
        <PmsAvatar name={lead?.name} avatar={lead?.avatar} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("Change lead")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {users.map((person) => (
            <DropdownMenuItem
              key={person.id}
              onClick={() => {
                setOpen(false);
                if (person.id !== value) onChange(person.id);
              }}
              className="flex items-center gap-2"
            >
              <PmsAvatar name={person.name} avatar={person.avatar} size={6} />
              <span className="min-w-0 flex-1 truncate text-sm">{person.name}</span>
              <span className="text-xs text-muted-foreground">{roleOf(person.role)}</span>
              {person.id === value ? <Check className="ms-1 size-4 shrink-0 text-primary" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LeadSelect;
