import { useState, useEffect, useCallback } from "react";

import {
 getTalentCreditsTotalCirculation,
 buildListTalentCreditsQuery,
 buildListCreditTransactionsQuery,
 getConsumptionTotals,
 getMonthlyConsumption,
 manualAdjustTalentCredit,
 addCreditsRpc,
 deductCreditsRpc,
} from "@/domains/finance/repo/financeRepo";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
 Coins,
 Search,
 Plus,
 Minus,
 RefreshCw,
 ChevronLeft,
 ChevronRight,
 TrendingDown,
 Calendar,
 Activity,
 CircleDollarSign,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Talent Credits Terminal
 * 2026 Standard: Blended Phase 6 UI (Deep Pagination & RPC Mutations)
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
 talent?: { full_name: string; email: string };
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
 talent?: { full_name: string; email: string };
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

 const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; talent?: TalentCredit; type: "add" | "deduct" }>({
 open: false,
 type: "add",
 });
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
 const totalData = await getConsumptionTotals();
 const totalConsumed = totalData.reduce((sum, t) => sum + Math.abs(t.amount), 0);
 const serviceMap: Record<string, { consumed: number; count: number }> = {};
 totalData.forEach((t) => {
 const service = t.service_type || "other";
 if (!serviceMap[service]) serviceMap[service] = { consumed: 0, count: 0 };
 serviceMap[service].consumed += Math.abs(t.amount);
 serviceMap[service].count += 1;
 });

 const now = new Date();
 const monthlyData = await getMonthlyConsumption(
 startOfMonth(now).toISOString(),
 endOfMonth(now).toISOString(),
 );

 setConsumptionStats({
 totalConsumed,
 monthlyConsumed: monthlyData.reduce((sum, t) => sum + Math.abs(t.amount), 0),
 serviceBreakdown: Object.entries(serviceMap)
 .map(([service, data]) => ({ service, ...data }))
 .sort((a, b) => b.consumed - a.consumed),
 });
 } catch (err) {
 console.error("Telemetry Fault:", err);
 }
 }, []);

 const loadData = useCallback(async () => {
 setIsLoading(true);
 try {
 if (page === 1 && selectedTab === "balances") {
 setTotalCirculation(await getTalentCreditsTotalCirculation());
 }

 const query =
 selectedTab === "balances"
 ? buildListTalentCreditsQuery({ page, pageSize: ITEMS_PER_PAGE })
 : buildListCreditTransactionsQuery({ page, pageSize: ITEMS_PER_PAGE, typeFilter });

 const result = await withTimeout(
 Promise.resolve(query),
 TIMEOUTS.DEFAULT,
 "Registry Sync Timeout",
 );
 if (result.error) throw result.error;

 if (selectedTab === "balances") setCredits(result.data as TalentCredit[]);
 else setTransactions(result.data as CreditTransaction[]);

 setTotalCount(result.count || 0);
 } catch (err) {
 toast.error("Failed: Save failed");
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

 let rpcError: any = null;
 try {
 if (adjustDialog.type === "add") {
 await addCreditsRpc({
 talentId: talentNode.talent_id,
 amount,
 description: adjustReason || "Executive credit handshake",
 transactionType: "admin_credit",
 });
 } else {
 await deductCreditsRpc({
 talentId: talentNode.talent_id,
 amount,
 description: adjustReason || "Executive debit handshake",
 serviceType: "admin_debit",
 transactionType: "admin_debit",
 });
 }
 } catch (e) {
 rpcError = e;
 }

 if (rpcError) {
 console.warn("RPC mismatch. Activating manual ledger protocol.", rpcError);
 const newBalance = (talentNode.balance || 0) + finalAmount;
 await manualAdjustTalentCredit({
 creditId: talentNode.id,
 talentId: talentNode.talent_id,
 newBalance,
 delta: finalAmount,
 transactionType: adjustDialog.type === "add" ? "admin_credit" : "admin_debit",
 description: adjustReason || `Executive ${adjustDialog.type === "add" ? "credit" : "debit"} handshake`,
 });
 }

 toast.success("Credits updated");
 setAdjustDialog({ open: false, type: "add" });
 setAdjustAmount("");
 setAdjustReason("");
 loadData();
 } catch (err: any) {
 toast.error("Error: Transaction failed");
 } finally {
 setIsAdjusting(false);
 }
 };

 const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

 return (
 <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
 {/* Phase 6 Executive Header */}
 <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
 <div className="space-y-1 text-left">
 <div className="flex items-center gap-3 text-blue-500">
 <CircleDollarSign className="h-8 w-8 text-blue-500 fill-blue-500/20" />
 <h2 className="text-4xl font-semibold uppercase tracking-tight italic leading-none text-foreground">
 Talent Credits
 </h2>
 </div>
 <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
 B2C Token Registry & Telemetry v2.6
 </p>
 </div>
 <Button
 variant="outline"
 onClick={loadData}
 className="rounded-xl h-12 px-6 border font-semibold uppercase text-xs gap-2 text-blue-600 border-blue-500/20 bg-blue-500/10 hover:bg-blue-500 hover:text-white transition-all"
 >
 <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Re-Sync Registry
 </Button>
 </header>

 {/* KPI Cards */}
 {selectedTab === "balances" && (
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 <Card className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm shadow-sm group">
 <CardContent className="p-6 flex items-center gap-6">
 <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-white/5 transition-transform group-hover:rotate-6">
 <Coins className="h-7 w-7 text-blue-500" />
 </div>
 <div className="text-left">
 <p className="text-[9px] font-semibold text-muted-foreground/40 mb-1">
 Circulation
 </p>
 <p className="text-3xl font-semibold tracking-tight italic leading-none">
 {totalCirculation.toLocaleString()}
 </p>
 </div>
 </CardContent>
 </Card>

 <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 shadow-sm text-left">
 <CardContent className="p-6">
 <div className="flex items-center gap-2 mb-3">
 <TrendingDown className="h-4 w-4 text-destructive" />
 <p className="text-[9px] font-semibold text-destructive/60">Burn Rate (Total)</p>
 </div>
 <p className="text-3xl font-semibold tracking-tight italic text-destructive leading-none">
 {consumptionStats.totalConsumed.toLocaleString()}
 </p>
 <p className="text-sm font-medium text-muted-foreground/40 mt-2 italic">
 Node Activity Verified
 </p>
 </CardContent>
 </Card>

 <Card className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm shadow-sm text-left">
 <CardContent className="p-6">
 <div className="flex items-center gap-2 mb-3">
 <Calendar className="h-4 w-4 text-primary" />
 <p className="text-[9px] font-semibold text-muted-foreground/40">
 Current Cycle
 </p>
 </div>
 <p className="text-3xl font-semibold tracking-tight italic leading-none">
 {consumptionStats.monthlyConsumed.toLocaleString()}
 </p>
 <p className="text-sm font-medium text-muted-foreground/40 mt-2 italic">
 Temporal Index: Active
 </p>
 </CardContent>
 </Card>

 <Card className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm shadow-sm flex flex-col justify-center text-left">
 <CardContent className="p-6 space-y-3">
 <p className="text-[9px] font-semibold text-muted-foreground/40 border-b border-border/10 pb-2">
 Service breakout
 </p>
 <div className="space-y-2">
 {consumptionStats.serviceBreakdown.slice(0, 3).map((item) => (
 <div
 key={item.service}
 className="flex items-center justify-between text-xs font-medium tracking-tight"
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

 {/* Main Ledger Component */}
 <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card">
 <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600" />
 <CardHeader className="p-8 border-b border-border/10">
 <div className="flex flex-col lg:flex-row gap-6 justify-between lg:items-center">
 <div className="flex gap-2 bg-muted/20 p-1 rounded-2xl border border-border/40 w-fit">
 <button
 onClick={() => setSelectedTab("balances")}
 className={cn(
 "px-6 py-2 rounded-xl text-[10px] font-black transition-all",
 selectedTab === "balances"
 ? "bg-blue-600 text-white shadow-lg"
 : "hover:bg-muted/50 text-muted-foreground",
 )}
 >
 Balances
 </button>
 <button
 onClick={() => setSelectedTab("transactions")}
 className={cn(
 "px-6 py-2 rounded-xl text-[10px] font-black transition-all",
 selectedTab === "transactions"
 ? "bg-blue-600 text-white shadow-lg"
 : "hover:bg-muted/50 text-muted-foreground",
 )}
 >
 Ledger
 </button>
 </div>
 <div className="flex flex-col sm:flex-row gap-4">
 <div className="relative group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-blue-500 transition-colors" />
 <Input
 placeholder="Search registry..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-11 h-12 w-full sm:w-72 bg-muted/20 border border-border/40 rounded-xl font-bold"
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
 <div className="overflow-x-auto">
 <Table>
 <TableHeader className="bg-muted/10 border-b border-border/20">
 <TableRow className="hover:bg-transparent">
 <TableHead className="text-[10px] font-semibold py-6 pl-8">
 {selectedTab === "balances" ? "Talent Entity" : "Temporal Index"}
 </TableHead>
 <TableHead className="text-[10px] font-semibold">
 {selectedTab === "balances" ? "Logic Endpoint" : "Target Entity"}
 </TableHead>
 <TableHead className="text-[10px] font-semibold">
 {selectedTab === "balances" ? "Current balance" : "Type"}
 </TableHead>
 <TableHead className="text-right text-[10px] font-semibold pr-8">
 Interrogate
 </TableHead>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-border/5">
 {selectedTab === "balances"
 ? credits.map((credit) => (
 <TableRow key={credit.id} className="group transition-all hover:bg-blue-500/[0.02]">
 <TableCell className="px-8 py-6 font-semibold text-sm uppercase tracking-tight italic group-hover:text-blue-500 transition-colors text-left">
 {credit.talent?.full_name || "Anonymous"}
 </TableCell>
 <TableCell className="text-left">
 <span className="text-[11px] font-bold text-muted-foreground/60">
 {credit.talent?.email}
 </span>
 </TableCell>
 <TableCell className="text-left">
 <Badge
 variant="outline"
 className="font-mono text-[10px] border rounded-lg bg-background px-3 border-blue-500/20 text-blue-600"
 >
 {credit.balance.toLocaleString()} TKN
 </Badge>
 </TableCell>
 <TableCell className="text-right pr-8">
 <div className="flex gap-2 justify-end opacity-20 group-hover:opacity-100 transition-opacity">
 <Button
 variant="ghost"
 size="icon" aria-label="Add"
 className="h-10 w-10 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border"
 onClick={() => setAdjustDialog({ open: true, talent: credit, type: "add" })}
 >
 <Plus className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon" aria-label="Remove"
 className="h-10 w-10 rounded-xl hover:bg-destructive text-destructive hover:text-white transition-all border"
 onClick={() => setAdjustDialog({ open: true, talent: credit, type: "deduct" })}
 >
 <Minus className="h-4 w-4" />
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))
 : transactions.map((tx) => (
 <TableRow key={tx.id} className="group transition-all hover:bg-blue-500/[0.02]">
 <TableCell className="px-8 py-6 font-mono text-[10px] text-muted-foreground/60 italic text-left">
 {format(new Date(tx.created_at), "MMM d, HH:mm:ss")}
 </TableCell>
 <TableCell className="text-left">
 <p className="font-semibold text-xs uppercase tracking-tight italic">
 {tx.talent?.full_name || "System"}
 </p>
 </TableCell>
 <TableCell className="text-left">
 <Badge
 className={cn(
 "rounded-lg font-black text-[8px] px-3 py-1 border-none",
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
 </div>
 )}

 {/* Pagination Controls */}
 {totalPages > 1 && (
 <div className="flex items-center justify-between p-8 border-t border-border/10 bg-muted/5">
 <div className="space-y-1 text-left">
 <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground/40 italic">
 Registry Frame
 </p>
 <p className="text-xl font-semibold tracking-tight">
 {page} <span className="text-xs opacity-20">of</span> {totalPages}
 </p>
 </div>
 <div className="flex gap-4">
 <Button
 variant="outline"
 size="icon" aria-label="Previous"
 className="h-12 w-12 rounded-xl border hover:bg-blue-600 hover:text-white transition-all"
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 disabled={page === 1}
 >
 <ChevronLeft className="h-5 w-5" />
 </Button>
 <Button
 variant="outline"
 size="icon" aria-label="Next"
 className="h-12 w-12 rounded-xl border hover:bg-blue-600 hover:text-white transition-all"
 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
 disabled={page === totalPages}
 >
 <ChevronRight className="h-5 w-5" />
 </Button>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* RPC Adjust Dialog */}
 <Dialog open={adjustDialog.open} onOpenChange={(open) => !open && setAdjustDialog({ open: false, type: "add" })}>
 <DialogContent className="max-w-xl rounded-2xl border-4 border-border/40 bg-background/95 p-0 overflow-hidden shadow-sm text-left">
 <div
 className={cn(
 "h-2 w-full",
 adjustDialog.type === "add"
 ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
 : "bg-gradient-to-r from-destructive/80 to-destructive",
 )}
 />
 <div className="p-10">
 <DialogHeader className="mb-8">
 <div className="flex items-center gap-4">
 <Activity
 className={cn("h-8 w-8", adjustDialog.type === "add" ? "text-emerald-500" : "text-destructive")}
 />
 <div className="text-left">
 <DialogTitle className="text-3xl font-semibold uppercase tracking-tight italic">
 {adjustDialog.type === "add" ? "Executive Credit" : "Executive Debit"}
 </DialogTitle>
 <DialogDescription className="text-sm font-medium text-muted-foreground/60">
 Manual override of talent fiscal balance
 </DialogDescription>
 </div>
 </div>
 </DialogHeader>
 <div className="space-y-8 py-4">
 <div className="p-6 rounded-2xl border bg-muted/20 border-border/10 flex items-center justify-between">
 <div>
 <p className="text-[10px] font-semibold text-muted-foreground/40 mb-1">
 Target Node
 </p>
 <p className="text-lg font-semibold tracking-tight uppercase leading-none">
 {adjustDialog.talent?.talent?.full_name}
 </p>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-semibold text-muted-foreground/40 mb-1">
 Status Balance
 </p>
 <p className="text-lg font-semibold tracking-tight leading-none text-blue-500">
 {adjustDialog.talent?.balance} TKN
 </p>
 </div>
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold text-primary ml-1">
 Amount (credits)
 </Label>
 <Input
 type="number"
 value={adjustAmount}
 onChange={(e) => setAdjustAmount(e.target.value)}
 placeholder="0000"
 className="h-10 rounded-xl border font-semibold text-xl"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold text-primary ml-1">
 Override Justification
 </Label>
 <Textarea
 value={adjustReason}
 onChange={(e) => setAdjustReason(e.target.value)}
 placeholder="Define administrative reason..."
 rows={3}
 className="rounded-2xl border p-6 italic font-medium"
 />
 </div>
 </div>
 <DialogFooter className="mt-10 pt-8 border-t border-border/10">
 <Button
 variant="ghost"
 onClick={() => setAdjustDialog({ open: false, type: "add" })}
 className="h-14 px-8 font-semibold uppercase text-xs"
 >
 Abort
 </Button>
 <Button
 onClick={handleAdjustCredits}
 disabled={isAdjusting || !adjustAmount}
 className={cn(
 "h-10 px-4 rounded-xl font-black text-[11px] shadow-sm flex items-center gap-3 text-white",
 adjustDialog.type === "add"
 ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
 : "bg-destructive hover:bg-destructive/90 shadow-destructive/20",
 )}
 >
 {isAdjusting ? <RefreshCw className="animate-spin h-4 w-4" /> : <Activity className="h-4 w-4" />} Commit
 Sync
 </Button>
 </DialogFooter>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}

export default TalentCreditsTab;
