import type { ReactNode } from "react";

import i18n from "@/i18n";
import { createToastManager } from "@/components/ui/toast";
import { toneData, type ToneName } from "./tones";
import type { ToastData } from "./toaster";

/** Global manager rendered by <PositionedToaster /> in App.tsx. */
export const toastManager = createToastManager();

export type ToastTone =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "loading"
  | "reminder";

export type ToastOptions = {
  description?: ReactNode;
  duration?: number;
  id?: string;
  closeButton?: boolean;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
};

const toneByName: Record<ToastTone, ToneName> = {
  default: "default",
  success: "success",
  info: "info",
  warning: "warning",
  error: "error",
  loading: "default",
  reminder: "reminder",
};

// Every toast gets a second line. Match both source-language and Chinese titles,
// so a caller only needs to pass the title and the description follows its language.
const DETAIL_KEYS: Record<string, string> = {
  "Logged in successfully": "Your workspace is ready. Pick up where you left off.",
  "登录成功": "Your workspace is ready. Pick up where you left off.",
  "Account created": "You're signed in and your workspace is ready.",
  "账号已创建": "You're signed in and your workspace is ready.",
  "Project created": "The new project is open. Add requirements, tasks and progress.",
  "项目创建成功": "The new project is open. Add requirements, tasks and progress.",
  "Saved successfully": "Your changes have been written to the project record.",
  "保存成功": "Your changes have been written to the project record.",
  "Profile updated": "Your teammates now see the latest profile.",
  "个人资料已更新": "Your teammates now see the latest profile.",
  "Avatar updated": "Your new avatar is shown across the workspace.",
  "头像已更新": "Your new avatar is shown across the workspace.",
  "Contact created": "The contact is in your list. Add notes anytime.",
  "联系人已新增": "The contact is in your list. Add notes anytime.",
  "Contact updated": "Contact details are up to date.",
  "联系人已更新": "Contact details are up to date.",
  "Contact deleted": "The contact has been removed from your list.",
  "联系人已删除": "The contact has been removed from your list.",
  "Added to favorites": "You can find it in your favorites.",
  "已收藏": "You can find it in your favorites.",
  "Removed from favorites": "It's no longer in your favorites.",
  "已取消收藏": "It's no longer in your favorites.",
  "Notes saved": "Your note will be here next time.",
  "备注已保存": "Your note will be here next time.",
  "Role updated": "The member's permissions have changed.",
  "角色已更新": "The member's permissions have changed.",
  "Member removed": "The member no longer has access to this workspace.",
  "成员已移除": "The member no longer has access to this workspace.",
  "Reset code generated": "Check your inbox and continue with the code.",
  "重置码已生成": "Check your inbox and continue with the code.",
  "Password reset. Please log in again.": "Sign in with your new password.",
  "密码已重置，请重新登录": "Sign in with your new password.",
  "Live chat is not available yet": "Reach us by email if you need help.",
  "Registration is open. Members can create accounts on the sign-up page.":
    "Share the sign-up link with your team.",
  "注册已开放，成员可在注册页自助创建账号。": "Share the sign-up link with your team.",
  "Operation failed": "Please check what you entered and try again.",
  "操作失败": "Please check what you entered and try again.",
};

const TONE_DETAILS: Record<ToastTone, string> = {
  default: "Done. You can keep working.",
  success: "Your changes have been saved.",
  info: "Here's what you need to know.",
  warning: "Please review it before continuing.",
  error: "Something went wrong. Please try again.",
  loading: "This will only take a moment.",
  reminder: "No action is needed right now.",
};

const detailKey = (message: ReactNode, tone: ToastTone): string => {
  const title = typeof message === "string" ? message : "";
  return DETAIL_KEYS[title] ?? TONE_DETAILS[tone];
};

const show = (message: ReactNode, tone: ToastTone, options?: ToastOptions): string => {
  const extras: Partial<ToastData> = {
    closeButton: options?.closeButton,
    ...(options?.icon ? { icon: options.icon } : {}),
  };

  // Loading keeps the built-in spinner from `typeIcons` instead of a tinted badge.
  const data: ToastData = tone === "loading" ? { ...extras } : toneData(toneByName[tone], extras);

  return toastManager.add({
    id: options?.id,
    type: tone === "default" ? undefined : tone,
    title: message,
    description: options?.description ?? i18n.t(detailKey(message, tone)),
    timeout: options?.duration,
    actionProps: options?.action
      ? { children: options.action.label, onClick: options.action.onClick }
      : undefined,
    data,
  });
};

const make = (tone: ToastTone) => (message: ReactNode, options?: ToastOptions): string =>
  show(message, tone, options);

const toastFn = (message: ReactNode, options?: ToastOptions): string =>
  show(message, "default", options);

/** Sonner-compatible facade backed by the Base UI / Sonner 08 toast manager. */
export const toast = Object.assign(toastFn, {
  message: make("default"),
  success: make("success"),
  info: make("info"),
  warning: make("warning"),
  error: make("error"),
  loading: make("loading"),
  reminder: make("reminder"),
  dismiss: (id?: string): void => toastManager.close(id),
});
