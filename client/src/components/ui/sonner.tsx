"use client"

import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, CircleHelpIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

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
        success: <CircleCheckIcon className="size-4" />,
        info: <CircleHelpIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
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
