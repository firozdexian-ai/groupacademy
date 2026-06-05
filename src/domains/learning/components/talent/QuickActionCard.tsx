import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, LucideIcon, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Tactical Ingress Node (QuickActionCard)
 * High-velocity navigation card for core application module transitions.
 */

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  path: string;
  description?: string;
  className?: string;
}

export function QuickActionCard({ icon: Icon, label, count, path, description, className }: QuickActionCardProps) {
  const navigate = useNavigate();

  // Monitor high-velocity action card views via telemetry pathways
  useEffect(() => {
    if (label && path) {
      trackEvent("quick_action_card_rendered", {
        actionLabel: label,
        destinationPath: path,
        hasActiveThreads: count !== undefined && count > 0,
      });
    }
  }, [label, path, count]);

  if (!label || !path || !Icon) {
    trackError("QuickActionCard mounted without authoritative structural models.", {
      component: "QuickActionCard",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const handleActionNavigationTrigger = () => {
    trackEvent("quick_action_card_executed", { actionLabel: label, targetPath: path });

    // Navigate cleanly without introducing structural query overhead or rendering stutters
    navigate(path);
  };

  const cleanDisplayLabel = label.trim();

  return (
    <Card
      onClick={handleActionNavigationTrigger}
      className={cn(
        "group relative cursor-pointer text-left rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring select-none sm:select-text w-full min-w-0 overflow-hidden transition-all duration-300 transform-gpu",
        "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
        className,
      )}
    >
      {/* Interactive gradient spotlight element */}
      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none select-none" />

      <CardContent className="p-4 flex items-center justify-between gap-4 w-full min-w-0">
        {/* Category Mapped Graphic Icon Shield */}
        <div className="h-12 w-12 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center shadow-inner shrink-0 select-none transition-all duration-500 transform group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-3 group-hover:shadow-md group-hover:shadow-primary/10">
          <Icon className="h-5 w-5 stroke-[2.2]" />
        </div>

        {/* Metadata Stack Layout Area */}
        <div className="flex-1 min-w-0 text-left flex flex-col justify-center leading-none">
          <p className="font-bold text-xs sm:text-sm text-foreground/90 tracking-tight group-hover:text-primary transition-colors truncate text-ellipsis pr-1 select-text selection:bg-primary/10">
            {cleanDisplayLabel}
          </p>

          {count !== undefined && count > 0 ? (
            <div className="flex items-center gap-1.5 mt-1.5 select-none leading-none tabular-nums">
              <div className="relative h-2 w-2 shrink-0">
                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </div>
              <p className="text-[10px] font-semibold text-success dark:text-success tracking-wide pt-0.5">
                {count.toLocaleString()} Tasks Open
              </p>
            </div>
          ) : description ? (
            <p className="text-[11px] font-medium text-muted-foreground/70 truncate text-ellipsis mt-1 leading-none select-text max-w-full">
              {description.trim()}
            </p>
          ) : (
            <div className="flex items-center gap-1 mt-1 opacity-30 select-none text-muted-foreground leading-none">
              <Zap className="h-3 w-3 fill-primary/10 text-primary stroke-[2.2] shrink-0" />
              <span className="text-[9px] font-bold tracking-wide">Available</span>
            </div>
          )}
        </div>

        {/* Navigation Affordance Chevron Element */}
        <div className="h-8 w-8 rounded-xl bg-muted/20 border border-border/10 flex items-center justify-center shrink-0 select-none group-hover:bg-primary/10 transition-colors duration-300">
          <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all stroke-[2.5]" />
        </div>
      </CardContent>
    </Card>
  );
}
