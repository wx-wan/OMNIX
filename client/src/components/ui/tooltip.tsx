import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { cn } from 'cn'

/**
 * 悬停提示（字段标签旁的 ⓘ 等）
 *
 * 走 Base UI 的 Portal 渲染到 body：表单内容区是 `overflow-y-auto` 的滚动容器，
 * 用绝对定位的气泡会被它裁掉，Portal 则不会。
 * 原先只有原生 `title` —— 浏览器要悬停约 1 秒才弹、且样式不可控，用户常以为「没提示」。
 */
function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return (
    <TooltipPrimitive.Provider delay={150}>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipPrimitive.Provider>
  )
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 6,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, 'side' | 'sideOffset'>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        className="isolate z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            'max-w-64 rounded-lg bg-foreground px-2.5 py-1.5 text-xs leading-snug text-background shadow-md duration-base outline-none',
            'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:ease-enter',
            'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:ease-exit',
            className,
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent }
