import * as React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPublicWebinarBySlug } from "@/domains/learning/repo/learningRepo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Sparkles, ArrowRight, Coins, Inbox } from "lucide-react";
import { formatEventTime, formatEventLocal, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { getCourseCredits } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Dynamic Webinar Ingress Pipeline Hub (WebinarLanding)
 * Hardened marketing entry node tracking incoming affiliate links and insulating local time translations from hydration drift.
 * Version: Launch Candidate · Phase Z0 Execution Stability Locked
 */
export default function WebinarLanding() {
  const { slug: unverifiedRouteSlugStr } = useParams<{ slug: string }>();
  const [browserSearchUrlParamsMap] = useSearchParams();
  const executeNavigationHook = useNavigate();

  // =========================================================================
  // LIFECYCLE SECTOR 1: AFFILIATE PARAMETER PERSISTENCE & STORAGE CORES
  // =========================================================================
  React.useEffect(() => {
    const rawAffiliateReferralCode = browserSearchUrlParamsMap.get("ref");
    if (!rawAffiliateReferralCode) return;

    try {
      localStorage.setItem("ga_referral", rawAffiliateReferralCode);
      if (unverifiedRouteSlugStr) {
        localStorage.setItem(`course_ref:${unverifiedRouteSlugStr}`, rawAffiliateReferralCode);
      }
    } catch (suppressedStorageException) {
      // Protects layout configurations if sandboxed or private browser layers lock localStorage
    }
  }, [browserSearchUrlParamsMap, unverifiedRouteSlugStr]);

  // =========================================================================
  // LIFECYCLE SECTOR 2: DATA ACQUISITION WIRE THROUGH TANSTACK ENGINE
  // =========================================================================
  const { data: verifiedWebinarDataRecord, isLoading: isPlatformCacheResolving } = useQuery({
    queryKey: ["public-webinar-instance", unverifiedRouteSlugStr],
    enabled: !!unverifiedRouteSlugStr,
    queryFn: async () => {
      if (!unverifiedRouteSlugStr) return null;

      const { data: extractedContentNode, error: contentHandshakeError } = await supabase
        .from("content")
        .select(
          "id, title, slug, description, content_type, cover_image_url, event_date, event_timezone, event_duration_minutes, max_capacity, current_enrollment, instructor_name, price",
        )
        .eq("slug", unverifiedRouteSlugStr)
        .eq("is_published", true)
        .maybeSingle();

      if (contentHandshakeError) throw contentHandshakeError;
      return extractedContentNode;
    },
  });

  // =========================================================================
  // LIFECYCLE SECTOR 3: TELEMETRY DISPATCH INSULATION INSIDE COMMITTED TRACKS
  // =========================================================================
  React.useEffect(() => {
    const activeTrackingReferralToken = browserSearchUrlParamsMap.get("ref");
    if (!activeTrackingReferralToken || !verifiedWebinarDataRecord?.id) return;

    const dispatchReferralTelemetrySignal = async () => {
      try {
        await supabase.rpc("track_course_referral_click", {
          p_content_id: verifiedWebinarDataRecord.id,
          p_ref_code: activeTrackingReferralToken,
        });
      } catch (suppressedException) {
        // Shield rendering passes from floating analytics breaks
      }
    };

    dispatchReferralTelemetrySignal();
  }, [browserSearchUrlParamsMap, verifiedWebinarDataRecord?.id]);

  // =========================================================================
  // ACTION HOOKS: USER INTERACTION SEGMENT ROUTERS
  // =========================================================================
  const handleJoinSequenceExecution = React.useCallback(async () => {
    try {
      const {
        data: { session: activeSessionInstance },
      } = await supabase.auth.getSession();
      const redirectionTargetRouteStr = `/app/learning/courses/${unverifiedRouteSlugStr}?promo=webinar`;

      if (activeSessionInstance) {
        executeNavigationHook(redirectionTargetRouteStr);
      } else {
        executeNavigationHook(`/auth?redirect=${encodeURIComponent(redirectionTargetRouteStr)}`);
      }
    } catch (criticalAuthLookupException) {
      executeNavigationHook("/auth");
    }
  }, [unverifiedRouteSlugStr, executeNavigationHook]);

  // =========================================================================
  // RENDERING FLAGS: COMPONENT RENDERING GATES
  // =========================================================================
  if (isPlatformCacheResolving) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 space-y-4 text-left antialiased block w-full">
        <Skeleton className="h-44 w-full rounded-xl shrink-0" />
        <Skeleton className="h-6 w-3/4 rounded-xs shrink-0" />
        <div className="space-y-2 block w-full">
          <Skeleton className="h-3.5 w-full rounded-xs shrink-0" />
          <Skeleton className="h-3.5 w-full rounded-xs shrink-0" />
          <Skeleton className="h-3.5 w-2/3 rounded-xs shrink-0" />
        </div>
      </div>
    );
  }

  if (!verifiedWebinarDataRecord) {
    return (
      <div
        role="alert"
        className="min-h-[60vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu"
      >
        <div className="max-w-xs block space-y-4 leading-none">
          <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/50 mx-auto pointer-events-none">
            <Inbox className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div className="space-y-1 block">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Event Not Resolved</p>
            <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal">
              The targeted presentation portal or live webinar node configuration could not be loaded down safely.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => executeNavigationHook("/")}
            className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            Return to Core Hub
          </Button>
        </div>
      </div>
    );
  }

  const computedPlatformCreditsPrice = getCourseCredits(Number(verifiedWebinarDataRecord.price ?? 0));
  const availableRemainingSeatCapacityCount = verifiedWebinarDataRecord.max_capacity
    ? verifiedWebinarDataRecord.max_capacity - (verifiedWebinarDataRecord.current_enrollment || 0)
    : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-8 pb-24 space-y-4 sm:space-y-5 text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: BRANDED MEDIA DISPLAY CAP CLIPS */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden block relative aspect-video select-none pointer-events-none shrink-0 w-full shadow-2xs">
        {verifiedWebinarDataRecord.cover_image_url ? (
          <img
            src={verifiedWebinarDataRecord.cover_image_url}
            alt={`Promotional illustration display card for ${verifiedWebinarDataRecord.title}`}
            className="w-full h-full object-cover block"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/10 via-emerald-500/5 to-background flex items-center justify-center block">
            <Sparkles className="h-12 w-12 text-primary/30 stroke-[1.8]" />
          </div>
        )}
      </div>

      {/* HUD LEVEL 2: SPECIFICATION METADATA SEGMENTS */}
      <div className="space-y-1.5 block leading-none w-full">
        <Badge className="font-mono text-[9px] font-extrabold uppercase tracking-wide rounded px-1.5 h-5 pt-0.5 pointer-events-none select-none bg-primary text-primary-foreground shrink-0">
          LIVE KNOWLEDGE WEBINAR
        </Badge>

        <h1 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wide text-foreground leading-tight select-text block pt-1">
          {verifiedWebinarDataRecord.title}
        </h1>
        {verifiedWebinarDataRecord.instructor_name && (
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground/60 leading-none select-text block pt-0.5">
            Hosted by Specialist Instructor: {verifiedWebinarDataRecord.instructor_name}
          </p>
        )}
      </div>

      {/* HUD LEVEL 3: TIMING LOGS SPECIFICATIONS CARD */}
      <Card className="rounded-xl border border-border/60 bg-card/30 shadow-none block w-full overflow-hidden">
        <CardContent className="p-4 space-y-3.5 text-xs sm:text-sm font-semibold leading-none text-foreground/80 w-full block">
          {/* Calendar Sync Tracks */}
          <div className="flex items-start gap-3 w-full leading-none">
            <Calendar className="h-4 w-4 text-primary stroke-[2.2] shrink-0 select-none pointer-events-none pt-0.5" />
            <div className="leading-none flex-1 min-w-0 space-y-1 block">
              <p className="font-bold text-foreground block select-text">
                {formatEventTime(
                  verifiedWebinarDataRecord.event_date,
                  verifiedWebinarDataRecord.event_timezone || DEFAULT_EVENT_TZ,
                )}
              </p>
              <p className="text-[11px] text-muted-foreground/50 block select-text font-mono font-medium lowercase tracking-tight">
                {/* Guaranteed to synchronize formatting values without throwing runtime timezone drift faults */}
                Local Conversion Profile: {formatEventLocal(verifiedWebinarDataRecord.event_date)}
              </p>
            </div>
          </div>

          {/* Time Duration Struts */}
          {verifiedWebinarDataRecord.event_duration_minutes ? (
            <div className="flex items-center gap-3 w-full select-none pointer-events-none block">
              <Clock className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
              <span className="pt-0.5 block font-mono font-bold uppercase text-[11px] sm:text-xs tracking-wide">
                Session Length Time Allocation: {verifiedWebinarDataRecord.event_duration_minutes} Minutes
              </span>
            </div>
          ) : null}

          {/* Capacity Threshold Counter Rails */}
          {availableRemainingSeatCapacityCount !== null && (
            <div className="flex items-center gap-3 w-full select-none pointer-events-none block border-t border-border/5 pt-3">
              <Users className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
              <span
                className={cn(
                  "pt-0.5 block text-xs font-bold uppercase tracking-wide",
                  availableRemainingSeatCapacityCount <= 10 && availableRemainingSeatCapacityCount > 0
                    ? "text-destructive"
                    : "text-muted-foreground/70",
                )}
              >
                {availableRemainingSeatCapacityCount > 0
                  ? `Registry Slots Remaining: ${availableRemainingSeatCapacityCount.toLocaleString()} Open Seats`
                  : "Registry Capacity Sealed: Admission Sold Out"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HUD LEVEL 4: ABSTRACT DESCRIPTION SECTION OVERVIEWS */}
      {verifiedWebinarDataRecord.description && (
        <Card className="rounded-xl border border-border/60 bg-card/20 shadow-none block w-full overflow-hidden">
          <CardContent className="p-4 text-xs sm:text-sm font-medium text-foreground/80 leading-relaxed select-text block w-full whitespace-pre-line">
            <h2 className="text-[10px] font-mono font-extrabold uppercase tracking-wide text-muted-foreground/40 select-none pointer-events-none block leading-none pb-2 border-b border-border/5 mb-2.5">
              Instructional Syllabus Focus Outline
            </h2>
            {verifiedWebinarDataRecord.description}
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 5: COMPLIANCE INGRESS INCENTIVE CONTEXT FOOT CTA */}
      <Card className="rounded-xl border border-border/60 bg-linear-to-r from-card via-card/40 to-background shadow-none block w-full overflow-hidden">
        <CardContent className="p-4 space-y-4 w-full block text-left leading-none">
          <div className="flex items-center gap-2 select-none pointer-events-none leading-none">
            <Coins className="h-4 w-4 text-emerald-600 stroke-[2.2]" />
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground pt-0.5">
              Complimentary Pipeline Credit Integration Allocation
            </p>
          </div>

          <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-normal block select-text">
            Finalize onboarding setup steps to dispatch a baseline system credit reward structure mapping{" "}
            <span className="font-mono font-extrabold text-foreground bg-muted border border-border/40 px-1 py-0.5 rounded-sm tabular-nums">
              250 PLATFORM CREDITS
            </span>{" "}
            directly into your active profile wallet. This session burns{" "}
            <span className="font-mono font-bold text-foreground tabular-nums">
              {computedPlatformCreditsPrice} credits
            </span>
            , preserving a net residual balance of{" "}
            <span className="font-mono font-bold text-foreground tabular-nums">
              {Math.max(0, 250 - computedPlatformCreditsPrice)} credits
            </span>{" "}
            to inject cleanly toward advanced automated AI mock validation scenarios, salary assessment models, or code
            reviews.
          </p>

          <Button
            type="button"
            size="lg"
            onClick={handleJoinSequenceExecution}
            disabled={availableRemainingSeatCapacityCount !== null && availableRemainingSeatCapacityCount <= 0}
            className="w-full h-10 px-5 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors shadow-xs transform-gpu active:scale-[0.985] block select-none"
          >
            <span>Sign Up & Reserve Admission Coordinates</span>
            <ArrowRight className="h-4 w-4 stroke-[2.5]" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
