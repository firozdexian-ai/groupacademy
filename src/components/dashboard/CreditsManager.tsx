import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Coins, Search, Plus, Minus, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";

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

export function CreditsManager() {
  const [credits, setCredits] = useState<TalentCredit[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"balances" | "transactions">("balances");
  const [adjustDialog, setAdjustDialog] = useState<{
    open: boolean;
    talent?: TalentCredit;
    type: "add" | "deduct";
  }>({ open: false, type: "add" });
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load talent credits with talent info
      const { data: creditsData, error: creditsError } = await supabase
        .from("talent_credits")
        .select(`
          *,
          talent:talents(full_name, email)
        `)
        .order("balance", { ascending: false });

      if (creditsError) throw creditsError;
      setCredits(creditsData || []);

      // Load recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("credit_transactions")
        .select(`
          *,
          talent:talents(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error: any) {
      console.error("Error loading credits:", error);
      toast.error("Failed to load credits data");
    } finally {
      setIsLoading(false);
    }
  };

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
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
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
        ].join(",")
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

  const filteredCredits = credits.filter(
    (c) =>
      c.talent?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.talent?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(
    (t) =>
      t.talent?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.talent?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.service_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCredits = credits.reduce((sum, c) => sum + c.balance, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Credits Manager</h2>
          <p className="text-muted-foreground">
            Manage talent credit balances and view transaction history
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total in Circulation</p>
                <p className="text-2xl font-bold">{totalCredits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Coins className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Talents with Credits</p>
                <p className="text-2xl font-bold">{credits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Coins className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions (Last 100)</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search */}
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
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {selectedTab === "balances" ? (
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
                {filteredCredits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No credits found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCredits.map((credit) => (
                    <TableRow key={credit.id}>
                      <TableCell className="font-medium">
                        {credit.talent?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>{credit.talent?.email}</TableCell>
                      <TableCell className="text-right font-mono">
                        {credit.balance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setAdjustDialog({ open: true, talent: credit, type: "add" })
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setAdjustDialog({ open: true, talent: credit, type: "deduct" })
                            }
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
          ) : (
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
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">
                        {format(new Date(tx.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell>{tx.talent?.full_name || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant={tx.amount > 0 ? "default" : "secondary"}>
                          {tx.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.service_type || "-"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          tx.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {tx.balance_after}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Adjust Dialog */}
      <Dialog
        open={adjustDialog.open}
        onOpenChange={(open) => !open && setAdjustDialog({ open: false, type: "add" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustDialog.type === "add" ? "Add Credits" : "Deduct Credits"}
            </DialogTitle>
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
            <Button
              variant="outline"
              onClick={() => setAdjustDialog({ open: false, type: "add" })}
            >
              Cancel
            </Button>
            <Button onClick={handleAdjustCredits} disabled={isAdjusting || !adjustAmount}>
              {isAdjusting
                ? "Processing..."
                : adjustDialog.type === "add"
                ? "Add Credits"
                : "Deduct Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
