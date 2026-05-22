import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import {
  getTalentReferralIdentityByUser,
  countTalentsReferredBy,
} from "@/domains/talent/repo/talentRepo";
import { sumReferralBonusCredits } from "@/domains/finance/repo/financeRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Copy, Gift, Users, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReferralStats {
  invited: number;
  earned: number;
}

/**
 * GroUp Academy: Escrow Referral Telemetry & Share Node (ReferralCard)
 * An authoritative operational sandbox managing tracking handle allocations, network invitation metrics, and bonus calculation passes.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ReferralCard() {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [refCode, setRefCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({ invited: 0, earned: 0 });
  const [loading, setLoading] = useState(true);

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("referral_card_mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Secure Ingress Pass: Fetch initial referral datasets with clean closure parameters to protect memory contexts
  useEffect(() => {
    let isRequestActive = true;

    const executeReferralLedgerHydration = async () => {
      try {
        const { data: authUserData, error: authUserQueryError } = await supabase.auth.getUser();
        if (authUserQueryError) throw authUserQueryError;
        if (!authUserData?.user) return;

        // Step 1: Retrieve core profile referral hash identities from database variables
        const talentProfileData = await getTalentReferralIdentityByUser(authUserData.user.id);
        if (!talentProfileData) return;

        const resolvedRefCodeTokenStr = talentProfileData.ref_code ?? talentProfileData.id;

        // Step 2: Concurrent Promise Execution Pass to avoid nested sequential network cascades
        const [calculatedInvitedTotalNum, compiledEarnedTokensNum] = await Promise.all([
          countTalentsReferredBy(talentProfileData.id),
          sumReferralBonusCredits(talentProfileData.id),
        ]);

        // Step 3: Evaporate stale local data records using verified React Query tracks globally
        await queryClient.invalidateQueries({ queryKey: ["referral-stats"] });

        if (isRequestActive && isMountedRef.current) {
          setRefCode(resolvedRefCodeTokenStr);
          setStats({ invited: calculatedInvitedTotalNum, earned: compiledEarnedTokensNum });
          setLoading(false);
          trackEvent("referral_metrics_hydration_success", { totalInvited: calculatedInvitedTotalNum });
        }
      } catch (caughtPipelineExceptionErr) {
        trackError(caughtPipelineExceptionErr, {
          component: "ReferralCard",
          action: "execute_referral_ledger_hydration",
        });
        if (isRequestActive && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    executeReferralLedgerHydration();

    return () => {
      isRequestActive = false;
    };
  }, [queryClient]);

  const constructedShareLinkUrlStr = useMemo(() => {
    if (!refCode) return "";
    return `${window.location.origin}/auth?ref=${refCode}`;
  }, [refCode]);

  const handleLinkClipboardCopyProtocol = () => {
    if (!constructedShareLinkUrlStr) return;
    trackEvent("referral_link_copied_clipboard");

    try {
      navigator.clipboard.writeText(constructedShareLinkUrlStr);
      toast.success("Referral invitation link successfully synced to clipboard vectors.");
    } catch (err) {
      trackError(err, { component: "ReferralCard", action: "copy_referral_link_clipboard" });
      toast.error("Handshake Exception: Clipboard security block intercepted operation.");
    }
  };

  // =========================================================================
  // CORE PROTOCOL VIEW 1: LOAD RECTILINEAR GAUGE FILL CHIPS
  // =========================================================================
  if (loading) {
    return (
      <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased select-none">
        <div className="p-4 sm:p-5 flex items-center justify-center gap-2 w-full h-32">
          <Loader2 className="h-4 w-4 animate-spin text-primary stroke-[2.5]" />
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-primary italic animate-pulse leading-none">
            Parsing referral accounting indices…
          </span>
        </div>
      </Card>
    );
  }

  if (!refCode) return null;

  return (
    <Card className="w-full text-left rounded-xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden select-none sm:select-text">
      {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTROLS BLOCK */}
      <CardHeader className="p-4 sm:p-5 border-b border-border/10 bg-muted/10 select-none leading-none w-full shrink-0">
        <CardTitle className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 w-full leading-none">
          <Gift className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
          <span>Invite & Earn Ingress Ledger</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center font-semibold text-xs text-foreground/90">
        <p className="text-[11px] font-semibold text-muted-foreground/70 leading-normal block select-text pr-0.5">
          Acquire{" "}
          <strong className="text-foreground font-mono bg-muted/40 px-1 py-0.5 rounded shadow-xs">
            10 bonus credits
          </strong>{" "}
          instantly when an associated network candidate completes their preliminary transactional paid handshake
          connection profile down ledger rows.
        </p>

        {/* HUD LEVEL 2: DYNAMIC SHARE ROUTE TEXT INPUT PANEL STRIP */}
        <div className="flex gap-2 w-full shrink-0 select-none items-center font-bold text-xs">
          <Input
            readOnly
            value={constructedShareLinkUrlStr}
            className="h-9 rounded-xl border border-border/40 bg-background/50 font-mono text-[10px] text-primary/80 tracking-wide leading-none p-3 shadow-inner flex-1 min-w-0 select-all block cursor-default outline-none focus-visible:ring-0"
          />
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={handleLinkClipboardCopyProtocol}
            className="h-9 w-9 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground hover:bg-accent shrink-0 shadow-sm cursor-pointer transform-gpu active:scale-95 transition-transform flex items-center justify-center p-0"
            title="Copy invitation link trajectory coefficients onto local machine clip clipboard nodes"
          >
            <Copy className="h-4 w-4 stroke-[2.2]" />
          </Button>
        </div>

        {/* HUD LEVEL 3: HISTORICAL PERFORMANCE ANALYTIC METER TILES */}
        <div className="flex items-center gap-3 select-none font-bold text-xs flex-wrap pt-1 leading-none">
          <Badge
            variant="outline"
            className="rounded px-2 h-6 text-[10px] font-bold tracking-tight border border-border/40 bg-background/30 text-muted-foreground gap-1.5 flex items-center leading-none shadow-xs shrink-0 tabular-nums"
          >
            <Users className="h-3.5 w-3.5 stroke-[2.2] text-muted-foreground/60" />
            <span>{stats.invited} Mapped Candidates</span>
          </Badge>

          <Badge
            variant="outline"
            className="rounded px-2 h-6 text-[10px] font-extrabold tracking-tight border border-primary/20 bg-primary/5 text-primary gap-1.5 flex items-center leading-none shadow-xs shrink-0 font-mono tabular-nums"
          >
            <Zap className="h-3.5 w-3.5 stroke-[2.5] text-primary fill-primary/10 animate-pulse" />
            <span>{stats.earned} cr accumulated yield</span>
          </Badge>
        </div>

        {/* HUD LEVEL 4: RECTILINEAR OVERLAY BOTTOM METRIC LOG OMNIPRESENCE SHIELD */}
        <div className="flex items-center justify-center gap-1.5 py-2 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none shrink-0 uppercase w-full pt-3 mt-1">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Talent expansion conversion validation mapping updates complete</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReferralCard;
