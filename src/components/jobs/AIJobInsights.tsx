import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, Sparkles, Coins, ChevronDown, ChevronUp, CheckCircle, XCircle, TrendingUp, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MatchResult {
  overall_match: number;
  skills_match: {
    matched: string[];
    missing: string[];
    percentage: number;
  };
  experience_fit: number;
  education_fit: number;
  recommendation: string;
  tips_to_improve: string[];
}

interface MarketInsight {
  applicant_count_estimate: string;
  competition_level: string;
  salary_insight: {
    market_range: string;
    posted_salary_assessment: string;
  };
  company_reputation: string;
  similar_jobs_count: number;
  hiring_timeline_estimate: string;
  success_tips: string[];
}

interface AIJobInsightsProps {
  jobId: string;
  talentId: string;
}

export function AIJobInsights({ jobId, talentId }: AIJobInsightsProps) {
  const { canAfford, deductCredits } = useCredits();
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [marketInsight, setMarketInsight] = useState<MarketInsight | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

  const handleGetMatch = async () => {
    if (!canAfford("JOB_MATCH_SCORE")) {
      toast.error("Insufficient credits. You need 10 credits for this feature.");
      return;
    }

    setLoadingMatch(true);
    try {
      // Deduct credits first
      const success = await deductCredits("JOB_MATCH_SCORE", jobId, "Job Match Analysis");
      if (!success) {
        toast.error("Failed to deduct credits");
        return;
      }

      const { data, error } = await supabase.functions.invoke("score-job-match", {
        body: { jobId, talentId },
      });

      if (error) throw error;
      setMatchResult(data);
      setMatchOpen(true);
    } catch (error) {
      console.error("Error getting match score:", error);
      toast.error("Failed to analyze match. Please try again.");
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleGetMarketInsight = async () => {
    if (!canAfford("JOB_MARKET_INSIGHT")) {
      toast.error("Insufficient credits. You need 15 credits for this feature.");
      return;
    }

    setLoadingMarket(true);
    try {
      // Deduct credits first
      const success = await deductCredits("JOB_MARKET_INSIGHT", jobId, "Job Market Insight");
      if (!success) {
        toast.error("Failed to deduct credits");
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-job-market", {
        body: { jobId },
      });

      if (error) throw error;
      setMarketInsight(data);
      setMarketOpen(true);
    } catch (error) {
      console.error("Error getting market insight:", error);
      toast.error("Failed to analyze market. Please try again.");
    } finally {
      setLoadingMarket(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-500";
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Insights</h3>
            <p className="text-xs text-muted-foreground">Premium career intelligence</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Match Score Feature */}
          <Collapsible open={matchOpen} onOpenChange={setMatchOpen}>
            {!matchResult ? (
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3 px-4"
                onClick={handleGetMatch}
                disabled={loadingMatch}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Show Match Details</span>
                </div>
                {loadingMatch ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Coins className="h-3 w-3 text-amber-500" />
                    10 credits
                  </Badge>
                )}
              </Button>
            ) : (
              <>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-auto py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Match Score</span>
                      <span className={cn("font-bold", getMatchColor(matchResult.overall_match))}>
                        {matchResult.overall_match}%
                      </span>
                    </div>
                    {matchOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-4 px-1">
                  {/* Skills Match */}
                  <div>
                    <p className="text-sm font-medium mb-2">Skills Match ({matchResult.skills_match.percentage}%)</p>
                    <div className="space-y-2">
                      {matchResult.skills_match.matched.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {matchResult.skills_match.matched.map((skill, i) => (
                            <Badge key={i} variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {matchResult.skills_match.missing.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {matchResult.skills_match.missing.map((skill, i) => (
                            <Badge key={i} variant="secondary" className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              <XCircle className="h-3 w-3" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fit Scores */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground text-xs">Experience Fit</p>
                      <p className={cn("font-bold text-lg", getMatchColor(matchResult.experience_fit))}>
                        {matchResult.experience_fit}%
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground text-xs">Education Fit</p>
                      <p className={cn("font-bold text-lg", getMatchColor(matchResult.education_fit))}>
                        {matchResult.education_fit}%
                      </p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium">{matchResult.recommendation}</p>
                  </div>

                  {/* Tips */}
                  {matchResult.tips_to_improve.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Tips to Improve</p>
                      <ul className="space-y-1.5">
                        {matchResult.tips_to_improve.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CollapsibleContent>
              </>
            )}
          </Collapsible>

          {/* Market Insight Feature */}
          <Collapsible open={marketOpen} onOpenChange={setMarketOpen}>
            {!marketInsight ? (
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3 px-4"
                onClick={handleGetMarketInsight}
                disabled={loadingMarket}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Job & Applicant Insight</span>
                </div>
                {loadingMarket ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Coins className="h-3 w-3 text-amber-500" />
                    15 credits
                  </Badge>
                )}
              </Button>
            ) : (
              <>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-auto py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Market Insight</span>
                      <Badge variant="secondary" className="text-xs">
                        {marketInsight.competition_level}
                      </Badge>
                    </div>
                    {marketOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-4 px-1">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground text-xs">Est. Applicants</p>
                      <p className="font-bold">{marketInsight.applicant_count_estimate}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground text-xs">Similar Jobs</p>
                      <p className="font-bold">{marketInsight.similar_jobs_count}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground text-xs">Hiring Timeline</p>
                      <p className="font-bold">{marketInsight.hiring_timeline_estimate}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground text-xs">Competition</p>
                      <p className="font-bold">{marketInsight.competition_level}</p>
                    </div>
                  </div>

                  {/* Salary Insight */}
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Salary Insight</p>
                    <p className="text-sm font-medium">{marketInsight.salary_insight.market_range}</p>
                    <p className="text-xs text-muted-foreground">{marketInsight.salary_insight.posted_salary_assessment}</p>
                  </div>

                  {/* Company Reputation */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Company Reputation</p>
                    <p className="text-sm font-medium">{marketInsight.company_reputation}</p>
                  </div>

                  {/* Success Tips */}
                  {marketInsight.success_tips.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Tips for Success</p>
                      <ul className="space-y-1.5">
                        {marketInsight.success_tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CollapsibleContent>
              </>
            )}
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
