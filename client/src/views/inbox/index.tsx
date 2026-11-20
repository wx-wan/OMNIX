import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Archive,
  AtSign,
  Bell,
  CheckCheck,
  Clock,
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InboxData } from "src/api/inbox/inbox-data";
import {
  InboxNotification,
  InboxViewOptions,
} from "src/types/apps/inbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type FilterKey = "all" | "unread" | "mentions" | "updates";

const DEFAULT_VIEW: InboxViewOptions = {
  sort: "Latest",
  typeLabel: true,
  messagePreview: true,
  time: true,
  readItems: true,
  snoozedItems: false,
  activityUpdates: true,
  unreadOnTop: false,
};

const SORT_OPTIONS = ["Latest", "Earliest", "Most important", "Sender A–Z"];

function FilterItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <li
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-4 py-2.5 capitalize transition-colors",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary"
          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="text-sm font-medium">{label}</span>
      {typeof count === "number" && (
        <span className="ml-auto text-xs font-medium">{count}</span>
      )}
    </li>
  );
}

function OptionRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm">{t(label)}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function Inbox() {
  const { t } = useTranslation();
  const [items, setItems] = useState<InboxNotification[]>(InboxData);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<InboxViewOptions>(DEFAULT_VIEW);
  const [showFilters, setShowFilters] = useState(false);

  const unreadCount = useMemo(
    () => items.filter((n) => n.unread).length,
    [items]
  );
  const mentionCount = useMemo(
    () => items.filter((n) => n.type === "Mention").length,
    [items]
  );
  const selected = items.find((n) => n.id === selectedId) ?? null;

  /** just now / 1d ago / 中文日期 —— 英文回退原文，中文走词典 */
  const formatTime = (time: string) => {
    if (time === "just now") return t("just now");
    const m = /^(\d+)d ago$/.exec(time);
    if (m) return `${m[1]}${t("d ago")}`;
    return time;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter((n) => {
      if (activeFilter === "unread" && !n.unread) return false;
      if (activeFilter === "mentions" && n.type !== "Mention") return false;
      if (activeFilter === "updates" && n.type === "Mention") return false;
      if (unreadOnly && !n.unread) return false;
      if (!view.readItems && n.unread === false) return false;
      if (!view.activityUpdates && n.type === "Activity") return false;
      if (
        q &&
        !n.message.toLowerCase().includes(q) &&
        !n.actorName.toLowerCase().includes(q)
      )
        return false;
      return true;
    });

    if (view.unreadOnTop) {
      list = [...list].sort(
        (a, b) => Number(b.unread) - Number(a.unread)
      );
    } else if (view.sort === "Earliest") {
      list = [...list].reverse();
    } else if (view.sort === "Most important") {
      list = [...list].sort(
        (a, b) => Number(a.type !== "Mention") - Number(b.type !== "Mention")
      );
    } else if (view.sort === "Sender A–Z") {
      list = [...list].sort((a, b) => a.actorName.localeCompare(b.actorName));
    }
    return list;
  }, [items, activeFilter, unreadOnly, query, view]);

  const selectNotification = (id: string) => {
    setSelectedId(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));

  const setViewOption = <K extends keyof InboxViewOptions>(
    key: K,
    value: InboxViewOptions[K]
  ) => setView((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex h-[calc(100vh-150px)] min-h-[480px] flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("Inbox")}</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount} {t("unread notifications")}
          </p>
        </div>
      </div>

      <Card className="min-h-0 flex-1 flex-row gap-0 py-0">
        {/* 左栏：分组筛选 + 操作 */}
        <aside
          className={cn(
            "w-60 shrink-0 border-e lg:block",
            showFilters ? "block" : "hidden"
          )}
        >
          <ScrollArea className="h-full">
            <ul className="flex flex-col gap-0.5 p-6">
              <FilterItem
                icon={InboxIcon}
                label={t("All")}
                count={items.length}
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              />
              <FilterItem
                icon={Mail}
                label={t("Unread")}
                count={unreadCount}
                active={activeFilter === "unread"}
                onClick={() => setActiveFilter("unread")}
              />

              <li className="-mx-6 my-4 list-none">
                <Separator />
              </li>
              <li className="list-none">
                <h6 className="pb-3 text-xs font-semibold uppercase text-muted-foreground">
                  {t("Sort By")}
                </h6>
              </li>
              <FilterItem
                icon={AtSign}
                label={t("Mentions")}
                count={mentionCount}
                active={activeFilter === "mentions"}
                onClick={() => setActiveFilter("mentions")}
              />
              <FilterItem
                icon={RefreshCw}
                label={t("Updates")}
                count={items.length - mentionCount}
                active={activeFilter === "updates"}
                onClick={() => setActiveFilter("updates")}
              />

              <li className="-mx-6 my-4 list-none">
                <Separator />
              </li>
              <li className="list-none">
                <h6 className="pb-3 text-xs font-semibold uppercase text-muted-foreground">
                  {t("Actions")}
                </h6>
              </li>
              <FilterItem
                icon={MailOpen}
                label={t("Unread Only")}
                active={unreadOnly}
                onClick={() => setUnreadOnly((v) => !v)}
              />
              <FilterItem
                icon={CheckCheck}
                label={t("Mark All As Read")}
                onClick={markAllRead}
              />
            </ul>
          </ScrollArea>
        </aside>

        {/* 中间：搜索 + View options + 通知列表 */}
        <section className="left-part flex h-full w-full max-w-full min-w-0 flex-col border-e-0 px-0 pt-0 md:border-e md:border-border lg:max-w-[340px]">
          <div className="flex items-center gap-2 p-4">
            <button
              type="button"
              aria-label="Filters"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted lg:hidden"
            >
              <Menu className="size-4" />
            </button>

            <InputGroup className="flex-1">
              <InputGroupInput
                placeholder={t("Find from your notifications...")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <InputGroupAddon align="inline-start">
                <Search className="size-4" />
              </InputGroupAddon>
            </InputGroup>

            <Popover>
              <PopoverTrigger
                aria-label={t("View options")}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
              >
                <SlidersHorizontal className="size-4" />
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-72">
                <div className="space-y-3 p-1">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      {t("SORT BY")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setViewOption("sort", option)}
                          className={cn(
                            "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                            view.sort === option
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/70"
                          )}
                        >
                          {t(option)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                      {t("SHOW IN EACH ROW")}
                    </p>
                    <OptionRow
                      label="Type label"
                      checked={view.typeLabel}
                      onChange={(v) => setViewOption("typeLabel", v)}
                    />
                    <OptionRow
                      label="Message preview"
                      checked={view.messagePreview}
                      onChange={(v) => setViewOption("messagePreview", v)}
                    />
                    <OptionRow
                      label="Time"
                      checked={view.time}
                      onChange={(v) => setViewOption("time", v)}
                    />
                  </div>

                  <Separator />
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                      {t("INCLUDE")}
                    </p>
                    <OptionRow
                      label="Read items"
                      checked={view.readItems}
                      onChange={(v) => setViewOption("readItems", v)}
                    />
                    <OptionRow
                      label="Snoozed items"
                      checked={view.snoozedItems}
                      onChange={(v) => setViewOption("snoozedItems", v)}
                    />
                    <OptionRow
                      label="Activity updates"
                      checked={view.activityUpdates}
                      onChange={(v) => setViewOption("activityUpdates", v)}
                    />
                  </div>

                  <Separator />
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                      {t("LAYOUT")}
                    </p>
                    <OptionRow
                      label="Unread on top"
                      checked={view.unreadOnTop}
                      onChange={(v) => setViewOption("unreadOnTop", v)}
                    />
                  </div>

                  <Separator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setView(DEFAULT_VIEW)}
                  >
                    {t("Reset to default")}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="h-full w-full">
              {filtered.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  {t("No notifications")}
                </p>
              ) : (
                filtered.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => selectNotification(n.id)}
                    className={cn(
                      "group flex cursor-pointer items-center gap-3 border-b border-border px-6 py-4 hover:bg-primary/5",
                      n.unread && "bg-brand/5",
                      selectedId === n.id && "bg-muted"
                    )}
                  >
                    <div className="flex w-full gap-3">
                      <div className="relative shrink-0 self-start">
                        <Avatar className="size-10">
                          <AvatarImage src={n.avatar} alt={n.actorName} />
                          <AvatarFallback>
                            {n.actorName
                              .split(" ")
                              .map((p) => p[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {n.unread && (
                          <span className="absolute -top-0.5 -right-0.5 flex size-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                            <span className="relative inline-flex size-3 rounded-full border-2 border-card bg-teal-400" />
                          </span>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h6
                            className={cn(
                              "truncate text-sm text-primary",
                              selectedId === n.id && "font-semibold"
                            )}
                          >
                            {n.actorName}
                          </h6>
                          {view.typeLabel && (
                            <Badge
                              variant="ghost"
                              className={cn(
                                "h-5 rounded-md px-2 text-xs",
                                n.type === "Mention"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {t(n.type)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          {view.messagePreview ? (
                            <p
                              className={cn(
                                "line-clamp-1 text-xs text-muted-foreground",
                                selectedId === n.id &&
                                  "font-medium text-foreground"
                              )}
                            >
                              {n.message}
                            </p>
                          ) : (
                            <span />
                          )}
                          {view.time && (
                            <p className="shrink-0 text-[11px] font-medium text-muted-foreground">
                              {formatTime(n.time)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </section>

        {/* 右栏：空态 / 通知详情 */}
        <section className="hidden min-w-0 flex-1 lg:flex">
          {!selected ? (
            <div className="flex min-h-0 flex-1 items-center justify-center p-6">
              <Empty className="border-none">
                <EmptyHeader>
                  <EmptyMedia>
                    <InboxIcon
                      className="size-16 text-muted-foreground/50"
                      strokeWidth={1.25}
                    />
                  </EmptyMedia>
                  <EmptyTitle>{t("No notification selected")}</EmptyTitle>
                  <EmptyDescription>
                    {t(
                      "Choose a notification from the list to view its details, comments and linked item."
                    )}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-1 border-b border-border p-4">
                {[Star, Bell, Clock, Archive, MoreHorizontal].map(
                  (Icon, index) => (
                    <button
                      key={index}
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                    >
                      <Icon className="size-4" />
                    </button>
                  )
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                <div className="border-l-2 border-primary pl-3 text-xs text-muted-foreground">
                  <Bell className="mr-1 inline size-3.5" />
                  {selected.actorName} {t("mentioned you in this issue")} ·{" "}
                  {formatTime(selected.time)}
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  #{selected.detail.issueNumber} {selected.detail.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selected.detail.description}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 text-muted-foreground"
                >
                  <Plus className="size-4" />
                  {t("Add sub-issue")}
                </Button>

                <Separator />

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{t("Activity")}</h3>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {t("Unsubscribe")}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage
                      src={selected.detail.activityAvatar}
                      alt={selected.detail.activityActor}
                    />
                    <AvatarFallback>
                      {selected.detail.activityActor
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {selected.detail.activityActor}
                    </span>{" "}
                    {t("created the issue")} ·{" "}
                    {formatTime(selected.detail.activityTime)}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <Textarea
                  placeholder={t("Leave a comment...")}
                  className="min-h-16 resize-none"
                />
              </div>
            </div>
          )}
        </section>
      </Card>
    </div>
  );
}
