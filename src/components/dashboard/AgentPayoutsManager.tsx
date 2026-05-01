import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wallet, Check, X, Banknote } from "lucide-react";
import { toast } from "sonner";

interface PayoutRow {
  id: string;
  talent_id: string;
  amount_credits: number;
  payout_method: string;
  payout_details: Record<string, unknown>;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  talent?: { full_name: string | null; email: string | null };
}

const STATUSES = ["pending", "approved", "paid", "rejected"] as const;

export function AgentPayoutsManager() {
  const [tab, setTab] = useState<typeof STATUSES[number]>("pending");
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [tab]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("agent_payout_requests")
      .select("*, talent:talents(full_name,email)")
      .eq("status", tab)
      .order("created_at", { ascending: false });
    setRows((data as PayoutRow[]) ?? []);
    setLoading(false);
  }

  async function update(id: string, status: string, notes?: string) {
    if (status === "paid") {
      const { error } = await supabase.rpc("mark_payout_paid", { p_request_id: id, p_notes: notes ?? null });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("agent_payout_requests")
        .update({ status, admin_notes: notes ?? null, processed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return toast.error(error.message);
    }
    toast.success(`Marked as ${status}`);
    void load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />Agent Payouts
        </h2>
        <p className="text-sm text-muted-foreground">Review and process payout requests from agent creators.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof STATUSES[number])}>
        <TabsList>
          {STATUSES.map((s) => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
        </TabsList>

        <TabsContent value={tab}>
          <Card>
            <CardHeader><CardTitle className="capitalize">{tab} payouts ({rows.length})</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />Loading…
                </div>
              ) : rows.length === 0 ? (
                <p className="text-center py-10 text-sm text-muted-foreground">No {tab} payouts.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">{r.talent?.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.talent?.email}</div>
                        </TableCell>
                        <TableCell className="text-right font-bold">{Number(r.amount_credits).toFixed(1)}</TableCell>
                        <TableCell><Badge variant="outline">{r.payout_method}</Badge></TableCell>
                        <TableCell className="text-xs max-w-xs truncate">
                          {(r.payout_details as { note?: string })?.note ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {tab === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => update(r.id, "approved")}>
                                <Check className="h-3 w-3 mr-1" />Approve
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => update(r.id, "rejected")}>
                                <X className="h-3 w-3 mr-1" />Reject
                              </Button>
                            </>
                          )}
                          {tab === "approved" && (
                            <Button size="sm" onClick={() => update(r.id, "paid")}>
                              <Banknote className="h-3 w-3 mr-1" />Mark paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
