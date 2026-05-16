import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Fluid Containment Overlay System (ScrollArea)
 * Hardened responsive viewport controller protecting layout elements from flex-box collapse and track collisions.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden w-full block min-h-0 transform-gpu antialiased", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] select-text block [&>div]:!block">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar orientation="vertical" />
    <ScrollBar orientation="horizontal" />
    <ScrollAreaPrimitive.Corner className="bg-border/5 select-none pointer-events-none" />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = "ScrollArea_Core_Containment_Node";

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors duration-150 p-px bg-transparent absolute dynamic-scrollbar-track z-50",
      orientation === "vertical" && "h-full w-1.5 right-0 top-0 bottom-0 border-l border-l-transparent",
      orientation === "horizontal" && "w-full h-1.5 bottom-0 left-0 right-0 border-t border-t-transparent flex-row",
      "data-[state=visible]:animate-in data-[state=closed]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in duration-100",
      className,
    )}
    {...props}
  >
    {/* HUD LEVEL 1: ACCESSIBLE GRAB TRACK SECTOR THUMB THREAD */}
    <ScrollAreaPrimitive.ScrollAreaThumb
      className={cn(
        "relative flex-1 rounded-full bg-border/40 transition-colors duration-150 transform-gpu shrink-0 block",
        "hover:bg-primary/60 active:bg-primary",
        "after:absolute after:inset-0 after:min-h-[32px] after:min-w-[32px]", // Optimizes interactive hit targeted bounding zones securely
      )}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = "ScrollArea_Core_Track_Node";

export { ScrollArea, ScrollBar };
