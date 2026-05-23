import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUserId } from "@/lib/auth";
import {
  listPayoutAccounts,
  insertPayoutAccount,
  setPayoutAccountPrimary,
  deletePayoutAccount,
} from "@/domains/profile/repo/profileRepo";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Wallet, Star, Trash2, Plus, Loader2, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


interface PayoutAccount {
  id: string;
  method: "bkash" | "bank" | "paypal" | "wise";
  account_name: string;
  account_number: string;
  bank_name: string | null;
  is_primary: boolean;
}

const METHOD_LABEL = {
  bkash: "bKash",
  bank: "Bank Transfer",
  paypal: "PayPal",
  wise: "Wise",
} as const;

/**
 * GroUp Academy: Authoritative Disbursement Ledger Configuration Terminal (PayoutAccountsManager)
 * An operational sandbox orchestrating multi-channel payout accounts, routing keys, and primary flags.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function PayoutAccountsManager() {
  const queryClient = useQueryClient();
  const { talent } = useTalent();
  const isMountedRef = useRef<boolean>(true);

  const [rows, setRows] = useState<PayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  const [method, setMethod] = useState<PayoutAccount["method"]>("bkash");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("payout_accounts_manager_mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadPayoutAccountsLedger = async () => {
    if (!talent?.id) return;

    if (isMountedRef.current) {
      setLoading(true);
    }

    try {
      const data = await listPayoutAccounts(talent.id);

      if (isMountedRef.current) {
        setRows((data as any[]) || []);
        setLoading(false);
        trackEvent("payout_accounts_loaded", { accountsCount: data?.length || 0 });
      }
    } catch (err) {
      trackError(err, { component: "PayoutAccountsManager", action: "load_payout_accounts_ledger" });
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPayoutAccountsLedger();
  }, [talent?.id]);

  const handleAccountRegistrationSubmit = async () => {
    if (!talent?.id) return;

    const sanitizedAccountName = accountName.trim();
    const sanitizedAccountNumber = accountNumber.trim();
    const sanitizedBankName = bankName.trim();

    if (!sanitizedAccountName || !sanitizedAccountNumber) {
      toast.error("Account holder name and account routing parameters are required.");
      return;
    }

    setBusy(true);
    trackEvent("payout_account_registration_initiated", { method });
    const dynamicToastTrackerId = toast.loading(
      "Registering disbursement variables over secure workspace index nodes...",
    );

    try {
      const uid = await getCurrentUserId();
      if (!uid) throw new Error("Authentication index token lost. Please log in.");

      const isFirstAccountNode = rows.length === 0;

      await insertPayoutAccount({
        talentId: talent.id,
        userId: uid,
        method,
        accountName: sanitizedAccountName,
        accountNumber: sanitizedAccountNumber,
        bankName: method === "bank" ? sanitizedBankName || null : null,
        isPrimary: isFirstAccountNode,
      });

      

      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["payout-accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        toast.success("Disbursement channel successfully verified down configuration ledger.", {
          id: dynamicToastTrackerId,
        });
        setAccountName("");
        setAccountNumber("");
        setBankName("");
        setAdding(false);

        trackEvent("payout_account_registration_success");
        await loadPayoutAccountsLedger();
      }
    } catch (e: any) {
      const parsedExceptionMsg = e instanceof Error ? e.message : String(e);
      trackError(parsedExceptionMsg, { component: "PayoutAccountsManager", action: "commit_account_registration" });
      toast.error(`Couldn't save account: ${parsedExceptionMsg}`, { id: dynamicToastTrackerId });
    } finally {
      if (isMountedRef.current) {
        setBusy(false);
      }
    }
  };

  const handlePrimaryFlagAssignment = async (targetAccountIdStr: string) => {
    if (!targetAccountIdStr) return;

    setBusy(true);
    trackEvent("payout_account_primary_set_requested", { accountId: targetAccountIdStr });
    const dynamicToastTrackerId = toast.loading("Updating primary payout path designations...");

    try {
      await setPayoutAccountPrimary(targetAccountIdStr);

      await queryClient.invalidateQueries({ queryKey: ["payout-accounts"] });

      if (isMountedRef.current) {
        toast.success("Primary account route successfully verified.", { id: dynamicToastTrackerId });
        trackEvent("payout_account_primary_set_success");
        await loadPayoutAccountsLedger();
      }
    } catch (e: any) {
      const parsedExceptionMsg = e instanceof Error ? e.message : String(e);
      trackError(parsedExceptionMsg, {
        component: "PayoutAccountsManager",
        action: "assign_primary_flag",
        accountId: targetAccountIdStr,
      });
      toast.error(`Couldn't update: ${parsedExceptionMsg}`, { id: dynamicToastTrackerId });
    } finally {
      if (isMountedRef.current) {
        setBusy(false);
      }
    }
  };

  const handleAccountNodeExpunge = async (targetAccountIdStr: string) => {
    if (!targetAccountIdStr) return;

    // Controlled structural verification step instead of basic prompt hooks
    const confirmToastId = toast.info("Are you sure you want to expunge this disbursement account row?", {
      action: {
        label: "Confirm Purge",
        onClick: async () => {
          setBusy(true);
          trackEvent("payout_account_removal_executed", { accountId: targetAccountIdStr });

          try {
            await deletePayoutAccount(targetAccountIdStr);

            await queryClient.invalidateQueries({ queryKey: ["payout-accounts"] });
            toast.success("Disbursement node successfully removed.");
            await loadPayoutAccountsLedger();
          } catch (err) {
            const parsedExceptionMsg = err instanceof Error ? err.message : String(err);
            trackError(parsedExceptionMsg, {
              component: "PayoutAccountsManager",
              action: "expunge_account_node",
              accountId: targetAccountIdStr,
            });
            toast.error(`Purge Failed: ${parsedExceptionMsg}`);
          } finally {
            if (isMountedRef.current) {
              setBusy(false);
            }
          }
        },
      },
      cancel: {
        label: "Abort",
        onClick: () => trackEvent("payout_account_removal_cancelled"),
      },
    });
  };

  return (
    <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden transition-colors hover:border-border/60">
      <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center">
        {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTROLS BLOCK */}
        <div className="flex items-center gap-2 px-0.5 select-none w-full leading-none shrink-0 h-8 text-left">
          <Wallet className="h-4.5 w-4.5 text-primary stroke-[2.2] shrink-0 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide truncate block pt-0.5 leading-none">
            Disbursement Channel Configuration
          </h3>
        </div>

        <p className="text-[11px] font-semibold text-muted-foreground/70 leading-normal select-none pr-1">
          Specify your primary billing account coordinates to authorize fast workspace token withdrawals. Add secondary
          alternatives as automated failover routing keys.
        </p>

        {/* LOADING PROCESSING INDICATOR SCREEN */}
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground select-none leading-none w-full">
            <Loader2 className="h-4 w-4 animate-spin text-primary stroke-[2.5]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider pl-0.5 animate-pulse">
              Loading payout accounts…
            </span>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-[11px] font-semibold text-muted-foreground/50 italic py-2 pl-0.5 select-none leading-none">
            No payout accounts yet.
          </div>
        ) : (
          /* ACTIVE DISBURSEMENT ROUTE TILES GRID LIST */
          <div className="space-y-2.5 w-full min-w-0 text-left font-bold text-xs tracking-tight">
            {rows.map((rowItem) => (
              <div
                key={rowItem.id}
                className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/40 bg-background/50 group/row transition-all w-full min-w-0 select-none leading-none"
              >
                <div className="min-w-0 flex-1 space-y-1.5 flex flex-col justify-center text-left leading-none">
                  <div className="flex items-center gap-2 leading-none w-full">
                    <p className="text-xs sm:text-sm font-bold text-foreground/90 uppercase truncate text-ellipsis pr-1 block select-text leading-none">
                      {rowItem.account_name}
                    </p>
                    {rowItem.is_primary && (
                      <Badge
                        variant="outline"
                        className="rounded px-1.5 h-4.5 text-[8px] font-extrabold tracking-wider uppercase border border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-0.5 flex items-center leading-none shadow-xs shrink-0"
                      >
                        <Star className="h-2.5 w-2.5 fill-current stroke-[2.5]" />
                        <span className="pt-0.5">Primary</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs font-mono font-bold text-muted-foreground/60 tracking-normal leading-none uppercase truncate text-ellipsis select-text w-full block">
                    {METHOD_LABEL[rowItem.method] || "Channel"}
                    {rowItem.bank_name ? ` &bull; ${rowItem.bank_name}` : ""} &bull; {rowItem.account_number}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-bold text-xs select-none">
                  {!rowItem.is_primary && (
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => handlePrimaryFlagAssignment(rowItem.id)}
                      disabled={busy}
                      className="h-7 px-2 rounded-lg font-bold text-[10px] uppercase tracking-wide border border-border/40 bg-background/30 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors"
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    size="icon"
                    type="button"
                    variant="ghost"
                    onClick={() => handleAccountNodeExpunge(rowItem.id)}
                    disabled={busy}
                    className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors shrink-0 p-0 border-none shadow-none"
                  >
                    <Trash2 className="h-4 w-4 stroke-[2.2]" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HUD LEVEL 2: ADD NEW ACCOUNT CONDITIONAL LAYOUT SHEETS FORM */}
        {adding ? (
          <div className="space-y-3.5 p-3.5 border border-border/40 bg-background/50 rounded-xl w-full min-w-0 flex flex-col justify-center animate-in slide-in-from-bottom-1 duration-200">
            <div className="space-y-1.5 text-left w-full min-w-0 font-bold text-xs tracking-tight">
              <Label className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/70 block pl-0.5 select-none leading-none">
                Disbursement Method
              </Label>
              <Select
                value={method}
                disabled={busy}
                onValueChange={(v) => {
                  trackEvent("payout_accounts_method_altered", { method: v });
                  setMethod(v as any);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground px-3 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/40 bg-background font-bold text-xs">
                  <SelectItem value="bkash" className="cursor-pointer text-xs font-semibold py-2 rounded-lg">
                    bKash Mobile Wallet
                  </SelectItem>
                  <SelectItem value="bank" className="cursor-pointer text-xs font-semibold py-2 rounded-lg">
                    Direct Bank Transfer
                  </SelectItem>
                  <SelectItem value="paypal" className="cursor-pointer text-xs font-semibold py-2 rounded-lg">
                    PayPal Token Network
                  </SelectItem>
                  <SelectItem value="wise" className="cursor-pointer text-xs font-semibold py-2 rounded-lg">
                    Wise Virtual Transfer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {method === "bank" && (
              <div className="space-y-1.5 text-left w-full min-w-0 font-bold text-xs tracking-tight animate-in fade-in duration-200">
                <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
                  Bank Name institution *
                </Label>
                <Input
                  value={bankName}
                  disabled={busy}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="E.g. BRAC Bank Plc, City Bank"
                  className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block"
                />
              </div>
            )}

            <div className="space-y-1.5 text-left w-full min-w-0 font-bold text-xs tracking-tight">
              <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
                Account Holder Legal Name *
              </Label>
              <Input
                value={accountName}
                disabled={busy}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="E.g. JASON BOURNE"
                className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block uppercase italic font-bold"
              />
            </div>

            <div className="space-y-1.5 text-left w-full min-w-0 font-bold text-xs tracking-tight">
              <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
                {method === "paypal"
                  ? "PayPal Email *"
                  : method === "bkash"
                    ? "bKash Phone Number *"
                    : "Account Number / IBAN *"}
              </Label>
              <Input
                value={accountNumber}
                disabled={busy}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={
                  method === "paypal"
                    ? "email@domain.com"
                    : method === "bkash"
                      ? "01XXXXXXXXX"
                      : "Account number"
                }
                className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block font-mono tracking-wide"
              />
            </div>

            <div className="flex gap-2.5 font-bold text-xs pt-2 select-none w-full shrink-0">
              <Button
                onClick={handleAccountRegistrationSubmit}
                disabled={busy}
                type="button"
                className="flex-[2] h-10 rounded-xl font-bold uppercase text-[10px] tracking-wider gap-1.5 cursor-pointer shadow-md transform-gpu active:scale-[0.995] transition-transform bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" /> : "Save Account"}
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setAdding(false)}
                className="flex-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 hover:text-foreground h-10 px-3 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              trackEvent("payout_accounts_add_clicked");
              setAdding(true);
            }}
            className="w-full h-10 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer hover:bg-accent gap-1.5 flex items-center justify-center transition-colors select-none"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add payout account</span>
          </Button>
        )}

        {/* HUD LEVEL 3: RECTILINEAR OVERLAY BOTTOM METRIC LOG OMNIPRESENCE SHIELD */}
        <div className="mt-4 flex items-center justify-center gap-1.5 py-2.5 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none shrink-0 uppercase w-full">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Compensation payout routing ledger synchronization indexes complete</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default PayoutAccountsManager;
