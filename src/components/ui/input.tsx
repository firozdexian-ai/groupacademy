import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Technical Data Acquisition Node (Input)
 * Hardened atomic form field ensuring zero Cumulative Layout Shift (CLS) and seamless global token symmetry.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs sm:text-sm font-bold text-foreground/90 transition-colors duration-150 transform-gpu antialiased select-text placeholder:text-muted-foreground/40 placeholder:font-normal placeholder:not-italic shadow-inner outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-20 disabled:pointer-events-none shrink-0 leading-none",
          "file:border-0 file:bg-transparent file:text-[9px] file:font-mono file:font-extrabold file:uppercase file:tracking-wide file:text-primary file:cursor-pointer file:mr-2",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input_Core_Acquisition_Node";

export { Input };
