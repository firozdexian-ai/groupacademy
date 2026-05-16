import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Registry Selector Navigation Hub (Select)
 * Hardened WAI-ARIA compliant combobox isolating multi-tier category maps and securing dynamic layout variables.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs sm:text-sm font-bold text-foreground/90 transition-colors duration-150 transform-gpu antialiased outline-none shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-20 disabled:pointer-events-none shrink-0 leading-none",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-muted-foreground/40 stroke-[2.5] transition-transform duration-150 shrink-0 data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "Select_Core_Trigger_Node";

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1 select-none pointer-events-none text-muted-foreground/40 shrink-0",
      className,
    )}
    {...props}
  >
    <ChevronUp className="h-3.5 w-3.5 stroke-[2.5]" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = "Select_Scroll_Up_Trigger_Node";

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1 select-none pointer-events-none text-muted-foreground/40 shrink-0",
      className,
    )}
    {...props}
  >
    <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = "Select_Scroll_Down_Trigger_Node";

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", sideOffset = 6, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[11.5rem] overflow-hidden rounded-xl border border-border/40 bg-popover/95 backdrop-blur-md p-1 text-popover-foreground shadow-md transform-gpu text-left antialiased select-none",
        "data-[state=open]:animate-in data-[state=open]:fade-in duration-100",
        position === "popper" && "md:max-h-64 lg:max-h-80 w-full min-w-[var(--radix-select-trigger-width)]",
        className,
      )}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-viewport-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "Select_Core_Content_Node";

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-2.5 py-1.5 font-mono text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground/50 block leading-none select-none",
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = "Select_Core_Label_Node";

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2.5 text-xs font-bold text-foreground/80 outline-none transition-colors duration-150 transform-gpu w-full gap-2",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-30",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center select-none pointer-events-none">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 stroke-[3px] text-primary" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>
      <span className="truncate block pt-0.5 w-full">{children}</span>
    </SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "Select_Core_Item_Node";

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("h-px bg-border/10 my-1 w-full block shrink-0", className)}
    {...props}
  />
));
SelectSeparator.displayName = "Select_Core_Separator_Node";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
