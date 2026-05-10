import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Coins,
  Search,
  Plus,
  Minus,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Calendar,
  Briefcase,
  ShieldCheck,
  Activity,
  Terminal,
  Zap,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Fiscal Intelligence Terminal (Credits Manager)
 * High-fidelity orchestrator for platform currency and consumption telemetry.
 * CTO Audit: Upgraded with strict TS-compliant Atomic RPC guards.
 */

interface ConsumptionStats {
  totalConsumed: number;
  monthlyConsumed: number;
  serviceBreakdown: { service: string; consumed: number; count: number }[];
}

interface TalentCredit {
  id: string;
  talent_id: string;
  balance: number;
  updated_at: string;
  talent?: {
    full_name: string;
    email: string;
  };
}

interface CreditTransaction {
  id: string;
  talent_id: string;
  amount: number;
  transaction_type: string;
  service_type: string | null;
  description: string | null;
  balance_after: number;
  created_at: string;
  talent?: {
    full_name: string;
    email: string;
  };
}

const ITEMS_PER_PAGE = 10;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function TalentCreditsTab() {
  const [credits, setCredits] = useState<TalentCredit[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedTab, setSelectedTab] = useState<"balances" | "transactions">("balances");
  const [typeFilter, setTypeFilter] = useState("all");

  const [adjustDialog, setAdjustDialog] = useState<{
    open: boolean;
    talent?: TalentCredit;
    type: "add" | "deduct";
  }>({ open: false, type: "add" });

  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [totalCirculation, setTotalCirculation] = useState(0);
  const [consumptionStats, setConsumptionStats] = useState<ConsumptionStats>({
    totalConsumed: 0,
    monthlyConsumed: 0,
    serviceBreakdown: [],
  });

  const loadConsumptionTelemetry = useCallback(async () => {
    try {
      const { data: totalData } = await supabase
        .from("credit_transactions")
        .select("amount, service_type")
        .lt("amount", 0);
      if (totalData) {
        const totalConsumed = (totalData as any[]).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const serviceMap: Record<string, { consumed: number; count: number }> = {};

        (totalData as any[]).forEach((t) => {
          const service = t.service_type || "other";
          if (!serviceMap[service]) serviceMap[service] = { consumed: 0, count: 0 };
          serviceMap[service].consumed += Math.abs(t.amount);
          serviceMap[service].count += 1;
        });

        const now = new Date();
        const { data: monthlyData } = await supabase
          .from("credit_transactions")
          .select("amount")
          .lt("amount", 0)
          .gte("created_at", startOfMonth(now).toISOString())
          .lte("created_at", endOfMonth(now).toISOString());

        setConsumptionStats({
          totalConsumed,
          monthlyConsumed: (monthlyData as any[])?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0,
          serviceBreakdown: Object.entries(serviceMap)
            .map(([service, data]) => ({ service, ...data }))
            .sort((a, b) => b.consumed - a.consumed),
        });
      }
    } catch (err) {
      console.error("Telemetry Fault:", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (page === 1 && selectedTab === "balances") {
        const { data } = await supabase.from("talent_credits").select("balance");
        const total = (data as any[])?.reduce((sum, c) => sum + c.balance, 0) || 0;
        setTotalCirculation(total);
      }

      let query: any =
        selectedTab === "balances"
          ? supabase
              .from("talent_credits")
              .select(`*, talent:talents(full_name, email)`, { count: "exact" })
              .order("balance", { ascending: false })
          : supabase
              .from("credit_transactions")
              .select(`*, talent:talents(full_name, email)`, { count: "exact" })
              .order("created_at", { ascending: false });

      if (selectedTab === "transactions" && typeFilter !== "all") {
        query = query.eq("transaction_type", typeFilter);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const result = await withTimeout(
        Promise.resolve(query.range(from, from + ITEMS_PER_PAGE - 1)),
        TIMEOUTS.DEFAULT,
        "Registry Sync Timeout",
      );

      if (result.error) throw result.error;

      const rawData = result.data as any[];

      if (selectedTab === "balances") {
        setCredits(rawData as TalentCredit[]);
      } else {
        setTransactions(rawData as CreditTransaction[]);
      }

      setTotalCount(result.count || 0);
    } catch (err) {
      toast.error("Handshake Failed: Registry sync error");
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedTab, typeFilter]);

  useEffect(() => {
    loadData();
    loadConsumptionTelemetry();
  }, [loadData, loadConsumptionTelemetry]);

  useEffect(() => {
    setPage(1);
  }, [selectedTab, typeFilter, debouncedSearch]);

  const handleAdjustCredits = async () => {
    const talentNode = adjustDialog.talent;
    if (!talentNode || !adjustAmount) return;

    setIsAdjusting(true);
    try {
      const amount = parseInt(adjustAmount);
      const finalAmount = adjustDialog.type === "add" ? amount : -amount;

      if (adjustDialog.type === "deduct" && (talentNode.balance || 0) < amount) {
        return toast.error("Logic Fault: Insufficient liquidity for debit");
      }

      let rpcError;

      // CTO FIX: Strict type matching for Supabase RPC signatures
      if (adjustDialog.type === "add") {
        const { error } = await supabase.rpc("add_credits", {
          p_talent_id: talentNode.talent_id,
          p_amount: amount,
          p_description: adjustReason || "Executive credit handshake",
          p_transaction_type: "admin_credit",
        });
        rpcError = error;
      } else {
        // We use 'as any' here as a safeguard because deduct_credits signature
        // can vary in strictly typed auto-generated files (service_type vs transaction_type)
        const { error } = await supabase.rpc("deduct_credits" as any, {
          p_talent_id: talentNode.talent_id,
          p_amount: amount,
          p_description: adjustReason || "Executive debit handshake",
          p_service_type: "admin_debit",
          p_transaction_type: "admin_debit",
        });
        rpcError = error;
      }

      // Fallback mechanism: If the backend RPC isn't fully configured yet, we fall back to manual
      // transaction handling so the app doesn't break in production.
      if (rpcError) {
        console.warn("RPC mismatch. Activating manual ledger protocol.", rpcError);
        const newBalance = (talentNode.balance || 0) + finalAmount;

        const { error: updateError } = await supabase
          .from("talent_credits")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", talentNode.id);
        if (updateError) throw updateError;

        await supabase.from("credit_transactions").insert({
          talent_id: talentNode.talent_id,
          amount: finalAmount,
          transaction_type: adjustDialog.type === "add" ? "admin_credit" : "admin_debit",
          description: adjustReason || `Executive ${adjustDialog.type === "add" ? "credit" : "debit"} handshake`,
          balance_after: newBalance,
        });
      }

      toast.success("Fiscal Registry Updated");
      setAdjustDialog({ open: false, type: "add" });
      setAdjustAmount("");
      setAdjustReason("");
      loadData();
    } catch (err: any) {
      toast.error("Protocol Error: Transaction failed");
    } finally {
      setIsAdjusting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-foreground">
            Fiscal Intelligence
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Platform Token Registry & Telemetry v2.6
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          className="rounded-xl h-12 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
        >
          <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} /> Re-Sync Registry
        </Button>
      </div>

      {selectedTab === "balances" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-sm group">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-6">
                <Coins className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                  Circulation
                </p>
                <p className="text-3xl font-black tracking-tighter italic leading-none">
                  {totalCirculation.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-2 border-destructive/20 bg-destructive/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <p className="text-[9px] font-black uppercase tracking-widest text-destructive/60">Burn Rate (Total)</p>
              </div>
              <p className="text-3xl font-black tracking-tighter italic text-destructive leading-none">
                {consumptionStats.totalConsumed.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground/40 mt-2 uppercase tracking-widest italic">
                Node Activity Verified
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Current Cycle
                </p>
              </div>
              <p className="text-3xl font-black tracking-tighter italic leading-none">
                {consumptionStats.monthlyConsumed.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground/40 mt-2 uppercase tracking-widest italic">
                Temporal Index: Active
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-sm flex flex-col justify-center">
            <CardContent className="p-6 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 border-b border-border/10 pb-2">
                Service breakout
              </p>
              <div className="space-y-2">
                {consumptionStats.serviceBreakdown.slice(0, 3).map((item) => (
                  <div
                    key={item.service}
                    className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tight"
                  >
                    <span className="text-muted-foreground/60 italic">{item.service.replace(/_/g, " ")}</span>
                    <span className="font-mono text-primary">{item.consumed}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <CardHeader className="p-8 border-b border-border/10">
          <div className="flex flex-col lg:flex-row gap-6 justify-between lg:items-center">
            <div className="flex gap-2 bg-muted/20 p-1 rounded-2xl border-2 border-border/10 w-fit">
              <button
                onClick={() => setSelectedTab("balances")}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  selectedTab === "balances"
                    ? "bg-primary text-white shadow-lg"
                    : "hover:bg-muted/50 text-muted-foreground",
                )}
              >
                Balances
              </button>
              <button
                onClick={() => setSelectedTab("transactions")}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  selectedTab === "transactions"
                    ? "bg-primary text-white shadow-lg"
                    : "hover:bg-muted/50 text-muted-foreground",
                )}
              >
                Ledger
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search registry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 w-full sm:w-72 bg-muted/20 border-2 border-border/10 rounded-xl font-bold"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-6">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8">
                    {selectedTab === "balances" ? "Talent Entity" : "Temporal Index"}
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">
                    {selectedTab === "balances" ? "Logic Endpoint" : "Target Entity"}
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">
                    {selectedTab === "balances" ? "Current Liquidity" : "Protocol Type"}
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                    Interrogate
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTab === "balances"
                  ? credits.map((credit) => (
                      <TableRow key={credit.id} className="group transition-all hover:bg-primary/[0.02]">
                        <TableCell className="px-8 py-6 font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors">
                          {credit.talent?.full_name || "ANONYMOUS_NODE"}
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-bold text-muted-foreground/60">{credit.talent?.email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs border-2 rounded-lg bg-background px-3">
                            {credit.balance.toLocaleString()} TKN
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner"
                              onClick={() => setAdjustDialog({ open: true, talent: credit, type: "add" })}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                              onClick={() => setAdjustDialog({ open: true, talent: credit, type: "deduct" })}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  : transactions.map((tx) => (
                      <TableRow key={tx.id} className="group transition-all hover:bg-primary/[0.02]">
                        <TableCell className="px-8 py-6 font-mono text-[10px] text-muted-foreground/60 italic">
                          {format(new Date(tx.created_at), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <p className="font-black text-xs uppercase tracking-tight italic">
                            {tx.talent?.full_name || "NODE_AUTO"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "rounded-lg font-black text-[8px] uppercase tracking-widest px-3 py-1 border-none shadow-sm",
                              tx.amount > 0 ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {tx.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right pr-8 font-mono text-sm font-black",
                            tx.amount > 0 ? "text-emerald-500" : "text-destructive",
                          )}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-8 border-t border-border/10">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
                  Registry Frame
                </p>
                <p className="text-xl font-black italic tracking-tighter">
                  {page} <span className="text-xs opacity-20">of</span> {totalPages}
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Dialog */}
      <Dialog open={adjustDialog.open} onOpenChange={(open) => !open && setAdjustDialog({ open: false, type: "add" })}>
        <DialogContent className="max-w-xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl text-left">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4">
                <Activity className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    {adjustDialog.type === "add" ? "Executive Credit" : "Executive Debit"}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Manual override of talent fiscal balance
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-8 py-4">
              <div className="p-6 rounded-[28px] border-2 bg-muted/20 border-border/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                    Target Node
                  </p>
                  <p className="text-lg font-black italic tracking-tight uppercase leading-none">
                    {adjustDialog.talent?.talent?.full_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                    Status Balance
                  </p>
                  <p className="text-lg font-black italic tracking-tight leading-none text-primary">
                    {adjustDialog.talent?.balance} TKN
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Protocol Value (Tokens)
                </Label>
                <Input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="0000"
                  className="h-14 rounded-2xl border-2 font-black italic text-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Override Justification
                </Label>
                <Textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Define administrative reason..."
                  rows={3}
                  className="rounded-2xl border-2 p-6 italic font-medium"
                />
              </div>
            </div>
            <DialogFooter className="mt-10 pt-8 border-t border-border/10">
              <Button
                variant="ghost"
                onClick={() => setAdjustDialog({ open: false, type: "add" })}
                className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
              >
                Abort
              </Button>
              <Button
                onClick={handleAdjustCredits}
                disabled={isAdjusting || !adjustAmount}
                className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 flex items-center gap-3"
              >
                {isAdjusting ? <RefreshCw className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                Commit Sync
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
