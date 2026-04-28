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
  if (score >= 80) return "OPTIMAL_MATCH";
  if (score >= 60) return "STRONG_FIT";
  if (score >= 40) return "MARGINAL_NODE";
  return "LOW_RELEVANCE";
}

export function AIRelevanceScore({ applicationId, jobId, talentId, score, rationale, onScored }: Props) {
  const [loading, setLoading] = useState(false);

  const runScore = async () => {
    if (!talentId) {
      toast.error("Protocol Fault: No linked talent node detected.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Initializing neural matching protocol...");

    try {
      const { data, error } = await supabase.functions.invoke("score-job-match", {
        body: { jobId, talentId },
      });

      if (error) {
        const msg = (data as any)?.error || error.message || "Logic Fault";
        throw new Error(msg);
      }

      const overall = Math.round(Number(data?.overall_match ?? data?.score ?? 0));
      const reco = data?.recommendation || data?.rationale || "";

      // PERSIST TO REGISTRY
      const { error: upErr } = await supabase
        .from("job_applications")
        .update({
          ai_match_score: overall,
          ai_match_rationale: reco,
          ai_scored_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (upErr) throw upErr;

      toast.success(`Node Scored: ${overall}/100`, { id: toastId });
      onScored?.(overall, reco);
    } catch (err: any) {
      toast.error("Neural Error: " + err.message, { id: toastId });
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
          title={rationale || "RE-CALIBRATE NODE"}
          className={cn(
            "h-8 flex items-center gap-2 px-3 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest transition-all active:scale-95 hover:shadow-lg",
            scoreColor(score),
            loading ? "animate-pulse opacity-50" : "",
          )}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 fill-current" />}
          <span>{score}%</span>
          <span className="opacity-40 font-bold hidden sm:inline">| {scoreLabel(score)}</span>
        </button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 px-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest gap-2 bg-muted/20 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
      onClick={runScore}
      disabled={loading || !talentId}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
      <span>INITIALIZE_SCORING</span>
    </Button>
  );
}
