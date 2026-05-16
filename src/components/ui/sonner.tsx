import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { cn } from "@/lib/utils";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * GroUp Academy: Technical Event Disclosure Notification Protocol Interface (Toaster)
 * Hardened toast layer optimizing multi-toast overlay stacks and protecting description fields from layout distortions.
 * Version: Launch Candidate · Phase Z0 Lifecycle & Stack Bounds Locked
 */
const Toaster = ({ className, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={cn("toaster group block antialiased select-none font-sans pointer-events-auto", className)}
      toastOptions={{
        classNames: {
          toast: cn(
            "group toast w-full flex items-start gap-3 rounded-xl border border-border/40 bg-popover/95 text-popover-foreground backdrop-blur-md p-4 shadow-md text-left leading-none transform-gpu",
            "data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-30",
          ),
          title: "text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide block leading-none pt-0.5",
          description:
            "text-[11px] font-mono font-medium leading-normal text-muted-foreground/60 block pt-1 select-text selection:bg-primary/10",
          actionButton: cn(
            "h-8 px-3 rounded-lg font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shrink-0 cursor-pointer pt-0.5",
          ),
          cancelButton: cn(
            "h-8 px-3 rounded-lg font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-accent border border-border/40 bg-background/50 transition-colors shrink-0 cursor-pointer pt-0.5",
          ),
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
