/**
 * GroUp Academy: AI Tools Hub Surface (ToolsView)
 * CTO Reference: Authoritative hub container displaying talent career optimization assets.
 * Version: Launch Candidate · Phase Z0 Hardened
 * Enhancements: Performance layout tracking, system anomaly filters, and telemetry synchronization.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  ClipboardList,
  Target,
  Zap,
  Coins,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Loader2,
  Wand2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreMeJobPicker } from "@/domains/jobs/components/ScoreMeJobPicker";
import { useNextBestTool } from "@/hooks/useNextBestTool";
import { useToolRuns, type ToolKey } from "@/hooks/useToolRuns";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

type ToolDef = {
  key: ToolKey;
  title: string;
  description: string;
  cost: number;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
};

const TOOL_META: Record<
  ToolKey,
  { title: string; description: string; cost: number; icon: React.ElementType; href?: string }
> = {
  cv: {
    key: "cv" as ToolKey,
    title: "ATS-friendly CV",
    description: "Generate a clean PDF from your profile.",
    cost: 15,
    icon: FileText,
    href: "/app/tools/cv-maker",
  } as any,
  answers: {
    title: "Application answers",
    description: "Draft tailored answers to application questions.",
    cost: 10,
    icon: ClipboardList,
    href: "/app/tools/application-helper",
  } as any,
  assessment: {
    title: "Career assessment",
    description: "Get a readiness score and skill-gap plan.",
    cost: 50,
    icon: Target,
    href: "/app/tools/assessment",
  } as any,
  interview: {
    title: "Mock interview",
    description: "Practice AI-generated questions for a role.",
    cost: 50,
    icon: Zap,
    href: "/app/tools/mock-interview",
  } as any,
  salary: {
    title: "Salary analysis",
    description: "Benchmark your worth in the market.",
    cost: 50,
    icon: Coins,
    href: "/app/tools/salary-analysis",
  } as any,
  portfolio: {
    title: "Portfolio builder",
    description: "A polished portfolio site, built for you.",
    cost: 500,
    icon: Sparkles,
    href: "/app/tools/portfolio",
  } as any,
  score: {
    title: "Score me vs job",
    description: "See how well you match a saved or recent job.",
    cost: 10,
    icon: TrendingUp,
  } as any,
};

const REASON_COPY: Record<string, string> = {
  no_cv: "Start with a clean CV — it boosts every match.",
  low_completeness: "Build a stronger profile to unlock better matches.",
  saved_recent: "You saved a job recently — let's draft your answers.",
  saved_unscored: "You have unscored saved jobs. See your fit.",
  no_assessment_recent: "It's been a while — get a fresh readiness score.",
  no_salary_recent: "Check your market salary range.",
  default: "Try a mock interview to sharpen your delivery.",
};

export function ToolsView() {
  const navigate = useNavigate();
  const [scoreOpen, setScoreOpen] = useState(false);
  const { data: nextBest, isLoading: loadingNext } = useNextBestTool();
  const { data: recent, isLoading: loadingRuns } = useToolRuns(5);

  const handleToolClick = (key: ToolKey) => {
    trackEvent("ai_tool_hub_item_clicked", { toolKey: key });

    if (key === "score") {
      setScoreOpen(true);
      return;
    }

    const meta = TOOL_META[key] as any;
    if (meta?.href) {
      try {
        navigate(meta.href);
      } catch (err) {
        trackError(err, {
          component: "ToolsView",
          action: "navigate_tool_href",
          toolKey: key,
          href: meta.href,
        });
      }
    }
  };

  const tools: ToolKey[] = ["cv", "answers", "score", "assessment", "interview", "salary", "portfolio"];

  return (
    <div className="space-y-6 antialiased select-none sm:select-text w-full px-0.5">
      {/* Dynamic Recommendation Card Block */}
      <Card className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden transform-gpu shadow-sm">
        <CardContent className="p-5 space-y-3.5 w-full min-w-0">
          <div className="flex items-center gap-2 border-b border-border/5 pb-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Up next for you</h2>
          </div>
          {loadingNext ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground animate-pulse py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Finding your best next step…
            </div>
          ) : nextBest ? (
            <NextBestCard
              toolKey={nextBest.tool_key}
              reason={REASON_COPY[nextBest.reason] || nextBest.reason || REASON_COPY.default}
              onPick={() => handleToolClick(nextBest.tool_key)}
            />
          ) : (
            <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-normal py-0.5">
              Pick any tool below to get started — we'll personalize this recommendation as you use them.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main Grid Tool Directory */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">All AI tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 transform-gpu">
          {tools.map((key) => {
            const meta = TOOL_META[key] as any;
            const Icon = meta.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleToolClick(key)}
                className="text-left rounded-2xl border border-border/40 bg-card p-4.5 transition-all hover:border-primary/40 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring active:scale-[0.995]"
              >
                <div className="flex items-start gap-3.5 w-full min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5 shadow-inner">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-4 leading-none w-full select-none">
                      <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground/90 truncate">
                        {meta.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="gap-1 text-[10px] h-5 px-1.5 font-bold bg-background/50 border-border/60 tabular-nums shadow-sm shrink-0"
                      >
                        <Coins className="h-2.5 w-2.5 text-warning fill-warning/5 stroke-[2]" />
                        <span>{meta.cost}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium line-clamp-2 pr-1">
                      {meta.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Historical Logs Activity Stream Container */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Recent activity</h2>
        <Card className="rounded-2xl border border-border/40 overflow-hidden bg-card/20 backdrop-blur-sm shadow-sm w-full">
          <CardContent className="p-2 w-full">
            {loadingRuns ? (
              <div className="flex items-center gap-2 p-4 text-xs font-semibold text-muted-foreground animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Loading activity ledger…
              </div>
            ) : !recent || recent.length === 0 ? (
              <p className="text-xs sm:text-sm font-medium text-muted-foreground/60 p-6 text-center italic">
                No tool runs logged yet. Pick an AI tool above to begin processing.
              </p>
            ) : (
              <ul className="divide-y divide-border/20 w-full">
                {recent.map((r) => {
                  const meta = TOOL_META[r.tool_key] as any;
                  const Icon = meta?.icon || Sparkles;
                  return (
                    <li key={r.id} className="w-full">
                      <button
                        type="button"
                        onClick={() => handleToolClick(r.tool_key)}
                        className="flex w-full items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-muted/40 transition-colors text-left group"
                      >
                        <div className="h-9 w-9 rounded-xl bg-background border border-border/20 flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/20 transition-colors">
                          <Icon className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1 leading-tight">
                          <p className="text-xs sm:text-sm font-bold text-foreground/90 truncate group-hover:text-primary transition-colors">
                            {meta?.title || r.tool_key}
                          </p>
                          <p className="text-[11px] font-medium text-muted-foreground/70 mt-0.5 tabular-nums">
                            {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })} · {r.cost_credits} cr
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/70 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ScoreMeJobPicker open={scoreOpen} onOpenChange={setScoreOpen} />
    </div>
  );
}

function NextBestCard({ toolKey, reason, onPick }: { toolKey: ToolKey; reason: string; onPick: () => void }) {
  const meta = TOOL_META[toolKey] as any;
  const Icon = meta?.icon || Sparkles;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/30 p-4 rounded-xl border border-border/20 shadow-inner w-full">
      <div className="flex items-start gap-3.5 min-w-0 text-left">
        <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-sm text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-xs sm:text-sm font-bold text-foreground/90 truncate">{meta?.title || toolKey}</p>
          <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium mt-1 break-words select-text selection:bg-primary/15">
            {reason}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={onPick}
        className="rounded-xl shrink-0 gap-1.5 font-bold text-xs h-9 w-full sm:w-auto shadow-md"
      >
        <span>Start</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
