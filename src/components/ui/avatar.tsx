import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Profile Identity Asset Terminal (Avatar)
 * Hardened accessible component providing high-fidelity graphic avatars with graceful network loading fallbacks.
 * Version: Launch Candidate · Phase Z0 Architectural Balance Lock
 */
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border/40 bg-muted/10 shadow-xs select-none transition-transform duration-300 hover:scale-[1.02] transform-gpu antialiased items-center justify-center",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar_Core_Root_Node";

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover select-none pointer-events-none block", className)}
    {...props}
  />
));
AvatarImage.displayName = "Avatar_Core_Image_Node";

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-background font-mono text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/60 select-none pointer-events-none leading-none shadow-inner antialiased border border-transparent selection:bg-transparent h-full w-full block pt-0.5",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = "Avatar_Core_Fallback_Node";

export { Avatar, AvatarImage, AvatarFallback };
