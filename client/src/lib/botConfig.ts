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
// 同时落地到 localStorage：确保「服务不可达 / 离线」时仍使用已配置的形象，而非默认 mochi。
const STORAGE_KEY = "omnix.botConfig.v1";

function loadFromStorage(): BotConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BotConfig> | null;
    if (parsed && typeof parsed.botCharacter === "string") return parsed as BotConfig;
    return null;
  } catch {
    return null;
  }
}

function persist(cfg: BotConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    /* 忽略配额溢出等异常 */
  }
}

let cache: BotConfig | null = loadFromStorage();
let inflight: Promise<BotConfig> | null = null;
const listeners = new Set<(c: BotConfig) => void>();

function emit() {
  if (!cache) return;
  listeners.forEach((l) => l(cache!));
}

export function getCachedBotConfig() {
  return cache;
}

/** 向服务端核对最新配置（在线则刷新，离线时保持本地缓存值）。 */
function refreshFromServer(): Promise<BotConfig> {
  if (!inflight) {
    inflight = api
      .get<BotConfig>("/contacts/bot")
      .then((r) => {
        cache = r.data;
        persist(cache);
        emit();
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** 读取系统机器人配置：优先返回本地缓存（含离线兜底），并后台向服务端核对。 */
export function fetchBotConfig(): Promise<BotConfig> {
  if (cache) {
    if (!inflight) refreshFromServer();
    return Promise.resolve(cache);
  }
  return refreshFromServer();
}

/** 保存机器人配置（名称 / 形象），更新缓存并广播给所有订阅者。 */
export async function saveBotConfig(
  patch: Partial<Pick<BotConfig, "name" | "botCharacter">>,
): Promise<BotConfig> {
  const r = await api.patch<BotConfig>("/contacts/bot", patch);
  cache = r.data;
  persist(cache);
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
