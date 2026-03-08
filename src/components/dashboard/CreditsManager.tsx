import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Coins, Search, Plus, Minus, Download, RefreshCw, ChevronLeft, ChevronRight, TrendingDown, Calendar, Briefcase } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";

// Revenue analytics state
interface ConsumptionStats {
  totalConsumed: number;
  monthlyConsumed: number;
  serviceBreakdown: { service: string; consumed: number; count: number }[];
}

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
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

export function CreditsManager() {
  // Data State
  const [credits, setCredits] = useState<TalentCredit[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedTab, setSelectedTab] = useState<"balances" | "transactions">("balances");
  const [typeFilter, setTypeFilter] = useState("all");

  // Adjust Dialog State
  const [adjustDialog, setAdjustDialog] = useState<{
    open: boolean;
    talent?: TalentCredit;
    type: "add" | "deduct";
  }>({ open: false, type: "add" });
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Stats
  const [totalCirculation, setTotalCirculation] = useState(0);
  const [consumptionStats, setConsumptionStats] = useState<ConsumptionStats>({
    totalConsumed: 0,
    monthlyConsumed: 0,
    serviceBreakdown: [],
  });

  // Fetch consumption analytics
  const loadConsumptionStats = useCallback(async () => {
    try {
      // Total consumed (all-time) - negative amounts indicate consumption
      const { data: totalData } = await supabase
        .from("credit_transactions")
        .select("amount, service_type")
        .lt("amount", 0);

      if (totalData) {
        const totalConsumed = totalData.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        // Group by service type
        const serviceMap: Record<string, { consumed: number; count: number }> = {};
        totalData.forEach((t) => {
          const service = t.service_type || "other";
          if (!serviceMap[service]) {
            serviceMap[service] = { consumed: 0, count: 0 };
          }
          serviceMap[service].consumed += Math.abs(t.amount);
          serviceMap[service].count += 1;
        });

        const serviceBreakdown = Object.entries(serviceMap)
          .map(([service, data]) => ({ service, ...data }))
          .sort((a, b) => b.consumed - a.consumed);

        // Monthly consumed (current month)
        const now = new Date();
        const monthStart = startOfMonth(now).toISOString();
        const monthEnd = endOfMonth(now).toISOString();

        const { data: monthlyData } = await supabase
          .from("credit_transactions")
          .select("amount")
          .lt("amount", 0)
          .gte("created_at", monthStart)
          .lte("created_at", monthEnd);

        const monthlyConsumed = monthlyData?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

        setConsumptionStats({
          totalConsumed,
          monthlyConsumed,
          serviceBreakdown,
        });
      }
    } catch (error) {
      console.error("Error loading consumption stats:", error);
    }
  }, []);

  useEffect(() => {
    loadConsumptionStats();
  }, [loadConsumptionStats]);

  // Fetch Data (Paginated)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Load Summary Stats (Once)
      if (page === 1 && selectedTab === "balances") {
        const { data: sumData } = await (supabase.rpc as any)("get_total_credits_circulation"); // Optional: replace with simple select if RPC missing
        // Fallback calculation if RPC missing or error
        if (sumData === null || sumData === undefined) {
          const { data } = await supabase.from("talent_credits").select("balance");
          setTotalCirculation(data?.reduce((sum, c) => sum + c.balance, 0) || 0);
        } else {
          setTotalCirculation(sumData);
        }
      }

      // 2. Load List based on Tab
      let query;

      if (selectedTab === "balances") {
        query = supabase
          .from("talent_credits")
          .select(`*, talent:talents(full_name, email)`, { count: "exact" })
          .order("balance", { ascending: false });

        // Note: Relation search limited client side for now unless RPC used
      } else {
        query = supabase
          .from("credit_transactions")
          .select(`*, talent:talents(full_name, email)`, { count: "exact" })
          .order("created_at", { ascending: false });

        if (typeFilter !== "all") {
          query = query.eq("transaction_type", typeFilter);
        }
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading credits data timed out");

      if (result.error) throw result.error;

      if (selectedTab === "balances") {
        setCredits((result.data as unknown as TalentCredit[]) || []);
      } else {
        setTransactions((result.data as unknown as CreditTransaction[]) || []);
      }
      setTotalCount(result.count || 0);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Failed to load credits data");
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedTab, typeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page on tab/filter switch
  useEffect(() => {
    setPage(1);
  }, [selectedTab, typeFilter, debouncedSearch]);

  const handleAdjustCredits = async () => {
    if (!adjustDialog.talent || !adjustAmount) return;
    setIsAdjusting(true);

    try {
      const amount = parseInt(adjustAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const finalAmount = adjustDialog.type === "add" ? amount : -amount;
      const newBalance = adjustDialog.talent.balance + finalAmount;

      if (newBalance < 0) {
        toast.error("Insufficient balance for deduction");
        return;
      }

      // Update balance
      const { error: updateError } = await supabase
        .from("talent_credits")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", adjustDialog.talent.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase.from("credit_transactions").insert({
        talent_id: adjustDialog.talent.talent_id,
        amount: finalAmount,
        transaction_type: adjustDialog.type === "add" ? "admin_credit" : "admin_debit",
        description: adjustReason || `Admin ${adjustDialog.type === "add" ? "credit" : "debit"}`,
        balance_after: newBalance,
      });

      if (transactionError) throw transactionError;

      toast.success(`Successfully ${adjustDialog.type === "add" ? "added" : "deducted"} ${amount} credits`);
      setAdjustDialog({ open: false, type: "add" });
      setAdjustAmount("");
      setAdjustReason("");
      loadData();
    } catch (error: any) {
      console.error("Error adjusting credits:", error);
      toast.error("Failed to adjust credits");
    } finally {
      setIsAdjusting(false);
    }
  };

  const exportTransactions = () => {
    // Note: Exports current page only unless RPC endpoint added
    const csvContent = [
      ["Date", "Talent", "Email", "Type", "Service", "Amount", "Balance After", "Description"].join(","),
      ...transactions.map((t) =>
        [
          format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
          t.talent?.full_name || "Unknown",
          t.talent?.email || "",
          t.transaction_type,
          t.service_type || "",
          t.amount,
          t.balance_after,
          `"${t.description || ""}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credit-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Credits Manager</h2>
          <p className="text-muted-foreground">Manage talent credit balances and view transaction history</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats (Visible only on Balances tab) */}
      {selectedTab === "balances" && (
        <>
          {/* Existing Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total in Circulation</p>
                  <p className="text-2xl font-bold">{totalCirculation.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Coins className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Talents with Credits</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Analytics Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Credit Consumption (Revenue)
            </h3>
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-destructive/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-muted-foreground">Total Consumed</p>
                  </div>
                  <p className="text-2xl font-bold text-destructive">{consumptionStats.totalConsumed.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">≈ ${(consumptionStats.totalConsumed * 0.02).toLocaleString()} USD revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <p className="text-2xl font-bold">{consumptionStats.monthlyConsumed.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">≈ ${(consumptionStats.monthlyConsumed * 0.02).toLocaleString()} USD</p>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Service Breakdown</p>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {consumptionStats.serviceBreakdown.slice(0, 5).map((item) => (
                      <div key={item.service} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{item.service.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{item.count} uses</Badge>
                          <span className="font-mono font-medium">{item.consumed}</span>
                        </div>
                      </div>
                    ))}
                    {consumptionStats.serviceBreakdown.length === 0 && (
                      <p className="text-sm text-muted-foreground">No consumption data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Button
            variant={selectedTab === "balances" ? "default" : "outline"}
            onClick={() => setSelectedTab("balances")}
          >
            Balances
          </Button>
          <Button
            variant={selectedTab === "transactions" ? "default" : "outline"}
            onClick={() => setSelectedTab("transactions")}
          >
            Transactions
          </Button>
        </div>
        <div className="flex gap-2">
          {selectedTab === "transactions" && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="admin_credit">Admin Credit</SelectItem>
                <SelectItem value="admin_debit">Admin Debit</SelectItem>
                <SelectItem value="service_usage">Service Usage</SelectItem>
                <SelectItem value="top_up">Top Up</SelectItem>
              </SelectContent>
            </Select>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          {selectedTab === "transactions" && (
            <Button variant="outline" onClick={exportTransactions}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : selectedTab === "balances" ? (
            // Balances Table
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talent</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No credits found
                      </TableCell>
                    </TableRow>
                  ) : (
                    credits.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell className="font-medium">{credit.talent?.full_name || "Unknown"}</TableCell>
                        <TableCell>{credit.talent?.email}</TableCell>
                        <TableCell className="text-right font-mono">{credit.balance.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAdjustDialog({ open: true, talent: credit, type: "add" })}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAdjustDialog({ open: true, talent: credit, type: "deduct" })}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          ) : (
            // Transactions Table
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Talent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(tx.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell>{tx.talent?.full_name || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant={tx.amount > 0 ? "default" : "secondary"}>{tx.transaction_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{tx.service_type || "-"}</TableCell>
                      <TableCell
                        className={`text-right font-mono ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
                      </TableCell>
                      <TableCell className="text-right font-mono">{tx.balance_after}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Dialog */}
      <Dialog open={adjustDialog.open} onOpenChange={(open) => !open && setAdjustDialog({ open: false, type: "add" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{adjustDialog.type === "add" ? "Add Credits" : "Deduct Credits"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Talent</p>
              <p className="font-medium">{adjustDialog.talent?.talent?.full_name}</p>
              <p className="text-sm text-muted-foreground">
                Current balance: {adjustDialog.talent?.balance || 0} credits
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <Input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Enter amount"
                min={1}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Reason</label>
              <Textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Reason for adjustment..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog({ open: false, type: "add" })}>
              Cancel
            </Button>
            <Button onClick={handleAdjustCredits} disabled={isAdjusting || !adjustAmount}>
              {isAdjusting ? "Processing..." : adjustDialog.type === "add" ? "Add Credits" : "Deduct Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
