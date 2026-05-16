import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Tactile Mobile Bottom Sheet Enclosure Protocol (Drawer)
 * Hardened gesture-driven overlay container optimizing mobile layout boundaries and stabilizing tactile drag tracks.
 * Version: Launch Candidate · Phase Z0 Dynamic Calculation Hardened
 */
const Drawer = ({ shouldScaleBackground = true, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = "Drawer_Core_Platform_Node";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-background/40 backdrop-blur-md", className)}
    {...props}
  />
));
DrawerOverlay.displayName = "Drawer_Core_Overlay_Node";

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex h-auto flex-col rounded-t-xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-lg transform-gpu select-none text-left antialiased outline-none focus:outline-none",
        className,
      )}
      {...props}
    >
      {/* HUD LEVEL 1: STRUCTURAL GESTURE INDICATOR HINGE DRAG TRACK HANDLE */}
      <div
        className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted/40 shrink-0 pointer-events-none select-none"
        aria-hidden="true"
      />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "Drawer_Core_Content_Node";

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 sm:p-5 text-left select-none shrink-0 leading-none w-full", className)}
    {...props}
  />
);
DrawerHeader.displayName = "Drawer_Core_Header_Node";

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-auto flex flex-col gap-2 p-4 sm:p-5 select-none border-t border-border/10 pt-4 w-full shrink-0 font-bold text-xs",
      className,
    )}
    {...props}
  />
);
DrawerFooter.displayName = "Drawer_Core_Footer_Node";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none pt-0.5",
      className,
    )}
    {...props}
  />
));
DrawerTitle.displayName = "Drawer_Core_Title_Node";

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn(
      "text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-normal pt-1 block select-text",
      className,
    )}
    {...props}
  />
));
DrawerDescription.displayName = "Drawer_Core_Description_Node";

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
