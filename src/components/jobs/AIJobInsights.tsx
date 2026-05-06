import { useState } from "react";
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
} from "lucide-react";
import { ProcessingCard, type ProcessingStage } from "@/components/ui/processing-card";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WhyYouMatchPanel } from "@/components/jobs/WhyYouMatchPanel";

/**
 * GroUp Academy: Career Intelligence Hub
 * CTO Reference: Authoritative node for neural mapping and market telemetry.
 */

const MATCH_STAGES: ProcessingStage[] = [
  { progress: 0, message: "INITIALIZING_IDENTITY_SYNC" },
  { progress: 25, message: "COMPARING_KNOWLEDGE_NODES" },
  { progress: 55, message: "EVALUATING_TRAJECTORY_FIT" },
  { progress: 80, message: "SYNTHESIZING_STRATEGY" },
];

const MARKET_STAGES: ProcessingStage[] = [
  { progress: 0, message: "POLLING_MARKET_REGISTRY" },
  { progress: 25, message: "CALCULATING_COMPETITIVE_DENSITY" },
  { progress: 55, message: "AUDITING_FISCAL_BENCHMARKS" },
  { progress: 80, message: "FINALIZING_TELEMETRY" },
];

interface AIJobInsightsProps {
  jobId: string;
  talentId: string;
}

export function AIJobInsights({ jobId, talentId }: AIJobInsightsProps) {
  const { canAfford, deductCredits } = useCredits();
  const [matchResult, setMatchResult] = useState<any | null>(null);
  const [marketInsight, setMarketInsight] = useState<any | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

  const executeMatchSync = async () => {
    if (!canAfford("JOB_MATCH_SCORE")) return toast.error("FISCAL_DEFICIT: 10_CR REQUIRED");

    setLoadingMatch(true);
    try {
      const success = await deductCredits("JOB_MATCH_SCORE", jobId, "Identity Sync Analysis");
      if (!success) throw new Error("TRANSACTION_FAULT");

      const { data, error } = await supabase.functions.invoke("score-job-match", {
        body: { jobId, talentId },
      });

      if (error) throw error;
      setMatchResult(data);
      setMatchOpen(true);
      toast.success("IDENTITY_MAPPING_COMPLETE");
    } catch (error) {
      toast.error("NEURAL_SYNC_FAULT");
    } finally {
      setLoadingMatch(false);
    }
  };

  const executeMarketTelemetry = async () => {
    if (!canAfford("JOB_MARKET_INSIGHT")) return toast.error("FISCAL_DEFICIT: 15_CR REQUIRED");

    setLoadingMarket(true);
    try {
      const success = await deductCredits("JOB_MARKET_INSIGHT", jobId, "Market Telemetry");
      if (!success) throw new Error("TRANSACTION_FAULT");

      const { data, error } = await supabase.functions.invoke("analyze-job-market", {
        body: { jobId },
      });

      if (error) throw error;
      setMarketInsight(data);
      setMarketOpen(true);
      toast.success("TELEMETRY_SYNC_COMPLETE");
    } catch (error) {
      toast.error("MACRO_SYNC_FAULT");
    } finally {
      setLoadingMarket(false);
    }
  };

  const getIntensityColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <Card className="rounded-[32px] border-2 border-purple-500/20 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
      <CardContent className="p-6">
        {/* HUD: HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg">
            <Brain className="h-6 w-6 text-purple-500 animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black uppercase italic tracking-tighter">Neural_Insights</h3>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
              Advanced_Trajectory_Intelligence
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* COMPONENT: IDENTITY_MATCH_NODE */}
          <Collapsible open={matchOpen} onOpenChange={setMatchOpen}>
            {!matchResult ? (
              loadingMatch ? (
                <ProcessingCard title="IDENTITY_SYNC" stages={MATCH_STAGES} duration={12000} />
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-16 rounded-[24px] justify-between px-6 border-2 transition-all active:scale-95 group"
                  onClick={executeMatchSync}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-purple-500 group-hover:scale-125 transition-transform" />
                    <span className="font-black uppercase italic text-xs tracking-widest">Map_Identity_Match</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="gap-2 bg-amber-500/10 text-amber-600 border-2 border-amber-500/20 px-3 h-8"
                  >
                    <Coins className="h-3.5 w-3.5 fill-current" /> 10_CR
                  </Badge>
                </Button>
              )
            ) : (
              <>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-16 rounded-[24px] justify-between px-6 border-2 border-purple-500/30 bg-purple-500/5"
                  >
                    <div className="flex items-center gap-4">
                      <ShieldCheck className="h-5 w-5 text-purple-500" />
                      <div className="text-left">
                        <span className="block text-[8px] font-black uppercase tracking-widest opacity-40">
                          Sync_Parity
                        </span>
                        <span
                          className={cn(
                            "text-xl font-black italic tracking-tighter",
                            getIntensityColor(matchResult.overall_match),
                          )}
                        >
                          {matchResult.overall_match}%_OVERALL
                        </span>
                      </div>
                    </div>
                    {matchOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-6 px-1 animate-in slide-in-from-top-2 duration-500 text-left">
                  {/* SKILL_PARITY_HUD */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest italic">Skill_Registry_Parity</p>
                      <span className="text-[10px] font-black text-purple-500">
                        {matchResult.skills_match.percentage}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {matchResult.skills_match.matched.map((skill: string, i: number) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="gap-2 bg-emerald-500/5 border-emerald-500/20 text-emerald-600 text-[10px] font-bold py-1 px-3"
                        >
                          <CheckCircle className="h-3 w-3" /> {skill.toUpperCase()}
                        </Badge>
                      ))}
                      {matchResult.skills_match.missing.map((skill: string, i: number) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="gap-2 bg-rose-500/5 border-rose-500/20 text-rose-500 text-[10px] font-bold py-1 px-3"
                        >
                          <XCircle className="h-3 w-3" /> {skill.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-muted/20 border-2 border-border/10">
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Exp_Vector_Fit</p>
                      <p className={cn("text-2xl font-black italic", getIntensityColor(matchResult.experience_fit))}>
                        {matchResult.experience_fit}%
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/20 border-2 border-border/10">
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Edu_Node_Parity</p>
                      <p className={cn("text-2xl font-black italic", getIntensityColor(matchResult.education_fit))}>
                        {matchResult.education_fit}%
                      </p>
                    </div>
                  </div>

                  {matchResult.verified_match && <WhyYouMatchPanel verifiedMatch={matchResult.verified_match} />}
                  <div className="p-5 rounded-3xl bg-primary/5 border-2 border-primary/20 relative overflow-hidden">
                    <Zap className="absolute top-2 right-2 h-4 w-4 text-primary opacity-20" />
                    <p className="text-xs font-medium leading-relaxed italic text-foreground/80">
                      "{matchResult.recommendation}"
                    </p>
                  </div>
                </CollapsibleContent>
              </>
            )}
          </Collapsible>

          {/* COMPONENT: MARKET_TELEMETRY_NODE */}
          <Collapsible open={marketOpen} onOpenChange={setMarketOpen}>
            {!marketInsight ? (
              loadingMarket ? (
                <ProcessingCard title="MARKET_POLL" stages={MARKET_STAGES} duration={12000} />
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-16 rounded-[24px] justify-between px-6 border-2 transition-all active:scale-95 group"
                  onClick={executeMarketTelemetry}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500 group-hover:scale-125 transition-transform" />
                    <span className="font-black uppercase italic text-xs tracking-widest">Gather_Market_Telemetry</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="gap-2 bg-amber-500/10 text-amber-600 border-2 border-amber-500/20 px-3 h-8"
                  >
                    <Coins className="h-3.5 w-3.5 fill-current" /> 15_CR
                  </Badge>
                </Button>
              )
            ) : (
              <>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-16 rounded-[24px] justify-between px-6 border-2 border-blue-500/30 bg-blue-500/5"
                  >
                    <div className="flex items-center gap-4">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <div className="text-left">
                        <span className="block text-[8px] font-black uppercase tracking-widest opacity-40">
                          Competitive_Data
                        </span>
                        <span className="text-xl font-black italic tracking-tighter uppercase">
                          {marketInsight.competition_level}
                        </span>
                      </div>
                    </div>
                    {marketOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-6 px-1 animate-in slide-in-from-top-2 duration-500 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Est_Applicants", val: marketInsight.applicant_count_estimate },
                      { label: "Hiring_Velocity", val: marketInsight.hiring_timeline_estimate },
                      { label: "Similar_Nodes", val: marketInsight.similar_jobs_count },
                      { label: "Market_Index", val: marketInsight.competition_level },
                    ].map((m, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-muted/20 border border-border/10 shadow-inner">
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">{m.label}</p>
                        <p className="font-black uppercase italic text-sm">{m.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 rounded-3xl bg-emerald-500/5 border-2 border-emerald-500/20">
                    <p className="text-[10px] font-black uppercase text-emerald-600 mb-2 italic">
                      Fiscal_Benchmark_Insight
                    </p>
                    <p className="text-sm font-bold italic mb-1">{marketInsight.salary_insight.market_range}</p>
                    <p className="text-[10px] font-medium text-muted-foreground/80 italic">
                      {marketInsight.salary_insight.posted_salary_assessment}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest italic ml-1">
                      Tactical_Success_Protocols
                    </p>
                    <ul className="space-y-3">
                      {marketInsight.success_tips.map((tip: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-4 p-4 rounded-2xl bg-muted/10 border border-border/5"
                        >
                          <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-xs font-medium italic text-muted-foreground">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CollapsibleContent>
              </>
            )}
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
