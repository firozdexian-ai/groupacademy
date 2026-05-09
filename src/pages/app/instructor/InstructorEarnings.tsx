/**
 * Phase C2 — Instructor Earnings (V2).
 * - Uses React Query keyed ["instructor-dashboard"] so the Phase T2 cache
 *   invalidation bridge auto-refreshes after Maestro tool runs.
 * - Hits the single-trip get_instructor_dashboard_v2 RPC.
 * - Renders an "Awaiting Review" banner whenever an open payout request exists.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Wallet, TrendingUp, Banknote, Clock, ArrowRight, Hourglass, Users, FileCheck2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";

type SummaryRow = {
  id: string; source_kind: string; amount_credits: number; status: string;
  period_month: string; created_at: string;
};
type Summary = {
  lifetime_credits: number; this_month_credits: number;
  available_credits: number; pending_credits: number;
  series: { month: string; credits: number }[];
  recent: SummaryRow[];
};
type OpenPayout = {
  id: string; amount_credits: number; payout_method: string;
  status: "pending" | "approved"; created_at: string;
};
type DashboardV2 = {
  summary: Summary;
  open_payout_requests: OpenPayout[];
  pending_review_count: number;
  active_students_count: number;
  fetched_at: string;
};

export default function InstructorEarnings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["instructor-dashboard"],
    queryFn: async (): Promise<DashboardV2 | null> => {
      const { data, error } = await supabase.rpc("get_instructor_dashboard_v2" as any);
      if (error) throw error;
      return (data as any) ?? null;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }
  if (!data || !data.summary) {
    return <Card className="p-4 text-sm text-muted-foreground">No earnings yet.</Card>;
  }

  const summary = data.summary;
  const openPayouts = data.open_payout_requests ?? [];
  const totalPending = openPayouts.reduce((s, p) => s + Number(p.amount_credits || 0), 0);

  return (
    <div className="space-y-3">
      {/* Awaiting Review banner */}
      {openPayouts.length > 0 && (
        <Card className="p-3 border-amber-400/50 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-start gap-2">
            <Hourglass className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                Pending Payout — Awaiting Review
              </p>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-200/80 mt-0.5">
                {openPayouts.length} request{openPayouts.length === 1 ? "" : "s"} · {totalPending.toFixed(1)} credits (≈ ৳{Math.round(totalPending * 2)}) being processed by our team.
              </p>
              <div className="mt-2 space-y-1">
                {openPayouts.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-[10px] text-amber-900/80 dark:text-amber-100/80">
                    <span className="capitalize">{p.payout_method} · {new Date(p.created_at).toLocaleDateString()}</span>
                    <Badge variant="outline" className="text-[10px] border-amber-400/50">
                      {p.status === "approved" ? "Approved · paying out" : "In review"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Lifetime" credits={summary.lifetime_credits} icon={<TrendingUp className="h-3.5 w-3.5" />} />
        <Stat label="This month" credits={summary.this_month_credits} icon={<Wallet className="h-3.5 w-3.5" />} />
        <Stat label="Available" credits={summary.available_credits} icon={<Banknote className="h-3.5 w-3.5 text-emerald-500" />} highlight />
        <Stat label="Pending" credits={summary.pending_credits} icon={<Clock className="h-3.5 w-3.5 text-amber-500" />} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Users className="h-3.5 w-3.5" />Active students</div>
          <p className="text-lg font-semibold mt-1 tabular-nums">{data.active_students_count ?? 0}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><FileCheck2 className="h-3.5 w-3.5" />Pending review</div>
          <p className="text-lg font-semibold mt-1 tabular-nums">{data.pending_review_count ?? 0}</p>
        </Card>
      </div>

      <Card className="p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium">Last 6 months</p>
          <p className="text-[10px] text-muted-foreground">credits</p>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.series ?? []}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} width={28} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="credits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <RequestPayoutSheet
        available={summary.available_credits}
        onDone={() => qc.invalidateQueries({ queryKey: ["instructor-dashboard"] })}
      />

      <Card className="p-3">
        <p className="text-xs font-medium mb-2">Recent activity</p>
        <div className="divide-y">
          {(summary.recent ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium capitalize">{r.source_kind.replace(/_/g, " ")}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()} · {r.period_month.slice(0, 7)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "paid" ? "default" : r.status === "available" ? "secondary" : "outline"} className="text-[10px]">
                  {r.status}
                </Badge>
                <span className="text-xs font-semibold tabular-nums">{Number(r.amount_credits).toFixed(1)}</span>
              </div>
            </div>
          ))}
          {(summary.recent?.length ?? 0) === 0 && (
            <p className="text-[11px] text-muted-foreground py-4 text-center">No ledger rows yet.</p>
          )}
        </div>
      </Card>

      <p className="text-[10px] text-muted-foreground px-1">
        1 credit ≈ 2 BDT. Minimum payout 500 credits. Statements are generated on the 1st of each month.
      </p>
    </div>
  );
}

function Stat({ label, credits, icon, highlight }: { label: string; credits: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <Card className={`p-3 ${highlight ? "border-emerald-400/40" : ""}`}>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">{icon}{label}</div>
      <p className="text-lg font-semibold mt-1 tabular-nums">{Number(credits || 0).toFixed(1)}</p>
      <p className="text-[10px] text-muted-foreground">≈ ৳{Math.round(Number(credits || 0) * 2)}</p>
    </Card>
  );
}

function RequestPayoutSheet({ available, onDone }: { available: number; onDone: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>(String(Math.max(500, Math.floor(available))));
  const [method, setMethod] = useState("bkash");
  const [account, setAccount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = useMemo(() => Number(amount) >= 500 && Number(amount) <= available && account.trim().length > 0, [amount, available, account]);

  async function submit() {
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("request-instructor-payout", {
      body: { amount: Number(amount), method, details: { account } },
    });
    setSubmitting(false);
    if (error || (data as any)?.error) {
      toast({ title: "Payout failed", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Payout requested", description: `${amount} credits queued for review.` });
    setOpen(false);
    onDone();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full" disabled={available < 500}>
          <Wallet className="h-4 w-4 mr-1.5" />
          Request payout {available >= 500 ? `(up to ${Math.floor(available)})` : "(min 500)"}
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader><SheetTitle>Request payout</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-3">
          <div>
            <Label htmlFor="amt" className="text-xs">Amount (credits)</Label>
            <Input id="amt" type="number" min={500} max={Math.floor(available)} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <p className="text-[10px] text-muted-foreground mt-1">≈ ৳{Math.round(Number(amount || 0) * 2)} · available {Math.floor(available)}</p>
          </div>
          <div>
            <Label className="text-xs">Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bkash">bKash</SelectItem>
                <SelectItem value="bank">Bank transfer</SelectItem>
                <SelectItem value="wise">Wise</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="acc" className="text-xs">{method === "bkash" ? "bKash number" : method === "bank" ? "Bank account" : "Account / email"}</Label>
            <Input id="acc" value={account} onChange={(e) => setAccount(e.target.value)} placeholder={method === "bkash" ? "01XXXXXXXXX" : ""} />
          </div>
        </div>
        <SheetFooter className="mt-4">
          <Button onClick={submit} disabled={!canSubmit || submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit request"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
