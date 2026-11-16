"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PositionedToaster, createToastManager } from "./toaster";
import { tones, toneData, type Tone, type ToneName } from "./tones";

// A local manager keeps these toasts top right, clear of chat widgets in the bottom corner.
const toast = createToastManager();

const variants: { label: string; tone: ToneName; show: () => void }[] = [
  {
    label: "Default",
    tone: "default",
    show: () => toast.add({ title: "Event created", description: "Friday, Nov 7 at 10:00 AM", data: toneData("default") }),
  },
  {
    label: "Success",
    tone: "success",
    show: () => toast.add({ type: "success", title: "Changes saved", description: "Your profile is up to date.", data: toneData("success") }),
  },
  {
    label: "Info",
    tone: "info",
    show: () => toast.add({ type: "info", title: "New version available", description: "Refresh to get v2.4.0.", data: toneData("info") }),
  },
  {
    label: "Warning",
    tone: "warning",
    show: () => toast.add({ type: "warning", title: "Storage almost full", description: "You have used 92% of 10 GB.", data: toneData("warning") }),
  },
  {
    label: "Error",
    tone: "error",
    show: () => toast.add({ type: "error", title: "Payment failed", description: "Your card was declined.", data: toneData("error") }),
  },
  {
    label: "With close button",
    tone: "reminder",
    show: () =>
      toast.add({
        title: "Session expires soon",
        description: "You will be signed out in 5 minutes.",
        timeout: 8000,
        data: toneData("reminder", { closeButton: true }),
      }),
  },
];

const SonnerDemo = () => {
  return (
    <PositionedToaster manager={toast} position="top-right">
      <div className="flex max-w-md flex-wrap justify-center gap-2">
        {variants.map((variant) => {
          const tone: Tone = tones[variant.tone];
          return (
            <Button
              key={variant.label}
              variant="outline"
              onClick={variant.show}
              className={cn("text-foreground", tone.button)}
            >
              <tone.icon className={tone.iconColor} aria-hidden="true" />
              {variant.label}
            </Button>
          );
        })}
      </div>
    </PositionedToaster>
  );
};

export default SonnerDemo;
