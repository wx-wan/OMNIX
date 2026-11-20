import { FlaskConicalIcon, GitCommitHorizontalIcon, HammerIcon, RocketIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import "@/components/shadcn-dashboard/animated-beam/animated-beam-02.css";

export type BeamStage = {
  label: string;
  detail?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tint?: string;
  active?: string;
};

// 官方默认四阶段（Deploy Pipeline）原样保留，未传 stages 时 1:1。
const defaultStages: BeamStage[] = [
  { label: "Commit", detail: "a1f3c9e", icon: GitCommitHorizontalIcon, tint: "bg-sky-400/15 text-sky-400", active: "border-sky-400" },
  { label: "Build", detail: "38s", icon: HammerIcon, tint: "bg-amber-300/20 text-amber-300", active: "border-amber-300" },
  { label: "Test", detail: "214 passed", icon: FlaskConicalIcon, tint: "bg-blue-500/15 text-blue-500", active: "border-blue-500" },
  { label: "Deploy", detail: "Production", icon: RocketIcon, tint: "bg-teal-400/15 text-teal-400", active: "border-teal-400" },
];

const TINTS = [
  "bg-sky-400/15 text-sky-400",
  "bg-amber-300/20 text-amber-300",
  "bg-blue-500/15 text-blue-500",
  "bg-teal-400/15 text-teal-400",
  "bg-violet-400/15 text-violet-400",
  "bg-rose-400/15 text-rose-400",
];
const ACTIVES = [
  "border-sky-400", "border-amber-300", "border-blue-500",
  "border-teal-400", "border-violet-400", "border-rose-400",
];
const BEAMS = ["stroke-amber-300", "stroke-blue-500", "stroke-teal-400", "stroke-violet-400", "stroke-rose-400"];

/**
 * Animated Beam 02 - Deploy Pipeline（官方 1:1 结构）。
 * 可选 stages：用设置里的阶段名/天数替换展示；CSS 动画类名沿用官方，
 * 超过 4 段的 pulse/glow 用内联 animationDelay 复用末段关键帧。
 */
const AnimatedBeamPipeline = ({ stages = defaultStages }: { stages?: BeamStage[] }) => {
  const items = stages.length ? stages : defaultStages;
  const count = items.length;
  const step = 100 / count;
  const segments = items.slice(0, -1).map((_, index) => {
    const x1 = step * (index + 1);
    const x2 = step * (index + 2);
    return {
      path: `M${x1 * 4} 50 H${x2 * 4 - 26}`,
      beamClass: BEAMS[index % BEAMS.length],
      segment: Math.min(index + 1, 3),
      stage: Math.min(index + 1, 4),
      delay: index > 2 ? `${index * 0.9}s` : undefined,
    };
  });

  return (
    <div className="relative mx-auto aspect-10/3 w-full max-w-2xl">
      <svg aria-hidden="true" viewBox="0 0 400 120" fill="none" className="absolute inset-0 size-full">
        {segments.map((segment) => (
          <g key={segment.path}>
            <path d={segment.path} pathLength={100} strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="stroke-border" />
            <path
              d={segment.path}
              pathLength={100}
              strokeWidth={2}
              strokeLinecap="round"
              style={segment.delay ? { animationDelay: segment.delay } : undefined}
              className={cn("animated-beam-02-pulse", `animated-beam-02-segment-${segment.segment}`, segment.beamClass)}
            />
          </g>
        ))}
      </svg>

      <ol aria-label="Project stages">
        {items.map((stage, index) => {
          const Icon = stage.icon ?? RocketIcon;
          return (
            <li
              key={`${stage.label}-${index}`}
              className="absolute top-5/12 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${step * index + step / 2}%` }}
            >
              <span className="relative flex size-9 items-center justify-center rounded-xl border border-border bg-background">
                <span
                  aria-hidden="true"
                  className={cn("animated-beam-02-stage absolute -inset-px rounded-xl border-2", stage.active ?? ACTIVES[index % ACTIVES.length], `animated-beam-02-stage-${Math.min(index + 1, 4)}`)}
                  style={index > 3 ? { animationDelay: `${index * 0.9}s` } : undefined}
                />
                <span className={cn("flex size-7 items-center justify-center rounded-lg", stage.tint ?? TINTS[index % TINTS.length])}>
                  <Icon aria-hidden="true" className="size-3.5" />
                </span>
              </span>
              <span className="absolute top-full left-1/2 mt-1.5 flex -translate-x-1/2 flex-col items-center">
                <span className="text-[10px] font-medium whitespace-nowrap text-foreground">{stage.label}</span>
                {stage.detail ? <span className="text-[10px] whitespace-nowrap text-muted-foreground">{stage.detail}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default AnimatedBeamPipeline;
