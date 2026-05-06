import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function IELTSResults() {
  const { id } = useParams<{ id: string }>();
  const { data: attempt, isLoading } = useQuery({
    queryKey: ["ielts-attempt", id],
    queryFn: async () => {
      const { data } = await supabase.from("ielts_mock_attempts").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  if (isLoading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (!attempt) return <div className="p-4 text-center">Not found.</div>;

  const fb = (attempt.ai_feedback as any) ?? {};
  const criteria = fb.criteria ?? {};

  return (
    <div className="px-4 py-4 space-y-3 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold capitalize">{attempt.section} Result</h1>
        <Badge className="text-2xl px-3 py-1 font-bold">Band {attempt.ai_band_score ?? "—"}</Badge>
      </div>

      <div className="space-y-2">
        {Object.entries(criteria).map(([k, v]: any) => (
          <Card key={k} className="p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold capitalize text-sm">{k.replace(/_/g, " ")}</div>
              <Badge variant="secondary">Band {v.band}</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{v.feedback}</div>
          </Card>
        ))}
      </div>

      {!!fb.strengths?.length && (
        <Card className="p-3 bg-emerald-50 dark:bg-emerald-950/30">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">Strengths</div>
          <ul className="text-sm space-y-0.5">{fb.strengths.map((s: string, i: number) => <li key={i}>• {s}</li>)}</ul>
        </Card>
      )}
      {!!fb.improvements?.length && (
        <Card className="p-3 bg-amber-50 dark:bg-amber-950/30">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Improvements</div>
          <ul className="text-sm space-y-0.5">{fb.improvements.map((s: string, i: number) => <li key={i}>• {s}</li>)}</ul>
        </Card>
      )}
      {fb.next_action && (
        <Card className="p-3 border-primary/40">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Next Action</div>
          <div className="text-sm">{fb.next_action}</div>
        </Card>
      )}
    </div>
  );
}
