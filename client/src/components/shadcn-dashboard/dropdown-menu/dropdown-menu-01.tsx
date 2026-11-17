"use client";

import type { ReactElement } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CircleUserRound,
  CreditCard,
  ReceiptText,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";

type Props = {
  trigger: ReactElement;
  defaultOpen?: boolean;
  align?: "start" | "center" | "end";
  /** 用户信息：不传则沿用 block 的默认演示数据。 */
  user?: {
    name: string;
    email: string;
    avatar?: string;
    initials?: string;
    online?: boolean;
  };
  /** 菜单项点击回调；不传则仅作展示。key 与默认项 label 对应。 */
  onSelect?: (label: string) => void;
  /** 菜单项文案映射（本地化）；默认原样展示 block 的英文 label。 */
  labelOf?: (label: string) => string;
};

type MenuItem = {
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
};

const PROFILE_ITEMS: MenuItem[] = [
  { label: "My Profile", icon: CircleUserRound },
  { label: "My Subscription", icon: CreditCard },
  { label: "My Invoice", icon: ReceiptText },
];

const SETTINGS_ITEMS: MenuItem[] = [
  { label: "Account Settings", icon: Settings },
];

const LOGOUT_ITEM: MenuItem = {
  label: "Signout",
  icon: LogOut,
  destructive: true,
};

const itemClass =
  "p-2 text-sm font-medium text-popover-foreground cursor-pointer gap-2";

const DEFAULT_USER = {
  name: "David McMichael",
  email: "david@shadcndashboard.com",
  avatar:
    "https://images.shadcnspace.com/assets/shadcn-dashboard/profile/user-1.webp",
  initials: "DM",
  online: true,
};

const Dropdown = ({
  trigger,
  defaultOpen,
  align = "end",
  user = DEFAULT_USER,
  onSelect,
  labelOf = (label) => label,
}: Props) => {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger className="cursor-pointer">
        {trigger}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="w-3xs rounded-2xl data-open:slide-in-from-bottom-20! data-closed:slide-out-to-bottom-20 data-open:fade-in-0 data-closed:fade-out-0 data-closed:zoom-out-100 duration-400"
      >
        <DropdownMenuGroup>
          {/* User Info */}
          <DropdownMenuLabel className="flex items-center gap-3 px-4 py-3">
            <div className="relative">
              <Avatar className="size-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              {user.online ? (
                <span className="ring-card absolute right-0 bottom-0 z-10 size-2 rounded-full bg-green-600 ring-2" />
              ) : null}
            </div>

            <div className="flex flex-col">
              <span className="text-popover-foreground text-sm font-medium">
                {user.name}
              </span>
              <span className="text-muted-foreground text-sm">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Main Links */}
          {PROFILE_ITEMS.map(({ label, icon: Icon }) => (
            <DropdownMenuItem
              key={label}
              className={itemClass}
              onClick={() => onSelect?.(label)}
            >
              <Icon size={20} />
              <span>{labelOf(label)}</span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {/* Settings */}
          <DropdownMenuGroup>
            {SETTINGS_ITEMS.map(({ label, icon: Icon }) => (
              <DropdownMenuItem
                key={label}
                className={itemClass}
                onClick={() => onSelect?.(label)}
              >
                <Icon size={20} />
                <span>{labelOf(label)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem
            className={itemClass}
            onClick={() => onSelect?.(LOGOUT_ITEM.label)}
          >
            <LOGOUT_ITEM.icon size={20} />
            <span>{labelOf(LOGOUT_ITEM.label)}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DropdownMenu01 = () => {
  return (
    <Dropdown
      align="center"
      trigger={
        <div className="rounded-full">
          <Avatar className="size-10 cursor-pointer">
            <AvatarImage
              src="https://images.shadcnspace.com/assets/shadcn-dashboard/profile/user-1.webp"
              alt="David McMichael"
            />
            <AvatarFallback>DM</AvatarFallback>
          </Avatar>
        </div>
      }
    />
  );
};

export { Dropdown };
export default DropdownMenu01;
