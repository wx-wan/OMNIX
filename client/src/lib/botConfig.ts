import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface BotConfig {
  id: string;
  name: string;
  type: string;
  email: string;
  botCharacter: string;
}

// 模块级缓存：所有 RobotAvatar 共享同一个机器人配置，避免重复请求。
let cache: BotConfig | null = null;
let inflight: Promise<BotConfig> | null = null;
const listeners = new Set<(c: BotConfig) => void>();

function emit() {
  if (!cache) return;
  listeners.forEach((l) => l(cache!));
}

export function getCachedBotConfig() {
  return cache;
}

/** 读取系统机器人配置（带缓存）。 */
export function fetchBotConfig(): Promise<BotConfig> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = api
      .get<BotConfig>("/contacts/bot")
      .then((r) => {
        cache = r.data;
        emit();
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** 保存机器人配置（名称 / 形象），更新缓存并广播给所有订阅者。 */
export async function saveBotConfig(
  patch: Partial<Pick<BotConfig, "name" | "botCharacter">>,
): Promise<BotConfig> {
  const r = await api.patch<BotConfig>("/contacts/bot", patch);
  cache = r.data;
  emit();
  return cache;
}

/** 供组件订阅机器人配置；首次挂载时拉取，后续复用缓存，保存后实时刷新。 */
export function useBotConfig() {
  const [cfg, setCfg] = useState<BotConfig | null>(cache);

  useEffect(() => {
    let alive = true;
    if (cache) setCfg(cache);
    const l = (c: BotConfig) => {
      if (alive) setCfg(c);
    };
    listeners.add(l);
    fetchBotConfig()
      .then((c) => {
        if (alive) setCfg(c);
      })
      .catch(() => {});
    return () => {
      alive = false;
      listeners.delete(l);
    };
  }, []);

  return cfg;
}
