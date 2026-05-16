import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Identity Verification Handshake Terminal (InputOTP)
 * Hardened multi-factor authorization input grid providing isolated field contexts and full slot matrix dereferencing insulation.
 * Version: Launch Candidate · Phase Z0 Lifecycle & Index Safeguards Hardened
 */
const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-30 has-[:disabled]:pointer-events-none select-none", 
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed pointer-events-auto", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP_Core_Root_Node";

const InputOTPGroup = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("flex items-center gap-1.5 shrink-0 min-w-0 select-none", className)} 
      {...props} 
    />
  )
);
InputOTPGroup.displayName = "InputOTP_Core_Group_Node";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<typeof "div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  
  // Phase 1: Defensively isolate array references to protect execution chains against index bounds gaps
  const extractedSlotContextData = inputOTPContext?.slots?.[index];
  
  if (!extractedSlotContextData) {
    return (
      <div 
        ref={ref} 
        className={cn("h-10 w-9 rounded-lg border border-border/20 bg-muted/10 shrink-0", className)} 
        {...props} 
      />
    );
  }

  const { char, hasFakeCaret, isActive } = extractedSlotContextData;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-11 w-9 items-center justify-center border border-border/60 bg-background/50 rounded-lg font-mono text-sm font-extrabold text-foreground/90 transition-all duration-150 transform-gpu antialiased select-text cursor-text shadow-inner leading-none pt-0.5",
        isActive && "z-10 border-primary ring-1 ring-ring shadow-xs",
        char && "border-primary/40 bg-primary/[0.01]",
        className
      )}
      {...props}
    >
      <span className={cn("transition-transform duration-150 inline-block text-center leading-none", isActive && "text-primary")}>
        {char}
      </span>
      
      {/* HUD LEVEL 1: ISOLATED KEYBOARD FOCUS VECTOR CARET LOOP */}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none" aria-hidden="true">
          <div className="animate-caret-blink h-4 w-0.5 rounded-full bg-primary duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTP_Core_Slot_Node";

const InputOTPSeparator = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      role="separator" 
      aria-hidden="true"
      className={cn("px-1 shrink-0 select-none pointer-events-none text-muted-foreground/30 flex items-center justify-center", className)} 
      {...props}
    >
      <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
    </div>
  )
);
InputOTPSeparator.displayName = "InputOTP_Core_Separator_Node";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };