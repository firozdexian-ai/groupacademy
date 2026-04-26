import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  applicationId: string;
  jobId: string;
  talentId: string | null;
  score: number | null;
  rationale: string | null;
  onScored?: (score: number, rationale: string) => void;
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  if (score >= 60) return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
  if (score >= 40) return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Weak";
}

export function AIRelevanceScore({ applicationId, jobId, talentId, score, rationale, onScored }: Props) {
  const [loading, setLoading] = useState(false);

  const runScore = async () => {
    if (!talentId) {
      toast.error("Cannot score — application has no linked talent");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-job-match", {
        body: { jobId, talentId },
      });
      if (error) throw error;
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
      toast.success(`Scored: ${overall}/100`);
      onScored?.(overall, reco);
    } catch (err: any) {
      toast.error(err.message || "Score failed");
    } finally {
      setLoading(false);
    }
  };

  if (score !== null && score !== undefined) {
    return (
      <button
        onClick={runScore}
        disabled={loading}
        title={rationale || "Click to re-score"}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold transition hover:opacity-80",
          scoreColor(score)
        )}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
        {score}
        <span className="opacity-70 font-normal">· {scoreLabel(score)}</span>
      </button>
    );
  }

  return (
    <Button size="sm" variant="outline" className="h-7 px-2" onClick={runScore} disabled={loading || !talentId}>
      {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Brain className="h-3 w-3 mr-1" />}
      Score
    </Button>
  );
}
