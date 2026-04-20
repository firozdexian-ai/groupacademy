import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: Binary Logic Gate
 * High-fidelity state controller for mutually exclusive system parameters.
 * Synchronized with the 2026 'Executive Logic' interaction physics.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-500",
      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
      "disabled:cursor-not-allowed disabled:opacity-20",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-primary/10 data-[state=unchecked]:backdrop-blur-sm",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-lg bg-background shadow-xl ring-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "data-[state=checked]:translate-x-5 data-[state=checked]:scale-110",
        "data-[state=unchecked]:translate-x-0.5",
        "shadow-primary/5 group-hover:shadow-primary/20",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
