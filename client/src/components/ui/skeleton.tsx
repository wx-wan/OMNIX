/**
 * 统一骨架屏原语。
 *
 * 职责：仅模拟最终内容的「空间结构」，不表示 spinner / progress / 状态 / 假数据。
 * 视觉复用 muted token + rounded-md；动效走 Tailwind `animate-pulse`。
 */
import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

/** 基础骨架块：任意尺寸 + 圆角自定义，组合出任何结构占位。 */
function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      aria-hidden="true"
      {...props}
    />
  )
}

/** 通用表格骨架：rows×cols 结构占位。 */
function TableSkeleton({
  rows = 8,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div role="status" className={cn('w-full', className)}>
      <Table className="table-fixed">
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r} className="hover:bg-transparent">
              <TableCell colSpan={cols} className="py-3">
                <div className="flex items-center gap-3" aria-hidden="true">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/6" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/** 通用区块 / 页面骨架：垂直堆叠占位块。 */
function SectionSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div role="status" className={cn('space-y-3', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

export { Skeleton, TableSkeleton, SectionSkeleton }
