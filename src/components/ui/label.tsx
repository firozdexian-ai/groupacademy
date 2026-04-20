import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: Metadata Protocol
 * High-density labeling system for technical data acquisition nodes.
 * Built on Radix UI for robust accessible peer-association.
 */
const labelVariants = cva(
  "text-[10px] font-black uppercase tracking-[0.2em] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-30 transition-colors duration-200",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), "text-muted-foreground/80 peer-focus:text-primary", className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
