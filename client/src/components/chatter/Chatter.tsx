import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { SendHorizontal, Paperclip } from "lucide-react";
import { cn } from "cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RobotAvatar } from "@/components/common/RobotAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface ChatterAttachment {
  name: string;
  size?: string;
}

export interface ChatterMessage {
  id: string;
  author: string;
  /** 头像首字缩写覆盖；不传则按 author 自动派生。 */
  initials?: string;
  body: string;
  /** 预格式化时间字符串；不传则新消息用当前时间。 */
  timestamp?: string;
  attachments?: ChatterAttachment[];
  /** 是否系统机器人（ominXBot）发出的操作记录。 */
  isBot?: boolean;
}

export interface ChatterProps {
  title?: string;
  initialMessages?: ChatterMessage[];
  /** 发消息时使用的当前用户名；不传则显示「我 / You」。 */
  currentUser?: string;
  /** 关注者名单（头像组，Odoo chatter 风格）。 */
  followers?: string[];
  onSend?: (text: string) => void;
  placeholder?: string;
  className?: string;
  /** 充满父容器高度（消息区 flex-1 自适应滚动），用于详情页分栏布局。 */
  fill?: boolean;
}

function deriveInitials(name: string): string {
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 1).toUpperCase();
}

function formatNow(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Chatter：记录级讨论面板（Odoo 风格）——消息流 + 发消息输入框，可挂到任意业务单据底部。展示型，发消息走 onSend，组件内保留本地草稿。 */
export function Chatter({
  title,
  initialMessages = [],
  currentUser,
  followers,
  onSend,
  placeholder,
  className,
  fill,
}: ChatterProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatterMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");

  // 资源优化：同一消息流中仅「最后一条」机器人消息实时渲染，其余用静态切片。
  const lastBotIndex = (() => {
    let idx = -1;
    messages.forEach((m, i) => {
      if (m.isBot) idx = i;
    });
    return idx;
  })();

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const msg: ChatterMessage = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()),
      author: currentUser ?? t("chatter.you"),
      body: text,
      timestamp: formatNow(),
    };
    setMessages((prev) => [...prev, msg]);
    onSend?.(text);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={cn("flex flex-col rounded-2xl bg-card shadow-card", fill && "h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {title ?? t("chatter.title")}
          </h3>
          <span className="rounded-4xl bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {messages.length}
          </span>
        </div>
        {followers && followers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("chatter.followers")}</span>
            <div className="flex -space-x-2">
              {followers.map((f, i) => (
                <Avatar key={i} size="sm" className="ring-2 ring-background">
                  <AvatarFallback>{deriveInitials(f)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message thread */}
      <div
        className={cn(
          "flex flex-col overflow-y-auto px-4 py-4",
          fill ? "min-h-0 flex-1" : "max-h-80",
        )}
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("chatter.empty")}</p>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {messages.map((m, i) => (
              <div
                key={m.id}
                className="group flex gap-3 rounded-xl px-1 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-muted/40"
              >
                {m.isBot ? (
                  <RobotAvatar
                    size={32}
                    state="idle"
                    live={i === lastBotIndex}
                    className="mt-0.5 shrink-0"
                  />
                ) : (
                  <Avatar size="sm" className="mt-0.5 shrink-0 ring-2 ring-background">
                    <AvatarFallback>{m.initials ?? deriveInitials(m.author)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-foreground">{m.author}</span>
                    {m.isBot && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        机器人
                      </span>
                    )}
                    {m.timestamp && (
                      <span className="text-xs text-muted-foreground/70">{m.timestamp}</span>
                    )}
                  </div>
                  {m.isBot ? (
                    <div className="mt-1.5 rounded-lg bg-muted/50 px-3 py-2 text-sm leading-relaxed text-foreground/80 ring-1 ring-inset ring-border/50">
                      {m.body}
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                      {m.body}
                    </p>
                  )}
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.attachments.map((a, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground/80"
                        >
                          <Paperclip className="size-3.5" />
                          {a.name}
                          {a.size && <span className="text-muted-foreground">{a.size}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Composer：仅在支持发送（传入 onSend）时显示 */}
      {onSend && (
        <form
          className="border-t border-border px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder ?? t("chatter.placeholder")}
            rows={2}
            className="min-h-0 resize-none"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{t("chatter.hint")}</span>
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              <SendHorizontal />
              {t("chatter.send")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
