import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function ReviewerProgramTab() {
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [r, d, l] = await Promise.all([
      supabase.from("reviewer_profiles").select("*").order("accuracy", { ascending: false }).limit(100),
      supabase.from("gig_disputes").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("gig_review_assignments").select("status,kind"),
    ]);
    setReviewers(r.data || []);
    setDisputes(d.data || []);
    const s: any = { offered: 0, claimed: 0, submitted: 0, expired: 0 };
    (l.data || []).forEach((x: any) => { s[x.status] = (s[x.status] || 0) + 1; });
    setInsights(s);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("reviewer_profiles").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  };

  const resolveDispute = async (id: string, verdict: string) => {
    const { error } = await supabase.rpc("resolve_dispute", { _dispute_id: id, _verdict: verdict, _notes: "Admin override" });
    if (error) toast.error(error.message); else { toast.success("Resolved"); load(); }
  };

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  return (
    <Tabs defaultValue="reviewers">
      <TabsList>
        <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
        <TabsTrigger value="disputes">Disputes</TabsTrigger>
        <TabsTrigger value="insights">Insights</TabsTrigger>
      </TabsList>
      <TabsContent value="reviewers" className="mt-3 space-y-2">
        {reviewers.length === 0 && <Card className="p-4 text-sm text-muted-foreground">No reviewers yet.</Card>}
        {reviewers.map(r => (
          <Card key={r.id} className="p-3 flex items-center justify-between text-sm">
            <div>
              <div className="font-medium">{r.talent_id.slice(0,8)} · {r.tier}</div>
              <div className="text-xs text-muted-foreground">accuracy {r.accuracy}% · {r.items_resolved} items · {r.status}</div>
            </div>
            <div className="flex gap-1">
              {r.status !== "active" && <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "active")}>Activate</Button>}
              {r.status !== "paused" && <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "paused")}>Pause</Button>}
              {r.status !== "suspended" && <Button size="sm" variant="destructive" onClick={() => setStatus(r.id, "suspended")}>Suspend</Button>}
            </div>
          </Card>
        ))}
      </TabsContent>
      <TabsContent value="disputes" className="mt-3 space-y-2">
        {disputes.length === 0 && <Card className="p-4 text-sm text-muted-foreground">No disputes.</Card>}
        {disputes.map(d => (
          <Card key={d.id} className="p-3 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="outline">{d.status}</Badge> <span className="font-medium">{d.reason_code}</span>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3">{d.narrative}</p>
            {d.status !== "resolved" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => resolveDispute(d.id, "approve")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => resolveDispute(d.id, "revise")}>Revise</Button>
                <Button size="sm" variant="destructive" onClick={() => resolveDispute(d.id, "reject")}>Reject</Button>
              </div>
            )}
            {d.final_verdict && <div className="text-xs">Verdict: <span className="font-medium">{d.final_verdict}</span></div>}
          </Card>
        ))}
      </TabsContent>
      <TabsContent value="insights" className="mt-3">
        <Card className="p-4 grid grid-cols-2 gap-3 text-sm">
          {Object.entries(insights).map(([k, v]) => (
            <div key={k}><div className="text-muted-foreground capitalize">{k}</div><div className="text-2xl font-semibold">{v as number}</div></div>
          ))}
        </Card>
      </TabsContent>
    </Tabs>
  );
}
