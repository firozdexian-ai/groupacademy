import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Wallet,
  TrendingUp,
  Banknote,
  Clock,
  ArrowRight,
  Hourglass,
  Users,
  FileCheck2,
  Inbox,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getInstructorDashboardV2 } from "@/domains/learning/repo/learningRepo";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { requestInstructorPayout } from "@/domains/finance/api/financeApi";

// =========================================================================
// DETERMINISTIC CONTRACT INTERFACES
// =========================================================================
interface SummaryRow {
  id: string;
  source_kind: string;
  amount_credits: number;
  status: string;
  period_month: string;
  created_at: string;
}

interface SummarySeriesItem {
  month: string;
  credits: number;
}

interface Summary {
  lifetime_credits: number;
  this_month_credits: number;
  available_credits: number;
  pending_credits: number;
  series: SummarySeriesItem[];
  recent: SummaryRow[];
}

interface OpenPayout {
  id: string;
  amount_credits: number;
  payout_method: string;
  status: "pending" | "approved";
  created_at: string;
}

interface DashboardV2 {
  summary: Summary;
  open_payout_requests: OpenPayout[];
  pending_review_count: number;
  active_students_count: number;
  fetched_at: string;
}

interface StatProps {
  label: string;
  credits: number;
  icon: React.ReactNode;
  highlight?: boolean;
}

interface RequestPayoutSheetProps {
  available: number;
  onDone: () => void;
}

/**
 * GroUp Academy: Authoritative Instructor Earnings & Ledger Cockpit (InstructorEarnings)
 * Hardened operational module isolating telemetry execution loops and anchoring hydration-safe date paths.
 * Version: Launch Candidate · Phase Z0 Financial Control Locked
 */
export default function InstructorEarnings() {
  const queryClientInstance = useQueryClient();
  const { toast } = useToast();

  const { data: dashboardPayloadData, isLoading: isDashboardResolving } = useQuery<DashboardV2 | null>({
    queryKey: ["instructor-dashboard"],
    queryFn: async (): Promise<DashboardV2 | null> => {
      try {
        return await getInstructorDashboardV2<DashboardV2>();
      } catch (rpcHandshakeError: any) {
        toast({ title: "Synchronization Failure", description: rpcHandshakeError.message, variant: "destructive" });
        throw rpcHandshakeError;
      }
    },
  });

  const resolvedPayoutMetrics = React.useMemo(() => {
    if (!dashboardPayloadData?.open_payout_requests) return { openPayouts: [], totalPending: 0 };
    const openPayouts = dashboardPayloadData.open_payout_requests;
    const totalPending = openPayouts.reduce(
      (accumulatedSum, payoutNode) => accumulatedSum + Number(payoutNode.amount_credits || 0),
      0,
    );
    return { openPayouts, totalPending };
  }, [dashboardPayloadData]);

  const handleInvalidationSequenceComplete = React.useCallback(() => {
    queryClientInstance.invalidateQueries({ queryKey: ["instructor-dashboard"] });
  }, [queryClientInstance]);

  if (isDashboardResolving) {
    return (
      <div
        role="status"
        className="w-full flex items-center justify-center py-12 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none pointer-events-none gap-2.5"
      >
        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
        <span>Synchronizing Ledger Metrics...</span>
      </div>
    );
  }

  if (!dashboardPayloadData?.summary) {
    return (
      <Card className="rounded-xl border border-dashed border-border/60 bg-card/20 p-6 text-center select-none block">
        <Inbox className="h-5 w-5 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
        <p className="text-xs font-semibold text-muted-foreground/50 leading-normal mt-2 max-w-xs mx-auto">
          No statement or credit allocation entries mapped onto this ledger yet.
        </p>
      </Card>
    );
  }

  const summaryDataNode = dashboardPayloadData.summary;
  const { openPayouts, totalPending } = resolvedPayoutMetrics;

  return (
    <div className="space-y-4 block text-left antialiased transform-gpu w-full">
      {/* HUD LEVEL 1: PENDING ACCOUNTING REVIEW NOTIFICATION BANNER */}
      {openPayouts.length > 0 && (
        <Card className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] shadow-2xs overflow-hidden block w-full select-none">
          <CardContent className="p-3.5 flex items-start gap-3 leading-none w-full">
            <Hourglass className="h-4 w-4 text-amber-500 stroke-[2.2] shrink-0 pt-0.5" />
            <div className="min-w-0 flex-1 leading-none space-y-1 block">
              <p className="text-xs font-bold uppercase tracking-wide text-foreground">
                Allocation Review Cycle Active
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground/70 leading-normal block select-text">
                {openPayouts.length.toString()} tracking row{openPayouts.length === 1 ? "" : "s"} ·{" "}
                <span className="font-mono font-bold text-foreground tabular-nums">
                  {totalPending.toFixed(1)} credits
                </span>{" "}
                (≈ BDT {Math.round(totalPending * 2).toLocaleString()}) mapped inside the validation buffer queue.
              </p>

              <div className="pt-2.5 space-y-2 block border-t border-border/5 mt-2 w-full">
                {openPayouts.slice(0, 3).map((payoutItem) => (
                  <div
                    key={payoutItem.id}
                    className="flex items-center justify-between gap-4 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60 w-full block leading-none"
                  >
                    <span className="truncate block select-text max-w-[160px] sm:max-w-xs pt-0.5">
                      {payoutItem.payout_method} ·{" "}
                      {new Date(payoutItem.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-extrabold px-1.5 h-4.5 rounded border-amber-500/20 bg-amber-500/5 text-amber-600 tracking-wide pt-0.5 shrink-0 leading-none"
                    >
                      {payoutItem.status === "approved" ? "RELEASE APPROVED" : "UNDER AUDIT"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HUD LEVEL 2: COMPOSITE LEDGER SPECIFICATION MATRIX METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 block w-full select-none">
        <Stat
          label="Lifetime Yield"
          credits={summaryDataNode.lifetime_credits}
          icon={<TrendingUp className="h-3.5 w-3.5 stroke-[2.2]" />}
        />
        <Stat
          label="Current Month"
          credits={summaryDataNode.this_month_credits}
          icon={<Wallet className="h-3.5 w-3.5 stroke-[2.2]" />}
        />
        <Stat
          label="Available Liquidity"
          credits={summaryDataNode.available_credits}
          icon={<Banknote className="h-3.5 w-3.5 text-emerald-600 stroke-[2.2]" />}
          highlight
        />
        <Stat
          label="Escrow Holding"
          credits={summaryDataNode.pending_credits}
          icon={<Clock className="h-3.5 w-3.5 text-amber-500 stroke-[2.2]" />}
        />
      </div>

      {/* HUD LEVEL 3: CLASSROOM METRIC SUB-CARDS */}
      <div className="grid grid-cols-2 gap-3 block w-full select-none">
        <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none block">
          <CardContent className="p-3 leading-none space-y-1 block">
            <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide leading-none">
              <Users className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Active Roster Registries</span>
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-foreground tabular-nums pt-0.5">
              {dashboardPayloadData.active_students_count ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none block">
          <CardContent className="p-3 leading-none space-y-1 block">
            <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide leading-none">
              <FileCheck2 className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Pending Evaluation Tasks</span>
            </div>
            <p className="text-base sm:text-lg font-black font-mono text-foreground tabular-nums pt-0.5">
              {dashboardPayloadData.pending_review_count ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* HUD LEVEL 4: TIME SERIES HISTOGRAM TIMELINE */}
      <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full select-none">
        <CardContent className="p-4 block w-full leading-none">
          <div className="flex items-center justify-between mb-3 border-b border-border/5 pb-2 select-none pointer-events-none leading-none w-full shrink-0">
            <p className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 leading-none">
              Yield Horizon Allocation Tracking
            </p>
            <p className="font-mono text-[10px] font-bold text-muted-foreground/30 uppercase tracking-wider leading-none">
              UNIT: PLATFORM CREDITS
            </p>
          </div>
          <div className="h-36 block w-full transform-gpu antialiased">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryDataNode.series ?? []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 9,
                    fontWeight: 700,
                    fill: "hsl(var(--muted-foreground))",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                  tickFormatter={(val) => String(val).slice(5)}
                  stroke="transparent"
                />
                <YAxis
                  tick={{
                    fontSize: 9,
                    fontWeight: 600,
                    fill: "hsl(var(--muted-foreground))",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                  width={36}
                  stroke="transparent"
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                  contentStyle={{
                    fontSize: 11,
                    background: "hsl(var(--popover))",
                    borderRadius: "8px",
                    borderColor: "hsl(var(--border)/0.6)",
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="credits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ACTION INTERACTION INGRESS CAP CONTROL */}
      <RequestPayoutSheet available={summaryDataNode.available_credits} onDone={handleInvalidationSequenceComplete} />

      {/* HUD LEVEL 5: COMPREHENSIVE ACTIVITY STATEMENT ROSTER */}
      <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none overflow-hidden block w-full">
        <CardContent className="p-4 block w-full leading-none">
          <p className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
            Recent Activity Manifest Log
          </p>
          <div className="divide-y divide-border/5 block w-full mt-1">
            {(summaryDataNode.recent ?? []).map((rowItem) => (
              <div
                key={rowItem.id}
                className="flex items-center justify-between gap-4 py-2.5 leading-none w-full block"
              >
                <div className="min-w-0 flex-1 leading-none space-y-1 block">
                  <p className="text-xs font-bold uppercase tracking-wide text-foreground truncate block pt-0.5 select-text">
                    {rowItem.source_kind.replace(/_/g, " ")}
                  </p>
                  <p className="font-mono text-[10px] font-bold text-muted-foreground/40 leading-none select-text uppercase tracking-tight">
                    {new Date(rowItem.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })} · CYCLE:{" "}
                    {rowItem.period_month.slice(0, 7)}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 select-none pointer-events-none leading-none">
                  <Badge
                    variant={
                      rowItem.status === "paid" ? "default" : rowItem.status === "available" ? "secondary" : "outline"
                    }
                    className="font-mono text-[9px] font-extrabold uppercase px-1.5 h-4.5 rounded pt-0.5 leading-none shrink-0 rounded-xs"
                  >
                    {rowItem.status}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-foreground tabular-nums text-right block pt-0.5 w-12">
                    {Number(rowItem.amount_credits).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
            {(summaryDataNode.recent?.length ?? 0) === 0 && (
              <p className="text-xs font-semibold text-muted-foreground/40 py-8 text-center select-none block">
                No active rows matching the specified token parameters resolved in this audit list.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* COMPLIANCE DISCLOSURE SLOTS */}
      <footer className="px-1 select-none pointer-events-none block leading-none w-full shrink-0">
        <p className="font-mono text-[9px] font-bold uppercase tracking-wide text-muted-foreground/30 leading-normal">
          Exchange reference values index: 1.0 Platform Credit ≈ 2.0 BDT liquidity metrics. Lower validation limit cap
          threshold fixed at 500.0 entries. Settlement statements compile on the 1st of each lunar calendar sequence.
        </p>
      </footer>
    </div>
  );
}

// =========================================================================
// NESTED ELEMENT 1: ATOMIC RECORDING DATA DATA DISPLAY ROW CARD
// =========================================================================
function Stat({ label, credits, icon, highlight }: StatProps) {
  return (
    <Card
      className={cn(
        "rounded-lg border bg-card/30 border-border/60 shadow-none flex flex-col justify-between p-3 leading-none h-20",
        highlight && "border-emerald-500/30 bg-emerald-500/[0.01]",
      )}
    >
      <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wide leading-none">
        {icon}
        <span>{label}</span>
      </div>
      <div className="space-y-0.5 block leading-none">
        <p className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight tabular-nums block leading-none">
          {Number(credits || 0).toFixed(1)}
        </p>
        <p className="font-sans text-[10px] font-bold text-muted-foreground/50 tracking-wide block leading-none tabular-nums">
          ≈ ৳{Math.round(Number(credits || 0) * 2).toLocaleString()}
        </p>
      </div>
    </Card>
  );
}

// =========================================================================
// NESTED ELEMENT 2: PAYOUT SETTLE LIQUIDITY EXECUTION SHEET OVERLAY
// =========================================================================
function RequestPayoutSheet({ available, onDone }: RequestPayoutSheetProps) {
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = React.useState<boolean>(false);
  const [amountInputStr, setAmountInputStr] = React.useState<string>("");
  const [methodSelectionStr, setMethodSelectionStr] = React.useState<string>("bkash");
  const [accountDetailsStr, setAccountDetailsStr] = React.useState<string>("");
  const [isMutationProcessing, setIsMutationProcessing] = React.useState<boolean>(false);

  // Synchronize form values defensively upon layout instantiation events
  React.useEffect(() => {
    if (isSheetOpen) {
      setAmountInputStr(String(Math.max(500, Math.floor(available))));
      setAccountDetailsStr("");
    }
  }, [isSheetOpen, available]);

  const isFormParametersValid = React.useMemo<boolean>(() => {
    const numericValueAmount = Number(amountInputStr);
    return numericValueAmount >= 500 && numericValueAmount <= available && accountDetailsStr.trim().length > 0;
  }, [amountInputStr, available, accountDetailsStr]);

  const executePayoutSubmissionPipeline = async () => {
    if (!isFormParametersValid) return;

    setIsMutationProcessing(true);
    try {
      let edgeFunctionResponseData: any = null;
      let functionInvokeError: any = null;
      try {
        edgeFunctionResponseData = await requestInstructorPayout({
          amount: Number(amountInputStr),
          method: methodSelectionStr,
          details: { account: accountDetailsStr },
        });
      } catch (e) {
        functionInvokeError = e;
      }

      if (functionInvokeError || (edgeFunctionResponseData as any)?.error) {
        toast({
          title: "Pipeline Execution Blocked",
          description:
            (edgeFunctionResponseData as any)?.error ||
            functionInvokeError?.message ||
            "Function thrown unhandled exception",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Liquidity Request Logged",
        description: `Operational volume ${amountInputStr} successfully routed to tracking audit tables.`,
      });
      setIsSheetOpen(false);
      onDone();
    } catch (fatalPipelineCrashPayload) {
      toast({
        title: "Terminal System Error",
        description: "The core transaction system failed to respond.",
        variant: "destructive",
      });
    } finally {
      setIsMutationProcessing(false);
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          className="w-full h-10 px-4 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985]"
          disabled={available < 500}
        >
          <Wallet className="h-4 w-4 stroke-[2.2] shrink-0" />
          <span>
            Request Payout Alignment{" "}
            {available >= 500 ? `(Up To ${Math.floor(available).toLocaleString()})` : "(Min 500 Required)"}
          </span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="rounded-l-xl w-full max-w-sm overflow-y-auto block select-none border-l border-border/60 bg-popover/95 backdrop-blur-md"
      >
        <SheetHeader className="text-left select-none pointer-events-none block leading-none pb-3 border-b border-border/10">
          <SheetTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
            Disburse Platform Liquidity
          </SheetTitle>
          <SheetDescription className="text-[11px] font-semibold text-muted-foreground/50">
            Route verified credit allocations directly to external banking endpoints.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 block w-full leading-none">
          <div className="space-y-1 block leading-none">
            <Label
              htmlFor="amt"
              className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none"
            >
              Allocation Quantum Volume
            </Label>
            <Input
              id="amt"
              type="number"
              disabled={isMutationProcessing}
              min={500}
              max={Math.floor(available)}
              value={amountInputStr}
              onChange={(e) => setAmountInputStr(e.target.value)}
              className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none font-mono tabular-nums"
            />
            <p className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase block leading-none pt-0.5 tabular-nums">
              ≈ BDT {Math.round(Number(amountInputStr || 0) * 2).toLocaleString()} · LIQUIDITY LIMIT:{" "}
              {Math.floor(available).toLocaleString()}
            </p>
          </div>

          <div className="space-y-1 block leading-none">
            <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
              Target Ingress Clearinghouse
            </Label>
            <Select disabled={isMutationProcessing} value={methodSelectionStr} onValueChange={setMethodSelectionStr}>
              <SelectTrigger className="h-9 font-sans text-xs sm:text-sm rounded-lg border border-border/40 bg-background/50 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border border-border/60 bg-popover text-popover-foreground">
                <SelectItem value="bkash" className="text-xs uppercase font-mono font-bold">
                  bKash MFS System
                </SelectItem>
                <SelectItem value="bank" className="text-xs uppercase font-mono font-bold">
                  Scheduled Corporate Banking
                </SelectItem>
                <SelectItem value="wise" className="text-xs uppercase font-mono font-bold">
                  Wise Cross-Border Node
                </SelectItem>
                <SelectItem value="paypal" className="text-xs uppercase font-mono font-bold">
                  PayPal Payment Engine
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 block leading-none">
            <Label
              htmlFor="acc"
              className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none"
            >
              {methodSelectionStr === "bkash"
                ? "bKash Terminal Phone Identifier"
                : methodSelectionStr === "bank"
                  ? "Routing Number & Bank Account"
                  : "Recipient Email / Workspace Handle"}
            </Label>
            <Input
              id="acc"
              disabled={isMutationProcessing}
              value={accountDetailsStr}
              onChange={(e) => setAccountDetailsStr(e.target.value)}
              placeholder={methodSelectionStr === "bkash" ? "01XXXXXXXXX" : "Input identification coordinates..."}
              className="h-9 text-xs sm:text-sm bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none font-mono"
            />
          </div>
        </div>

        <SheetFooter className="mt-5 block w-full shrink-0">
          <Button
            type="button"
            onClick={executePayoutSubmissionPipeline}
            disabled={!isFormParametersValid || isMutationProcessing}
            className="w-full h-9 rounded-lg font-bold uppercase text-xs tracking-wider gap-1.5 cursor-pointer shadow-xs transform-gpu active:scale-[0.985]"
          >
            {isMutationProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5 stroke-[2.2]" />
            )}
            <span>Dispatch Settlement Request</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
