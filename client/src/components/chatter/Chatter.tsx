import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { SendHorizontal, Paperclip, ChevronDown, ChevronUp, Undo2 } from "lucide-react";
import { cn } from "cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  /** 作者头像 URL（如 Accio work 的 web 头像）；优先于首字母展示。 */
  authorAvatar?: string;
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
  onSend?: (text: string) => Promise<ChatterMessage | void> | void;
  /** 撤回某条消息（仅本人、3 分钟内）。传入后组件内会显示撤回按钮；reject 时组件回滚本地乐观更新。 */
  onRecall?: (id: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  /** 充满父容器高度（消息区 flex-1 自适应滚动），用于详情页分栏布局。 */
  fill?: boolean;
  /** 是否还有更早消息未加载（瀑布流）；父组件初始传入，内部随分页更新。 */
  hasMore?: boolean;
  /** 加载更早的一页（oldest=当前最旧消息）。返回该页消息(asc)与是否还有更早。 */
  onLoadOlder?: (
    oldest: ChatterMessage,
  ) => Promise<{ messages: ChatterMessage[]; hasMore: boolean }>;
  /** 增量刷新：拉取最新一屏并与现有消息合并（发消息/保存后调用）。 */
  onLoadLatest?: () => Promise<{ messages: ChatterMessage[]; hasMore: boolean }>;
  /** 递增触发 onLoadLatest（父组件在保存/推进阶段后自增）。 */
  refreshToken?: number;
  /** 轮询间隔(ms)：非 0 时定期增量拉取最新消息，实现多页/多用户讨论实时同步；默认 0(关闭)。 */
  pollMs?: number;
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
  hasMore: hasMoreProp,
  onLoadOlder,
  onLoadLatest,
  refreshToken,
  pollMs,
}: ChatterProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatterMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [hasMore, setHasMore] = useState<boolean>(hasMoreProp ?? false);
  const [hasPaged, setHasPaged] = useState(false); // 是否真正翻页加载过更早消息（用于控制“没有更多了”提示）
  const [loadingOlder, setLoadingOlder] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // 系统机器人名称/形象取自当前用户的个人偏好（实时），回退到消息自带 author
  const bot = useBotConfig();
  // 仅「最新一条」机器人消息实时渲染 3D，其余用静态切片（省资源，避免大量 WebGL 并行）
  const lastBotId = useMemo(
    () => [...messages].reverse().find((m) => m.isBot)?.id,
    [messages],
  );
  // 消息展开/收起：全局功能键统一控制，默认全部展开
  const [allExpanded, setAllExpanded] = useState(true);
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

  // 撤回：仿微信——就地转为「X 撤回了一条信息」系统记录（乐观更新）；后端失败时回滚
  const recall = async (id: string) => {
    const original = messages.find((m) => m.id === id);
    if (!original) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, isRecall: true, body: `${m.author} 撤回了一条信息` }
          : m,
      ),
    );
    try {
      await onRecall?.(id);
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === id ? original : m)));
    }
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
        {m.authorAvatar ? <AvatarImage src={m.authorAvatar} alt={m.author} /> : null}
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

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    const msg: ChatterMessage = {
      id: tempId,
      author: currentUser ?? t("chatter.you"),
      body: text,
      timestamp: formatNow(),
      sentAt: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setDraft("");
    requestAnimationFrame(() => scrollToBottom());
    try {
      const created = await onSend?.(text);
      if (created) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...created,
                  sentAt: created.createdAt
                    ? Date.parse(created.createdAt)
                    : undefined,
                }
              : m,
          ),
        );
      }
    } catch {
      // 发送失败：移除乐观消息
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // 滚动到底部（最新消息）——默认定位到最新位置
  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // 瀑布流：加载更早的一页并前插，保持视觉位置不跳动
  const loadOlder = async () => {
    if (loadingOlder || !hasMore || !onLoadOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = messages[0];
      const res = await onLoadOlder(oldest);
      const el = scrollRef.current;
      const prevHeight = el?.scrollHeight ?? 0;
      const prevTop = el?.scrollTop ?? 0;
      setMessages((prev) => [...res.messages, ...prev]);
      setHasMore(res.hasMore);
      setHasPaged(true);
      requestAnimationFrame(() => {
        const el2 = scrollRef.current;
        if (!el2) return;
        el2.scrollTop = el2.scrollHeight - prevHeight + prevTop;
      });
    } catch {
      /* 忽略加载失败 */
    } finally {
      setLoadingOlder(false);
    }
  };

  // 增量刷新：拉取最新一屏并与现有消息按 id 合并（保留已加载的旧消息视图）
  const loadLatest = async () => {
    if (!onLoadLatest) return;
    try {
      const res = await onLoadLatest();
      setMessages((prev) => {
        const map = new Map<string, ChatterMessage>();
        [...prev, ...res.messages].forEach((m) => map.set(m.id, m));
        return [...map.values()].sort((a, b) =>
          (a.createdAt ?? "") < (b.createdAt ?? "")
            ? -1
            : (a.createdAt ?? "") > (b.createdAt ?? "")
              ? 1
              : a.id < b.id
                ? -1
                : 1,
        );
      });
      setHasMore((h) => h || res.hasMore);
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        if (atBottom) scrollToBottom();
      });
    } catch {
      /* 忽略刷新失败 */
    }
  };

  // 挂载：默认滚动到最新位置
  useLayoutEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 父组件在保存/推进阶段后自增 refreshToken → 增量拉取最新消息
  useEffect(() => {
    if ((refreshToken ?? 0) > 0) void loadLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  // 跨页/多用户实时同步：定期增量拉取最新消息（标签页可见时），按 id 合并去重
  const loadLatestRef = useRef(loadLatest);
  loadLatestRef.current = loadLatest;
  useEffect(() => {
    if (!pollMs) return;
    const iv = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void loadLatestRef.current();
    }, pollMs);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs]);

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
        <div className="flex items-center gap-3">
          {/* 消息展开/收起功能键：位于关注者左侧，默认全部展开 */}
          <button
            type="button"
            onClick={() => setAllExpanded((v) => !v)}
            aria-label={allExpanded ? t("chatter.collapseAll") : t("chatter.expandAll")}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {allExpanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            {allExpanded ? t("chatter.collapseAll") : t("chatter.expandAll")}
          </button>
          {followers && followers.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground">{t("chatter.followers")}</span>
              <div className="flex -space-x-2">
                {followers.map((f, i) => (
                  <Avatar key={i} size="sm" className="ring-2 ring-background">
                    <AvatarFallback>{deriveInitials(f)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Message thread */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          if (e.currentTarget.scrollTop <= 24) void loadOlder();
        }}
        className={cn(
          "flex flex-col gap-4 overflow-y-auto px-4 py-4",
          fill ? "min-h-0 flex-1" : "max-h-80",
        )}
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("chatter.empty")}</p>
        ) : (
          <>
            {hasMore && onLoadOlder ? (
              loadingOlder ? (
                <div className="py-1 text-center text-xs text-muted-foreground">
                  {t("chatter.loading")}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void loadOlder()}
                  className="mx-auto flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ChevronDown className="size-3.5" />
                  {t("chatter.loadOlder")}
                </button>
              )
            ) : (
              // 仅在真正翻页加载过更早消息且已到底时才提示；
              // 首屏消息未达一页上限（后端直接 hasMore=false）时不显示
              !hasMore &&
              hasPaged &&
              messages.length > 0 && (
                <div className="py-1 text-center text-xs text-muted-foreground">
                  {t("chatter.noMore")}
                </div>
              )
            )}
            {runs.map((run) => {
              const firstId = messages[run.start].id;
              const group = messages.slice(run.start, run.end + 1);
              const count = group.length;
              const expandable = count > 3;
              const collapsed = expandable && !allExpanded;
              // 收起时仅显示最后 1 条，其余隐藏；展开（默认）显示整组
              const visible = collapsed ? group.slice(-1) : group;
              const hidden = count - visible.length;
              return (
                <Fragment key={firstId}>
                  {collapsed && (
                    <button
                      type="button"
                      onClick={() => setAllExpanded(true)}
                      className="mx-auto flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <ChevronDown className="size-3.5" />
                      {t("chatter.expand", { n: hidden })}
                    </button>
                  )}
                  {visible.map(renderMessage)}
                </Fragment>
              );
            })}
          </>
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
