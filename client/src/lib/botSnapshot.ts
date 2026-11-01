import type { CharacterSpec, MascotState } from "wobnimo";
import { snapshot } from "wobnimo";
import { characters as characterList } from "wobnimo/characters";

// 静态切片缓存：key = character:state:size → dataURL。
// 用于消息流中「非最新」的机器人头像，避免每个都挂一个实时 WebGL 实例（省 GPU/CPU）。
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

// wobnimo/characters 导出的是内置角色数组，按 id 建索引。
const specMap = new Map<string, CharacterSpec>(
  (characterList as CharacterSpec[]).map((c) => [c.id, c]),
);
const fallbackSpec =
  specMap.get("mochi") ?? (characterList as CharacterSpec[])[0];

function keyOf(character: string, state: MascotState, size: number) {
  return `${character}:${state}:${size}`;
}

/** 同步读取已缓存的切片；未生成时返回 undefined。 */
export function getBotSnapshotSync(
  character: string,
  state: MascotState,
  size: number,
): string | undefined {
  return cache.get(keyOf(character, state, size));
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
      return url;
    })
    .finally(() => {
      inflight.delete(k);
    });
  inflight.set(k, p);
  return p;
}

