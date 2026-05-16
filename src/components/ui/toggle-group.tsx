import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  size: "default",
  variant: "default",
});

/**
 * GroUp Academy: Authoritative Toggle Selection Segment Protocol (ToggleGroup)
 * Hardened WAI-ARIA compliant layout button row ensuring zero visual layout shifts during option selections.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted/40 p-1 select-none pointer-events-auto transform-gpu gap-1 shrink-0 block",
      className,
    )}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));
ToggleGroup.displayName = "ToggleGroup_Core_Root_Node";

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "rounded-md px-3 h-7 text-xs font-bold text-muted-foreground/70 outline-none transition-colors duration-150 transform-gpu cursor-pointer select-none leading-none pt-0.5 border border-transparent shadow-none",
        "focus:outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring",
        "data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:border-border/10 data-[state=on]:font-extrabold shadow-2xs",
        "hover:text-foreground hover:bg-background/30",
        "disabled:pointer-events-none disabled:opacity-20",
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});
ToggleGroupItem.displayName = "ToggleGroup_Core_Item_Node";

export { ToggleGroup, ToggleGroupItem };
