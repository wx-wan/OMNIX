import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { WsUser } from "src/types/apps/workspace";
import { PmsAvatar } from "./pms";
import { roleLabelKey } from "./projects/role-label";

/**
 * 人员字段唯一实现：经办人 / 创建人 / 负责人 / 成员共用。
 *
 * - 单选：value 为单个 id（或 null），列表里点击即可改派；
 * - 多选：value 为 id 数组，头像组展示，下拉里勾选增删；
 * - 只读：editable=false 时仅展示头像+姓名（多人为重叠头像组 + +N），不弹层；
 * - 全部左对齐，触发器与下拉内容均从 start 对齐；
 * - 唯一数据源是 WsUser（后端 /api/auth/users），不再自建假用户。
 */
export function PeopleField({
  users,
  value,
  onChange,
  multiple = false,
  editable = false,
  max = 3,
  size = "sm",
  align = "start",
  label,
  className,
  mode = "dropdown",
}: {
  users: WsUser[];
  value?: string | string[] | null;
  onChange?: (value: string | string[] | null) => void;
  multiple?: boolean;
  editable?: boolean;
  /** 多选只读时最多展示的头像数，超出以 +N 显示。 */
  max?: number;
  size?: "xs" | "sm";
  align?: "start" | "end";
  /** 下拉标题（如「指派给」「负责人」「成员」），不传则用默认。 */
  label?: string;
  className?: string;
  /** dropdown=列表内轻量下拉；select=表单内与 EnumSelect/RecordSelect 同款的选择框。 */
  mode?: "dropdown" | "select";
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const byId = new Map(users.map((person) => [person.id, person]));
  const selected: WsUser[] = multiple
    ? ((value as string[] | undefined) ?? [])
        .map((id) => byId.get(id))
        .filter((person): person is WsUser => Boolean(person))
    : [byId.get((value as string | null | undefined) ?? "")].filter(
        (person): person is WsUser => Boolean(person)
      );

  const nameSize = size === "xs" ? "text-xs" : "text-sm";
  const roleOf = (person: WsUser) => {
    const key = roleLabelKey(person.role);
    return key ? t(key) : "";
  };

  /** 只读展示：单选=头像+姓名；多选=重叠头像组 + +N。经办人/创建人共用同一形态。 */
  const content = (
    <span className={cn("flex min-w-0 items-center", nameSize, className)}>
      {selected.length === 0 ? (
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground">
            <UserRound className="size-3.5" />
          </span>
          <span className="truncate">{t("Unassigned")}</span>
        </span>
      ) : multiple ? (
        <span className="flex items-center">
          {selected.slice(0, max).map((person, index) => (
            <span
              key={person.id}
              title={person.name}
              className={cn("shrink-0", index > 0 && "-ms-2 ring-2 ring-background rounded-full")}
            >
              <PmsAvatar name={person.name} avatar={person.avatar} />
            </span>
          ))}
          {selected.length > max ? (
            <span
              className="-ms-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground ring-2 ring-background"
              title={selected
                .slice(max)
                .map((person) => person.name)
                .join(", ")}
            >
              +{selected.length - max}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="flex min-w-0 items-center gap-2">
          <PmsAvatar name={selected[0].name} avatar={selected[0].avatar} />
          <span className="truncate">{selected[0].name.split(" ")[0]}</span>
        </span>
      )}
    </span>
  );

  if (!editable) return content;

  const singleId = (value as string | null | undefined) ?? "";
  const multiIds = (value as string[] | undefined) ?? [];

  /** select 模式：与表单其它字段同款，触发器为带边框 Select，选项为头像+姓名+角色。 */
  if (mode === "select" && !multiple) {
    const NONE = "none";
    return (
      <Select
        value={singleId || NONE}
        onValueChange={(next) => next && onChange?.(next === NONE ? null : next)}
      >
        <SelectTrigger className={cn("w-full", className)}>
          <SelectValue>
            {(selected) => {
              const person = byId.get(String(selected ?? ""));
              return person ? (
                <span className="flex min-w-0 items-center gap-2">
                  <PmsAvatar name={person.name} avatar={person.avatar} />
                  <span className="truncate text-sm">{person.name}</span>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">{t("Unassigned")}</span>
              );
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{t("Unassigned")}</SelectItem>
          {users.map((person) => (
            <SelectItem key={person.id} value={person.id}>
              <span className="flex min-w-0 items-center gap-2">
                <PmsAvatar name={person.name} avatar={person.avatar} />
                <span className="truncate text-sm">{person.name}</span>
                <span className="ms-2 text-xs text-muted-foreground">{roleOf(person)}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={label ?? t("Assignee")}
        className="flex min-w-0 items-center gap-1 rounded-md px-1 py-0.5 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {label ?? t("Assignee")}
        </div>
        <DropdownMenuSeparator />
        {!multiple ? (
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              onChange?.(null);
            }}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground">
              <UserRound className="size-3.5" />
            </span>
            <span className="ms-2 text-muted-foreground">{t("Unassigned")}</span>
            {!singleId ? <Check className="ms-auto size-4" /> : null}
          </DropdownMenuItem>
        ) : null}
        {users.map((person) =>
          multiple ? (
            <DropdownMenuCheckboxItem
              key={person.id}
              checked={multiIds.includes(person.id)}
              onCheckedChange={(checked) =>
                onChange?.(
                  checked
                    ? [...multiIds, person.id]
                    : multiIds.filter((id) => id !== person.id)
                )
              }
              className="flex items-center gap-2"
            >
              <PmsAvatar name={person.name} avatar={person.avatar} />
              <span className="min-w-0 flex-1 truncate text-sm">{person.name}</span>
              <span className="text-xs text-muted-foreground">{roleOf(person)}</span>
            </DropdownMenuCheckboxItem>
          ) : (
            <DropdownMenuItem
              key={person.id}
              onClick={() => {
                setOpen(false);
                if (person.id !== singleId) onChange?.(person.id);
              }}
              className="flex items-center gap-2"
            >
              <PmsAvatar name={person.name} avatar={person.avatar} />
              <span className="min-w-0 flex-1 truncate text-sm">{person.name}</span>
              <span className="text-xs text-muted-foreground">{roleOf(person)}</span>
              {singleId === person.id ? <Check className="ms-1 size-4 shrink-0" /> : null}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** 多选头像组（只读）的便捷别名，语义化用于成员列。 */
export function PeopleGroup({
  users,
  value,
  max = 3,
  className,
}: {
  users: WsUser[];
  value: string[];
  max?: number;
  className?: string;
}) {
  return (
    <PeopleField
      users={users}
      value={value}
      multiple
      max={max}
      className={className}
    />
  );
}

export default PeopleField;
