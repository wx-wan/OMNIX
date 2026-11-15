import { useTranslation } from "react-i18next";

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUsers } from "@/api/auth/use-users";
import { avatarSrc } from "@/views/apps/shared";
import { useAuth } from "@/context/AuthContext";
import { presenceStyles } from "@/lib/presence";

/**
 * 成员在线状态列表（shadcn block 用法示例）。
 * 成员来自真实注册用户，状态来自后端 SSE 广播，不再使用演示值。
 */
const AvatarDemo = () => {
  const { t } = useTranslation();
  const { users } = useUsers();
  const { presence } = useAuth();

  return (
    <ul className="flex w-full max-w-xs flex-col gap-3">
      {users.slice(0, 4).map((person) => {
        const status = presence[person.id] ?? "offline";
        const label = t(presenceStyles[status].label);
        return (
          <li key={person.id} className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage
                src={avatarSrc(person.avatarUrl)}
                alt={person.name}
                className={cn(status === "offline" && "grayscale")}
              />
              <AvatarFallback>{person.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              <AvatarBadge className={presenceStyles[status].className}>
                <span className="sr-only">{label}</span>
              </AvatarBadge>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", presenceStyles[status].className)} aria-hidden="true" />
                {label}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default AvatarDemo;
