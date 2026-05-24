import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
 listMyWithdrawalRequests,
 listMyTalentPayoutAccounts,
 insertTalentWithdrawalRequest,
} from "@/domains/finance/repo/financeRepo";
import { getTalentVerificationStatus } from "@/domains/talent/repo/talentRepo";
import { ArrowLeft, Wallet, Coins, Loader2, Clock, CheckCircle2, XCircle, ShieldAlert, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { cn } from "@/lib/utils";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";

// Production Data Contracts[cite: 8]
interface WithdrawalRequest {
 id: string;
 amount_credits: number;
 method: string;
 status: "pending" | "approved" | "paid" | "rejected";
 admin_notes: string | null;
 created_at: string;
}

interface PayoutAccount {
 id: string;
 method: string;
 account_name: string;
 account_number: string;
 bank_name: string | null;
 is_primary: boolean;
}

const METHOD_LABEL: Record<string, string> = { bkash: "bKash", bank: "Bank transfer", paypal: "PayPal", wise: "Wise" };

const STATUS_META: Record<WithdrawalRequest["status"], { label: string; icon: any; cls: string }> = {
 pending: { label: "Pending review", icon: Clock, cls: "bg-amber-100 text-amber-700 border-amber-200" },
 approved: { label: "Approved", icon: CheckCircle2, cls: "bg-blue-100 text-blue-700 border-blue-200" },
 paid: { label: "Paid", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
 rejected: { label: "Rejected", icon: XCircle, cls: "bg-rose-100 text-rose-700 border-rose-200" },
};

export default function Withdrawals() {
 const navigate = useNavigate();
 const { talent } = useTalent();
 const { balance, earnedBalance } = useCredits();
 const [amount, setAmount] = useState<string>("");
 const [accountId, setAccountId] = useState<string>("");
 const [submitting, setSubmitting] = useState(false);

 // Digital Workforce Anomaly Protocol[cite: 6]
 const reportAnomaly = async (event: string, context: any) => {
 console.error(`[Digital Workforce Anomaly] ${event}`, context);
 await adminSupportAssistant({ type: "payout_error", event, context });
 };

 const {
 data: requests = [],
 isLoading: txLoading,
 refetch,
 } = useQuery({
 queryKey: ["withdrawal-requests", talent?.id],
 enabled: !!talent?.id,
 queryFn: async () => {
 try {
 return (await listMyWithdrawalRequests(talent!.id)) as unknown as WithdrawalRequest[];
 } catch (error) {
 await reportAnomaly("LedgerFetchFailure", { error });
 throw error;
 }
 },
 });

 const { data: accounts = [], isLoading: accLoading } = useQuery({
 queryKey: ["payout-accounts", talent?.id],
 enabled: !!talent?.id,
 queryFn: async () => (await listMyTalentPayoutAccounts(talent!.id)) as unknown as PayoutAccount[],
 });

 const { data: talentMeta } = useQuery({
 queryKey: ["talent-verify-status", talent?.id],
 enabled: !!talent?.id,
 queryFn: async () => ({ verification_status: await getTalentVerificationStatus(talent!.id) }),
 });

 const earned = Number(earnedBalance || 0);
 const verified = talentMeta?.verification_status === "verified";

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!talent?.id || !verified) return;
 const amt = Number(amount);
 if (!amt || amt < 100 || amt > earned) return toast.error("Invalid amount or insufficient funds.");

 setSubmitting(true);
 try {
 const acct = accounts.find((a) => a.id === accountId);
 if (!acct) throw new Error("Account mismatch.");

 const { error } = await insertTalentWithdrawalRequest({
 talent_id: talent.id,
 amount_credits: amt,
 method: acct.method,
 payout_details: { account_id: acct.id, account_name: acct.account_name, account_number: acct.account_number },
 });
 if (error) throw error;
 toast.success("Request synchronized.");
 setAmount("");
 refetch();
 } catch (e) {
 await reportAnomaly("PayoutSubmissionFailure", { error: e });
 toast.error("Protocol error. Workforce notified.");
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className={PAGE_SHELL_WIDE}>
 <header className="flex items-center gap-5">
 <Button variant="ghost" size="icon" className="rounded-xl h-11 w-11" onClick={() => navigate(-1)}>
 <ArrowLeft className="h-5 w-5 text-primary" />
 </Button>
 <div>
 <h1 className={PAGE_TITLE}>Withdraw Earnings</h1>
 <p className={PAGE_SUBTITLE}>Cash out credits to your linked node.</p>
 </div>
 </header>

 <Card className={CARD}>
 <CardContent className="p-5 flex items-center gap-4">
 <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
 <Wallet className="h-6 w-6 text-primary" />
 </div>
 <div className="flex-1">
 <p className="text-xs text-muted-foreground">Withdrawable balance</p>
 <p className="text-2xl font-bold flex items-center gap-2">
 <Coins className="h-5 w-5 text-amber-500" /> {earned.toFixed(1)}
 </p>
 </div>
 </CardContent>
 </Card>

 {!verified && (
 <Card className="border-amber-300 bg-amber-50/50">
 <CardContent className="p-4 flex items-start gap-3">
 <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
 <div className="flex-1 text-sm">
 <p className="font-semibold">Verify identity to withdraw</p>
 <p className="text-muted-foreground">Complete profile verification in settings.</p>
 </div>
 <Button size="sm" onClick={() => navigate("/app/profile/verify")}>
 Verify
 </Button>
 </CardContent>
 </Card>
 )}

 <Card className={CARD}>
 <CardHeader>
 <CardTitle>Request payout</CardTitle>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-1.5">
 <Label>Disbursement account</Label>
 <Select value={accountId} onValueChange={setAccountId} disabled={submitting}>
 <SelectTrigger>
 <SelectValue placeholder="Choose account" />
 </SelectTrigger>
 <SelectContent>
 {accounts.map((a) => (
 <SelectItem key={a.id} value={a.id}>
 {METHOD_LABEL[a.method]} · {a.account_name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <Label>Amount (100+ credits)</Label>
 <Input
 type="number"
 min={100}
 value={amount}
 onChange={(e) => setAmount(e.target.value)}
 disabled={submitting}
 />
 </div>
 <Button className="w-full" disabled={submitting || !verified || earned < 100}>
 {submitting ? <Loader2 className="animate-spin mr-2" /> : null} Submit
 </Button>
 </form>
 </CardContent>
 </Card>
 </div>
 );
}
