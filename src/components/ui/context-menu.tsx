import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Technical Quick-Action Context Interface HUD (ContextMenu)
 * Hardened responsive popover terminal handling localized macro-action lookups and context sync layers.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const ContextMenu = ContextMenuPrimitive.Root;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuGroup = ContextMenuPrimitive.Group;
const ContextMenuPortal = ContextMenuPrimitive.Portal;
const ContextMenuSub = ContextMenuPrimitive.Sub;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center rounded-lg px-2.5 py-2 text-xs font-bold text-foreground/80 outline-none transition-colors duration-150 transform-gpu gap-2 w-full text-left",
      "data-[state=open]:bg-accent data-[state=open]:text-foreground focus:bg-accent focus:text-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    <span className="truncate block flex-1 pt-0.5">{children}</span>
    <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 stroke-[2.5] shrink-0" />
  </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = "ContextMenu_Sub_Trigger_Node";

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[9.5rem] overflow-hidden rounded-xl border border-border/40 bg-popover/95 backdrop-blur-md p-1 text-popover-foreground shadow-md animate-in fade-in duration-100 transform-gpu text-left",
      className,
    )}
    {...props}
  />
));
ContextMenuSubContent.displayName = "ContextMenu_Sub_Content_Node";

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 min-w-[11.5rem] overflow-hidden rounded-xl border border-border/40 bg-popover/95 backdrop-blur-md p-1 text-popover-foreground shadow-md animate-in fade-in duration-100 transform-gpu text-left",
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = "ContextMenu_Core_Content_Node";

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-2 text-xs font-bold text-foreground/80 outline-none transition-colors duration-150 transform-gpu w-full gap-2",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-30",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
ContextMenuItem.displayName = "ContextMenu_Core_Item_Node";

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2.5 text-xs font-bold text-foreground/80 outline-none transition-colors duration-150 transform-gpu w-full gap-2",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-30",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center select-none pointer-events-none">
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 stroke-[3px] text-primary" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    <span className="truncate block pt-0.5 w-full">{children}</span>
  </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName = "ContextMenu_Checkbox_Item_Node";

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2.5 text-xs font-bold text-foreground/80 outline-none transition-colors duration-150 transform-gpu w-full gap-2",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-30",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center select-none pointer-events-none">
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-primary text-primary stroke-[1.5]" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    <span className="truncate block pt-0.5 w-full">{children}</span>
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = "ContextMenu_Radio_Item_Node";

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2.5 py-1.5 font-mono text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
ContextMenuLabel.displayName = "ContextMenu_Label_Node";

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("h-px bg-border/10 my-1 w-full block shrink-0", className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = "ContextMenu_Separator_Node";

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
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
ContextMenuShortcut.displayName = "ContextMenu_Shortcut_Node";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
