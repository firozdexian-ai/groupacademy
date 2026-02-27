import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth, subMonths, addMonths, isBefore, isAfter } from "date-fns";
import {
  Briefcase, Bot, ClipboardCheck, Mic, DollarSign, Gift, CreditCard,
  BookOpen, Coins, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  ArrowLeft, FileText, Settings
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { cn } from "@/lib/utils";

// --- Service icon & label mapping ---
const SERVICE_META: Record<string, { icon: React.ElementType; label: string }> = {
  JOB_APPLICATION: { icon: Briefcase, label: "Job Application" },
  AI_AGENT_CHAT: { icon: Bot, label: "AI Agent Chat" },
  CAREER_ASSESSMENT: { icon: ClipboardCheck, label: "Career Assessment" },
  MOCK_INTERVIEW: { icon: Mic, label: "Mock Interview" },
  SALARY_ANALYSIS: { icon: DollarSign, label: "Salary Analysis" },
  IELTS_MOCK: { icon: BookOpen, label: "IELTS Mock" },
  job_sharing: { icon: Briefcase, label: "Job Share Reward" },
  welcome_bonus: { icon: Gift, label: "Welcome Bonus" },
  purchase: { icon: CreditCard, label: "Credit Purchase" },
  refund: { icon: CreditCard, label: "Refund" },
  gig_reward: { icon: Gift, label: "Gig Reward" },
  service_usage: { icon: Coins, label: "Service Usage" },
};

function getServiceMeta(serviceType: string | null, transactionType: string) {
  if (serviceType && SERVICE_META[serviceType]) return SERVICE_META[serviceType];
  if (SERVICE_META[transactionType]) return SERVICE_META[transactionType];
  return { icon: Coins, label: transactionType?.replace(/_/g, " ") || "Transaction" };
}

interface Transaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  service_type: string | null;
  description: string | null;
  created_at: string;
  is_earned: boolean;
  reference_id: string | null;
}

// ===================== MAIN COMPONENT =====================
export default function Transactions() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { balance, earnedBalance, freeBalance } = useCredits();
  const [activeTab, setActiveTab] = useState("history");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  // --- Month picker state ---
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));

  // ===== HISTORY: last 90 days =====
  const { data: historyTxns = [], isLoading: historyLoading } = useQuery({
    queryKey: ["credit-history", talent?.id],
    queryFn: async () => {
      if (!talent?.id) return [];
      const since = subDays(new Date(), 90).toISOString();
      const { data } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("talent_id", talent.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      return (data as Transaction[]) || [];
    },
    enabled: !!talent?.id,
  });

  // ===== MONTHLY STATEMENT =====
  const monthStart = startOfMonth(selectedMonth).toISOString();
  const monthEnd = endOfMonth(selectedMonth).toISOString();

  const { data: monthTxns = [], isLoading: monthLoading } = useQuery({
    queryKey: ["credit-month", talent?.id, monthStart],
    queryFn: async () => {
      if (!talent?.id) return [];
      const { data } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("talent_id", talent.id)
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd)
        .order("created_at", { ascending: true });
      return (data as Transaction[]) || [];
    },
    enabled: !!talent?.id,
  });

  // Previous month's last transaction for start balance
  const prevMonthEnd = endOfMonth(subMonths(selectedMonth, 1)).toISOString();
  const { data: prevLastTx } = useQuery({
    queryKey: ["credit-prev-balance", talent?.id, prevMonthEnd],
    queryFn: async () => {
      if (!talent?.id) return null;
      const { data } = await supabase
        .from("credit_transactions")
        .select("balance_after")
        .eq("talent_id", talent.id)
        .lte("created_at", prevMonthEnd)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!talent?.id,
  });

  const startBalance = prevLastTx?.balance_after ?? 0;
  const endBalance = monthTxns.length > 0 ? monthTxns[monthTxns.length - 1].balance_after : startBalance;
  const netChange = endBalance - startBalance;

  const lastUpdate = monthTxns.length > 0 ? monthTxns[monthTxns.length - 1].created_at : null;

  // Service-wise breakdown
  const serviceBreakdown = useMemo(() => {
    const map: Record<string, { amount: number; label: string; icon: React.ElementType }> = {};
    monthTxns.forEach((tx) => {
      const key = tx.service_type || tx.transaction_type;
      const meta = getServiceMeta(tx.service_type, tx.transaction_type);
      if (!map[key]) map[key] = { amount: 0, label: meta.label, icon: meta.icon };
      map[key].amount += tx.amount;
    });
    return Object.entries(map).sort((a, b) => a[1].amount - b[1].amount);
  }, [monthTxns]);

  const canGoNext = isBefore(endOfMonth(selectedMonth), new Date());

  const visibleHistory = historyTxns.slice(0, visibleCount);

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold">Transactions</h1>
        </div>
      </div>

      {/* Wallet Summary */}
      <div className="px-4 pb-3">
        <CreditBalance variant="full" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="statement">Monthly Statement</TabsTrigger>
        </TabsList>

        {/* ========== TAB 1: HISTORY ========== */}
        <TabsContent value="history" className="mt-3 space-y-1">
          {/* Statement link */}
          <button
            onClick={() => setActiveTab("statement")}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-card rounded-lg border text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Statement Request</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <p className="text-xs text-muted-foreground pt-2 pb-1 px-1">
            Transactions from last 90 days
          </p>

          {historyLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : visibleHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-1">
              {visibleHistory.map((tx) => {
                const meta = getServiceMeta(tx.service_type, tx.transaction_type);
                const Icon = meta.icon;
                const isPositive = tx.amount > 0;
                const expanded = expandedId === tx.id;
                const date = new Date(tx.created_at);

                return (
                  <Card
                    key={tx.id}
                    className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(expanded ? null : tx.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{meta.label}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {tx.description || meta.label}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className={cn(
                              "text-sm font-semibold",
                              isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                            )}>
                              {isPositive ? "+" : ""}{tx.amount}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] text-muted-foreground">
                            {format(date, "MMM d")} · {format(date, "h:mm a")}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                            Details {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </span>
                        </div>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-2 pt-2 border-t border-border space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Balance after</span>
                          <span className="font-medium text-foreground">{tx.balance_after}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Type</span>
                          <span className="capitalize">{tx.transaction_type.replace(/_/g, " ")}</span>
                        </div>
                        {tx.is_earned && (
                          <div className="flex justify-between">
                            <span>Category</span>
                            <Badge variant="secondary" className="text-[10px] h-4">Earned</Badge>
                          </div>
                        )}
                        {tx.reference_id && (
                          <div className="flex justify-between">
                            <span>Reference</span>
                            <span className="font-mono text-[10px]">{tx.reference_id.slice(0, 8)}…</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}

              {visibleCount < historyTxns.length && (
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => setVisibleCount((c) => c + 20)}
                >
                  Load more
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* ========== TAB 2: MONTHLY STATEMENT ========== */}
        <TabsContent value="statement" className="mt-3 space-y-3">
          {/* Month picker */}
          <div className="flex items-center justify-between bg-card rounded-lg border px-4 py-2.5">
            <button onClick={() => setSelectedMonth((m) => subMonths(m, 1))}>
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <span className="font-semibold text-sm">{format(selectedMonth, "MMMM yyyy")}</span>
            <button
              onClick={() => canGoNext && setSelectedMonth((m) => addMonths(m, 1))}
              disabled={!canGoNext}
              className="disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Last update */}
          {lastUpdate && (
            <p className="text-xs text-muted-foreground px-1">
              Last update: {format(new Date(lastUpdate), "h:mm a, MMM d")}
            </p>
          )}

          {monthLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : (
            <>
              {/* Start / End Balance */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Start Balance</p>
                  <p className="text-xl font-bold">{startBalance}</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">End Balance</p>
                  <p className="text-xl font-bold">{endBalance}</p>
                </Card>
              </div>

              {/* Breakdown */}
              <Card className="p-3">
                <p className="text-sm font-semibold mb-2">Service-wise Breakdown</p>
                {serviceBreakdown.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No transactions this month</p>
                ) : (
                  <div className="space-y-2">
                    {serviceBreakdown.map(([key, { amount, label, icon: SvcIcon }]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <SvcIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{label}</span>
                        </div>
                        <span className={cn(
                          "font-semibold flex-shrink-0",
                          amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                        )}>
                          {amount > 0 ? "+" : ""}{amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Net Change */}
              <Card className="p-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Net Change</span>
                <span className={cn(
                  "text-lg font-bold",
                  netChange > 0 ? "text-emerald-600 dark:text-emerald-400" : netChange < 0 ? "text-destructive" : "text-foreground"
                )}>
                  {netChange > 0 ? "+" : ""}{netChange}
                </span>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
