import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Metadata Disclosure Node (Tooltip)
 * Hardened WAI-ARIA compliant overlay isolating contextual briefs and safeguarding panel boundaries from edge clipping.
 * Version: Launch Candidate · Phase Z0 Lifecycle & Collision Bounds Locked
 */

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, collisionPadding = 12, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    collisionPadding={collisionPadding}
    className={cn(
      "z-50 overflow-hidden rounded-md border border-border/40 bg-popover/95 px-2.5 py-1.5 text-xs font-semibold text-popover-foreground shadow-sm backdrop-blur-md max-w-xs block text-left leading-tight pointer-events-none select-none transform-gpu antialiased pt-1",
      "animate-in fade-in duration-100",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
      "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
      className,
    )}
    {...props}
  />
));

TooltipContent.displayName = "Tooltip_Core_Content_Node";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
