import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function GigVerificationQueueTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gig_verifications")
        .select("*")
        .in("verdict", ["escalated", "auto_revise", "pending"])
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const { data: appeals } = useQuery({
    queryKey: ["admin-appeals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gig_verification_appeals")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const decide = async (id: string, verdict: "human_approved" | "human_rejected") => {
    await supabase.from("gig_verifications").update({ verdict, reviewed_at: new Date().toISOString() }).eq("id", id);
    await supabase.rpc("apply_verification_verdict", { _verification_id: id });
    toast.success("Verdict applied");
    refetch();
  };

  const resolveAppeal = async (id: string, decision: "approved" | "rejected") => {
    const { error } = await supabase.rpc("resolve_verification_appeal", { _appeal_id: id, _decision: decision });
    if (error) toast.error(error.message); else { toast.success("Appeal resolved"); refetch(); }
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-sm font-semibold mb-2">Escalated & revision queue ({data?.length ?? 0})</h3>
        {data?.length === 0 ? (
          <Card className="p-4 text-center text-sm text-muted-foreground">Nothing to review.</Card>
        ) : (
          <div className="space-y-2">
            {data?.map((v: any) => (
              <Card key={v.id} className="p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="capitalize">{v.gig_kind}</Badge>
                  <Badge variant="secondary" className="capitalize">{v.verdict.replace("_", " ")}</Badge>
                  {v.score != null && <Badge>Score {v.score}</Badge>}
                  {(v.risk_flags ?? []).map((f: string) => <Badge key={f} variant="destructive">{f}</Badge>)}
                </div>
                {v.rationale && <p className="text-xs text-muted-foreground line-clamp-3">{v.rationale}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => decide(v.id, "human_approved")}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => decide(v.id, "human_rejected")}>Reject</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-2">Pending appeals ({appeals?.length ?? 0})</h3>
        {appeals?.length === 0 ? (
          <Card className="p-4 text-center text-sm text-muted-foreground">No appeals.</Card>
        ) : (
          <div className="space-y-2">
            {appeals?.map((a: any) => (
              <Card key={a.id} className="p-3 space-y-2">
                <p className="text-sm">{a.reason}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resolveAppeal(a.id, "approved")}>Uphold appeal</Button>
                  <Button size="sm" variant="outline" onClick={() => resolveAppeal(a.id, "rejected")}>Reject appeal</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
