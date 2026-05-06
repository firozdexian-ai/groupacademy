import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

interface Props { gigId: string; gigKind?: "marketplace" | "quick"; }

export function RecommendedBiddersPanel({ gigId, gigKind = "marketplace" }: Props) {
  const qc = useQueryClient();
  const { data: matches, isLoading } = useQuery({
    queryKey: ["recommended-bidders", gigId],
    queryFn: async () => {
      const { data } = await supabase
        .from("gig_matches")
        .select("id, talent_id, score, signals, why_text, status")
        .eq("gig_id", gigId)
        .eq("gig_kind", gigKind)
        .order("score", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("refresh_gig_matches", { _gig_id: gigId, _gig_kind: gigKind, _limit: 25 });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Refreshed"); qc.invalidateQueries({ queryKey: ["recommended-bidders", gigId] }); },
  });

  const shortlist = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase.rpc("shortlist_match", { _match_id: matchId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Shortlisted"); qc.invalidateQueries({ queryKey: ["recommended-bidders", gigId] }); },
  });

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />AI-recommended bidders</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => refresh.mutate()} disabled={refresh.isPending}>Refresh</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!isLoading && !matches?.length && <p className="text-xs text-muted-foreground">No matches yet — click Refresh to score talents.</p>}
        {matches?.map((m: any, i: number) => (
          <div key={m.id} className="border rounded-lg p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-sm">Candidate #{i + 1}</span>
                <Badge className="text-[10px] bg-primary/15 text-primary hover:bg-primary/20">Score {Math.round(Number(m.score))}</Badge>
                {m.status !== "offered" && <Badge variant="outline" className="text-[10px] capitalize">{m.status}</Badge>}
              </div>
              {m.why_text && <p className="text-xs text-muted-foreground line-clamp-2">{m.why_text}</p>}
            </div>
            <Button size="sm" variant="outline" onClick={() => shortlist.mutate(m.id)} disabled={m.status === "shortlisted"}>
              <Star className="w-3.5 h-3.5 mr-1" />Shortlist
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
