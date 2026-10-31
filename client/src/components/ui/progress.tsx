import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "cn"

/**
 * 进度条（基于 Base UI Progress）。
 * Base UI 的 Indicator 会自动按 value 计算 width，无需手动处理。
 */
function Progress({ className, ...props }: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "flex h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Track className="flex-1">
        <ProgressPrimitive.Indicator className="h-full bg-primary transition-[width] duration-base ease-enter" />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
