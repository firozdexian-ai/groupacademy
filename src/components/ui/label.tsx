import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Metadata Text Association Protocol (Label)
 * Hardened WAI-ARIA compliant tracking label providing robust peer-disabled indicators and zero layout shifts.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const labelVariants = cva(
  "text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wide leading-none select-none text-muted-foreground/80 transition-colors duration-150 transform-gpu antialiased peer-disabled:cursor-not-allowed peer-disabled:opacity-20 peer-focus:text-primary pointer-events-none block text-left pt-0.5 pb-0.5",
  {
    variants: {
      variant: {
        default: "",
        destructive: "text-destructive/90 peer-focus:text-destructive",
        muted: "text-muted-foreground/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ variant }), className)} {...props} />
));

Label.displayName = "Label_Core_Metadata_Node";

export { Label, labelVariants };
