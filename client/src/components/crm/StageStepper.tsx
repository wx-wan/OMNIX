import { Fragment } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StageOption {
  id: string;
  title: string;
  accent: string;
  /** 阶段标识（如 lead / qualify），用于阶段判定。 */
  key?: string;
}

type StageItem =
  | { kind: "stage"; s: StageOption; i: number }
  | { kind: "more"; side: "left" | "right"; count: number };

/**
 * 商机阶段条：顶栏中央展示当前阶段上下文（纯展示，不可切换阶段）。
 * 设计：带连接轨道的水平时间线——阶段节点用强调色圆点区分「过去 / 当前 / 未来」，
 * 当前阶段带浅色胶囊底与细环高亮；每个阶段的「停留时间」置于节点下方，配 Clock 图标。
 * 窗口固定为「含当前阶段在内的 3 个阶段」——当前居中，越界则向两端夹紧；
 * 更早/更晚的阶段折叠为「···」（tooltip 提示前/后 N 个阶段）。
 * 顶栏高度有限（48px），小屏隐藏。
 */
export function StageStepper({
  stages,
  currentId,
  durations,
  className,
}: {
  stages: StageOption[];
  currentId?: string;
  /** 各阶段停留时长（按 stageId），无记录则不展示。 */
  durations?: Record<string, string>;
  className?: string;
}) {
  const currentIndex = stages.findIndex((s) => s.id === currentId);
  const WINDOW = 3;

  // 计算窗口化后的展示项（含当前在内共 WINDOW 个，当前尽量居中）
  const items: StageItem[] = [];
  if (currentIndex < 0) {
    stages.forEach((s, i) => items.push({ kind: "stage", s, i }));
  } else {
    const maxStart = Math.max(0, stages.length - WINDOW);
    const start = Math.min(Math.max(currentIndex - 1, 0), maxStart);
    const end = Math.min(start + WINDOW, stages.length);
    if (start > 0) {
      items.push({ kind: "more", side: "left", count: start });
    }
    for (let i = start; i < end; i++) {
      items.push({ kind: "stage", s: stages[i], i });
    }
    if (end < stages.length) {
      items.push({ kind: "more", side: "right", count: stages.length - end });
    }
  }

  // 连接轨道色调：已走过的段落（到达当前及之前）更深，未来段落用边框灰
  const connectorTone = (i: number) =>
    currentIndex >= 0 && i <= currentIndex ? "bg-foreground/25" : "bg-border";

  return (
    <div className={cn("hidden items-center lg:flex", className)}>
      {items.map((it, idx) => {
        if (it.kind === "more") {
          return (
            <Fragment key={`more-${it.side}`}>
              {idx > 0 && (
                <span className="mx-1.5 h-px w-3.5 shrink-0 bg-border/70" aria-hidden />
              )}
              <span
                className="flex shrink-0 items-center px-1 text-muted-foreground/50"
                title={
                  it.side === "left" ? `前 ${it.count} 个阶段` : `后 ${it.count} 个阶段`
                }
                aria-hidden
              >
                ···
              </span>
            </Fragment>
          );
        }
        const { s, i } = it;
        const isCurrent = i === currentIndex;
        const isPast = currentIndex >= 0 && i < currentIndex;
        const dur = durations?.[s.id];
        return (
          <Fragment key={s.id}>
            {idx > 0 && (
              <span className={cn("mx-1.5 h-px w-3.5 shrink-0", connectorTone(i))} aria-hidden />
            )}
            <span
              className={cn(
                "flex shrink-0 flex-col items-center gap-1 rounded-lg px-2.5 py-1 transition-colors",
                isCurrent
                  ? "bg-foreground/[0.06] ring-1 ring-foreground/10"
                  : "hover:bg-foreground/[0.03]",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "shrink-0 rounded-full",
                    isCurrent ? "size-2.5" : "size-2",
                    s.accent,
                    !isCurrent && !isPast && "opacity-30",
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap text-xs",
                    isCurrent
                      ? "font-semibold text-foreground"
                      : isPast
                        ? "font-medium text-foreground/70"
                        : "text-muted-foreground",
                  )}
                >
                  {s.title}
                </span>
              </span>
              {dur && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-[10px] leading-none tabular-nums",
                    isCurrent ? "text-foreground/60" : "text-muted-foreground/45",
                  )}
                >
                  <Clock className="size-2.5" aria-hidden />
                  {dur}
                </span>
              )}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
