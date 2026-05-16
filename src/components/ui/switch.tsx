import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Binary Logic Gate Interface Node (Switch)
 * Hardened WAI-ARIA compliant boolean switch ensuring zero visual layout shift and absolute token symmetry.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-150 outline-none select-none antialiased transform-gpu focus:outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-20 disabled:pointer-events-none",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted/60",
      className,
    )}
    {...props}
  >
    {/* HUD LEVEL 1: ISOLATED KINETIC THUMB STATE VECTOR INDICATOR */}
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-xs transition-transform duration-150 ease-out transform-gpu shrink-0 p-0 m-0",
        "data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-[1px]",
      )}
    />
  </SwitchPrimitives.Root>
));

Switch.displayName = "Switch_Core_Binary_Gate_Node";

export { Switch };
