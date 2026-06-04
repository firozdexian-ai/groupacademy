import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { buildListCreditTransactionsQuery } from "@/domains/finance/repo/financeRepo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Coins,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Clock,
  FileSpreadsheet,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SUPPORT_CONFIG } from "@/lib/constants/support";

type TransactionFilter = "all" | "deposit" | "debit" | "payout" | "refund";

interface CreditTransactionRow {
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

const TYPE_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  deposit: {
    label: "Deposit Credit",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    icon: ArrowDownRight,
  },
  debit: {
    label: "Platform Usage",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    icon: ArrowUpRight,
  },
  payout: {
    label: "Disbursement",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    icon: ArrowUpRight,
  },
  refund: {
    label: "Refund Restored",
    className: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20",
    icon: ArrowDownRight,
  },
};

/**
 * GroUp Academy: Transactions Master Ledger Tab
 * Administrative workspace tracking global credit circulation, user purchases, and corporate expenditures.
 */
export function TransactionsTab() {
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Queries historical transaction streams from real-time ledger records
  const {
    data: rawTransactions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-master-transactions-ledger", typeFilter, page],
    queryFn: async () => {
      const query = buildListCreditTransactionsQuery({ page, pageSize: 200, typeFilter });
      const result = await Promise.resolve(query);
      if (result.error) throw result.error;
      return (result.data || []) as unknown as CreditTransactionRow[];
    },
  });

  // Client-side filtration matrix targeting matching candidate context data
  const filteredTransactions = useMemo(() => {
    if (!rawTransactions) return [];
    if (!search.trim()) return rawTransactions;
    const s = search.toLowerCase();
    return rawTransactions.filter(
      (tx) =>
        tx.id?.toLowerCase().includes(s) ||
        tx.talent?.full_name?.toLowerCase().includes(s) ||
        tx.talent?.email?.toLowerCase().includes(s) ||
        tx.description?.toLowerCase().includes(s),
    );
  }, [rawTransactions, search]);

  const ledgerMetrics = useMemo(() => {
    const list = rawTransactions || [];
    const totalVolume = list.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const incomingVolume = list.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const outgoingVolume = list.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    return { totalVolume, incomingVolume, outgoingVolume };
  }, [rawTransactions]);

  const handleSupportInquiry = () => {
    const outboundMessage = encodeURIComponent(
      "Hello Finance Operations Team, I am requesting assistance with evaluating an unmatched transaction line on our global master ledger statement.",
    );
    window.open(`${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${outboundMessage}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Executive Financial Control Header */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Global Transaction Ledger
              </CardTitle>
              <CardDescription>
                Unified audit trail of platform micro-credit movements, gateway settlements, and account quota
                modifications.
              </CardDescription>
            </div>
            <div className="flex gap-2 select-none shrink-0 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="h-9 px-3 text-xs font-semibold gap-1.5 rounded-xl border border-border"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} /> Re-Sync
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Financial Analytics Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
        <Card className="p-5 border border-border/40 bg-card rounded-2xl shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
            Total Transaction Volume
          </p>
          <p className="text-2xl font-bold text-foreground">
            {ledgerMetrics.totalVolume.toLocaleString()}{" "}
            <span className="text-xs font-medium text-muted-foreground">cr</span>
          </p>
        </Card>
        <Card className="p-5 border border-border/40 bg-card rounded-2xl shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
            Total Allocated Additions
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            +{ledgerMetrics.incomingVolume.toLocaleString()}{" "}
            <span className="text-xs font-medium text-muted-foreground">cr</span>
          </p>
        </Card>
        <Card className="p-5 border border-border/40 bg-card rounded-2xl shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
            Total Platform Consumption
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            -{ledgerMetrics.outgoingVolume.toLocaleString()}{" "}
            <span className="text-xs font-medium text-muted-foreground">cr</span>
          </p>
        </Card>
      </div>

      {/* Control Navigation Filters Bar */}
      <Card className="border border-border/40 bg-card shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
        <CardHeader className="p-5 border-b border-border/40">
          <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by profile name, email reference, or description..."
                className="pl-10 h-10 w-full bg-muted/20 border border-border rounded-xl font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionFilter)}>
              <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl border font-semibold text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border font-semibold text-xs">
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="deposit">Deposits & Grants</SelectItem>
                <SelectItem value="debit">Platform Deductions</SelectItem>
                <SelectItem value="payout">User Withdrawals</SelectItem>
                <SelectItem value="refund">Returned Refunds</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {/* Ledger Rows Output */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-3">
              <Skeleton className="h-10 w-full rounded-xl bg-muted/20 border" />
              <Skeleton className="h-10 w-full rounded-xl bg-muted/20 border" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground/60 font-medium text-sm flex flex-col items-center justify-center gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              No historical ledger transaction entries match your active filtration parameters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs py-4 pl-6 text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground">User Profile</TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground">Classification</TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground">Description Details</TableHead>
                    <TableHead className="font-bold text-xs text-right text-muted-foreground">Impact Amount</TableHead>
                    <TableHead className="font-bold text-xs text-right pr-6 text-muted-foreground">
                      Running Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {filteredTransactions.map((tx) => {
                    const normalizedType =
                      tx.amount > 0
                        ? tx.transaction_type === "refund"
                          ? "refund"
                          : "deposit"
                        : tx.transaction_type === "payout"
                          ? "payout"
                          : "debit";
                    const meta = TYPE_CONFIG[normalizedType] || TYPE_CONFIG.debit;
                    const Icon = meta.icon;

                    return (
                      <TableRow key={tx.id} className="group hover:bg-muted/5 transition-colors duration-150">
                        <TableCell className="pl-6 py-4 font-mono text-xs text-muted-foreground/80">
                          {format(new Date(tx.created_at), "dd MMM yyyy, HH:mm")}
                        </TableCell>
                        <TableCell className="text-left">
                          <p className="font-semibold text-xs text-foreground">
                            {tx.talent?.full_name || "Platform Adjustment"}
                          </p>
                          {tx.talent?.email && (
                            <p className="text-[10px] font-medium text-muted-foreground/60 mt-0.5">{tx.talent.email}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-none gap-1",
                              meta.className,
                            )}
                          >
                            <Icon className="h-3 w-3 shrink-0" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground/90 max-w-xs truncate">
                          {tx.description || "No supplemental details available"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold text-xs tabular-nums font-sans",
                            tx.amount > 0 ? "text-emerald-600" : "text-foreground",
                          )}
                        >
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} cr
                        </TableCell>
                        <TableCell className="text-right pr-6 font-mono text-xs text-muted-foreground/80 tabular-nums">
                          {tx.balance_after?.toLocaleString()} cr
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Human-in-the-loop Operational Notice Footer */}
          <div className="p-4 border-t border-border/40 bg-muted/10 text-center select-none">
            <button
              onClick={handleSupportInquiry}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              Encountered a settlement discrepancy or ledger error? Contact Finance Operations Chat
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TransactionsTab;
