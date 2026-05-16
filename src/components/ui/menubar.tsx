import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative System Navigation Protocol Interface (Menubar)
 * Hardened high-density global layout bar managing macro command hubs and administrative action paths.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const MenubarMenu = MenubarPrimitive.Menu;
const MenubarGroup = MenubarPrimitive.Group;
const MenubarPortal = MenubarPrimitive.Portal;
const MenubarSub = MenubarPrimitive.Sub;
const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center gap-1 rounded-xl border border-border/40 bg-card/60 backdrop-blur-md p-1 shadow-xs select-none antialiased transform-gpu w-full",
      className,
    )}
    {...props}
  />
));
Menubar.displayName = "Menubar_Core_Root_Node";

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center rounded-lg px-3 h-8 text-xs font-bold text-foreground/80 outline-none transition-colors duration-150 transform-gpu leading-none pt-0.5",
      "data-[state=open]:bg-accent data-[state=open]:text-foreground focus:bg-accent focus:text-foreground",
      className,
    )}
    {...props}
  />
));
MenubarTrigger.displayName = "Menubar_Core_Trigger_Node";

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-xs font-bold text-foreground/80 outline-none transition-colors duration-150 transform-gpu gap-2 w-full text-left",
      "data-[state=open]:bg-accent data-[state=open]:text-foreground focus:bg-accent focus:text-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
MenubarSubTrigger.displayName = "Menubar_Sub_Trigger_Node";

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[9.5rem] overflow-hidden rounded-xl border border-border/40 bg-popover/95 backdrop-blur-md p-1 text-popover-foreground shadow-md animate-in fade-in duration-100 transform-gpu text-left",
      className,
    )}
    {...props}
  />
));
MenubarSubContent.displayName = "Menubar_Sub_Content_Node";

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = "start", alignOffset = -4, sideOffset = 6, ...props }, ref) => (
  <MenubarPrimitive.Portal>
    <MenubarPrimitive.Content
      ref={ref}
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[11.5rem] overflow-hidden rounded-xl border border-border/40 bg-popover/95 backdrop-blur-md p-1 text-popover-foreground shadow-md animate-in fade-in duration-100 transform-gpu text-left",
        className,
      )}
      {...props}
    />
  </MenubarPrimitive.Portal>
));
MenubarContent.displayName = "Menubar_Core_Content_Node";

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
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
MenubarItem.displayName = "Menubar_Core_Item_Node";

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
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
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4 stroke-[3px] text-primary" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    <span className="truncate block pt-0.5 w-full">{children}</span>
  </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = "Menubar_Checkbox_Item_Node";

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
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
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-primary text-primary stroke-[1.5]" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    <span className="truncate block pt-0.5 w-full">{children}</span>
  </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = "Menubar_Radio_Item_Node";

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2.5 py-1.5 font-mono text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
MenubarLabel.displayName = "Menubar_Label_Node";

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("h-px bg-border/10 my-1 w-full block shrink-0", className)}
    {...props}
  />
));
MenubarSeparator.displayName = "Menubar_Separator_Node";

const MenubarShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
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
MenubarShortcut.displayName = "Menubar_Shortcut_Node";

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
};
