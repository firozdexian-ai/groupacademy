import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Brain,
  Sparkles,
  Coins,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Zap,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ProcessingCard, type ProcessingStage } from "@/components/ui/processing-card";
import { analyzeJobMarket, scoreJobMatch } from "@/domains/jobs/api/jobsApi";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { recordToolRun } from "@/hooks/useToolRuns";
import { WhyYouMatchPanel } from "./WhyYouMatchPanel";

/**
 * GroUp Academy: Career Intelligence Hub
 * CTO Reference: Authoritative node for neural mapping and market telemetry.
 * Version: Launch Candidate · Phase Z0 Hardened
 */

const MATCH_STAGES: ProcessingStage[] = [
  { progress: 15, message: "Reading your profile" },
  { progress: 45, message: "Comparing your skills" },
  { progress: 75, message: "Evaluating your fit" },
  { progress: 95, message: "Finalizing analysis" },
];

const MARKET_STAGES: ProcessingStage[] = [
  { progress: 15, message: "Checking market data" },
  { progress: 45, message: "Measuring competition" },
  { progress: 75, message: "Comparing salaries" },
  { progress: 95, message: "Finalizing insights" },
];

interface AIJobInsightsProps {
  jobId: string;
  talentId: string;
}

export function AIJobInsights({ jobId, talentId }: AIJobInsightsProps) {
  const queryClient = useQueryClient();
  const { canAfford, deductCredits } = useCredits();

  const [matchResult, setMatchResult] = useState<any | null>(null);
  const [marketInsight, setMarketInsight] = useState<any | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

  // Monitor career intelligence module impressions via analytical telemetry
  useEffect(() => {
    if (jobId && talentId) {
      trackEvent("ai_job_insights_node_mounted", { jobId, talentId });
    }
  }, [jobId, talentId]);

  if (!jobId || !talentId) {
    trackError("AIJobInsights mounted without valid parametric asset bindings.", {
      component: "AIJobInsights",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const executeMatchSync = async () => {
    if (!canAfford("JOB_MATCH_SCORE")) {
      toast.error("You need 10 credits to analyze your match. Top up to continue.");
      return;
    }

    setLoadingMatch(true);
    trackEvent("ai_job_insights_match_sync_initiated", { jobId, talentId });

    try {
      const transactionSuccess = await deductCredits("JOB_MATCH_SCORE", jobId, "Job match analysis");
      if (!transactionSuccess) throw new Error("Couldn't reserve credits.");

      // Direct edge routing pass executing predictive competency profiling
      const data = await scoreJobMatch({ jobId, talentId });
      if (!data) throw new Error("We couldn't analyze this job right now. Please try again.");

      setMatchResult(data);
      setMatchOpen(true);

      // Commit system run logs dynamically for validation auditing records
      await recordToolRun({ toolKey: "score", costCredits: 10, jobId, payload: { score: data?.match_score } });

      // Automated Efficiency: Synchronize wallet caches instantly across vertical layouts
      queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
      queryClient.invalidateQueries({ queryKey: ["talent-stats", talentId] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      toast.success("Match analysis ready");
      trackEvent("ai_job_insights_match_sync_success", { jobId, matchScore: data?.overall_match });
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedExceptionMsg, {
        component: "AIJobInsights",
        action: "execute_match_sync_pipeline",
        jobId,
        talentId,
      });

      toast.error(`Couldn't analyze match: ${parsedExceptionMsg}`);
    } finally {
      setLoadingMatch(false);
    }
  };

  const executeMarketTelemetry = async () => {
    if (!canAfford("JOB_MARKET_INSIGHT")) {
      toast.error("You need 15 credits to see market insights. Top up to continue.");
      return;
    }

    setLoadingMarket(true);
    trackEvent("ai_job_insights_market_telemetry_initiated", { jobId });

    try {
      const transactionSuccess = await deductCredits("JOB_MARKET_INSIGHT", jobId, "Market insights");
      if (!transactionSuccess) throw new Error("Couldn't reserve credits.");

      // Direct edge routing pass querying macro workforce aggregates
      const data = await analyzeJobMarket({ jobId });
      if (!data) throw new Error("We couldn't pull market insights right now. Please try again.");

      setMarketInsight(data);
      setMarketOpen(true);

      queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
      queryClient.invalidateQueries({ queryKey: ["talent-stats", talentId] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      toast.success("Market insights ready");
      trackEvent("ai_job_insights_market_telemetry_success", { jobId });
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedExceptionMsg, {
        component: "AIJobInsights",
        action: "execute_market_telemetry_pipeline",
        jobId,
        talentId,
      });

      toast.error(`Couldn't load market insights: ${parsedExceptionMsg}`);
    } finally {
      setLoadingMarket(false);
    }
  };

  const getIntensityColor = (scoreValue: number): string => {
    const rawNum = Number(scoreValue) || 0;
    if (rawNum >= 80) return "text-success dark:text-success";
    if (rawNum >= 60) return "text-warning dark:text-warning";
    return "text-destructive dark:text-destructive";
  };

  return (
    <Card className="rounded-3xl border border-accent/20 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 relative overflow-hidden select-none w-full max-w-full">
      <CardContent className="p-4 sm:p-5 w-full min-w-0">
        {/* HUD: SECTION IDENTITY HEADER */}
        <div className="flex items-center gap-3.5 mb-5 select-none border-b border-border/10 pb-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center shrink-0 shadow-sm">
            <Brain className="h-5 w-5 text-accent animate-pulse stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1 text-left flex flex-col justify-center">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wide">
              AI Job Insights
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mt-0.5 leading-none">
              Match analysis and market data
            </p>
          </div>
        </div>

        <div className="space-y-3.5 w-full min-w-0">
          {/* COMPONENT MODULE A: IDENTITY ALIGNMENT NODE MATCH */}
          <Collapsible
            open={matchOpen}
            onOpenChange={(v) => {
              if (matchResult) {
                setMatchOpen(v);
                trackEvent("ai_job_insights_match_panel_toggled", { openState: v, jobId });
              }
            }}
          >
            {!matchResult ? (
              loadingMatch ? (
                <div className="w-full animate-in zoom-in-98 duration-200">
                  <ProcessingCard title="Analyzing your fit" stages={MATCH_STAGES} duration={12000} />
                </div>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  disabled={loadingMatch || loadingMarket}
                  className="w-full h-12 rounded-xl justify-between px-4 border border-border/40 hover:border-accent/30 bg-background/40 hover:bg-background/80 cursor-pointer transition-all active:scale-[0.99] group shadow-sm text-left gap-4"
                  onClick={executeMatchSync}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Sparkles className="h-4 w-4 text-accent group-hover:scale-110 transition-transform shrink-0 stroke-[2.2]" />
                    <span className="font-bold uppercase text-xs tracking-wide text-foreground/90 truncate">
                      Analyze My Fit
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="gap-1.5 bg-warning/10 dark:bg-warning/5 text-warning dark:text-warning border border-warning/20 px-2.5 h-6.5 rounded-lg text-xs font-bold shrink-0 tabular-nums shadow-inner"
                  >
                    <Coins className="h-3 w-3 fill-current stroke-[2.2]" />
                    <span>10 cr</span>
                  </Badge>
                </Button>
              )
            ) : (
              <div className="w-full border border-accent/20 bg-accent/[0.01] rounded-2xl p-2.5">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="w-full h-12 rounded-xl justify-between px-3 hover:bg-accent/5 transition-colors cursor-pointer text-left gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <ShieldCheck className="h-5 w-5 text-accent shrink-0 stroke-[2.2]" />
                      <div className="min-w-0 flex-1 flex flex-col justify-center leading-none">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none mb-0.5">
                          Overall Match
                        </span>
                        <span
                          className={cn(
                            "text-sm sm:text-base font-extrabold tracking-tight tabular-nums",
                            getIntensityColor(matchResult.overall_match),
                          )}
                        >
                          {matchResult.overall_match}% Match
                        </span>
                      </div>
                    </div>
                    {matchOpen ? (
                      <ChevronUp className="h-4 w-4 text-accent shrink-0 stroke-[2.5]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-accent shrink-0 stroke-[2.5]" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-3.5 space-y-4 px-1 pb-1.5 animate-in slide-in-from-top-2 duration-300 text-left w-full min-w-0 overflow-hidden transform-gpu">
                  {/* SKILL_PARITY_HUD Data Tracker */}
                  <div className="space-y-1.5 w-full min-w-0">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider select-none leading-none pl-0.5">
                      <p className="text-muted-foreground/80">Skills Match</p>
                      <span className="text-accent bg-accent/5 px-2 py-0.5 border border-accent/10 rounded-md tabular-nums font-extrabold">
                        {matchResult.skills_match?.percentage || 0}%
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1 w-full max-w-full">
                      {matchResult.skills_match?.matched?.map((skill: string, i: number) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="gap-1.5 bg-success/5 border-success/20 text-success dark:text-success text-[10px] font-bold py-0.5 px-2 rounded-md tracking-tight uppercase shadow-sm"
                        >
                          <CheckCircle className="h-3 w-3 shrink-0 stroke-[2.5]" />
                          <span className="truncate max-w-[110px]">{skill}</span>
                        </Badge>
                      ))}
                      {matchResult.skills_match?.missing?.map((skill: string, i: number) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="gap-1.5 bg-destructive/5 border-destructive/20 text-destructive dark:text-destructive text-[10px] font-bold py-0.5 px-2 rounded-md tracking-tight uppercase shadow-sm"
                        >
                          <XCircle className="h-3 w-3 shrink-0 stroke-[2.5]" />
                          <span className="truncate max-w-[110px]">{skill}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full tabular-nums text-left select-none">
                    <div className="p-3 rounded-xl border border-border/40 bg-card/40 shadow-inner flex flex-col justify-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 leading-none">
                        Experience Fit
                      </p>
                      <p
                        className={cn(
                          "text-base sm:text-lg font-extrabold tracking-tight italic leading-none pt-0.5",
                          getIntensityColor(matchResult.experience_fit),
                        )}
                      >
                        {matchResult.experience_fit || 0}%
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-border/40 bg-card/40 shadow-inner flex flex-col justify-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 leading-none">
                        Education Fit
                      </p>
                      <p
                        className={cn(
                          "text-base sm:text-lg font-extrabold tracking-tight italic leading-none pt-0.5",
                          getIntensityColor(matchResult.education_fit),
                        )}
                      >
                        {matchResult.education_fit || 0}%
                      </p>
                    </div>
                  </div>

                  {matchResult.verified_match && <WhyYouMatchPanel verifiedMatch={matchResult.verified_match} />}

                  <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 relative overflow-hidden select-text shadow-sm">
                    <Zap className="absolute top-2 right-2 h-3.5 w-3.5 text-primary opacity-20 pointer-events-none select-none stroke-[2.2]" />
                    <p className="text-xs font-semibold leading-relaxed italic text-foreground/80 break-words pl-0.5 pr-3">
                      &ldquo;{matchResult.recommendation}&rdquo;
                    </p>
                  </div>
                </CollapsibleContent>
              </div>
            )}
          </Collapsible>

          {/* COMPONENT MODULE B: WORKFORCE TELEMETRY NODE DATA */}
          <Collapsible
            open={marketOpen}
            onOpenChange={(v) => {
              if (marketInsight) {
                setMarketOpen(v);
                trackEvent("ai_job_insights_market_panel_toggled", { openState: v, jobId });
              }
            }}
          >
            {!marketInsight ? (
              loadingMarket ? (
                <div className="w-full animate-in zoom-in-98 duration-200">
                  <ProcessingCard title="Pulling market insights" stages={MARKET_STAGES} duration={12000} />
                </div>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  disabled={loadingMatch || loadingMarket}
                  className="w-full h-12 rounded-xl justify-between px-4 border border-border/40 hover:border-primary/30 bg-background/40 hover:bg-background/80 cursor-pointer transition-all active:scale-[0.99] group shadow-sm text-left gap-4"
                  onClick={executeMarketTelemetry}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform shrink-0 stroke-[2.2]" />
                    <span className="font-bold uppercase text-xs tracking-wide text-foreground/90 truncate">
                      See Market Insights
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="gap-1.5 bg-warning/10 dark:bg-warning/5 text-warning dark:text-warning border border-warning/20 px-2.5 h-6.5 rounded-lg text-xs font-bold shrink-0 tabular-nums shadow-inner"
                  >
                    <Coins className="h-3 w-3 fill-current stroke-[2.2]" />
                    <span>15 cr</span>
                  </Badge>
                </Button>
              )
            ) : (
              <div className="w-full border border-primary/20 bg-primary/[0.01] rounded-2xl p-2.5">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="w-full h-12 rounded-xl justify-between px-3 hover:bg-primary/5 transition-colors cursor-pointer text-left gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <TrendingUp className="h-5 w-5 text-primary shrink-0 stroke-[2.2]" />
                      <div className="min-w-0 flex-1 flex flex-col justify-center leading-none">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none mb-0.5">
                          Market Competition
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-primary dark:text-primary">
                          {marketInsight.competition_level || "Standard"}
                        </span>
                      </div>
                    </div>
                    {marketOpen ? (
                      <ChevronUp className="h-4 w-4 text-primary shrink-0 stroke-[2.5]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-primary shrink-0 stroke-[2.5]" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-3.5 space-y-4 px-1 pb-1.5 animate-in slide-in-from-top-2 duration-300 text-left w-full min-w-0 overflow-hidden transform-gpu">
                  <div className="grid grid-cols-2 gap-3 w-full tabular-nums text-left select-none">
                    {[
                      {
                        label: "Estimated applicants",
                        val: marketInsight.applicant_count_estimate || "10-25 candidates",
                      },
                      {
                        label: "Hiring timeline",
                        val: marketInsight.hiring_timeline_estimate || "2-3 weeks average",
                      },
                      {
                        label: "Similar roles",
                        val:
                          marketInsight.similar_jobs_count != null
                            ? `${marketInsight.similar_jobs_count} options active`
                            : "4 open positions",
                      },
                      { label: "Competition level", val: marketInsight.competition_level || "Moderate" },
                    ].map((metricItem, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-border/40 bg-card/40 shadow-inner flex flex-col justify-center min-w-0"
                      >
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1 leading-none truncate block">
                          {metricItem.label}
                        </p>
                        <p className="font-extrabold text-xs sm:text-sm text-foreground/90 tracking-tight uppercase truncate">
                          {metricItem.val}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Fiscal Compensation Range Indicators Analysis */}
                  <div className="p-4 rounded-xl border border-success/20 bg-success/5 select-text text-left shadow-sm">
                    <span className="text-[9px] font-bold text-success dark:text-success uppercase tracking-wider block mb-1 select-none pl-0.5">
                      Salary Insights
                    </span>
                    <p className="text-xs font-extrabold text-foreground/90 tracking-tight tabular-nums pl-0.5 leading-tight">
                      {marketInsight.salary_insight?.market_range || "In line with industry average."}
                    </p>
                    {marketInsight.salary_insight?.posted_salary_assessment && (
                      <p className="text-[11px] font-medium leading-relaxed text-muted-foreground/90 italic pl-0.5 mt-1.5 break-words">
                        {marketInsight.salary_insight.posted_salary_assessment}
                      </p>
                    )}
                  </div>

                  {/* Operational Success Tips List Segment Track */}
                  <div className="space-y-2 w-full min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 pl-0.5 select-none leading-none">
                      Tips to stand out
                    </p>
                    <ul className="space-y-2 w-full min-w-0 select-text">
                      {marketInsight.success_tips?.map((tipStringItem: string, index: number) => {
                        if (!tipStringItem) return null;
                        return (
                          <li
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/10 shadow-sm w-full min-w-0 animate-in slide-in-from-left-2 duration-150"
                          >
                            <Zap className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5 fill-warning/5 stroke-[2.2]" />
                            <span className="text-xs font-semibold leading-relaxed text-muted-foreground/90 break-words flex-1">
                              {tipStringItem.trim()}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </CollapsibleContent>
              </div>
            )}
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
