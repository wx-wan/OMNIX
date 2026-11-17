"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: string;
  title: string;
}

export interface SetupStepsProps {
  duration?: number;
  steps?: StepItem[];
  step1?: string;
  step2?: string;
  step3?: string;
  className?: string;
  /**
   * 受控进度：已完成的阶段数（0-based 当前 active 索引）。
   * - 0 表示第一个阶段进行中；
   * - steps.length 表示全部完成（所有阶段显示对勾、进度条 100%）。
   * 传入后停止内部自动轮播，完全由外部驱动。
   */
  pointer?: number;
  /** 全部阶段完成：收起步骤列表，显示紧凑完成态。 */
  done?: boolean;
}

type StepStatus = "completed" | "active" | "pending";

const defaultSteps: StepItem[] = [
  { id: "1", title: "Welcome Aboard" },
  { id: "2", title: "Verifying Details" },
  { id: "3", title: "Account Created" },
  { id: "4", title: "Configuring Workspace" },
  { id: "5", title: "Finalizing Setup" },
];

export const SetupSteps = ({
  duration = 3000,
  steps,
  step1 = "Welcome Aboard",
  step2 = "Verifying Details",
  step3 = "Account Created",
  className,
  pointer,
  done = false,
}: SetupStepsProps) => {
  const { t } = useTranslation();
  const stepsList = useMemo(() => {
    if (steps && steps.length > 0) return steps;
    return [
      { id: "1", title: step1 },
      { id: "2", title: step2 },
      { id: "3", title: step3 },
      { id: "4", title: "Configuring Workspace" },
      { id: "5", title: "Finalizing Setup" },
    ];
  }, [steps, step1, step2, step3]);

  const controlled = pointer !== undefined;
  const [innerPointer, setInnerPointer] = useState(1);
  const current = controlled ? (pointer as number) : innerPointer;
  const len = stepsList.length;

  // 未受控时保留原自动轮播（供独立 demo 使用）；受控时由外部串行循环推进。
  useEffect(() => {
    if (controlled || len === 0) return;
    const timer = setInterval(() => {
      setInnerPointer((prev) => (prev + 1) % len);
    }, duration);
    return () => clearInterval(timer);
  }, [controlled, duration, len]);

  /** 三步窗口：[上一步 / 当前 / 下一步]；受控完成时固定显示最后三步且全为 completed。 */
  const rows = useMemo(() => {
    if (len === 0) return [];
    const indices = controlled
      ? done
        ? [len - 1]
        : current >= len
          ? [len - 3, len - 2, len - 1]
          : [current - 1, current, current + 1]
      : [(current - 1 + len) % len, current % len, (current + 1) % len];
    return indices
      .filter((idx) => idx >= 0 && idx < len)
      .map((idx) => {
        const status: StepStatus = controlled
          ? idx < current
            ? "completed"
            : idx === current
              ? "active"
              : "pending"
          : idx === (current - 1 + len) % len
            ? "completed"
            : idx === current % len
              ? "active"
              : "pending";
        return { item: stepsList[idx], status };
      });
  }, [controlled, current, len, done, stepsList]);

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex w-full max-w-90 flex-col items-center gap-3 rounded-xl border border-border bg-white px-6 py-8 text-center",
          className,
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-teal-400 text-white">
          <Check className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-foreground">{t("All stages completed")}</span>
          <span className="text-xs text-muted-foreground">{t("Your project is ready.")}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={cn("flex w-full max-w-90 flex-col gap-2.5 py-2", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {rows.map(({ item, status }) => {
          const isActive = status === "active";
          const isCompleted = status === "completed";
          const statusLabel = isActive
            ? t("In Progress")
            : isCompleted
              ? t("Completed")
              : t("Not started");
          const stepNo = stepsList.findIndex((step) => step.id === item.id) + 1;

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: isActive ? 1 : isCompleted ? 0.55 : 0.4, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.94 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex w-full flex-col justify-center gap-2 rounded-xl border border-border bg-white p-3.5 transition-colors duration-500",
                isActive && "shadow-xs",
              )}
            >
              <div className="flex items-center justify-start gap-2.5">
                <div className="relative flex size-5 shrink-0 items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={status}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        isCompleted && "flex size-5 items-center justify-center rounded-full bg-teal-400 text-white",
                        isActive && "text-teal-400",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="size-3" />
                      ) : isActive ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <span className="size-2 rounded-full bg-muted-foreground/40" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold tabular-nums text-muted-foreground/70">
                      {String(stepNo).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "truncate text-sm font-semibold tracking-tight transition-colors duration-500",
                        isActive || isCompleted ? "text-foreground" : "text-muted-foreground/60",
                      )}
                    >
                      {item.title}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-medium transition-colors duration-500",
                      isActive
                        ? "text-teal-500"
                        : isCompleted
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50",
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>
              {status !== "pending" ? (
                <div className="ml-7.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-teal-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      width: isActive
                        ? { duration: duration / 1000, ease: "linear" }
                        : { duration: 0.5, ease: "easeInOut" },
                    }}
                  />
                </div>
              ) : null}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default function SetupStepsDemo() {
  return (
    <SetupSteps steps={defaultSteps} />
  );
}
