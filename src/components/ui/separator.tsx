import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: Structural Delineator
 * Minimalist divider node used to establish spatial boundaries between registry segments.
 * Built on Radix UI for semantic accessibility (decorative vs. structural).
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
      "shrink-0 bg-border/40 transition-colors duration-300",
      orientation === "horizontal"
        ? "h-[1.5px] w-full bg-gradient-to-r from-transparent via-border/40 to-transparent"
        : "h-full w-[1.5px] bg-gradient-to-b from-transparent via-border/40 to-transparent",
      className,
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
