import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
 ArrowLeft,
 Coins,
 History,
 CreditCard,
 FileText,
 ChevronLeft,
 ChevronRight,
 ChevronDown,
 ChevronUp,
 TrendingUp,
 Zap,
 AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfMonth, endOfMonth, subMonths, addMonths, isBefore } from "date-fns";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { MyInvoicesList } from "@/domains/finance/components/talent/MyInvoicesList";
import { CreditBalance } from "@/domains/finance/components/talent/CreditBalance";
import { cn } from "@/lib/utils";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";

// Production Data Contracts[cite: 8]
interface Transaction {
 id: string;
 amount: number;
 balance_after: number;
 transaction_type: string;
 service_type: string | null;
 description: string | null;
 created_at: string;
 is_earned: boolean;
}

const formatTxType = (type: string) => {
  if (!type) return "";
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function Transactions() {
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const { balance } = useCredits();
 const [activeTab, setActiveTab] = useState("history");
 const [expandedId, setExpandedId] = useState<string | null>(null);
 const [visibleCount, setVisibleCount] = useState(20);
 const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));

 // Digital Workforce Anomaly Protocol[cite: 6]
 const reportAnomaly = async (event: string, context: any) => {
 console.error(`[Digital Workforce Anomaly] ${event}`, context);
 await adminSupportAssistant({ type: "ledger_sync_error", event, context });
 };

 const { data: historyTxns = [], isLoading: historyLoading } = useQuery({
 queryKey: ["credit-history"],
 queryFn: async () => {
 const since = subDays(new Date(), 90).toISOString();
 const { data, error } = await supabase
 .from("credit_transactions")
 .select("*")
 .gte("created_at", since)
 .order("created_at", { ascending: false });
 if (error) {
 await reportAnomaly("LedgerHistoryFetchFailure", { error });
 throw error;
 }
 return (data as Transaction[]) || [];
 },
 });

 const monthStart = startOfMonth(selectedMonth).toISOString();
 const monthEnd = endOfMonth(selectedMonth).toISOString();

 const { data: monthTxns = [], isLoading: monthLoading } = useQuery({
 queryKey: ["credit-month", monthStart],
 queryFn: async () => {
 const { data, error } = await supabase
 .from("credit_transactions")
 .select("*")
 .gte("created_at", monthStart)
 .lte("created_at", monthEnd)
 .order("created_at", { ascending: true });
 if (error) {
 await reportAnomaly("MonthlyStatementFetchFailure", { monthStart, error });
 throw error;
 }
 return (data as Transaction[]) || [];
 },
 });

 const startBalance = 0; // Simplified for this view context
 const endBalance = monthTxns.length > 0 ? monthTxns[monthTxns.length - 1].balance_after : startBalance;
 const netChange = endBalance - startBalance;

 return (
 <div className={PAGE_SHELL_WIDE}>
 <header className="flex items-center gap-5">
 <Button
 variant="ghost"
 size="icon" aria-label="Go back"
 className="rounded-xl h-11 w-11 hover:bg-primary/5"
 onClick={() => navigate(-1)}
 >
 <ArrowLeft className="h-5 w-5 text-primary" />
 </Button>
 <div className="space-y-1">
 <h1 className={PAGE_TITLE}>Credits & Billing</h1>
 <p className={PAGE_SUBTITLE}>View your transaction history and invoices</p>
 </div>
 </header>

 <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
 <CreditBalance variant="full" />
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid w-full grid-cols-3 p-1.5 h-16 bg-muted/30 rounded-2xl border border-border/40">
 <TabsTrigger
 value="history"
 className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background"
 >
 History
 </TabsTrigger>
 <TabsTrigger
 value="invoices"
 className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background"
 >
 Invoices
 </TabsTrigger>
 <TabsTrigger
 value="statement"
 className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background"
 >
 Statement
 </TabsTrigger>
 </TabsList>

 <TabsContent value="history" className="mt-10 space-y-4 animate-in fade-in">
 {historyLoading ? (
 <Skeleton className="h-24 w-full rounded-2xl" />
 ) : (
 <div className="space-y-3">
 {historyTxns.slice(0, visibleCount).map((tx) => (
 <Card
 key={tx.id}
 className={cn(CARD, "cursor-pointer hover:border-primary/30")}
 onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
 >
 <CardContent className="p-6 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div
 className={cn(
 "h-12 w-12 rounded-2xl flex items-center justify-center border-2",
 tx.amount > 0
 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
 : "bg-primary/5 border-primary/10 text-primary",
 )}
 >
 <Coins className="h-6 w-6" />
 </div>
 <div>
 <h4 className="font-black uppercase italic">{formatTxType(tx.transaction_type)}</h4>
 <p className={META_TEXT}>{format(new Date(tx.created_at), "MMM d, yyyy")}</p>
 </div>
 </div>
 <p
 className={cn(
 "text-xl font-black italic",
 tx.amount > 0 ? "text-emerald-500" : "text-destructive",
 )}
 >
 {tx.amount > 0 ? "+" : ""}
 {tx.amount}
 </p>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </TabsContent>
 </Tabs>
 </div>
 );
}
