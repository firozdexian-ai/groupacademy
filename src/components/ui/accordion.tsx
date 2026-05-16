import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Analytical logging pass parameters integration hook helper
function trackEvent(eventNameStr: string, contextualMetaBlock?: Record<string, any>) {
  // Analytical logging pipeline integration point
}

/**
 * GroUp Academy: Accessible Disclosure Node Framework (Accordion)
 * Hardened WAI-ARIA compliant layout isolating expandable text matrices.
 * Version: Launch Candidate · Phase Z0 Geometric Stability Lock
 */
const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "border-b border-border/40 transition-all duration-300 rounded-xl px-4",
      "data-[state=open]:bg-primary/[0.015] data-[state=open]:border-border/60",
      className,
    )}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  telemetryId?: string;
}

const AccordionTrigger = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Trigger>, AccordionTriggerProps>(
  ({ className, children, telemetryId, onClick, ...props }, ref) => {
    const handleAccordionEngagementProtocol = (event: React.MouseEvent<HTMLButtonElement>) => {
      trackEvent("accordion_disclosure_toggled", {
        nodeId: telemetryId || "unspecified_accordion_node",
        timestamp: Date.now(),
      });
      if (onClick) onClick(event);
    };

    return (
      <AccordionPrimitive.Header className="flex w-full block">
        <AccordionPrimitive.Trigger
          ref={ref}
          onClick={handleAccordionEngagementProtocol}
          className={cn(
            "flex flex-1 items-center justify-between py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground/80 transition-all hover:text-primary outline-none focus-visible:text-primary group/trigger font-mono [&[data-state=open]>svg]:rotate-180 [&[data-state=open]]:text-primary cursor-pointer",
            className,
          )}
          {...props}
        >
          <span className="pt-0.5 block select-none text-left truncate pr-2 max-w-full">{children}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/40 stroke-[2.5] transition-transform duration-300 ease-in-out group-hover/trigger:text-primary/60" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
    );
  },
);
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-xs font-semibold leading-relaxed text-muted-foreground/80 transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down select-text"
    {...props}
  />
));
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
