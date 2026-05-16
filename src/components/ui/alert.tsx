import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Semantic Ingress Feedback Terminal Nodes (Alert)
 * Provides high-visibility information arrays for runtime states, system exceptions, and security blocks.
 * Version: Launch Candidate · Phase Z0 Architectural Spacing Lock
 */
const alertVariants = cva(
  "relative w-full rounded-xl border p-4 shadow-xs select-none sm:select-text text-left antialiased transition-colors duration-200 grid grid-cols-[auto_1fr] gap-3 items-start transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-background/50 backdrop-blur-md text-foreground border-border/40",
        destructive:
          "bg-destructive/[0.015] border-destructive/20 text-destructive dark:border-destructive/30 [&>svg]:text-destructive",
        warning:
          "bg-amber-500/[0.015] border-amber-500/15 text-amber-600 dark:text-amber-400 [&>svg]:text-amber-500 dark:[&>svg]:text-amber-400",
        success:
          "bg-emerald-500/[0.015] border-emerald-500/15 text-emerald-600 dark:text-emerald-400 [&>svg]:text-emerald-500 dark:[&>svg]:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, variant, icon, children, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
    {/* HUD CHANNEL INGRESS: Isolate graphic nodes cleanly away from layout block segments */}
    {icon && (
      <div className="h-4 w-4 shrink-0 flex items-center justify-center select-none pointer-events-none stroke-[2.2] mt-0.5">
        {icon}
      </div>
    )}
    <div className={cn("w-full min-w-0 space-y-1 flex flex-col justify-center", !icon && "col-span-2")}>{children}</div>
  </div>
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn(
        "text-[10px] font-mono font-extrabold uppercase tracking-wider text-foreground/90 block leading-none select-none",
        className,
      )}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-[11px] font-semibold text-muted-foreground/80 leading-normal block select-text pr-0.5",
        className,
      )}
      {...props}
    />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
