"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Props = {
  /** 已完成数（任务+问题） */
  done: number;
  /** 总数（任务+问题） */
  total: number;
  /** 已完成任务数 */
  doneTasks: number;
  /** 任务总数 */
  totalTasks: number;
  /** 已解决问题数 */
  doneIssues: number;
  /** 问题总数 */
  totalIssues: number;
  /** 进度百分比 */
  progress: number;
  zh: boolean;
};

/** 组织进度提醒文案：整体进度、任务/问题拆分、剩余提醒，空项目单独一条。 */
function buildMessages(p: Props): string[] {
  if (p.total === 0) {
    return p.zh
      ? ["暂无任务，项目尚未开始", "新建任务后可跟踪进度"]
      : ["No tasks yet — not started", "Add a task to track progress"];
  }
  const remaining = p.total - p.done;
  return p.zh
    ? [
        `整体进度 ${p.progress}% · 已完成 ${p.done}/${p.total} 项`,
        `当前阶段 ${p.doneTasks}/${p.totalTasks} 项任务已完成`,
        remaining > 0
          ? `还剩 ${remaining} 项任务待完成，继续推进`
          : "全部任务已完成，进度已达成",
      ]
    : [
        `Overall progress ${p.progress}% · ${p.done}/${p.total} tasks done`,
        `${p.doneTasks}/${p.totalTasks} tasks completed in the current stage`,
        remaining > 0
          ? `${remaining} task${remaining > 1 ? "s" : ""} remaining — keep going`
          : "All tasks completed — goal reached",
      ];
}

/** 进度提醒跑马灯：固定单行高度，文案上下滚动轮播。 */
export function ProgressTicker(props: Props) {
  const messages = buildMessages(props);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (messages.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="relative h-4 overflow-hidden" aria-live="polite">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.p
          key={`${index}-${messages[index]}`}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0 truncate text-xs text-muted-foreground"
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default ProgressTicker;
