import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getTalentInboxVolume, getTalentInboxUnlocked, unlockTalentInbox } from "@/domains/talent/repo/talentRepo";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Lock, Unlock, Loader2, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const FIXED_UNLOCK_THRESHOLD_VOLUME = 5000;

/**
 * GroUp Academy: Authoritative Inbox Ingress Permission Terminal (InboxUnlockCard)
 * An operational sandbox verifying dynamic profile trading volume thresholds and processing workspace inbox activation hooks.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function InboxUnlockCard() {
  const queryClient = useQueryClient();
  const { talent } = useTalent();
  const { toast } = useToast();
  const isMountedRef = useRef<boolean>(true);

  const [volume, setVolume] = useState<number>(0);
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("inbox_unlock_card_mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshUnlockLedgerMetrics = async () => {
    if (!talent?.id) return;

    try {
      // Execute uninsulated asynchronous queries wrapped inside a clean unified promise mesh
      const [normalizedVolumeNum, normalizedUnlockStatusBool] = await Promise.all([
        getTalentInboxVolume(talent.id),
        getTalentInboxUnlocked(talent.id),
      ]);

      if (isMountedRef.current) {

        setVolume(normalizedVolumeNum);
        setUnlocked(normalizedUnlockStatusBool);
        trackEvent("inbox_unlock_metrics_refreshed", {
          currentVolume: normalizedVolumeNum,
          isUnlocked: normalizedUnlockStatusBool,
        });
      }
    } catch (caughtPipelineExceptionErr) {
      trackError(caughtPipelineExceptionErr, { component: "InboxUnlockCard", action: "refresh_unlock_ledger_metrics" });
    }
  };

  useEffect(() => {
    refreshUnlockLedgerMetrics();
  }, [talent?.id]);

  const handleInboxUnlockMutationSubmit = async () => {
    if (loading || unlocked) return;

    setLoading(true);
    trackEvent("inbox_unlock_mutation_initiated", { volume });
    const dynamicToastTrackerId = toast({
      title: "MUTATING_PERMISSION_INDEX",
      description: "Verifying currency parameters down ledger rows…",
    });

    try {
      const { error: rpcMutationError } = await supabase.rpc("unlock_talent_inbox");
      if (rpcMutationError) throw rpcMutationError;

      // Automated Efficiency: Synchronize cache streams across metrics and token balances instantly
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-inbox-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });

      if (isMountedRef.current) {
        toast({
          title: "INBOX_UNLOCKED_SUCCESS",
          description: "Other validated talent nodes can now dispatch custom connection requests directly.",
        });
        trackEvent("inbox_unlock_mutation_success");
        await refreshUnlockLedgerMetrics();
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, { component: "InboxUnlockCard", action: "commit_inbox_unlock_rpc" });
      toast({ title: "PERMISSION_DENIED_FAULT", description: formattedExceptionMsgStr, variant: "destructive" });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const calculatedYieldPercentage = useMemo(() => {
    if (FIXED_UNLOCK_THRESHOLD_VOLUME <= 0) return 0;
    const directDivisionPct = (volume / FIXED_UNLOCK_THRESHOLD_VOLUME) * 100;
    return Math.min(100, Math.max(0, directDivisionPct));
  }, [volume]);

  if (!talent?.id) return null;

  return (
    <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden select-none sm:select-text">
      <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center font-semibold text-xs text-foreground/90">
        {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTROLS BLOCK */}
        <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none shrink-0 h-6">
          <div className="flex items-center gap-2 leading-none min-w-0 flex-1 text-left">
            {unlocked ? (
              <Unlock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[2.2] shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground/60 stroke-[2.2] shrink-0" />
            )}
            <h3 className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wide truncate block pt-0.5 leading-none">
              {unlocked ? "Ingress Channel Active" : "Unlock Messaging Inbox"}
            </h3>
          </div>

          {unlocked && (
            <Badge
              variant="outline"
              className="rounded px-1.5 h-4.5 text-[8px] font-extrabold tracking-wider uppercase border border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono shadow-xs shrink-0 select-none"
            >
              Active Node
            </Badge>
          )}
        </div>

        {/* HUD LEVEL 2: DYNAMIC LAYOUT SHEETS ACCORDING TO UNLOCK STATE */}
        {!unlocked ? (
          <div className="space-y-4 w-full min-w-0 flex flex-col justify-center animate-in slide-in-from-top-1 duration-200">
            <p className="text-[11px] font-semibold text-muted-foreground/70 leading-normal block select-text pr-0.5">
              Accumulate{" "}
              <strong className="text-foreground font-mono bg-muted/40 px-1 py-0.5 rounded shadow-xs">
                {FIXED_UNLOCK_THRESHOLD_VOLUME.toLocaleString()} lifetime credit transactions
              </strong>{" "}
              (via cross-profile earning or project spend) to authorize an automated system unlock sequence, or process
              a one-time deployment fee of{" "}
              <strong className="text-foreground font-mono bg-muted/40 px-1 py-0.5 rounded shadow-xs">
                {FIXED_UNLOCK_THRESHOLD_VOLUME.toLocaleString()} workspace credits
              </strong>{" "}
              instantly.
            </p>

            {/* INTEGRATED GAUGE BAR TRACK STRIP */}
            <div className="space-y-2 p-3 rounded-xl border border-border/40 bg-muted/10 w-full select-none shadow-sm leading-none shrink-0 font-bold text-[10px] tracking-tight text-muted-foreground/70 tabular-nums">
              <div className="flex justify-between items-center w-full leading-none uppercase tracking-wider font-mono">
                <span>Verification Volume Curve</span>
                <span className="text-primary font-black">
                  {volume.toLocaleString()} / {FIXED_UNLOCK_THRESHOLD_VOLUME.toLocaleString()} credits
                </span>
              </div>
              <Progress
                value={calculatedYieldPercentage}
                className="h-2 rounded-full border-none bg-primary/10 shadow-inner w-full block"
              />
            </div>

            {/* SECTOR DISPATCH BUTTON TRIGGER CONTROLLERS */}
            <Button
              type="button"
              disabled={loading}
              onClick={handleInboxUnlockMutationSubmit}
              className="w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 mt-1 select-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                  <span>Processing Handshake Matrix…</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                  <span>
                    {volume >= FIXED_UNLOCK_THRESHOLD_VOLUME
                      ? "Activate Verified Inbox (Free)"
                      : `Unlock Channel (${FIXED_UNLOCK_THRESHOLD_VOLUME.toLocaleString()} cr)`}
                  </span>
                </>
              )}
            </Button>
          </div>
        ) : (
          /* UNLOCKED SYSTEM STATUS PANEL */
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.015] p-3 text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2.5 select-none leading-none w-full shrink-0 animate-in fade-in duration-200">
            <ShieldCheck className="h-4 w-4 shrink-0 stroke-[2.5]" />
            <span className="leading-normal">
              Your messaging channel has successfully synchronized with the talent registry search networks. Alternative
              profiles can now initiate collaboration workflows.
            </span>
          </div>
        )}

        {/* HUD LEVEL 3: RECTILINEAR OVERLAY BOTTOM METRIC LOG OMNIPRESENCE SHIELD */}
        <div className="flex items-center justify-center gap-1.5 py-2 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none shrink-0 uppercase w-full pt-3 mt-1">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Messaging permission pipeline synchronization core complete</span>
        </div>
      </CardContent>
    </Card>
  );
}
