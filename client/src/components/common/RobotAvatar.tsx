import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Mascot } from "wobnimo/react";
import type { MascotState } from "wobnimo";
import { useBotConfig } from "@/lib/botConfig";
import { getBotSnapshot, getBotSnapshotSync } from "@/lib/botSnapshot";

/**
 * 机器人头像封装：基于 wobnimo 的轻量 3D 吉祥物（WebGL2，~25KB，零依赖）。
 * 默认形象取系统机器人配置（/contacts/bot 的 botCharacter），可在联系人/用户处修改；
 * 关闭指针交互与地面阴影，适配小尺寸头像/图标场景，动画随 state 变化。
 *
 * 资源优化：当 live=false 时只渲染「静态切片」（一次性截图），不再挂载实时 WebGL 实例，
 * 用于同一消息流里「非最新」的机器人，避免大量并行动画循环拖垮系统。
 */
export function RobotAvatar({
  size = 32,
  state = "idle",
  character,
  live = true,
  interactive = false,
  effects = false,
  className,
  style,
}: {
  size?: number;
  state?: MascotState;
  /** 内置吉祥物 id；不传则使用系统机器人配置的形象（默认 mochi）。 */
  character?: string;
  /** 是否实时渲染；false 时显示静态切片（更省资源）。默认 true。 */
  live?: boolean;
  interactive?: boolean;
  effects?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const bot = useBotConfig();
  const active = character ?? bot?.botCharacter ?? "mochi";

  if (!live) {
    return (
      <BotSnapshot
        character={active}
        state={state}
        size={size}
        className={className}
        style={style}
      />
    );
  }

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        ...style,
      }}
    >
      <Mascot
        character={active}
        state={state}
        interactive={interactive}
        effects={effects}
        floor={0}
        style={{ width: size, height: size }}
      />
    </span>
  );
}

/** 静态切片：优先用缓存 dataURL，未生成时占位，生成后替换为 <img>。 */
function BotSnapshot({
  character,
  state,
  size,
  className,
  style,
}: {
  character: string;
  state: MascotState;
  size: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [url, setUrl] = useState<string | undefined>(() =>
    getBotSnapshotSync(character, state, size),
  );

  useEffect(() => {
    let alive = true;
    getBotSnapshot(character, state, size)
      .then((u) => {
        if (alive) setUrl(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [character, state, size]);

  if (!url) {
    return (
      <span
        className={className}
        style={{ display: "inline-flex", width: size, height: size, ...style }}
      />
    );
  }
  return (
    <img
      src={url}
      alt=""
      className={className}
      style={{ display: "inline-flex", width: size, height: size, ...style }}
    />
  );
}

