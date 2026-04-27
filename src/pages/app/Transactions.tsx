import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth, subMonths, addMonths, isBefore } from "date-fns";
import {
  Briefcase,
  Bot,
  ClipboardCheck,
  Mic,
  DollarSign,
  Gift,
  CreditCard,
  BookOpen,
  Coins,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Zap,
  TrendingUp,
  History,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { MyInvoicesList } from "@/components/credits/MyInvoicesList";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Credit Ledger & Monthly Statement
 * High-fidelity orchestrator for economic telemetry and service usage indexing.
 * 2026 Standard: Executive Logic geometry with reinforced financial guards.
 */

const SERVICE_META: Record<string, { icon: React.ElementType; label: string }> = {
  JOB_APPLICATION: { icon: Briefcase, label: "Job Protocol" },
  AI_AGENT_CHAT: { icon: Bot, label: "Neural Handshake" },
  CAREER_ASSESSMENT: { icon: ClipboardCheck, label: "Logic Scorecard" },
  MOCK_INTERVIEW: { icon: Mic, label: "Vocal Calibration" },
  SALARY_ANALYSIS: { icon: DollarSign, label: "Market Intel" },
  IELTS_MOCK: { icon: BookOpen, label: "Language Sync" },
  job_sharing: { icon: Zap, label: "Viral Bounty" },
  welcome_bonus: { icon: Gift, label: "Genesis Bonus" },
  purchase: { icon: CreditCard, label: "Credit Injection" },
  refund: { icon: ShieldCheck, label: "Ledger Revert" },
  gig_reward: { icon: TrendingUp, label: "Performance Pay" },
  service_usage: { icon: Coins, label: "Protocol Fee" },
};

function getServiceMeta(serviceType: string | null, transactionType: string) {
  if (serviceType && SERVICE_META[serviceType]) return SERVICE_META[serviceType];
  if (SERVICE_META[transactionType]) return SERVICE_META[transactionType];
  return { icon: Coins, label: transactionType?.replace(/_/g, " ").toUpperCase() || "TRANSACTION" };
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

export default function Transactions() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { balance } = useCredits();
  const [activeTab, setActiveTab] = useState("history");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));

  // --- Registry Fetch: Last 90 Days ---
  const { data: historyTxns = [], isLoading: historyLoading } = useQuery({
    queryKey: ["credit-history", talent?.id],
    queryFn: async () => {
      if (!talent?.id) return [];
      const since = subDays(new Date(), 90).toISOString();
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("talent_id", talent.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Transaction[]) || [];
    },
    enabled: !!talent?.id,
  });

  // --- Statement Fetch: Monthly Segment ---
  const monthStart = startOfMonth(selectedMonth).toISOString();
  const monthEnd = endOfMonth(selectedMonth).toISOString();

  const { data: monthTxns = [], isLoading: monthLoading } = useQuery({
    queryKey: ["credit-month", talent?.id, monthStart],
    queryFn: async () => {
      if (!talent?.id) return [];
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("talent_id", talent.id)
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as Transaction[]) || [];
    },
    enabled: !!talent?.id,
  });

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

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-40 space-y-10 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-11 w-11 hover:bg-primary/5"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Credit Ledger</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
              Economic Telemetry Node
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] px-3 py-1 italic tracking-widest"
        >
          Logic Sync Active
        </Badge>
      </header>

      {/* Wallet HUD */}
      <div className="rounded-[40px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden">
        <CreditBalance variant="full" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 p-1.5 h-16 bg-muted/30 backdrop-blur-md rounded-[32px] border border-border/40 max-w-xl mx-auto">
          <TabsTrigger
            value="history"
            className="rounded-[24px] font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            <History className="h-3.5 w-3.5" /> History
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="rounded-[24px] font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            <CreditCard className="h-3.5 w-3.5" /> Invoices
          </TabsTrigger>
          <TabsTrigger
            value="statement"
            className="rounded-[24px] font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            <FileText className="h-3.5 w-3.5" /> Statement
          </TabsTrigger>
        </TabsList>

        {/* ========== TAB 1: REGISTRY HISTORY ========== */}
        <TabsContent
          value="history"
          className="mt-10 space-y-6 outline-none animate-in slide-in-from-bottom-4 duration-700"
        >
          <Button
            variant="ghost"
            onClick={() => setActiveTab("statement")}
            className="w-full h-16 rounded-[24px] border-2 border-dashed border-border/60 justify-between px-8 group hover:bg-primary/5 hover:border-primary/40 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:rotate-12 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <span className="font-black uppercase text-[11px] tracking-widest italic">
                Request Detailed Monthly Artifact
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:translate-x-1 transition-all" />
          </Button>

          <div className="flex items-center gap-3 px-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
              Last 90 Days Telemetry
            </h2>
          </div>

          {historyLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-[32px] bg-muted/40" />
              ))}
            </div>
          ) : historyTxns.length === 0 ? (
            <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-muted/5 py-24 text-center">
              <Coins className="h-16 w-16 mx-auto opacity-10 mb-6 rotate-12" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
                Ledger Empty: No recorded handshakes
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {historyTxns.slice(0, visibleCount).map((tx) => {
                const meta = getServiceMeta(tx.service_type, tx.transaction_type);
                const isPositive = tx.amount > 0;
                const expanded = expandedId === tx.id;

                return (
                  <Card
                    key={tx.id}
                    className={cn(
                      "group rounded-[28px] border-2 border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 cursor-pointer overflow-hidden",
                      expanded && "border-primary/40 shadow-xl",
                    )}
                    onClick={() => setExpandedId(expanded ? null : tx.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div
                          className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                            isPositive
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : "bg-primary/5 border-primary/10 text-primary",
                          )}
                        >
                          <meta.icon className="h-7 w-7" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-black text-base uppercase tracking-tighter italic leading-none group-hover:text-primary transition-colors">
                                {meta.label}
                              </h4>
                              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1.5 truncate max-w-[200px] sm:max-w-md">
                                {tx.description || "System Verification"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={cn(
                                  "text-2xl font-black italic tracking-tighter leading-none",
                                  isPositive ? "text-emerald-500" : "text-destructive",
                                )}
                              >
                                {isPositive ? "+" : ""}
                                {tx.amount}
                              </p>
                              <p className="text-[8px] font-black uppercase text-muted-foreground/30 tracking-widest mt-1">
                                CREDITS
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-border/10 mt-3">
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest italic">
                              {format(new Date(tx.created_at), "MMM d, yyyy · h:mm a")}
                            </span>
                            <div className="flex items-center gap-1.5 text-primary/40 text-[9px] font-black uppercase tracking-widest">
                              {expanded ? "Collapse Node" : "Interrogate"}
                              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {expanded && (
                        <div className="mt-6 pt-6 border-t-2 border-dashed border-border/20 grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">
                                Registry Post-Balance
                              </p>
                              <p className="text-sm font-black italic">{tx.balance_after} Credits</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">
                                Artifact Category
                              </p>
                              <Badge
                                variant="secondary"
                                className="bg-primary/5 text-primary border-none rounded-md text-[8px] font-black uppercase"
                              >
                                {tx.transaction_type.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-4 text-right">
                            <div className="space-y-1">
                              <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">
                                Node ID Hash
                              </p>
                              <p className="text-[10px] font-mono font-bold opacity-60 truncate">{tx.id}</p>
                            </div>
                            {tx.is_earned && (
                              <Badge className="bg-emerald-500 text-white border-none rounded-lg text-[8px] font-black px-3 py-1 uppercase tracking-widest italic">
                                Earned Artifact
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {visibleCount < historyTxns.length && (
                <Button
                  variant="ghost"
                  className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 hover:text-primary transition-all"
                  onClick={() => setVisibleCount((c) => c + 20)}
                >
                  Load Archived Data Logs
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* ========== TAB: INVOICES ========== */}
        <TabsContent
          value="invoices"
          className="mt-10 space-y-4 animate-in slide-in-from-bottom-4 duration-700 outline-none"
        >
          <MyInvoicesList />
        </TabsContent>

        {/* ========== TAB: MONTHLY STATEMENT ========== */}
        <TabsContent
          value="statement"
          className="mt-10 space-y-10 animate-in slide-in-from-bottom-4 duration-700 outline-none"
        >
          {/* Month Selector HUD */}
          <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-[32px] border-2 border-border/40 p-4 shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-12 w-12 hover:bg-primary/10"
              onClick={() => setSelectedMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="h-6 w-6 text-primary" />
            </Button>
            <div className="text-center">
              <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none">
                {format(selectedMonth, "MMMM yyyy")}
              </h3>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
                Statement Analysis Node
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-12 w-12 hover:bg-primary/10 disabled:opacity-10"
              onClick={() => setSelectedMonth((m) => addMonths(m, 1))}
              disabled={!isBefore(endOfMonth(selectedMonth), new Date())}
            >
              <ChevronRight className="h-6 w-6 text-primary" />
            </Button>
          </div>

          {monthLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-32 rounded-[32px]" />
                <Skeleton className="h-32 rounded-[32px]" />
              </div>
              <Skeleton className="h-64 rounded-[32px]" />
            </div>
          ) : (
            <div className="space-y-10">
              {/* Ledger Summary Grid */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-8 shadow-sm">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mb-3 italic text-center">
                    Opening Balance
                  </p>
                  <p className="text-4xl font-black italic tracking-tighter text-center leading-none">{startBalance}</p>
                </Card>
                <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-8 shadow-sm">
                  <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mb-3 italic text-center">
                    Closing Balance
                  </p>
                  <p className="text-4xl font-black italic tracking-tighter text-center leading-none text-primary">
                    {endBalance}
                  </p>
                </Card>
              </div>

              {/* Service Artifact Breakdown */}
              <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="p-8 bg-muted/20 border-b border-border/10 flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                    <TrendingUp className="h-4 w-4" /> Dimension Breakdown
                  </h3>
                  <span className="text-[9px] font-mono text-muted-foreground/40">
                    {monthTxns.length} Artifacts Analyzed
                  </span>
                </div>
                <CardContent className="p-10">
                  {serviceBreakdown.length === 0 ? (
                    <div className="text-center py-10 opacity-30 italic text-sm">
                      No transaction handshakes detected in this cycle.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {serviceBreakdown.map(([key, { amount, label, icon: SvcIcon }]) => (
                        <div key={key} className="flex items-center justify-between group">
                          <div className="flex items-center gap-5 min-w-0">
                            <div className="h-12 w-12 rounded-xl bg-background/50 border border-border/40 flex items-center justify-center transition-transform group-hover:scale-110">
                              <SvcIcon className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary" />
                            </div>
                            <span className="font-black uppercase tracking-widest text-[11px] italic text-foreground/70 group-hover:text-foreground transition-colors">
                              {label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="h-[1px] w-20 bg-muted-foreground/10 hidden sm:block" />
                            <span
                              className={cn(
                                "text-xl font-black italic tracking-tighter",
                                amount > 0 ? "text-emerald-500" : "text-destructive",
                              )}
                            >
                              {amount > 0 ? "+" : ""}
                              {amount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Indicator Card */}
              <Card
                className={cn(
                  "rounded-[32px] border-2 p-10 flex items-center justify-between shadow-2xl overflow-hidden relative group",
                  netChange >= 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5",
                )}
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <TrendingUp className="h-32 w-32" />
                </div>
                <div className="space-y-1.5 relative z-10">
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Net Trajectory</h3>
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Monthly Credit Variance Analyzed
                  </p>
                </div>
                <div className="text-right relative z-10">
                  <p
                    className={cn(
                      "text-5xl font-black italic tracking-tighter leading-none",
                      netChange > 0 ? "text-emerald-500" : netChange < 0 ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {netChange > 0 ? "+" : ""}
                    {netChange}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-2">Cycle Delta</p>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Credit Registry: Verified Node</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Economic Protocol v2.6.4 Synchronized
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
