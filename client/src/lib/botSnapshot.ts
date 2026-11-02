import type { CharacterSpec, MascotState } from "wobnimo";
import { snapshot } from "wobnimo";
import { characters as characterList } from "wobnimo/characters";

// 静态切片缓存：key = character:state:size → dataURL。
// 用于消息流中「非最新」的机器人头像，避免每个都挂一个实时 WebGL 实例（省 GPU/CPU）。
// 同时落地到 localStorage：离线 / 刷新后无需重新渲染即可直接显示已配置形象的图。
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
const STORAGE_PREFIX = "omnix.botSnapshot.";

// wobnimo/characters 导出的是内置角色数组，按 id 建索引。
const specMap = new Map<string, CharacterSpec>(
  (characterList as CharacterSpec[]).map((c) => [c.id, c]),
);
const fallbackSpec =
  specMap.get("mochi") ?? (characterList as CharacterSpec[])[0];

function keyOf(character: string, state: MascotState, size: number) {
  return `${character}:${state}:${size}`;
}

function storageKeyOf(character: string, state: MascotState, size: number) {
  return STORAGE_PREFIX + keyOf(character, state, size);
}

function readStorage(character: string, state: MascotState, size: number) {
  try {
    const s = localStorage.getItem(storageKeyOf(character, state, size));
    if (s) {
      cache.set(keyOf(character, state, size), s);
      return s;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function writeStorage(
  character: string,
  state: MascotState,
  size: number,
  url: string,
) {
  try {
    localStorage.setItem(storageKeyOf(character, state, size), url);
  } catch {
    /* 忽略配额溢出等异常 */
  }
}

/** 同步读取已缓存的切片；未生成时返回 undefined（优先内存，其次 localStorage）。 */
export function getBotSnapshotSync(
  character: string,
  state: MascotState,
  size: number,
): string | undefined {
  const mem = cache.get(keyOf(character, state, size));
  if (mem) return mem;
  return readStorage(character, state, size);
}

/**
 * 一次性渲染机器人形象的静态切片（dataURL），按 character+state+size 缓存。
 * snapshot() 只渲染一帧（不持续跑动画循环），用完即弃，几乎不占资源。
 */
export async function getBotSnapshot(
  character: string,
  state: MascotState,
  size: number,
): Promise<string> {
  const k = keyOf(character, state, size);
  const hit = cache.get(k);
  if (hit) return hit;
  const pending = inflight.get(k);
  if (pending) return pending;

  const spec = specMap.get(character) ?? fallbackSpec;
  const p = snapshot(spec, { state, size, floor: 0 })
    .then((canvas) => {
      const url = canvas.toDataURL("image/png");
      cache.set(k, url);
      writeStorage(character, state, size, url);
      return url;
    })
    .finally(() => {
      inflight.delete(k);
    });
  inflight.set(k, p);
  return p;
}

