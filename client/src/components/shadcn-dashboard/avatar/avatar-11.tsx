"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Check } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type AvatarMember = {
  id?: string;
  name: string;
  initials?: string;
  image?: string;
  role?: string;
};

const DEMO_MEMBERS: AvatarMember[] = [
  { name: "Albert Flores", initials: "AF", image: "https://images.shadcnspace.com/assets/shadcn-dashboard/profile/user-1.webp", role: "Owner" },
  { name: "Jessica Hall", initials: "JH", image: "https://images.shadcnspace.com/assets/shadcn-dashboard/profile/user-2.webp", role: "Admin" },
  { name: "Jenny Wilson", initials: "JW", image: "https://images.shadcnspace.com/assets/shadcn-dashboard/profile/user-3.webp", role: "Editor" },
  { name: "Robert Fox", initials: "RF", image: "https://images.shadcnspace.com/assets/shadcn-dashboard/profile/user-4.webp", role: "Editor" },
  { name: "Darlene Robertson", initials: "DR", image: "https://images.shadcnspace.com/assets/shadcn-dashboard/profile/user-5.webp", role: "Viewer" },
  { name: "Cody Fisher", initials: "CF", image: "https://images.shadcnspace.com/assets/shadcn-dashboard/profile/user-6.webp", role: "Viewer" },
  { name: "Kristin Watson", initials: "KW", image: "", role: "Viewer" },
];

const VISIBLE = 4;

type Props = {
  members?: AvatarMember[];
  visible?: number;
  /** 是否在头像组下方显示说明文字（独立 demo 用，列表行关闭）。 */
  showHint?: boolean;
  size?: "sm" | "default" | "lg";
  /** 对齐方式：demo 居中对齐，列表行左对齐。 */
  align?: "center" | "start";
  /** 是否允许添加/移除成员；列表默认 false，项目详情开启。 */
  editable?: boolean;
  /** 可选成员池（通常传工作区全部用户），editable 时用于下拉勾选。 */
  allUsers?: AvatarMember[];
  /** 成员变更回调，返回新的成员 id 列表。 */
  onChange?: (ids: string[]) => void;
};

const AvatarDemo = ({
  members = DEMO_MEMBERS,
  visible: visibleCount = VISIBLE,
  showHint = true,
  size = "lg",
  align = "center",
  editable = false,
  allUsers,
  onChange,
}: Props) => {
  const { t } = useTranslation();
  const [addOpen, setAddOpen] = useState(false);
  const visible = members.slice(0, visibleCount);
  const hidden = members.slice(visibleCount);
  const selectedIds = new Set(members.map((m) => m.id).filter(Boolean) as string[]);
  const pool = allUsers ?? members;
  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange?.(pool.filter((u) => u.id && next.has(u.id)).map((u) => u.id as string));
  };

  return (
    <TooltipProvider delay={150}>
      <div className={align === "start" ? "flex flex-col items-start gap-3" : "flex flex-col items-center gap-3"}>
        <AvatarGroup>
          {visible.map((member, index) => {
            const initials =
              member.initials ||
              member.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();
            return (
              <Tooltip key={`${member.name}-${index}`}>
                <TooltipTrigger
                  render={
                    <Avatar size={size} className="transition-transform hover:z-10 hover:-translate-y-0.5 motion-reduce:transition-none">
                      {member.image && <AvatarImage src={member.image} alt={member.name} />}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  }
                />
                <TooltipContent>{member.name}</TooltipContent>
              </Tooltip>
            );
          })}
          {hidden.length > 0 && (
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    aria-label={t("Show {{n}} more members", { n: hidden.length })}
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <AvatarGroupCount
                      className={
                        size === "lg"
                          ? "size-10 transition-colors hover:bg-muted/70 hover:text-foreground"
                          : size === "sm"
                            ? "size-6 text-xs transition-colors hover:bg-muted/70 hover:text-foreground"
                            : "size-8 transition-colors hover:bg-muted/70 hover:text-foreground"
                      }
                    >
                      +{hidden.length}
                    </AvatarGroupCount>
                  </button>
                }
              />
              <PopoverContent align="start" className="w-60 gap-1 p-1.5">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  {t("{{n}} members", { n: members.length })}
                </p>
                <ul className="flex flex-col">
                  {hidden.map((member, index) => {
                    const initials =
                      member.initials ||
                      member.name
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase();
                    return (
                      <li key={`${member.name}-${index}`} className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
                        <Avatar size="sm">
                          {member.image && <AvatarImage src={member.image} alt="" />}
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{member.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {member.role
                            ? t(member.role.charAt(0).toUpperCase() + member.role.slice(1))
                            : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </PopoverContent>
            </Popover>
          )}
          {editable && (
            <Popover open={addOpen} onOpenChange={setAddOpen}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    aria-label={t("Add members")}
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground outline-none transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring",
                      size === "lg" ? "size-10" : size === "sm" ? "size-6" : "size-8"
                    )}
                  >
                    <Plus className={size === "sm" ? "size-3" : "size-4"} />
                  </button>
                }
              />
              <PopoverContent align="start" className="w-64 gap-1 p-1.5">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  {t("Add members")}
                </p>
                <ul className="flex max-h-64 flex-col overflow-y-auto">
                  {pool.map((user, index) => {
                    const checked = user.id ? selectedIds.has(user.id) : false;
                    const initials =
                      user.initials ||
                      user.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
                    return (
                      <li key={`${user.id ?? user.name}-${index}`}>
                        <button
                          type="button"
                          onClick={() => user.id && toggle(user.id)}
                          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start hover:bg-accent"
                        >
                          <Avatar size="sm">
                            {user.image && <AvatarImage src={user.image} alt="" />}
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.role ? t(user.role.charAt(0).toUpperCase() + user.role.slice(1)) : ""}
                          </span>
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded border",
                              checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                            )}
                          >
                            {checked && <Check className="size-3" />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </PopoverContent>
            </Popover>
          )}
        </AvatarGroup>
        {showHint ? (
          <p className="text-xs text-muted-foreground">{t("Hover a face to see who it is")}</p>
        ) : null}
      </div>
    </TooltipProvider>
  );
};

export default AvatarDemo;
