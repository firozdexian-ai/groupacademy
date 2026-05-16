import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Decision Matrix Selection Node (RadioGroup)
 * Hardened mutually exclusive selection group protecting inline data layouts from layout shifting and border distortions.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn("grid gap-2.5 antialiased select-none text-left transform-gpu", className)}
      {...props}
    />
  );
});
RadioGroup.displayName = "RadioGroup_Core_Root_Node";

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "peer aspect-square h-4 w-4 rounded-full border border-border/60 bg-background/50 text-primary transition-colors duration-150 outline-none focus:outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-20 disabled:pointer-events-none data-[state=checked]:border-primary shrink-0 flex items-center justify-center p-0 m-0",
        className,
      )}
      {...props}
    >
      {/* HUD LEVEL 1: ACCESSIBLE ACTIVE SELECTION STATE DOT RING INDICATOR */}
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center animate-in zoom-in-75 fade-in duration-100 select-none pointer-events-none leading-none shrink-0">
        <Circle className="h-2 w-2 fill-primary text-primary stroke-none shrink-0" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = "RadioGroup_Core_Item_Node";

export { RadioGroup, RadioGroupItem };
