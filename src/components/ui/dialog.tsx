import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Modal Interaction Hub Primitives (Dialog)
 * Hardened WAI-ARIA compliant dialog matrix isolating modal focus trees and stabilizing baseline layout shifts.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/40 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = "Dialog_Core_Overlay_Node";

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/40 bg-card/95 backdrop-blur-xl p-5 sm:p-6 shadow-xl transform-gpu select-none sm:select-text duration-200 text-left antialiased data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-xl",
        className,
      )}
      {...props}
    >
      {children}

      {/* HUD LEVEL 1: ISOLATED MODAL SUSPENSION TERMINATION CONTROL SWITCH */}
      <DialogPrimitive.Close className="absolute right-3.5 top-3.5 h-7 w-7 rounded-lg bg-muted/30 border border-border/5 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <X className="h-4 w-4 stroke-[2.5]" />
        <span className="sr-only">Terminate active modal engagement panel node</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "Dialog_Core_Content_Node";

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-left select-none shrink-0 leading-none w-full", className)}
    {...props}
  />
);
DialogHeader.displayName = "Dialog_Core_Header_Node";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-2 mt-5 select-none border-t border-border/10 pt-4 w-full shrink-0 items-center font-bold text-xs",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "Dialog_Core_Footer_Node";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none", className)}
    {...props}
  />
));
DialogTitle.displayName = "Dialog_Core_Title_Node";

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-normal pt-1 block select-text",
      className,
    )}
    {...props}
  />
));
DialogDescription.displayName = "Dialog_Core_Description_Node";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
