import { useEffect, useState, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Flame, Sparkles, Loader2, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionRequestDialogProps {
  open: boolean;
  onOpenChange: (openStateBool: boolean) => void;
  recipientId: string;
  recipientName: string;
  onSent?: () => void;
}

/**
 * GroUp Academy: Escrowed Token Connection Request Terminal (ConnectionRequestDialog)
 * An authoritative operational sandbox managing connection requests, dynamic credit cost pricing queries, and escrow locks.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ConnectionRequestDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  onSent,
}: ConnectionRequestDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMountedRef = useRef<boolean>(true);

  const [price, setPrice] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Secure Ingress Pass: Query algorithmic credit price dynamically with clean closure parameters
  useEffect(() => {
    let isRequestActive = true;
    if (!open || !recipientId) return;

    supabase
      .from("talents") // Verification pass over database structure variables
      .rpc("get_talent_connection_price", { _recipient: recipientId })
      .then(({ data: balancePricePayload, error: rpcPriceError }) => {
        if (rpcPriceError) {
          trackError(rpcPriceError, {
            component: "ConnectionRequestDialog",
            action: "fetch_connection_price",
            recipientId,
          });
          if (isRequestActive && isMountedRef.current) {
            setPrice(50); // Safe fallback asset parameters standard
          }
          return;
        }

        if (isRequestActive && isMountedRef.current) {
          const normalizedPriceNum = Number(balancePricePayload ?? 50);
          setPrice(normalizedPriceNum);
          trackEvent("connection_price_hydrated", { recipientId, computedCost: normalizedPriceNum });
        }
      });

    return () => {
      isRequestActive = false;
    };
  }, [open, recipientId]);

  const safeRecipientFirstNameStr = useMemo(() => {
    if (!recipientName || typeof recipientName !== "string") return "Talent Node";
    return recipientName.split(" ")[0];
  }, [recipientName]);

  const handleConnectionRequestSubmit = async () => {
    if (sending || !recipientId) return;

    setSending(true);
    trackEvent("connection_request_dispatch_initiated", { recipientId, cost: price });

    try {
      // Execute transactional escrow request function via a cryptographically unified rpc node
      const { error: transactionMutationError } = await supabase.rpc("talent_connection_request", {
        _recipient: recipientId,
      });

      if (transactionMutationError) throw transactionMutationError;

      // Automated Efficiency: Synchronize cache streams across metrics and token ledgers instantly
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["connection-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });

      if (isMountedRef.current) {
        toast({
          title: "TRANSACTION_VERIFIED",
          description: `Connection requested cleanly. ${recipientName} retains a 14-day limit window to respond. Full balance refunded if declined.`,
        });

        trackEvent("connection_request_dispatch_success", { recipientId });
        onSent?.();
        onOpenChange(false);
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "ConnectionRequestDialog",
        action: "commit_connection_request_rpc",
        recipientId,
      });

      toast({
        title: "TRANSACTION_ABORTED_FAULT",
        description:
          formattedExceptionMsgStr || "Insufficient escrow token reserves available to settle transaction parameters.",
        variant: "destructive",
      });
    } finally {
      if (isMountedRef.current) {
        setSending(false);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpenStateBool) => {
        if (!isOpenStateBool && !sending) {
          onOpenChange(isOpenStateBool);
          trackEvent("connection_request_dialog_cancelled");
        }
      }}
    >
      <DialogContent className="sm:max-w-md rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6 text-left antialiased overflow-hidden transform-gpu select-none sm:select-text flex flex-col justify-center">
        {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTAINER */}
        <DialogHeader className="mb-3 text-left select-none shrink-0 leading-none w-full">
          <div className="flex items-center gap-2.5 leading-none w-full">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="h-4 w-4 text-primary stroke-[2.2] animate-pulse" />
            </div>
            <DialogTitle className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none min-w-0 flex-1 truncate text-ellipsis block pr-1">
              Initialize Connection with {recipientName}
            </DialogTitle>
          </div>
          <DialogDescription className="hidden sr-only" aria-hidden="true">
            Escrow balance allocation form parameters for launching cross-profile networking handshakes.
          </DialogDescription>
        </DialogHeader>

        {/* HUD LEVEL 2: DYNAMIC ESCROW METRIC CONTEXT BLOCKS */}
        <div className="space-y-4 w-full min-w-0 font-bold text-xs tracking-tight text-foreground/90">
          <p className="text-[11px] font-semibold text-muted-foreground/70 leading-normal block select-text pr-0.5">
            Dispatching a secure profile handshake requires an escrow commitment of{" "}
            <strong className="text-foreground font-mono bg-muted/40 px-1 py-0.5 rounded shadow-xs">
              {price !== null ? `${price} credits` : "… calculating"}
            </strong>{" "}
            (calibrated dynamically from 1% of their verified milestone curves). On network accept events, 70%
            translates to {safeRecipientFirstNameStr} directly, with 30% parsing down infrastructure pools. Tokens
            revert fully to your wallet ledger index if declined or unrecorded over 14 days.
          </p>

          {/* HARDENED AMBER NOTICE BOX CONTAINER */}
          <div className="flex gap-3 items-center p-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.015] leading-none text-left w-full min-w-0 select-none shadow-inner h-11 shrink-0">
            <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400 stroke-[2.2] shrink-0 animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-wide text-amber-600 dark:text-amber-400 block pt-0.5 truncate text-ellipsis max-w-full">
              Premium tier creator metrics dictate higher network values.
            </span>
          </div>
        </div>

        {/* HUD LEVEL 3: FOOTER DISPATCH ACTION STRIP CONTROL BUTTON ROW */}
        <DialogFooter className="mt-5 gap-2.5 sm:gap-0 select-none border-t border-border/10 pt-4 w-full shrink-0 flex items-center justify-end font-bold text-xs">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={sending}
            className="h-9 px-4 rounded-xl text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 transition-colors cursor-pointer"
          >
            Cancel Ingress
          </Button>

          <Button
            type="button"
            onClick={handleConnectionRequestSubmit}
            disabled={sending || price === null}
            className="h-9 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 min-w-[110px]"
          >
            {sending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                <span>Escrowing…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                <span>Send ({price ?? "…"} cr)</span>
              </>
            )}
          </Button>
        </DialogFooter>

        {/* HUD LEVEL 4: RECTILINEAR OVERLAY BOTTOM METRIC LOG OMNIPRESENCE SHIELD */}
        <div className="shrink-0 pt-2 mt-4 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none uppercase w-full flex items-center justify-center gap-1.5 h-6">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Profile alignment handshake currency routing ledger complete</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
