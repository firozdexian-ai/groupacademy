import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MasteryRow {
  topic_tag: string;
  mastery: number;
  attempts: number;
}

interface MasteryBarsProps {
  moduleId: string | undefined;
  /** Max number of topics to show. Default 5. */
  topN?: number;
}

function masteryTone(m: number) {
  if (m >= 0.75) return "bg-emerald-500";
  if (m >= 0.5) return "bg-primary";
  if (m >= 0.3) return "bg-amber-500";
  return "bg-rose-500";
}

function masteryLabel(m: number) {
  if (m >= 0.85) return "Mastered";
  if (m >= 0.65) return "Proficient";
  if (m >= 0.4) return "Developing";
  return "Beginner";
}

export function MasteryBars({ moduleId, topN = 5 }: MasteryBarsProps) {
  const [rows, setRows] = useState<MasteryRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!moduleId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("talent_skill_profile")
      .select("topic_tag, mastery, attempts")
      .eq("module_id", moduleId)
      .order("attempts", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("[MasteryBars] load failed", error);
          setRows([]);
        } else {
          setRows((data ?? []) as MasteryRow[]);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const top = (rows ?? [])
    .slice()
    .sort((a, b) => Number(b.mastery) - Number(a.mastery))
    .slice(0, topN);

  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-primary" />
          Topic_Mastery
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest italic">
              Syncing_Skill_Profile…
            </span>
          </div>
        ) : top.length === 0 ? (
          <div className="flex items-start gap-2 py-3 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest italic leading-relaxed">
              No mastery data yet. Complete a quiz to populate your skill profile.
            </p>
          </div>
        ) : (
          top.map((row) => {
            const pct = Math.round(Number(row.mastery) * 100);
            return (
              <div key={row.topic_tag} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-tight text-foreground truncate">
                    {row.topic_tag}
                  </span>
                  <span className="text-[10px] font-black tabular-nums text-muted-foreground">
                    {pct}%
                    <span className="ml-2 opacity-60">{masteryLabel(Number(row.mastery))}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-700", masteryTone(Number(row.mastery)))}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {row.attempts} attempt{row.attempts === 1 ? "" : "s"}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
