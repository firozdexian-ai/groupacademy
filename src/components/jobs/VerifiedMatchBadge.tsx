import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface VerifiedCredential {
  topic_tag: string;
  level: string;
  verify_code?: string;
}

interface VerifiedMatchBadgeProps {
  credentials?: VerifiedCredential[];
  masteryScore?: number;
  className?: string;
  compact?: boolean;
}

/**
 * GroUp Academy: Validation Tracking Node (VerifiedMatchBadge)
 * CTO Reference: Authoritative micro-badge component visualizing candidate skill verifications.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function VerifiedMatchBadge({
  credentials = [],
  masteryScore = 0,
  className,
  compact = false,
}: VerifiedMatchBadgeProps) {
  const hasCredentials = Array.isArray(credentials) && credentials.length > 0;
  const hasMastery = typeof masteryScore === "number" && masteryScore >= 60;

  // Intercept empty credential properties to prevent visual rendering leakage
  if (!hasCredentials && !hasMastery) return null;

  const labelsTextStringValue = hasCredentials
    ? `${credentials.length} verified skill${credentials.length > 1 ? "s" : ""}`
    : `${Math.round(masteryScore)}% verified mastery`;

  const handleTooltipVisibilityToggle = (isExpanded: boolean) => {
    if (isExpanded) {
      trackEvent("verified_match_badge_tooltip_expanded", {
        skillsCount: credentials?.length || 0,
        masteryScoreValue: masteryScore,
        isCompactMode: compact,
      });
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip onOpenChange={handleTooltipVisibilityToggle}>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 select-none transform-gpu shadow-sm h-5.5 rounded-md tabular-nums font-extrabold uppercase",
              compact ? "text-[9px] px-2 tracking-wide" : "text-[10px] px-2.5 tracking-tight normal-case",
              className,
            )}
          >
            <ShieldCheck
              className={cn("shrink-0 stroke-[2.5] text-emerald-500", compact ? "h-3 w-3" : "h-3.5 w-3.5")}
            />
            <span>{compact ? "Verified" : labelsTextStringValue}</span>
          </Badge>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          align="center"
          sideOffset={6}
          className="max-w-xs bg-popover/95 backdrop-blur-md text-popover-foreground border border-border/40 rounded-xl p-3 shadow-xl select-none animate-in fade-in duration-150 z-50 text-left"
          style={{ contentVisibility: "auto" }}
        >
          <div className="space-y-1.5 text-xs font-bold text-foreground/90 tracking-tight">
            <div className="flex items-center gap-1.5 select-none text-[11px] uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3.5 w-3.5 text-primary stroke-[2.5]" />
              <span>Verified Skill Match Track</span>
            </div>

            {hasCredentials ? (
              <ul className="space-y-1 pl-0.5 font-medium text-muted-foreground/90 leading-tight">
                {credentials.slice(0, 5).map((credentialItem, index) => {
                  if (!credentialItem || !credentialItem.topic_tag) return null;

                  // 1. Unique Key Ingestion Resolved: Prevent matching list identity crashes via concatenated keys
                  const calculatedRowKey = `${credentialItem.topic_tag}_${credentialItem.level || "tier"}_${index}`;

                  return (
                    <li key={calculatedRowKey} className="truncate break-all">
                      &bull; <span className="font-bold text-foreground/80">{credentialItem.topic_tag}</span>{" "}
                      <span className="text-[10px] font-mono opacity-70 tracking-tight font-semibold uppercase">
                        ({credentialItem.level})
                      </span>
                    </li>
                  );
                })}
                {credentials.length > 5 && (
                  <li className="text-[10px] font-semibold italic text-muted-foreground/60 select-none pt-0.5">
                    + {credentials.length - 5} more skill nodes verified
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-xs font-semibold font-mono text-muted-foreground/90 pl-0.5 leading-none">
                Mastery Score: <span className="text-primary font-bold">{Math.round(masteryScore)}</span> / 100 maximum
                bounds
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
