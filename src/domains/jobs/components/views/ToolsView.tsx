import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const TOOL_META: Record<ToolKey, { title: string; description: string; cost: number; icon: React.ElementType; href?: string }> = {
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
    if (key === "score") {
      setScoreOpen(true);
      return;
    }
    const meta = TOOL_META[key] as any;
    if (meta?.href) navigate(meta.href);
  };

  const tools: ToolKey[] = ["cv", "answers", "score", "assessment", "interview", "salary", "portfolio"];

  return (
    <div className="space-y-5">
      {/* Up Next */}
      <Card className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Up next for you</h2>
          </div>
          {loadingNext ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Finding your best next step…
            </div>
          ) : nextBest ? (
            <NextBestCard
              toolKey={nextBest.tool_key}
              reason={REASON_COPY[nextBest.reason] || nextBest.reason || REASON_COPY.default}
              onPick={() => handleToolClick(nextBest.tool_key)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Pick any tool below to get started — we'll personalize this card as you use them.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tools grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
          All AI tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tools.map((key) => {
            const meta = TOOL_META[key] as any;
            const Icon = meta.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleToolClick(key)}
                className="text-left rounded-2xl border border-border/40 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-snug">{meta.title}</h3>
                      <Badge variant="outline" className="gap-1 text-[10px] shrink-0">
                        <Coins className="h-2.5 w-2.5 text-amber-500" />
                        {meta.cost}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{meta.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
          Recent activity
        </h2>
        <Card className="rounded-2xl border border-border/40">
          <CardContent className="p-2">
            {loadingRuns ? (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : !recent || recent.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                No tool runs yet. Pick a tool above to get started.
              </p>
            ) : (
              <ul className="divide-y divide-border/40">
                {recent.map((r) => {
                  const meta = TOOL_META[r.tool_key] as any;
                  const Icon = meta?.icon || Sparkles;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => handleToolClick(r.tool_key)}
                        className="flex w-full items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted/40 transition-colors text-left"
                      >
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{meta?.title || r.tool_key}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })} · {r.cost_credits} cr
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
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
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{meta?.title || toolKey}</p>
        <p className="text-xs text-muted-foreground leading-snug mt-0.5">{reason}</p>
      </div>
      <Button size="sm" onClick={onPick} className="rounded-lg shrink-0 gap-1.5">
        Start <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
