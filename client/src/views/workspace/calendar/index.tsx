import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveDate, useWorkspace } from "src/api/workspace/use-workspace";
import { addEvent } from "src/api/workspace/project-stages";
import { NewEventDialog, type NewEventValues } from "../create-dialogs";
import { PmsPage } from "../pms";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const EVENT_COLOR: Record<string, string> = {
  sprint: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  meeting: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  deadline: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  release: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function CalendarPage() {
  const { t } = useTranslation();
  const { snap, zh, isLoading } = useWorkspace();
  const [view, setView] = useState("Month");
  const [cursor, setCursor] = useState(() => new Date());
  const [creating, setCreating] = useState(false);
  const [draftDate, setDraftDate] = useState(() => new Date().toISOString().slice(0, 10));

  const events = useMemo(
    () =>
      (snap?.events ?? []).map((event) => ({
        id: event.id,
        title: event.title,
        date: resolveDate(event.date),
        type: event.type,
      })),
    [snap]
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const onDay = (day: Date) =>
    events.filter((event) => event.date && sameDay(event.date, day));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = zh
    ? `${year}年${month + 1}月`
    : cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  const move = (delta: number) => {
    const next = new Date(cursor);
    if (view === "Month") next.setMonth(next.getMonth() + delta);
    else if (view === "Week") next.setDate(next.getDate() + 7 * delta);
    else next.setDate(next.getDate() + delta);
    setCursor(next);
  };

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = first.getDay();
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(year, month, index - offset + 1);
      return { date, outside: date.getMonth() !== month };
    });
  }, [year, month]);

  const now = new Date();
  const timeLabel = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  const eventChip = (event: { id: string; title: string; type: string }) => (
    <div
      key={event.id}
      className={`fc-event fc-daygrid-block-event fc-h-event truncate rounded-sm px-1 py-0.5 text-[10px] leading-4 ${
        EVENT_COLOR[event.type] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {event.type === "meeting" ? (
        <span className="fc-event-time block">{timeLabel}</span>
      ) : null}
      <span className="fc-event-title block">{event.title}</span>
    </div>
  );

  const create = (values: NewEventValues) => {
    const date = values.allDay
      ? values.date
      : `${values.date}T${values.time || "09:00"}:00`;
    addEvent(values.projectId || null, {
      title: values.title,
      description: values.description,
      date,
      type: values.type,
      assigneeId: values.assigneeId || null,
      allDay: values.allDay,
    });
    setCreating(false);
  };

  if (isLoading || !snap) return <div className="p-10 text-sm text-muted-foreground">…</div>;

  const fcButton =
    "fc-button fc-button-primary inline-flex h-7 cursor-pointer items-center justify-center rounded-md border border-border bg-background px-2 text-xs font-medium hover:bg-muted";

  return (
    <PmsPage title={t("Calendar")} count={t("N events", { n: events.length })}>
      <div className="pms-calendar h-[calc(100svh-14.5rem)] min-h-140 overflow-hidden rounded-xl border bg-card">
        <div className="fc fc-media-screen fc-direction-ltr fc-theme-standard flex h-full flex-col">
          <div className="fc-header-toolbar fc-toolbar fc-toolbar-ltr flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div className="fc-toolbar-chunk flex items-center gap-2">
              <div className="fc-button-group inline-flex gap-1">
                <button
                  type="button"
                  title="Previous Month"
                  onClick={() => move(-1)}
                  className={`${fcButton} fc-prev-button`}
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Next Month"
                  onClick={() => move(1)}
                  className={`${fcButton} fc-next-button`}
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
              <button
                type="button"
                title="This Month"
                onClick={() => setCursor(new Date())}
                className={`${fcButton} fc-today-button`}
              >
                {t("Today")}
              </button>
            </div>
            <div className="fc-toolbar-chunk">
              <h2 className="fc-toolbar-title text-sm font-semibold">{monthLabel}</h2>
            </div>
            <div className="fc-toolbar-chunk flex items-center gap-2">
              <button
                type="button"
                title="+ Add event"
                onClick={() => {
                  setDraftDate(new Date().toISOString().slice(0, 10));
                  setCreating(true);
                }}
                className={`${fcButton} fc-addEvent-button`}
              >
                {t("+ Add event")}
              </button>
              <div className="fc-button-group inline-flex gap-1">
                {["Month", "Week", "Day"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    title={`${option} view`}
                    onClick={() => setView(option)}
                    className={`${fcButton} ${
                      option === "Month"
                        ? "fc-dayGridMonth-button"
                        : option === "Week"
                          ? "fc-timeGridWeek-button"
                          : "fc-timeGridDay-button"
                    } ${view === option ? "fc-button-active bg-secondary text-secondary-foreground" : ""}`}
                  >
                    {t(option)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="fc-view-harness min-h-0 flex-1 overflow-auto">
            {view === "Month" ? (
              <div className="fc-scrollgrid fc-scrollgrid-liquid w-full">
                <div role="row" className="fc-col-header flex border-b border-border">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      role="columnheader"
                      className="fc-col-header-cell flex-1 border-e border-border px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div role="rowgroup" className="fc-daygrid-body grid grid-cols-7">
                  {cells.map(({ date, outside }, index) => (
                    <div
                      key={index}
                      data-date={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`}
                      onClick={(event) => {
                        setDraftDate(
                          event.currentTarget.dataset.date ??
                            new Date().toISOString().slice(0, 10)
                        );
                        setCreating(true);
                      }}
                      className={`fc-day fc-daygrid-day cursor-pointer border-e border-b border-border align-top ${
                        WEEKDAYS[date.getDay()].toLowerCase() === "sun" ? "fc-day-sun" : ""
                      } ${sameDay(date, today) ? "fc-day-today bg-blue-500/5" : ""} ${
                        outside ? "fc-day-other text-muted-foreground/50" : ""
                      }`}
                    >
                      <div className="fc-daygrid-day-frame fc-scrollgrid-sync-inner min-h-16">
                        <div className="fc-daygrid-day-top flex justify-end p-1">
                          <a className="fc-daygrid-day-number text-xs">{date.getDate()}</a>
                        </div>
                        <div className="fc-daygrid-day-events space-y-0.5 px-1">
                          {onDay(date).map(eventChip)}
                        </div>
                        <div className="fc-daygrid-day-bg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={`p-4 ${view === "Week" ? "fc-timeGridWeek-view" : "fc-timeGridDay-view"}`}
              >
                <div className="space-y-2">
                  {events
                    .filter((event) => {
                      if (!event.date) return false;
                      if (view === "Day") return sameDay(event.date, cursor);
                      const diff = Math.abs(
                        Math.round((event.date.getTime() - cursor.getTime()) / 86400000)
                      );
                      return diff <= 6;
                    })
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`flex items-center gap-3 rounded-md border border-border px-3 py-2 text-xs ${EVENT_COLOR[event.type] ?? ""}`}
                      >
                        <span className="text-muted-foreground">
                          {event.date?.toLocaleDateString(zh ? "zh-CN" : "en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="font-medium">{event.title}</span>
                        <span className="ms-auto text-[11px] text-muted-foreground">
                          {t(event.type)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NewEventDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={create}
        defaultDate={draftDate}
        projects={snap.projects}
        users={snap.users}
      />
    </PmsPage>
  );
}
