import { Fragment, useMemo, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { SendHorizontal, Paperclip, ChevronDown, ChevronUp, Undo2 } from "lucide-react";
import { cn } from "cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RobotAvatar } from "@/components/common/RobotAvatar";
import { useBotConfig } from "@/lib/botConfig";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/ui/chat-bubble";
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
  /** 是否为「撤回」系统记录（撤回后保留的一条提示，仿微信）。 */
  isRecall?: boolean;
  /** 发送时间戳（epoch ms），用于「3 分钟内可撤回」的窗口判断；由前端发送或后端 createdAt 映射得到。 */
  sentAt?: number;
  /** 服务端原始创建时间（ISO 字符串），用于映射 sentAt。 */
  createdAt?: string;
}

export interface ChatterProps {
  title?: string;
  initialMessages?: ChatterMessage[];
  /** 发消息时使用的当前用户名；不传则显示「我 / You」。 */
  currentUser?: string;
  /** 关注者名单（头像组，Odoo chatter 风格）。 */
  followers?: string[];
  onSend?: (text: string) => void;
  /** 撤回某条消息（仅本人、3 分钟内）。传入后组件内会显示撤回按钮。 */
  onRecall?: (id: string) => void;
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

/** 撤回窗口：发送后 3 分钟内可撤回 */
const RECALL_WINDOW = 3 * 60 * 1000;

/** Chatter：记录级讨论面板（Odoo 风格）——消息流 + 发消息输入框，可挂到任意业务单据底部。展示型，发消息走 onSend，组件内保留本地草稿。 */
export function Chatter({
  title,
  initialMessages = [],
  currentUser,
  followers,
  onSend,
  onRecall,
  placeholder,
  className,
  fill,
}: ChatterProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatterMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  // 系统机器人名称取自「联系人」中的设置（实时），回退到消息自带 author
  const bot = useBotConfig();
  // 仅「最新一条」机器人消息实时渲染 3D，其余用静态切片（省资源，避免大量 WebGL 并行）
  const lastBotId = useMemo(
    () => [...messages].reverse().find((m) => m.isBot)?.id,
    [messages],
  );
  // 连续同一用户超过 3 条时，可折叠（默认收起，显示最后 3 条），点击展开/收起
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const toggleRun = (key: string) =>
    setExpandedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  // 按 author 把连续消息分成「组」，便于对超长连续串做折叠
  const runs = useMemo(() => {
    const out: { start: number; end: number }[] = [];
    messages.forEach((m, i) => {
      const last = out[out.length - 1];
      if (last && messages[last.start].author === m.author) {
        last.end = i;
      } else {
        out.push({ start: i, end: i });
      }
    });
    return out;
  }, [messages]);

  // 撤回：仿微信——不真正删除，而是把该消息就地转为「X 撤回了一条信息」系统记录（乐观更新），再回调后端持久化
  const recall = (id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, isRecall: true, body: `${m.author} 撤回了一条信息` }
          : m,
      ),
    );
    onRecall?.(id);
  };

  const renderMessage = (m: ChatterMessage) => {
    // 本人发送、且在 3 分钟窗口内的消息可撤回（撤回系统记录本身不可再撤回）
    const canRecall =
      !!currentUser &&
      !m.isBot &&
      !m.isRecall &&
      m.author === currentUser &&
      typeof m.sentAt === "number" &&
      Date.now() - m.sentAt <= RECALL_WINDOW;

    // 撤回系统记录：居中灰色提示，仿微信「X 撤回了一条信息」
    if (m.isRecall) {
      return (
        <div key={m.id} className="flex justify-center py-1">
          <span className="text-xs text-muted-foreground">{m.body}</span>
        </div>
      );
    }

    // 系统操作（机器人写入的操作历史）：微信风格气泡，左对齐，头像是我们的 bot
    if (m.isBot) {
      return (
        <Fragment key={m.id}>
          <ChatBubble
            side="left"
            avatar={
              <RobotAvatar size={32} state="idle" live={m.id === lastBotId} />
            }
            name={bot?.name ?? m.author}
            time={m.timestamp}
          >
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
          </ChatBubble>
        </Fragment>
      );
    }
    // 人工消息：自己发的靠右（微信绿底），他人靠左（灰底）
    const right = !!currentUser && m.author === currentUser;
    const avatarEl = (
      <Avatar size="sm">
        <AvatarFallback>{m.initials ?? deriveInitials(m.author)}</AvatarFallback>
      </Avatar>
    );
    const bubbleContent = (
      <>
        <p className="whitespace-pre-wrap break-words">{m.body}</p>
        {m.attachments && m.attachments.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {m.attachments.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded border border-black/10 bg-white/50 px-1.5 py-0.5 text-xs text-[#1f1f1f]"
              >
                <Paperclip className="size-3" />
                {a.name}
                {a.size && <span className="opacity-70">{a.size}</span>}
              </span>
            ))}
          </div>
        )}
      </>
    );
    const bubble = (
      <ChatBubble
        side={right ? "right" : "left"}
        avatar={avatarEl}
        name={m.author}
        time={m.timestamp}
      >
        {bubbleContent}
      </ChatBubble>
    );

    // 可撤回时，「撤回」图标放在气泡左侧：时间行单独渲染在上方，
    // 让图标与仅含「头像+气泡」的 ChatBubble 同排 items-center，精确对气泡垂直居中
    if (canRecall) {
      return (
        <Fragment key={m.id}>
          <div className="flex flex-col items-end gap-1">
            {m.timestamp && (
              <div className="px-1 text-xs text-muted-foreground opacity-80">
                {m.timestamp}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => recall(m.id)}
                aria-label={t("chatter.recall")}
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border transition-colors hover:bg-accent hover:text-foreground"
              >
                <Undo2 className="size-4" />
              </button>
              <ChatBubble side={right ? "right" : "left"} avatar={avatarEl}>
                {bubbleContent}
              </ChatBubble>
            </div>
          </div>
        </Fragment>
      );
    }
    return <Fragment key={m.id}>{bubble}</Fragment>;
  };

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
      sentAt: Date.now(),
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
      <div className="flex items-center justify-between gap-2 px-4 py-3">
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
          "flex flex-col gap-4 overflow-y-auto px-4 py-4",
          fill ? "min-h-0 flex-1" : "max-h-80",
        )}
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("chatter.empty")}</p>
        ) : (
          runs.map((run) => {
            const firstId = messages[run.start].id;
            const group = messages.slice(run.start, run.end + 1);
            const count = group.length;
            const expandable = count > 3;
            const expanded = expandedRuns.has(firstId);
            // 默认收起：仅显示最后 1 条，其余全部隐藏；展开后显示整组
            const visible = expandable && !expanded ? group.slice(-1) : group;
            const hidden = count - visible.length;
            return (
              <Fragment key={firstId}>
                {expandable && !expanded && (
                  <button
                    type="button"
                    onClick={() => toggleRun(firstId)}
                    className="mx-auto flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <ChevronDown className="size-3.5" />
                    {t("chatter.expand", { n: hidden })}
                  </button>
                )}
                {visible.map(renderMessage)}
                {expandable && expanded && (
                  <button
                    type="button"
                    onClick={() => toggleRun(firstId)}
                    className="mx-auto flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <ChevronUp className="size-3.5" />
                    {t("chatter.collapse")}
                  </button>
                )}
              </Fragment>
            );
          })
        )}
      </div>

      {/* Composer：仅在支持发送（传入 onSend）时显示 */}
      {onSend && (
        <form
          className="px-4 py-3"
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
