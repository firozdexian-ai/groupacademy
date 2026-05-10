import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Wallet, Loader2, Clock, ArrowUpRight, Banknote } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  talent_id: string;
  amount_credits: number;
  method: string;
  payout_details: any;
  status: "pending" | "approved" | "paid" | "rejected";
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  talent?: { full_name: string | null; email: string | null };
}

const STATUSES: Row["status"][] = ["pending", "approved", "paid", "rejected"];

export function WithdrawalsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Row["status"]>("pending");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("withdrawal_requests" as any)
      .select("*, talent:talents(full_name, email)")
      .order("created_at", { ascending: false });
    setRows((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function processWithdrawal(id: string, action_status: Row["status"]) {
    setProcessingId(id);
    try {
      // CTO PATCH: Routing financial mutations through a secure executor
      const { data, error } = await supabase.functions.invoke("process-withdrawal", {
        body: {
          withdrawal_id: id,
          action: action_status,
          admin_notes: noteDraft[id] ?? null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Withdrawal securely marked as ${action_status}`);
      setNoteDraft((prev) => ({ ...prev, [id]: "" }));
      load();
    } catch (e: any) {
      toast.error(e.message || "Executor fault: Failed to process withdrawal");
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = rows.filter((r) => r.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "approved":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "paid":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "rejected":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Wallet className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Liquidity Output</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Gig Worker Payout Execution
          </p>
        </div>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Row["status"])}>
        <TabsList className="bg-muted/30 border-2 border-border/40 p-1 h-auto rounded-2xl mb-6">
          {STATUSES.map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              className="capitalize rounded-xl text-xs font-bold uppercase tracking-wider py-2.5 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              {s} ({rows.filter((r) => r.status === s).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-[32px]" />
            <Skeleton className="h-40 w-full rounded-[32px]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/10 border-2 border-dashed border-border/40 rounded-[40px]">
            <Banknote className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">
              No {filter} requests in queue
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filtered.map((r) => (
              <Card
                key={r.id}
                className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg overflow-hidden transition-all hover:shadow-xl"
              >
                <div
                  className={cn(
                    "h-1.5 w-full",
                    r.status === "pending"
                      ? "bg-gradient-to-r from-orange-400 to-orange-500"
                      : r.status === "paid"
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                        : r.status === "rejected"
                          ? "bg-gradient-to-r from-destructive to-red-500"
                          : "bg-gradient-to-r from-blue-400 to-blue-500",
                  )}
                />
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="font-black text-lg truncate flex items-center gap-2">
                        {r.talent?.full_name || "Unknown Talent"}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                        {r.talent?.email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize px-3 py-1 font-bold text-[10px] tracking-wider border-2",
                        getStatusColor(r.status),
                      )}
                    >
                      {r.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <div className="space-y-1 flex-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                        Requested Capital
                      </p>
                      <p className="text-2xl font-black italic tracking-tighter text-foreground leading-none">
                        {Number(r.amount_credits).toFixed(1)} <span className="text-sm text-primary">CR</span>
                      </p>
                    </div>
                    <div className="space-y-1 flex-1 border-l border-border/50 pl-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                        Routing
                      </p>
                      <p className="text-sm font-bold truncate">{r.method}</p>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">
                        {r.payout_details?.account_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Clock className="h-3 w-3" /> {format(new Date(r.created_at), "MMM dd, yyyy · HH:mm")}
                  </div>

                  {r.status === "pending" && (
                    <div className="pt-2 space-y-3">
                      <Input
                        placeholder="Attach audit notes for the ledger (optional)..."
                        value={noteDraft[r.id] ?? ""}
                        onChange={(e) => setNoteDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        className="h-10 rounded-xl border-2 text-xs"
                        disabled={processingId === r.id}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => processWithdrawal(r.id, "approved")}
                          disabled={processingId === r.id}
                          className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase text-[10px] tracking-wider"
                        >
                          {processingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => processWithdrawal(r.id, "rejected")}
                          disabled={processingId === r.id}
                          variant="destructive"
                          className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-wider"
                        >
                          {processingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reject (Refund)"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {r.status === "approved" && (
                    <div className="pt-2 border-t border-border/20">
                      <Button
                        size="sm"
                        onClick={() => processWithdrawal(r.id, "paid")}
                        disabled={processingId === r.id}
                        className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-emerald-500/20"
                      >
                        {processingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Execute Fiat Payout"}
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}

                  {r.admin_notes && (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic mb-1">
                        Audit Trail
                      </p>
                      <p className="text-xs text-foreground/80">{r.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Tabs>
    </div>
  );
}
