import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Coins, Loader2, Info, CheckCircle2, Clock, XCircle, ShieldAlert, Star } from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { InboxUnlockCard } from "@/components/talents/InboxUnlockCard";
import { HypeEarningsCard } from "@/components/feed/HypeEarningsCard";
import { ReferralCard } from "@/components/wallet/ReferralCard";

interface WithdrawalRow {
  id: string;
  amount_credits: number;
  method: string;
  status: "pending" | "approved" | "paid" | "rejected";
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

interface PayoutAccount {
  id: string;
  method: string;
  account_name: string;
  account_number: string;
  bank_name: string | null;
  is_primary: boolean;
}

const METHOD_LABEL: Record<string, string> = {
  bkash: "bKash", bank: "Bank transfer", paypal: "PayPal", wise: "Wise",
};

const STATUS_META: Record<WithdrawalRow["status"], { label: string; icon: any; cls: string }> = {
  pending:  { label: "Pending review", icon: Clock,        cls: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Approved",       icon: CheckCircle2, cls: "bg-blue-100 text-blue-700 border-blue-200" },
  paid:     { label: "Paid",           icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected",       icon: XCircle,      cls: "bg-rose-100 text-rose-700 border-rose-200" },
};

export default function Withdrawals() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { earnedBalance, balance } = useCredits() as any;
  const earned = Number(earnedBalance ?? 0);

  const [requests, setRequests] = useState<WithdrawalRow[]>([]);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");

  useEffect(() => {
    if (!talent?.id) return;
    (async () => {
      setLoading(true);
      const [{ data: w }, { data: a }, { data: t }] = await Promise.all([
        supabase.from("withdrawal_requests" as any).select("*").eq("talent_id", talent.id).order("created_at", { ascending: false }),
        supabase.from("talent_payout_accounts" as any).select("*").eq("talent_id", talent.id).order("is_primary", { ascending: false }),
        supabase.from("talents").select("verification_status").eq("id", talent.id).maybeSingle(),
      ]);
      setRequests(((w as any) || []) as WithdrawalRow[]);
      const accs = ((a as any) || []) as PayoutAccount[];
      setAccounts(accs);
      const primary = accs.find((x) => x.is_primary) || accs[0];
      if (primary) setAccountId(primary.id);
      setVerified(((t as any)?.verification_status) === "verified");
      setLoading(false);
    })();
  }, [talent?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!talent?.id) return;
    if (!verified) return toast.error("Verify your profile to enable withdrawals.");
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount.");
    if (amt > earned) return toast.error(`You only have ${earned} earned credits available.`);
    if (amt < 100) return toast.error("Minimum withdrawal is 100 credits.");
    const acct = accounts.find((a) => a.id === accountId);
    if (!acct) return toast.error("Select a disbursement account.");

    setSubmitting(true);
    const { error, data } = await supabase
      .from("withdrawal_requests" as any)
      .insert({
        talent_id: talent.id,
        amount_credits: amt,
        method: acct.method,
        payout_details: {
          account_id: acct.id,
          account_name: acct.account_name,
          account_number: acct.account_number,
          bank_name: acct.bank_name,
        },
      })
      .select()
      .single();
    setSubmitting(false);

    if (error) return toast.error(error.message || "Could not submit your request.");
    toast.success("Withdrawal request submitted.");
    setAmount("");
    setRequests((prev) => [data as any, ...prev]);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28 space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Withdraw earnings</h1>
          <p className="text-sm text-muted-foreground">Cash out the credits you've earned.</p>
        </div>
      </header>

      <HypeEarningsCard />
      <InboxUnlockCard />
      <ReferralCard />

      <Card>

        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Withdrawable balance</p>
            <p className="text-2xl font-bold flex items-center gap-1.5">
              <Coins className="h-5 w-5 text-amber-500" /> {earned.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-2">earned credits</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total balance</p>
            <p className="text-base font-semibold">{Number(balance ?? 0).toFixed(1)}</p>
          </div>
        </CardContent>
      </Card>

      {!verified && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Verify your profile to withdraw</p>
              <p className="text-xs text-muted-foreground">Add your photo, phone, country, an ID document, and a primary disbursement account.</p>
            </div>
            <Button size="sm" onClick={() => navigate("/app/profile/verify")}>Verify now</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p>Only <b>earned credits</b> can be withdrawn. Minimum: <b>100 credits</b>. Processed within 3 business days.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request a payout</CardTitle>
          <CardDescription>Choose an account and amount.</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">No disbursement account on file yet.</p>
              <Button onClick={() => navigate("/app/profile/verify")}>Add a disbursement account</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Disbursement account</Label>
                <Select value={accountId} onValueChange={setAccountId} disabled={submitting}>
                  <SelectTrigger><SelectValue placeholder="Choose account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-2">
                          {a.is_primary && <Star className="h-3 w-3 text-emerald-600" />}
                          <span>{METHOD_LABEL[a.method]} · {a.account_name} · {a.account_number}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="link" className="px-0 h-auto text-xs" onClick={() => navigate("/app/profile/verify")}>
                  Manage accounts
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (credits)</Label>
                <Input
                  id="amount" type="number" min={100} step={1} placeholder="100"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  disabled={submitting || earned < 100 || !verified}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || earned < 100 || !verified}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {!verified ? "Verify profile to withdraw" : earned < 100 ? "Earn at least 100 credits" : "Submit request"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Your requests</h2>
        {loading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => {
              const meta = STATUS_META[r.status];
              const Icon = meta.icon;
              return (
                <Card key={r.id} className="p-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {Number(r.amount_credits).toFixed(1)} credits · {METHOD_LABEL[r.method] || r.method}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      {r.admin_notes && <> · {r.admin_notes}</>}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("border", meta.cls)}>{meta.label}</Badge>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
