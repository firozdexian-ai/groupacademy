import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Technical Command Disclosure Interface Panel (DropdownMenu)
 * Hardened responsive popover terminal handling localized navigation lookups and context theme variables.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-xs font-bold text-foreground/80 outline-none transition-colors duration-150 transform-gpu gap-2 w-full text-left",
      "data-[state=open]:bg-accent data-[state=open]:text-foreground focus:bg-accent focus:text-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    <span className="truncate block flex-1 pt-0.5">{children}</span>
    <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 stroke-[2.5] shrink-0" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenu_Sub_Trigger_Node";

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[9.5rem] overflow-hidden rounded-xl border border-border/40 bg-popover/95 backdrop-blur-md p-1 text-popover-foreground shadow-md animate-in fade-in duration-100 transform-gpu text-left",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = "DropdownMenu_Sub_Content_Node";

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[11.5rem] overflow-hidden rounded-xl border border-border/40 bg-popover/95 backdrop-blur-md p-1 text-popover-foreground shadow-md animate-in fade-in duration-100 transform-gpu text-left",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenu_Core_Content_Node";

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-xs font-bold text-foreground/80 outline-none transition-colors duration-150 transform-gpu w-full gap-2",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-30",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenu_Core_Item_Node";

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2.5 text-xs font-bold text-foreground/80 outline-none transition-colors duration-150 transform-gpu w-full gap-2",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-30",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center select-none pointer-events-none">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 stroke-[3px] text-primary" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    <span className="truncate block pt-0.5 w-full">{children}</span>
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenu_Checkbox_Item_Node";

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
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
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-primary text-primary stroke-[1.5]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    <span className="truncate block pt-0.5 w-full">{children}</span>
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenu_Radio_Item_Node";

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2.5 py-1.5 font-mono text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenu_Label_Node";

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("h-px bg-border/10 my-1 w-full block shrink-0", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenu_Separator_Node";

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <kbd
      className={cn(
        "ml-auto h-4 min-w-[16px] inline-flex items-center justify-center select-none rounded border border-border/40 bg-muted/40 px-1 font-mono text-[9px] font-extrabold tracking-normal text-muted-foreground/50 leading-none shadow-xs pointer-events-none pt-0.5",
        className,
      )}
      {...props}
    >
      {props.children}
    </kbd>
  );
};
DropdownMenuShortcut.displayName = "DropdownMenu_Shortcut_Node";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
