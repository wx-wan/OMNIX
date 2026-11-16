import { BellRing, CircleCheck, Clock, Info, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ToastData } from "./toaster";

// Each type gets its own icon in a tinted circle, a matching toast border, and a matching button.
export type Tone = {
  icon: LucideIcon;
  iconColor: string;
  badge: string;
  border: string;
  button: string;
};

export const tones = {
  default: {
    icon: BellRing,
    iconColor: "text-muted-foreground",
    badge: "bg-muted",
    border: "",
    button: "",
  },
  success: {
    icon: CircleCheck,
    iconColor: "text-teal-400",
    badge: "bg-teal-400/15",
    border: "border-teal-400/30",
    button: "border-teal-400/30 bg-teal-400/10 hover:bg-teal-400/20",
  },
  info: {
    icon: Info,
    iconColor: "text-sky-400",
    badge: "bg-sky-400/15",
    border: "border-sky-400/30",
    button: "border-sky-400/30 bg-sky-400/10 hover:bg-sky-400/20",
  },
  warning: {
    icon: TriangleAlert,
    iconColor: "text-amber-300",
    badge: "bg-amber-300/20",
    border: "border-amber-300/40",
    button: "border-amber-300/40 bg-amber-300/15 hover:bg-amber-300/25",
  },
  error: {
    icon: OctagonAlert,
    iconColor: "text-destructive",
    badge: "bg-destructive/10",
    border: "border-destructive/30",
    button: "border-destructive/30 bg-destructive/10 hover:bg-destructive/15",
  },
  reminder: {
    icon: Clock,
    iconColor: "text-blue-500",
    badge: "bg-blue-500/15",
    border: "border-blue-500/30",
    button: "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20",
  },
} satisfies Record<string, Tone>;

export type ToneName = keyof typeof tones;

export const toneData = (name: ToneName, extra?: Partial<ToastData>): ToastData => {
  const tone: Tone = tones[name];
  return {
    icon: (
      <span className={cn("flex size-7 items-center justify-center rounded-full", tone.badge)}>
        <tone.icon className={cn("size-4", tone.iconColor)} aria-hidden="true" />
      </span>
    ),
    className: tone.border,
    ...extra,
  };
};
