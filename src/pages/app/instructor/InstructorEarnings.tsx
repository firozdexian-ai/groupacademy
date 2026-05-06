/**
 * Phase 4.7 — Instructor Earnings dashboard tab content.
 * Used inline in InstructorShell when ?tab=earnings.
 */
import { useEffect, useMemo, useState } from "react";
import { Loader2, Wallet, TrendingUp, Banknote, Clock, ArrowRight } from "lucide-react";
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

export default function InstructorEarnings() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_instructor_earnings_summary" as any);
    if (!error && data) setSummary(data as any);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }
  if (!summary) {
    return <Card className="p-4 text-sm text-muted-foreground">No earnings yet.</Card>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Lifetime" credits={summary.lifetime_credits} icon={<TrendingUp className="h-3.5 w-3.5" />} />
        <Stat label="This month" credits={summary.this_month_credits} icon={<Wallet className="h-3.5 w-3.5" />} />
        <Stat label="Available" credits={summary.available_credits} icon={<Banknote className="h-3.5 w-3.5 text-emerald-500" />} highlight />
        <Stat label="Pending" credits={summary.pending_credits} icon={<Clock className="h-3.5 w-3.5 text-amber-500" />} />
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

      <RequestPayoutSheet available={summary.available_credits} onDone={load} />

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
