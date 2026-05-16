import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Technical Structural Delineator Primitive (Separator)
 * Hardened WAI-ARIA compliant layout divider providing crisp integer-pixel strokes and un-conflicted color composition grids.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 block select-none pointer-events-none transform-gpu antialiased transition-colors duration-150",
      orientation === "horizontal"
        ? "h-px w-full bg-linear-to-r from-transparent via-border/20 to-transparent"
        : "h-full w-px bg-linear-to-b from-transparent via-border/20 to-transparent",
      className,
    )}
    {...props}
  />
));

Separator.displayName = "Separator_Core_Delineator_Node";

export { Separator };
