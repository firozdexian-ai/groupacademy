import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Sparkles, ChevronDown, ChevronUp, Zap, ShieldCheck, ArrowRight, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { formatEventTime, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { cn } from "@/lib/utils";

interface WelcomeBonusProps {
  onContinue: () => void;
}

/**
 * GroUp Academy: Wallet Balance Activation & Ingress Ledger Node (WelcomeBonus)
 * An authoritative onboarding step animating initial credit injections and pitching featured live milestones.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function WelcomeBonus({ onContinue }: WelcomeBonusProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [displayedCredits, setDisplayedCredits] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Monitor initial bonus balance overview expressions via telemetry logs
  useEffect(() => {
    trackEvent("onboarding_welcome_bonus_mounted");
  }, []);

  // 1. Ingress Pipeline: Query upcoming high-value synchronous classes within a 14-day window
  const { data: upcomingEvent, error: queryFetchError } = useQuery({
    queryKey: ["welcome-upcoming-event"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      return await getUpcomingPublishedEvent(14);
    },
  });

  // Handle pipeline error ingestion bounds cleanly across monitoring lanes
  useEffect(() => {
    if (queryFetchError) {
      trackError(queryFetchError, {
        component: "WelcomeBonus",
        action: "fetch_welcome_upcoming_event_query",
      });
    }
  }, [queryFetchError]);

  // 2. Hardened Ticker Execution Loop: Defensively clean intervals to block unmounted thread updates
  useEffect(() => {
    const targetWalletCreditsMax = 250;
    const macroAnimationDurationMs = 1500;
    const sequentialTickStepsCount = 40;

    const singleIncrementValue = targetWalletCreditsMax / sequentialTickStepsCount;
    const stepDurationTickMs = macroAnimationDurationMs / sequentialTickStepsCount;

    let currentAccumulatorValue = 0;

    const intervalId = setInterval(() => {
      currentAccumulatorValue += singleIncrementValue;

      if (currentAccumulatorValue >= targetWalletCreditsMax) {
        setDisplayedCredits(targetWalletCreditsMax);
        setAnimationComplete(true);
        trackEvent("onboarding_welcome_bonus_animation_complete");
        clearInterval(intervalId);
      } else {
        setDisplayedCredits(Math.floor(currentAccumulatorValue));
      }
    }, stepDurationTickMs);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const handleWalletExplanationToggle = () => {
    trackEvent("onboarding_welcome_bonus_explanation_toggled", { currentState: !showExplanation });
    setShowExplanation((prev) => !prev);
  };

  const handleFeaturedEventReservationClick = async (slugTargetStr: string) => {
    if (!slugTargetStr) return;

    const targetInstitutionalPathStr = `/app/learning/courses/${slugTargetStr}`;
    trackEvent("onboarding_welcome_bonus_event_reserved_clicked", { targetUrl: targetInstitutionalPathStr });

    try {
      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      navigate(targetInstitutionalPathStr);
    } catch (err) {
      trackError(err, {
        component: "WelcomeBonus",
        action: "execute_featured_event_navigation",
        targetUrl: targetInstitutionalPathStr,
      });
    }
  };

  const handleBuildProfileContinueClick = () => {
    trackEvent("onboarding_welcome_bonus_continue_clicked");
    onContinue();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 max-w-lg mx-auto w-full antialiased text-left select-none sm:select-text transform-gpu animate-in fade-in duration-500">
      {/* HUD ICON FRAMING CORE: WALLET INJECTION LAYER SHIELD */}
      <div className="relative mb-6 select-none">
        <div
          className={cn(
            "w-24 h-24 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center shadow-sm transition-transform duration-500 z-10 relative",
            animationComplete ? "scale-102 rotate-1" : "scale-100",
          )}
        >
          <Coins
            className={cn(
              "h-10 w-10 text-emerald-600 dark:text-emerald-400 transition-transform duration-500 stroke-[2.2]",
              animationComplete ? "scale-105" : "scale-100",
            )}
          />
        </div>

        {animationComplete && (
          <div className="absolute inset-0 pointer-events-none z-0 animate-in zoom-in-50 duration-300">
            <Sparkles className="h-5 w-5 text-emerald-500 absolute -top-4 -right-4 stroke-[2.2] animate-pulse" />
            <Zap className="h-4 w-4 text-amber-500 fill-amber-500/10 absolute -bottom-2 -left-4 stroke-[2.2] animate-bounce" />
            <div className="absolute -inset-6 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          </div>
        )}
      </div>

      {/* HUD HEADER TITLE CAPTION */}
      <div className="space-y-1.5 text-center select-none w-full leading-none mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/90 uppercase tracking-wide">
          Account Wallet Activated
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 leading-normal max-w-xs mx-auto">
          Baseline optimization token injection finalized. Review allocation maps ahead of entry pass.
        </p>
      </div>

      {/* NUMERIC COUNTER BALANCE CARD HUD */}
      <div className="w-full mb-6 select-none">
        <Card className="border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 relative overflow-hidden text-center shadow-sm w-full flex flex-col justify-center items-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="text-5xl sm:text-6xl font-black text-emerald-600 dark:text-emerald-400 mb-2 tracking-tighter tabular-nums italic leading-none block select-all selection:bg-emerald-500/10">
            {displayedCredits}
          </div>

          <div className="flex flex-col gap-1 w-full text-center leading-none">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-foreground/80 leading-none">
              Credits Committed to Ledger Index
            </p>
            <div className="flex items-center justify-center gap-1 text-muted-foreground/60 leading-none pt-0.5 font-bold text-[9px] uppercase tracking-wide font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5] shrink-0" />
              <span>Valued Balance Lock ~ $5.00 USD</span>
            </div>
          </div>
        </Card>
      </div>

      {/* DYNAMIC COLLAPSIBLE EXPLANATION SECTION AREA */}
      <button
        type="button"
        onClick={handleWalletExplanationToggle}
        className="group flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60 hover:text-primary transition-colors mb-6 outline-none focus-visible:ring-1 focus-visible:ring-ring p-1 rounded-md cursor-pointer leading-none shrink-0"
      >
        <span>Review Credit Consumption Framework</span>
        {showExplanation ? (
          <ChevronUp className="h-3.5 w-3.5 stroke-[2.5]" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
        )}
      </button>

      {showExplanation && (
        <div className="w-full bg-muted/20 border border-border/40 rounded-xl p-4 sm:p-5 mb-6 text-left animate-in slide-in-from-bottom-2 duration-200 shadow-inner">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/60 block pl-0.5 select-none leading-none mb-4">
            Calibration Debit Scale Mapping
          </span>
          <ul className="space-y-3 font-bold text-xs tracking-tight text-foreground/90 tabular-nums">
            {[
              { label: "Career Readiness Evaluation Audit", val: "50 Credits" },
              { label: "AI Cognitive Mock Simulation Interview", val: "50 Credits" },
              { label: "Salary Framework Analysis Insight", val: "50 Credits" },
              { label: "AI Tailored Cover Letter Application Pass", val: "25 Credits" },
            ].map((valuationItem, index) => (
              <li
                key={index}
                className="flex justify-between items-center border-b border-border/10 last:border-none pb-2.5 last:pb-0 w-full min-w-0 leading-none"
              >
                <span className="truncate text-ellipsis pr-2 font-semibold text-foreground/80">
                  {valuationItem.label}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md font-mono shadow-sm shrink-0 leading-none">
                  {valuationItem.val}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* RECRUITMENT INGRESS SUB-BLOCK: PROMOTIONAL EXCLUSIVE COMPONENT VIEW */}
      {animationComplete && upcomingEvent && (
        <div className="w-full mb-6 animate-in slide-in-from-bottom-2 duration-300 text-left">
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.03] to-emerald-500/[0.02] dark:from-primary/[0.01] dark:to-transparent p-4 flex items-start gap-3.5 w-full min-w-0 font-bold text-xs tracking-tight">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-inner select-none">
              <Calendar className="h-4.5 w-4.5 text-primary stroke-[2.2]" />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-center leading-none">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded shadow-sm w-fit select-none leading-none animate-pulse">
                🎁 Complementary Initial Session Token Mapped
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight leading-tight line-clamp-1 truncate select-text pr-1 w-full pt-0.5">
                {upcomingEvent.title}
              </h3>
              <p className="text-[11px] font-semibold text-muted-foreground/70 tracking-tight truncate tabular-nums select-none leading-none">
                {formatEventTime(upcomingEvent.event_date, upcomingEvent.event_timezone || DEFAULT_EVENT_TZ)}
              </p>

              <Button
                size="sm"
                variant="outline"
                type="button"
                className="h-8 text-xs font-bold uppercase tracking-wide rounded-xl w-full border border-border/60 hover:bg-accent transition-colors shrink-0 cursor-pointer shadow-sm gap-1 flex items-center select-none mt-1"
                onClick={() => handleFeaturedEventReservationClick(upcomingEvent.slug)}
              >
                <span>Claim Free Ingress Entry Pass</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION COMPLETION ACCESS SUBMIT BUTTON CONTROL BUTTON */}
      <Button
        size="lg"
        onClick={handleBuildProfileContinueClick}
        disabled={!animationComplete}
        type="button"
        className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 relative z-10 shrink-0"
      >
        {animationComplete ? (
          <>
            <span>Proceed to Profile Configuration</span>
            <ArrowRight className="h-4 w-4 shrink-0 stroke-[2.5]" />
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
            <span>Verifying Ledger Ingress Curves…</span>
          </div>
        )}
      </Button>
    </div>
  );
}
