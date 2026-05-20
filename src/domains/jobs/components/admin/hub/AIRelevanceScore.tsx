import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, Zap, Target, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: AI Relevance Scoring Node
 * CTO Reference: High-fidelity neural matching between talent artifacts and job infrastructure.
 */

interface Props {
  applicationId: string;
  jobId: string;
  talentId: string | null;
  score: number | null;
  rationale: string | null;
  onScored?: (score: number, rationale: string) => void;
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (score >= 60) return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  if (score >= 40) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Excellent Match";
  if (score >= 60) return "Strong Fit";
  if (score >= 40) return "Possible Fit";
  return "Low Relevance";
}

export function AIRelevanceScore({ applicationId, jobId, talentId, score, rationale, onScored }: Props) {
  const [loading, setLoading] = useState(false);

  const runScore = async () => {
    if (!talentId) {
      toast.error("No talent profile linked to this application.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Scoring this match...");

    try {
      const { data, error } = await supabase.functions.invoke("score-job-match", {
        body: { jobId, talentId },
      });

      if (error) {
        const msg = (data as any)?.error || error.message || "Something went wrong";
        throw new Error(msg);
      }

      const overall = Math.round(Number(data?.overall_match ?? data?.score ?? 0));
      const reco = data?.recommendation || data?.rationale || "";

      const { error: upErr } = await supabase
        .from("job_applications")
        .update({
          ai_match_score: overall,
          ai_match_rationale: reco,
          ai_scored_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (upErr) throw upErr;

      toast.success(`Match score: ${overall}/100`, { id: toastId });
      onScored?.(overall, reco);
    } catch (err: any) {
      toast.error("Couldn't score this match: " + err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (score !== null && score !== undefined) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in duration-500">
        <button
          onClick={runScore}
          disabled={loading}
          title={rationale || "Re-score this match"}
          className={cn(
            "h-8 flex items-center gap-2 px-3 rounded-lg border font-semibold text-xs transition-all active:scale-95 hover:shadow-md",
            scoreColor(score),
            loading ? "animate-pulse opacity-50" : "",
          )}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 fill-current" />}
          <span>{score}%</span>
          <span className="opacity-60 hidden sm:inline">· {scoreLabel(score)}</span>
        </button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 px-3 rounded-lg gap-2 hover:bg-primary/10 hover:text-primary transition-all"
      onClick={runScore}
      disabled={loading || !talentId}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
      <span className="text-xs font-medium">Score this match</span>
    </Button>
  );
}
