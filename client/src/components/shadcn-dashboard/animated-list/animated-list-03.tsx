"use client";

import { useState, type ReactNode, type ComponentType } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { MessageSquare, UserPlus, CreditCard, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type StackCardItem = {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  time?: string;
  /** 状态标签（如待办/进行中/完成），显示在右侧。 */
  tag?: ReactNode;
};

type StackRippleProps = {
  stackCardItems?: StackCardItem[];
  /** 受控展开状态；不传时组件内部自管理。 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 是否在组件内渲染 Show All/Hide 按钮；外部控制时可关闭。 */
  showToggle?: boolean;
  /** 工具栏文案（i18n 由接入方传入）。 */
  showAllLabel?: string;
  hideLabel?: string;
};

// Helper function to create standard icons wrapped in styled spans to avoid repetitive JSX definitions
const createIcon = (
  IconComponent: ComponentType<{ className?: string }>
) => (
  <span className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
    <IconComponent className="size-5 text-foreground" />
  </span>
);

const stackItems: StackCardItem[] = [
  {
    id: "item1",
    icon: createIcon(MessageSquare),
    title: "New Message",
    description: "Alex: Hey, let's catch up today!",
    time: "5m ago",
  },
  {
    id: "item2",
    icon: createIcon(UserPlus),
    title: "User Signed Up",
    description: "sarah.jones@example.com",
    time: "1h ago",
  },
  {
    id: "item3",
    icon: createIcon(CreditCard),
    title: "Payment Received",
    description: "$120.00 from Invoice #1024",
    time: "2h ago",
  },
];

// Shared spring transition configuration
const SPRING_TRANSITION = {
  type: "spring" as const,
  damping: 15,
  stiffness: 200,
  mass: 1,
  bounce: 0.3,
  delay: 0.13,
};

// Helper function to create motion variants with less boilerplate
const createVariant = (
  openProps: Record<string, unknown>,
  closeProps: Record<string, unknown>,
  transition = SPRING_TRANSITION
): Variants => ({
  open: { ...openProps, transition },
  close: { ...closeProps, transition },
});

const popup1Variant = createVariant({ y: -55 }, { y: 0 });
const popup2Variant = createVariant({ y: 0, scale: 1 }, { y: 0, scale: 0.95 });
const popup3Variant = createVariant({ y: 55, scale: 1 }, { y: 0, scale: 0.9 });
const buttonVariant = createVariant({ y: 55 }, { y: 0 });
const iconVariant = createVariant(
  { rotate: 180 },
  { rotate: 0 },
  { ...SPRING_TRANSITION, damping: 12, stiffness: 150 }
);

const CARD_CONFIGS = [
  { variant: popup3Variant, top: 100 },
  { variant: popup2Variant, top: 90 },
  { variant: popup1Variant, top: 80 },
];

export const StackRipple = ({
  stackCardItems = stackItems,
  open,
  onOpenChange,
  showToggle = true,
  showAllLabel = "Show All",
  hideLabel = "Hide",
}: StackRippleProps) => {
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          // 展开态：全部任务，固定高度内滚动
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="max-h-72 space-y-2 overflow-y-auto bg-background"
          >
            {stackCardItems.map((item) => (
              <div
                key={item.id}
                className="flex h-14 items-center justify-between gap-2 rounded-lg border border-border bg-background px-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {item.icon}
                  <div className="flex min-w-0 flex-col justify-center gap-0.5">
                    <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {item.tag}
                  {item.time ? (
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          // 折叠态：前 3 张堆叠卡片（保留 ripple 动画）
          <motion.div
            key="stacked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="relative h-72 overflow-hidden rounded-xl px-3.5 py-2.5"
          >
            <div className="relative h-full w-full">
              {stackCardItems.slice(0, 3).map((item, idx) => {
                const config = CARD_CONFIGS[idx] || CARD_CONFIGS[CARD_CONFIGS.length - 1];
                return (
                  <motion.div
                    key={item.id}
                    variants={config.variant}
                    animate="close"
                    initial="close"
                    style={{ top: config.top }}
                    className={cn(
                      "absolute inset-x-0 mx-auto flex h-14 w-full items-center justify-between",
                      "bg-background rounded-xl border border-border px-2"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {item.icon}
                      <div className="flex min-w-0 flex-col justify-center gap-0.5">
                        <p className="truncate text-foreground text-sm font-semibold">{item.title}</p>
                        <p className="truncate text-muted-foreground text-xs">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {item.tag}
                      {item.time ? (
                        <span className="text-muted-foreground text-xs">{item.time}</span>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showToggle ? (
        <motion.div
          variants={buttonVariant}
          animate="close"
          initial="close"
          className="absolute inset-x-0 mx-auto z-10 mt-3 w-full max-w-24"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(!isOpen)}
            className="w-full h-8 rounded-lg flex items-center justify-between gap-1 px-2.5"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={isOpen ? "hide" : "show"}
                className="text-xs font-medium text-foreground/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? hideLabel : showAllLabel}
              </motion.span>
            </AnimatePresence>
            <motion.span
              variants={iconVariant}
              animate={isOpen ? "open" : "close"}
              initial="close"
              className="text-foreground/80 flex items-center"
            >
              <ChevronDown className="size-4" />
            </motion.span>
          </Button>
        </motion.div>
      ) : null}
    </div>
  );
};

export default function StackRippleDemo() {
  return <StackRipple stackCardItems={stackItems} />;
}
