import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"
import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  side?: "left" | "right" | "top" | "bottom"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 duration-base supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-open:ease-enter data-closed:animate-out data-closed:fade-out-0 data-closed:ease-exit" />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover p-5 text-popover-foreground shadow-pop outline-none duration-base",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 max-w-sm data-open:animate-in data-open:slide-in-from-right data-open:ease-enter data-closed:animate-out data-closed:slide-out-to-right data-closed:ease-exit",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 max-w-sm data-open:animate-in data-open:slide-in-from-left data-open:ease-enter data-closed:animate-out data-closed:slide-out-to-left data-closed:ease-exit",
          side === "top" &&
            "inset-x-0 top-0 w-full data-open:animate-in data-open:slide-in-from-top data-open:ease-enter data-closed:animate-out data-closed:slide-out-to-top data-closed:ease-exit",
          side === "bottom" &&
            "inset-x-0 bottom-0 w-full data-open:animate-in data-open:slide-in-from-bottom data-open:ease-enter data-closed:animate-out data-closed:slide-out-to-bottom data-closed:ease-exit",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            render={<Button variant="ghost" size="icon-sm" className="absolute top-3 right-3" />}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sheet-header" className={cn("flex flex-col gap-2", className)} {...props} />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-heading text-base leading-tight font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
