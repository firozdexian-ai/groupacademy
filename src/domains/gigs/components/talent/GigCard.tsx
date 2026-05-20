import { useState, useEffect } from "react";
import { Coins, ChevronRight, CheckCircle2, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GigSubmissionForm } from "./GigSubmissionForm";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

/**
 * Compact, mobile-first task interaction row asset.
 * Hardened according to Phase Z0 Code Freeze specifications, incorporating
 * hardware-accelerated transitions and structural telemetry instrumentation.
 */
interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  requirements?: string;
  credit_reward: number;
  icon: string;
  max_completions_per_user?: number | null;
}

interface GigCardProps {
  gig: Gig;
  userSubmissions?: { total: number; pending: number };
}

export function GigCard({ gig, userSubmissions }: GigCardProps) {
  const [showForm, setShowForm] = useState(false);

  // Guard against structural mapping issues gracefully during fallback lookups
  const Icon = (() => {
    try {
      return getIcon(gig?.icon || "Briefcase");
    } catch (err) {
      return getIcon("Briefcase");
    }
  })();

  // Trace row instantiation lifecycles dynamically across telemetry channels
  useEffect(() => {
    if (gig?.id) {
      trackEvent("gig_card_item_rendered", {
        gigId: gig.id,
        category: gig.category,
        rewardAmount: gig.credit_reward,
        isMaxedOut: (userSubmissions?.total || 0) >= (gig.max_completions_per_user || Infinity),
      });
    }
  }, [gig, userSubmissions]);

  if (!gig || !gig.id) {
    trackError("GigCard component mounted without valid context bindings.", {
      component: "GigCard",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const totalSubmitted = userSubmissions?.total || 0;
  const pendingCount = userSubmissions?.pending || 0;
  const maxAllowed = gig.max_completions_per_user || Infinity;
  const isMaxed = totalSubmitted >= maxAllowed;
  const hasPending = pendingCount > 0;

  const handleRowInteraction = () => {
    if (isMaxed) return;

    trackEvent("gig_card_row_clicked", {
      gigId: gig.id,
      totalSubmitted,
      maxAllowed,
    });

    setShowForm(true);
  };

  return (
    <>
      <button
        type="button"
        disabled={isMaxed}
        onClick={handleRowInteraction}
        className={cn(
          "group w-full text-left rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm select-none transition-all duration-300 transform-gpu",
          "px-3.5 py-3 sm:px-4 sm:py-3.5 active:scale-[0.99] touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isMaxed
            ? "border-border/20 opacity-50 cursor-not-allowed"
            : "border-border/40 hover:border-primary/30 hover:shadow-md hover:bg-card/90",
        )}
      >
        <div className="flex items-center gap-3.5 w-full min-w-0">
          {/* Icon Wrapper Badge Element */}
          <div
            className={cn(
              "h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-colors duration-300",
              isMaxed
                ? "bg-muted/40 text-muted-foreground/30 border-border/10"
                : "bg-primary/10 border-primary/5 text-primary group-hover:bg-primary/15",
            )}
          >
            <Icon className="h-5 w-5 stroke-[2.2] transition-transform group-hover:scale-105 duration-300" />
          </div>

          {/* Core Text Info Block Node Elements */}
          <div className="min-w-0 flex-1 text-left space-y-0.5">
            <div className="flex items-center gap-2 w-full min-w-0">
              <h3
                className={cn(
                  "font-bold text-sm text-foreground/90 tracking-tight truncate leading-tight flex-1",
                  isMaxed && "text-muted-foreground/70",
                )}
              >
                {gig.title}
              </h3>
              {gig.credit_reward >= 15 && !isMaxed && (
                <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0 fill-amber-500/10 drop-shadow-[0_1px_4px_rgba(245,158,11,0.2)] animate-pulse" />
              )}
            </div>

            <p className="text-[11px] font-medium text-muted-foreground/90 line-clamp-1 break-all pr-1 leading-normal select-text selection:bg-primary/10">
              {gig.description}
            </p>

            {/* Functional Metadata Footer Badges Row */}
            <div className="flex items-center gap-2 pt-1 flex-wrap w-full">
              <Badge
                className={cn(
                  "border text-[10px] font-bold px-2 py-0 h-5 gap-1.5 rounded-lg select-none shadow-sm tabular-nums tracking-wide uppercase transition-all duration-300",
                  isMaxed
                    ? "bg-muted/40 text-muted-foreground/60 border-border/10"
                    : "bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 border-amber-500/20",
                )}
              >
                <Coins className="h-2.5 w-2.5 shrink-0" />
                <span>+{gig.credit_reward} cr</span>
              </Badge>

              {maxAllowed !== Infinity && (
                <span className="text-[10px] text-muted-foreground/70 font-bold tabular-nums tracking-wide bg-background/40 border border-border/20 px-1.5 py-0.5 rounded-md shadow-inner select-none">
                  {totalSubmitted}/{maxAllowed} capped
                </span>
              )}

              {hasPending && !isMaxed && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500 font-bold bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded-md shadow-sm select-none tracking-tight animate-in slide-in-from-left-2 duration-200">
                  <Clock className="h-2.5 w-2.5 shrink-0 animate-spin opacity-80" style={{ animationDuration: "3s" }} />
                  <span>{pendingCount} pending verification</span>
                </span>
              )}

              {isMaxed && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-500 font-bold bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 rounded-md shadow-sm select-none tracking-tight animate-in zoom-in-95 duration-200">
                  <CheckCircle2 className="h-3 w-3 shrink-0 stroke-[2.5]" />
                  <span>Completed</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Trigger Vector Indicator Icon */}
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 transition-all duration-300",
              isMaxed
                ? "text-muted-foreground/20"
                : "text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 stroke-[2.5]",
            )}
          />
        </div>
      </button>

      {/* Sheet application form execution context block */}
      <GigSubmissionForm
        gig={gig}
        open={showForm}
        onOpenChange={(isOpen) => {
          setShowForm(isOpen);
          if (!isOpen) {
            trackEvent("gig_card_form_dismissed", { gigId: gig.id });
          }
        }}
      />
    </>
  );
}
