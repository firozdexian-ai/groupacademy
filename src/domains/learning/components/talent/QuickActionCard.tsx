import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, LucideIcon, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Tactical Ingress Node (QuickActionCard)
 * CTO Reference: High-velocity navigation artifact for core module transitions.
 * Version: Launch Candidate · Phase Z0 Hardened
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
  const queryClient = useQueryClient();

  // Monitor high-velocity card action impressions safely via analytical telemetry
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

  const handleActionNavigationTrigger = async () => {
    trackEvent("quick_action_card_executed", { actionLabel: label, targetPath: path });

    try {
      // Automated Efficiency: Synchronize cache indices globally to avoid state drift across shared loops
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      navigate(path);
    } catch (err) {
      trackError(err, {
        component: "QuickActionCard",
        action: "execute_action_navigation_callback",
        targetPath: path,
      });
    }
  };

  const formattedDisplayLabel = label.trim().replace(/ /g, "_");

  return (
    <Card
      onClick={handleActionNavigationTrigger}
      className={cn(
        "group relative cursor-pointer text-left rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring select-none sm:select-text w-full min-w-0 overflow-hidden transition-all duration-300 transform-gpu",
        "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
        className,
      )}
    >
      {/* GLOW LAYER: Intermediary interactive gradient backdrop mesh */}
      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none select-none" />

      <CardContent className="p-4 flex items-center justify-between gap-4 w-full min-w-0">
        {/* ICON LAYER: Category Mapped Shield */}
        <div className="h-12 h-12 w-12 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center shadow-inner shrink-0 select-none transition-all duration-500 transform group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-3 group-hover:shadow-md group-hover:shadow-primary/10">
          <Icon className="h-5 w-5 stroke-[2.2]" />
        </div>

        {/* TAXONOMY METADATA STACK CONTAINER */}
        <div className="flex-1 min-w-0 text-left flex flex-col justify-center leading-none">
          <p className="font-extrabold text-[10px] sm:text-[11px] tracking-wider uppercase italic text-foreground/90 group-hover:text-primary transition-colors truncate text-ellipsis pr-1 select-text selection:bg-primary/10">
            {formattedDisplayLabel}
          </p>

          {count !== undefined && count > 0 ? (
            <div className="flex items-center gap-1.5 mt-1.5 select-none leading-none tabular-nums">
              <div className="relative h-2 w-2 shrink-0">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </div>
              <p className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest italic pt-0.5">
                {count.toLocaleString()} Active Threads
              </p>
            </div>
          ) : description ? (
            <p className="text-[10px] font-bold text-muted-foreground/60 truncate text-ellipsis mt-1.5 leading-none uppercase tracking-tight italic select-text max-w-full">
              {description.trim()}
            </p>
          ) : (
            <div className="flex items-center gap-1 mt-1.5 opacity-20 select-none text-muted-foreground leading-none">
              <Zap className="h-3 w-3 fill-primary/10 text-primary stroke-[2.2] shrink-0" />
              <span className="text-[8px] font-black uppercase tracking-wider">Protocol Active</span>
            </div>
          )}
        </div>

        {/* AFFORDANCE NODE: Navigational Direction Glyph */}
        <div className="h-8 w-8 rounded-xl bg-muted/20 border border-border/10 flex items-center justify-center shrink-0 select-none group-hover:bg-primary/10 transition-colors duration-300">
          <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all stroke-[2.5]" />
        </div>
      </CardContent>
    </Card>
  );
}
