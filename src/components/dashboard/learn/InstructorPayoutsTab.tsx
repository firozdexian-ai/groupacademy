/**
 * Phase 4.7 — Admin instructor payouts reconciliation tab.
 * Subtabs: Earnings (aggregate ledger), Payout Requests (inbox), Statements (PDFs).
 */
import { useEffect, useState } from "react";
import { Loader2, Wallet, FileText, ListChecks, CheckCircle2, XCircle, Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function InstructorPayoutsTab() {
  return (
    <div className="space-y-3">
      <header className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Instructor Payouts</h2>
      </header>
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests"><ListChecks className="h-3.5 w-3.5 mr-1" />Requests</TabsTrigger>
          <TabsTrigger value="earnings"><Banknote className="h-3.5 w-3.5 mr-1" />Earnings</TabsTrigger>
          <TabsTrigger value="statements"><FileText className="h-3.5 w-3.5 mr-1" />Statements</TabsTrigger>
        </TabsList>
        <TabsContent value="requests"><RequestsPanel /></TabsContent>
        <TabsContent value="earnings"><EarningsPanel /></TabsContent>
        <TabsContent value="statements"><StatementsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function RequestsPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending"|"approved"|"paid"|"rejected"|"all">("pending");

  async function load() {
    setLoading(true);
    let q = supabase.from("instructor_payout_requests" as any)
      .select("*").order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows((data as any) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [filter]);

  async function act(id: string, action: "approve"|"paid"|"reject") {
    setActing(id);
    const { data, error } = await supabase.functions.invoke("process-instructor-payout", { body: { request_id: id, action } });
    setActing(null);
    if (error || (data as any)?.error) {
      toast({ title: "Failed", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: `Marked ${action}` });
    load();
  }

  return (
    <div className="space-y-3 mt-3">
      <div className="flex gap-1 flex-wrap">
        {(["pending","approved","paid","rejected","all"] as const).map(f => (
          <Button key={f} size="sm" variant={filter===f?"default":"outline"} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
        ))}
      </div>
      {loading ? <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> :
        rows.length === 0 ? <Card className="p-4 text-sm text-muted-foreground">No {filter} requests.</Card> :
        <div className="space-y-2">
          {rows.map(r => (
            <Card key={r.id} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold tabular-nums">{Number(r.amount_credits).toFixed(1)} credits <span className="text-muted-foreground font-normal">≈ ৳{Math.round(r.amount_credits * 2)}</span></p>
                  <p className="text-xs text-muted-foreground">{r.payout_method.toUpperCase()} · {r.payout_details?.account ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleString()} · user {r.instructor_user_id.slice(0,8)}</p>
                </div>
                <Badge variant={r.status==="paid"?"default":r.status==="rejected"?"destructive":"secondary"} className="text-[10px] capitalize">{r.status}</Badge>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" disabled={acting===r.id} onClick={() => act(r.id, "approve")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve</Button>
                  <Button size="sm" disabled={acting===r.id} onClick={() => act(r.id, "paid")}><Banknote className="h-3.5 w-3.5 mr-1" />Mark paid</Button>
                  <Button size="sm" variant="ghost" disabled={acting===r.id} onClick={() => act(r.id, "reject")}><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
                </div>
              )}
              {r.status === "approved" && (
                <Button size="sm" className="mt-2" disabled={acting===r.id} onClick={() => act(r.id, "paid")}><Banknote className="h-3.5 w-3.5 mr-1" />Mark paid</Button>
              )}
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

function EarningsPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("instructor_earnings_ledger" as any)
        .select("instructor_user_id, source_kind, amount_credits, status, period_month")
        .order("period_month", { ascending: false }).limit(500);
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  // group by user + month
  const grouped: Record<string, { credits: number; rows: number }> = {};
  for (const r of rows) {
    const k = `${r.instructor_user_id}|${r.period_month}`;
    grouped[k] = grouped[k] ?? { credits: 0, rows: 0 };
    grouped[k].credits += Number(r.amount_credits);
    grouped[k].rows += 1;
  }
  const groupRows = Object.entries(grouped).map(([k, v]) => {
    const [user_id, period] = k.split("|");
    return { user_id, period, ...v };
  }).filter(r => !search || r.user_id.includes(search));

  return loading ? <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
    <div className="mt-3 space-y-2">
      <Input placeholder="Filter by user id…" value={search} onChange={e=>setSearch(e.target.value)} />
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40"><tr><th className="text-left p-2">Instructor</th><th className="text-left p-2">Month</th><th className="text-right p-2">Credits</th><th className="text-right p-2">Rows</th></tr></thead>
          <tbody>
            {groupRows.slice(0, 200).map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 font-mono">{r.user_id.slice(0,8)}…</td>
                <td className="p-2">{r.period.slice(0,7)}</td>
                <td className="p-2 text-right tabular-nums">{r.credits.toFixed(1)}</td>
                <td className="p-2 text-right text-muted-foreground">{r.rows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StatementsPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  async function load() {
    setLoading(true);
    const { data } = await supabase.from("instructor_statements" as any)
      .select("*").order("period_month", { ascending: false }).limit(100);
    setRows((data as any) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  async function regenerate() {
    const { error } = await supabase.functions.invoke("cron-instructor-monthly-statement", { body: {} });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Regenerated" }); load(); }
  }
  return (
    <div className="mt-3 space-y-2">
      <div className="flex justify-end"><Button size="sm" onClick={regenerate}>Regenerate previous month</Button></div>
      {loading ? <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> :
        rows.length === 0 ? <Card className="p-4 text-sm text-muted-foreground">No statements yet.</Card> :
        <div className="space-y-1.5">
          {rows.map(r => (
            <Card key={r.id} className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">{r.period_month.slice(0,7)} · user {r.instructor_user_id.slice(0,8)}</p>
                <p className="text-[10px] text-muted-foreground">Total: {r.summary?.total_credits ?? 0} cr · ৳{r.summary?.total_bdt ?? 0}</p>
              </div>
              {r.emailed_at && <Badge variant="secondary" className="text-[10px]">emailed</Badge>}
            </Card>
          ))}
        </div>
      }
    </div>
  );
}
