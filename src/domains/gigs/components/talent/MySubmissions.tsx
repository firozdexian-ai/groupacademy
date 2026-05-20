import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { trackError, trackEvent } from "@/lib/errorTracking";
import {
  Coins,
  Clock,
  MousePointerClick,
  Copy,
  Check,
  Link2,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Mission Audit Ledger (MySubmissions)
 * CTO Reference: Authoritative node for tracking gig completion and viral reach tracking logs.
 * Version: Launch Candidate · Phase Z0 Hardened
 */

const STATUS_CONFIG = {
  pending: {
    label: "Pending Verification",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  approved: {
    label: "Approved Settlement",
    icon: ShieldCheck,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  rejected: {
    label: "Audit Rejection",
    icon: AlertCircle,
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
};

export function MySubmissions({ talentId }: { talentId?: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Monitor submission list mounts safely over event streams
  useEffect(() => {
    if (talentId) {
      trackEvent("my_submissions_panel_viewed", { talentId });
    }
  }, [talentId]);

  if (!talentId) {
    trackError("MySubmissions panel mounted without a valid talent identity context reference.", {
      component: "MySubmissions",
      action: "null_pointer_assertion",
    });
    return null;
  }

  // 1. REGISTRY_SYNC: Fetch comprehensive historical task submissions (staleTime 3 min configuration)
  const {
    data: submissions = [],
    isLoading,
    error: subError,
  } = useQuery({
    queryKey: ["my-gig-submissions", talentId],
    enabled: !!talentId,
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gig_submissions")
        .select(
          "id, created_at, status, submission_data, ai_score, ai_feedback, admin_notes, credits_awarded, gigs(title, credit_reward, category)",
        )
        .eq("talent_id", talentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // 2. Referral Parameters Synchronization Query Node
  const { data: talentRefCode } = useQuery({
    queryKey: ["talent-ref-code", talentId],
    enabled: !!talentId,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase.from("talents").select("ref_code").eq("id", talentId).single();

      if (error) throw error;
      return data?.ref_code;
    },
  });

  // TELEMETRY Matrix: Extract job codes safely to execute atomic batch count aggregation
  const jobShareIds =
    submissions
      ?.filter((s) => s?.gigs?.category === "job_sharing")
      .map((s) => (s.submission_data as any)?.job_id)
      .filter(Boolean) || [];

  // 3. Consolidated Real-Time Click Attribution Tracking Engine (Single-pass replacement for N+1 loops)
  const { data: clickCounts = {} } = useQuery({
    queryKey: ["share-click-counts", talentId, jobShareIds.join(",")],
    enabled: jobShareIds.length > 0 && !!talentId,
    refetchInterval: 30000, // Sync loop intervals preserved safely
    queryFn: async () => {
      const countsAccumulator: Record<string, number> = {};

      try {
        // Fetch raw metrics in a single pass using relational .in() matching criteria
        const { data: bulkClicks, error: clickError } = await supabase
          .from("job_share_clicks")
          .select("job_id")
          .eq("talent_id", talentId)
          .in("job_id", jobShareIds);

        if (clickError) throw clickError;

        (bulkClicks || []).forEach((row: any) => {
          if (row?.job_id) {
            countsAccumulator[row.job_id] = (countsAccumulator[row.job_id] || 0) + 1;
          }
        });

        return countsAccumulator;
      } catch (loopErr) {
        trackError(loopErr, {
          component: "MySubmissions",
          action: "aggregate_consolidated_clicks_api",
          talentId,
        });
        return {};
      }
    },
  });

  // Intercept data pipeline anomalies cleanly via central telemetry monitors
  useEffect(() => {
    if (subError) {
      trackError(subError, {
        component: "MySubmissions",
        action: "fetch_gig_submissions_registry",
        talentId,
      });
    }
  }, [subError, talentId]);

  // Global window environment helper guard
  const buildRefPathSafe = (id: string): string => {
    if (!id) return "";
    const originScope =
      typeof window !== "undefined" && window.location?.origin ? window.location.origin : "https://groupacademy.app";
    return `${originScope}/jobs/${id}?ref=${talentRefCode || talentId}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3 select-none w-full">
        {[1, 2, 3].map((skeletonIndex) => (
          <Skeleton key={skeletonIndex} className="h-20 w-full rounded-2xl opacity-60" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-border/40 bg-card/40 backdrop-blur-md rounded-2xl select-none p-4 w-full">
        <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-3 animate-pulse" />
        <p className="text-xs font-bold text-muted-foreground leading-normal tracking-tight max-w-xs mx-auto">
          No task submission logs mapped to your ledger. Select an active gig update above to ignite tracking rows.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 antialiased select-none sm:select-text w-full">
      {submissions.map((sub: any) => {
        if (!sub || !sub.id) return null;

        const config = STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
        const StatusIcon = config.icon;
        const isJobSharing = sub.gigs?.category === "job_sharing";
        const jobId = (sub.submission_data as any)?.job_id;
        const clicks = isJobSharing && jobId ? Number(clickCounts[jobId] || 0) : null;

        const CLICK_THRESHOLD = 10;
        const aiScore = sub.ai_score != null ? Number(sub.ai_score) : null;

        const renderedTimestamp = sub.created_at ? format(new Date(sub.created_at), "MMM dd, yyyy") : "Recently";

        return (
          <div
            key={sub.id}
            className="bg-card/60 border border-border/40 backdrop-blur-md rounded-2xl px-4 py-3.5 transition-all duration-300 shadow-sm relative overflow-hidden group w-full min-w-0 text-left"
          >
            <div className="flex items-start justify-between gap-3.5 w-full min-w-0">
              <div className="min-w-0 flex-1 space-y-0.5">
                {/* Meta Header Information Row */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wide select-none truncate max-w-full leading-none">
                  <span className="text-primary truncate max-w-[60%]">{sub.gigs?.title}</span>
                  <span className="opacity-40">&bull;</span>
                  <span className="font-medium tracking-normal text-muted-foreground/60">{renderedTimestamp}</span>
                </div>

                {/* Dynamic Title Resolution Header Element */}
                <h4 className="font-bold text-xs sm:text-sm text-foreground/90 tracking-tight leading-tight truncate pr-1 select-all break-all">
                  {(sub.submission_data as any)?.job_title ||
                    (sub.submission_data as any)?.parsed_job?.title ||
                    (sub.submission_data as any)?.title ||
                    "Ecosystem Task Submission"}
                </h4>

                {/* Automated AI Feedback Ribbon */}
                {sub.ai_feedback && (
                  <div className="p-2 border border-primary/10 bg-primary/[0.01] rounded-xl select-text mt-2">
                    <p className="text-[11px] font-medium leading-relaxed text-muted-foreground/90 italic line-clamp-3">
                      &ldquo;{sub.ai_feedback}&rdquo;
                      {aiScore !== null && (
                        <span className="ml-1.5 not-italic text-[10px] font-extrabold tracking-wide uppercase bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded-full text-primary tabular-nums">
                          Synapse: {aiScore}/10 Score
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Badge Configuration Elements */}
              <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-extrabold uppercase tracking-wide px-2.5 h-5.5 gap-1 border rounded-md shadow-sm select-none shrink-0",
                    config.className,
                  )}
                >
                  <StatusIcon className="h-3 w-3 stroke-[2.5]" />
                  <span>{config.label}</span>
                </Badge>
                {sub.status === "approved" && sub.credits_awarded > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 text-xs font-extrabold tabular-nums bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 rounded-full shadow-sm animate-in fade-in duration-300">
                    <Coins className="h-3 w-3 fill-emerald-500/10 stroke-[2.2]" />
                    <span>+{Number(sub.credits_awarded).toLocaleString()} cr</span>
                  </span>
                )}
              </div>
            </div>

            {/* Viral Reach Multiplier Metrics Widget Wrapper Block */}
            {isJobSharing && sub.status === "pending" && clicks !== null && (
              <div className="mt-4 space-y-2 bg-primary/5 rounded-2xl p-3.5 border border-primary/15 dark:border-primary/10 select-none w-full animate-in zoom-in-98 duration-200">
                <div className="flex items-center justify-between text-[10px] font-bold text-foreground/90 uppercase tracking-wide">
                  <span className="flex items-center gap-1.5 text-primary">
                    <MousePointerClick className="h-3 w-3 stroke-[2.5]" />
                    <span>Viral reach progression</span>
                  </span>
                  <span className="tabular-nums tracking-wider bg-background/60 border px-2 py-0.5 rounded-md text-muted-foreground">
                    {clicks} / {CLICK_THRESHOLD} conversion clicks
                  </span>
                </div>

                <Progress
                  value={Math.min((clicks / CLICK_THRESHOLD) * 100, 100)}
                  className="h-1.5 rounded-full bg-muted shadow-inner"
                />

                <div className="flex items-center gap-2 w-full pt-1">
                  <div className="flex-1 flex items-center gap-2 bg-background/50 border border-border/40 rounded-xl px-2.5 py-1.5 min-w-0 shadow-inner">
                    <Link2 className="h-3.5 w-3.5 text-primary/40 shrink-0 stroke-[2.2]" />
                    <code className="text-[10px] font-mono truncate text-muted-foreground/80 select-all tracking-tight flex-1">
                      {buildRefPathSafe(jobId)}
                    </code>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    className="h-8 w-8 rounded-xl shrink-0 border border-border/60 hover:bg-accent active:scale-90 transition-transform cursor-pointer shadow-sm"
                    aria-label="Copy tracking path to clipboard"
                    onClick={() => {
                      const absoluteAttributionUrl = buildRefPathSafe(jobId);
                      navigator.clipboard.writeText(absoluteAttributionUrl);
                      setCopiedId(sub.id);
                      trackEvent("my_submissions_link_copied", { jobId });
                      toast.success("Affiliate referral link pinned to clipboard");
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                  >
                    {copiedId === sub.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[2.5] animate-in zoom-in-95 duration-200" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground/80 stroke-[2.2]" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Human Verification Rejection Context Notes Block */}
            {sub.admin_notes && !sub.ai_feedback && (
              <div className="mt-3 flex gap-2.5 p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl text-left shadow-inner animate-in slide-in-from-top-2 duration-300 select-text">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 stroke-[2.2]" />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-600 block leading-none">
                    Audit rejection remarks
                  </span>
                  <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 leading-relaxed mt-0.5 break-words">
                    {sub.admin_notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
