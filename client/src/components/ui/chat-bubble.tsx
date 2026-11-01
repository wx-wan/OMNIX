import { cn } from "cn";
import type { ReactNode } from "react";

type Side = "left" | "right";

export interface ChatBubbleProps {
  /** 头像（通常 <Avatar>） */
  avatar?: ReactNode;
  /** 昵称（接收方显示在气泡上方，发送方不显示） */
  name?: ReactNode;
  /** 时间（气泡上方小字） */
  time?: ReactNode;
  /** left=接收（灰底，头像在左）；right=发送（绿底，头像在右） */
  side?: Side;
  className?: string;
  children: ReactNode;
}

/** 微信风格聊天气泡：左侧接收（灰底）/ 右侧发送（微信绿底），含头像、昵称、时间。 */
export function ChatBubble({
  avatar,
  name,
  time,
  side = "left",
  className,
  children,
}: ChatBubbleProps) {
  const right = side === "right";
  return (
    <div
      className={cn(
        "flex gap-2.5",
        right ? "flex-row-reverse" : "flex-row",
        className,
      )}
    >
      {avatar && <div className="shrink-0 self-start pt-0.5">{avatar}</div>}
      <div
        className={cn(
          "flex min-w-0 max-w-[80%] flex-col gap-1",
          right ? "items-end" : "items-start",
        )}
      >
        {(name || time) && (
          <div
            className={cn(
              "flex items-center gap-2 px-1 text-xs text-muted-foreground",
              right && "flex-row-reverse",
            )}
          >
            {!right && name && <span>{name}</span>}
            {time && <span className="opacity-80">{time}</span>}
          </div>
        )}
        <div
          className={cn(
            "whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed",
            right
              ? "rounded-tr-sm bg-[#95ec69] text-[#1f1f1f]"
              : "rounded-tl-sm bg-muted text-foreground/90",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** 微信风格居中系统提示（如「xx 创建了商机」），无头像、无发送者身份。 */
export function ChatSystemNotice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-center", className)}>
      <div className="flex max-w-[90%] flex-wrap items-center justify-center gap-1.5 rounded-md bg-muted/70 px-2.5 py-1 text-center text-xs leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
