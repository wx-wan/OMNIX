import { Card } from "@/components/ui/card";
import { AppShell } from "../shared";

/**
 * V2 续 · /apps/calendar 逐项 1:1
 *
 * 取证：线上用 react-big-calendar（rbc-* 类名），本地 src/css/pages/app.css 已有 39 条 rbc 皮肤规则
 * 且 globals.css 已引入，故手写 DOM 挂同名类复用皮肤，不引入新依赖。
 *
 * 标题卡 1142×62 @y=82；主体卡 1142×834 @y=160，内部 rbc-calendar 1140×832 @y=161
 * = rbc-toolbar 73px（Today/Back/Next + November 2026 + Month/Week/Day/Agenda）
 * + rbc-month-view 759px（39px 表头 + 6 行 × 120px），每行 7 格 162/163px。
 * 7 个事件条按取证的 row/col/span/top 与线上原色值（lab()/rgb()）绝对定位。
 */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const WEEKS = [
  ["26", "27", "28", "29", "30", "31", "01"],
  ["02", "03", "04", "05", "06", "07", "08"],
  ["09", "10", "11", "12", "13", "14", "15"],
  ["16", "17", "18", "19", "20", "21", "22"],
  ["23", "24", "25", "26", "27", "28", "29"],
  ["30", "01", "02", "03", "04", "05", "06"],
];

const isOffRange = (w: number, d: number) => (w === 0 && d < 6) || (w === 5 && d > 0);

type CalEvent = {
  row: number;
  col: number;
  span: number;
  top: number;
  label: string;
  color: string;
};

const BLUE = "rgb(49, 116, 173)";
const YELLOW = "lab(80.1641 16.6016 99.2089)";
const DARK = "lab(7.78201 -0.0000149012 0)";
const TEAL = "lab(55.0223 -41.0774 -3.90277)";
const RED = "lab(48.4493 77.4328 61.5452)";

const EVENTS: CalEvent[] = [
  { row: 1, col: 1, span: 2, top: 21, label: "Twice event For two Days", color: DARK },
  { row: 2, col: 3, span: 1, top: 21, label: "Lunch with Mr.Raw", color: BLUE },
  { row: 2, col: 6, span: 1, top: 21, label: "Going For Party of Sahs", color: YELLOW },
  { row: 3, col: 1, span: 1, top: 21, label: "Learn ReactJs", color: TEAL },
  { row: 3, col: 3, span: 3, top: 21, label: "Research of making own Browser", color: BLUE },
  { row: 3, col: 5, span: 1, top: 46, label: "Launching MaterialArt Angular", color: RED },
  { row: 4, col: 0, span: 2, top: 21, label: "Learn Ionic", color: YELLOW },
];

const TOOLBAR_LEFT = ["Today", "Back", "Next"];
const TOOLBAR_RIGHT = ["Month", "Week", "Day", "Agenda"];

const CalendarApp = () => {
  return (
    <AppShell title="Calendar">
      <Card className="gap-0" style={{ paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}>
        <div className="rbc-calendar flex min-h-[800px] flex-col">
          {/* 工具栏 73px */}
          <div className="rbc-toolbar mb-0! flex h-[73px] shrink-0 items-center justify-between px-4">
            <div className="flex gap-1">
              {TOOLBAR_LEFT.map((t) => (
                <button key={t} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">
                  {t}
                </button>
              ))}
            </div>
            <span className="rbc-toolbar-label text-base font-semibold">November 2026</span>
            <div className="flex gap-1">
              {TOOLBAR_RIGHT.map((t) => (
                <button
                  key={t}
                  className={`rounded-md border border-border px-3 py-1.5 text-xs ${
                    t === "Month" ? "rbc-active bg-foreground text-background" : "hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 月历 759px */}
          <div className="rbc-month-view flex flex-1 flex-col border-t border-border">
            <div className="flex shrink-0 border-b border-border">
              {WEEKDAYS.map((d) => (
                <div key={d} className="rbc-header flex-1 text-center text-xs font-semibold">
                  {d}
                </div>
              ))}
            </div>

            {WEEKS.map((week, w) => (
              <div key={w} className="rbc-month-row relative flex h-[120px] shrink-0 border-t border-border first:border-t-0">
                {week.map((day, d) => (
                  <div
                    key={`${w}-${d}`}
                    className={`rbc-day-bg relative flex-1 ${isOffRange(w, d) ? "rbc-off-range-bg" : ""} ${
                      w === 2 && d === 4 ? "bg-muted/40" : ""
                    }`}
                  >
                    <button
                      className={`absolute start-2 top-1.5 text-xs ${isOffRange(w, d) ? "text-muted-foreground/50" : "text-muted-foreground"}`}
                    >
                      {day}
                    </button>
                  </div>
                ))}
                {EVENTS.filter((e) => e.row === w).map((e) => (
                  <div
                    key={e.label}
                    className="rbc-event absolute flex items-center overflow-hidden rounded-sm px-2 text-[11px] leading-6 text-white"
                    style={{
                      left: `calc(${e.col} * 100% / 7 + 1px)`,
                      width: `calc(${e.span} * 100% / 7 - 2px)`,
                      top: e.top,
                      height: 24,
                      backgroundColor: e.color,
                    }}
                  >
                    <span className="truncate">{e.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </AppShell>
  );
};

export default CalendarApp;
