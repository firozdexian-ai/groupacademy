import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Binary State Intercept Protocol (Toggle)
 * Hardened WAI-ARIA compliant binary toggle instrument protecting inline data layouts from layout shifting and border distortions.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const toggleVariants = cva(
  "inline-flex items-center justify-center transition-colors duration-150 outline-none select-none antialiased transform-gpu focus:outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-20 disabled:pointer-events-none cursor-pointer font-bold leading-none pt-0.5 shrink-0 block",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-foreground/80 hover:bg-accent hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
        outline:
          "border border-border/60 bg-background/50 text-foreground/80 hover:bg-accent hover:text-foreground focus-visible:bg-accent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary shadow-2xs",
      },
      size: {
        default: "h-9 px-3 rounded-lg text-xs sm:text-sm",
        sm: "h-8 px-2.5 rounded-md text-xs gap-2",
        lg: "h-10 px-4 rounded-xl text-sm gap-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));

Toggle.displayName = "Toggle_Core_Intercept_Node";

export { Toggle, toggleVariants };
