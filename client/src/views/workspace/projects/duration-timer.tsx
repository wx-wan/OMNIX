"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { resolveDate } from "src/api/workspace/use-workspace";

/**
 * 单个数字位：值变化时纵向滚入滚出，仿 shadcn 数字计时器。
 * 字体继承父级的 text-sm font-medium（与详情行其它值一致），无方块背景。
 */
function RollingDigit({ digit }: { digit: string }) {
  return (
    <span className="relative inline-flex h-[1.25em] w-[0.62em] items-center justify-center overflow-hidden tabular-nums">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.6 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** 数值（可多位）：逐位滚动，位数不足补零到 minWidth。 */
function RollingNumber({ value, minWidth = 2 }: { value: number; minWidth?: number }) {
  const digits = String(value).padStart(minWidth, "0").split("");
  return (
    <span className="inline-flex items-center gap-px">
      {digits.map((digit, index) => (
        <RollingDigit key={`${index}-${digits.length}`} digit={digit} />
      ))}
    </span>
  );
}

/** 持续时间计时器：从创建日期实时累加到当前，天/时为 0 时隐藏对应段。 */
export function DurationTimer({ createdAt }: { createdAt?: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const start = resolveDate(createdAt)?.getTime();
  if (!start) return <span className="text-sm text-muted-foreground">—</span>;

  const total = Math.max(0, Math.floor((now - start) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground tabular-nums">
      {days > 0 && (
        <>
          <RollingNumber value={days} minWidth={1} />
          <span className="text-muted-foreground">天</span>
        </>
      )}
      {hours > 0 && (
        <>
          <RollingNumber value={hours} minWidth={1} />
          <span className="text-muted-foreground">时</span>
        </>
      )}
      <RollingNumber value={minutes} />
      <span className="text-muted-foreground">分</span>
      <RollingNumber value={seconds} />
      <span className="text-muted-foreground">秒</span>
    </span>
  );
}

export default DurationTimer;
