import type { PresenceStatus } from "@/api/auth";

/** 在线状态配色与文案 key：状态由后端维护，前端只负责呈现。 */
export const presenceStyles = {
  online: { label: "Online", className: "bg-teal-400" },
  away: { label: "Away", className: "bg-amber-300" },
  busy: { label: "Do not disturb", className: "bg-orange-400" },
  offline: { label: "Offline", className: "bg-muted-foreground" },
} as const;

export const PRESENCE_STATUSES = Object.keys(presenceStyles) as PresenceStatus[];
