"use client"

import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, CircleXIcon, Loader2Icon } from "lucide-react"
import { RobotAvatar } from "@/components/common/RobotAvatar"
import { cn } from "@/lib/utils"
import type { MascotState } from "wobnimo"

/** 每种 toast 状态：机器人表情 + 该状态对应的彩色图标（图标放在机器人与文本之间）。 */
type ToastType = "success" | "info" | "warning" | "error" | "loading"
const STATUS_ICON: Record<
  ToastType,
  { Icon: React.ComponentType<{ className?: string }>; color: string; bg: string; robot: MascotState }
> = {
  success: { Icon: CircleCheckIcon, color: "text-emerald-600", bg: "bg-emerald-500/15", robot: "celebrating" },
  info: { Icon: InfoIcon, color: "text-sky-600", bg: "bg-sky-500/15", robot: "idle" },
  warning: { Icon: TriangleAlertIcon, color: "text-amber-600", bg: "bg-amber-500/15", robot: "thinking" },
  error: { Icon: CircleXIcon, color: "text-destructive", bg: "bg-destructive/15", robot: "error" },
  loading: { Icon: Loader2Icon, color: "text-sky-600", bg: "bg-sky-500/15", robot: "working" },
}

/** 文本右侧的状态区：一枚带浅底色的状态图标 + 机器人头像（机器人排在最末）。 */
function ToastIcon({ type }: { type: ToastType }) {
  const { Icon, color, bg, robot } = STATUS_ICON[type]
  return (
    <span className="flex items-center gap-2">
      <span className={cn("flex size-5 items-center justify-center rounded-full", bg)}>
        <Icon className={cn("size-3.5", color, type === "loading" && "animate-spin")} />
      </span>
      <RobotAvatar size={26} state={robot} />
    </span>
  )
}

/**
 * 消息提示（sonner）——全站唯一的 toast 出口。
 *
 * 跟随**应用自身**的主题（读 html.dark），而不是操作系统偏好。
 * 结构细节（内边距、字号、阴影、分状态图标色）写在 index.css 的「消息提示」段。
 * 不要打开 richColors：它带一套彩色底规则，会把白卡盖掉。
 * 描边必须保留（--normal-border = var(--border)）：暗色下卡片色与页面背景只差一档，
 * 不描边的话 toast 会糊成一条和背景融在一起的深色长条。
 */
function useAppTheme() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  React.useEffect(() => {
    const el = document.documentElement
    const sync = () => setTheme(el.classList.contains("dark") ? "dark" : "light")
    const observer = new MutationObserver(sync)
    observer.observe(el, { attributes: true, attributeFilter: ["class"] })
    sync()
    return () => observer.disconnect()
  }, [])
  return theme
}

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useAppTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        // 各 toast 状态对应机器人表情 + 状态彩色图标（机器人与文本之间）：
        success: <ToastIcon type="success" />, // 庆祝（完成）
        info: <ToastIcon type="info" />, // 普通待命
        warning: <ToastIcon type="warning" />, // 注意/思考
        error: <ToastIcon type="error" />, // 报错
        loading: <ToastIcon type="loading" />, // 工作中
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--width": "18rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
