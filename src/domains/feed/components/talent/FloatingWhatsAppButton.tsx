import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { markTalentWhatsappBonusClaimed } from "@/domains/talent/repo/talentRepo";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { getWhatsAppLink, getWhatsAppConnectMessage } from "@/lib/constants/support";
import { CREDIT_CONFIG } from "@/lib/creditPricing";

interface FloatingWhatsAppButtonProps {
  showPrompt?: boolean;
}

/**
 * Premium, performance-optimized Floating Support and Onboarding Bonus trigger button.
 * Built according to GroUp Academy Phase Z0 highly professional SAAS UI specifications
 * and Digital Workforce automated credit tracking guardrails.
 */
export function FloatingWhatsAppButton({ showPrompt = true }: FloatingWhatsAppButtonProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { talent, refreshTalent } = useTalent();
  const { addCredits } = useCredits();
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const bonusAmount = CREDIT_CONFIG.WHATSAPP_CONNECT_BONUS || 10;
  const hasClaimedBonus = !!talent?.whatsappBonusClaimedAt;

  if (!talent) return null;

  const handleConnect = async () => {
    if (isProcessing || !talent) return;

    const message = getWhatsAppConnectMessage(talent.fullName || "Academy Member");
    const whatsappUrl = getWhatsAppLink(message);

    // If bonus has already been settled, immediately forward the user to support lanes
    if (hasClaimedBonus) {
      trackEvent("FloatingWhatsAppButton:support_channel_opened", { talentId: talent.id });
      window.open(whatsappUrl, "_blank");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Processing your onboarding welcome bonus…");

    trackEvent("FloatingWhatsAppButton:bonus_claim_initiated", {
      talentId: talent.id,
      expectedBonus: bonusAmount,
    });

    try {
      // 1. Transaction Model: Allocate fractional bonus asset nodes to ledger
      const success = await addCredits(bonusAmount, "welcome_bonus", `WhatsApp Connect Bonus - ${bonusAmount} credits`);

      if (success) {
        // 2. Database Synchronization: Commit timestamp status back to core identity tables
        await markTalentWhatsappBonusClaimed(talent.id);

        // 3. Cache Bridge Invalidation: Force client query clients to re-sync across viewports
        queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
        await refreshTalent();

        toast.success(`Welcome bonus secured! +${bonusAmount} credits added to your wallet`, { id: toastId });
        trackEvent("FloatingWhatsAppButton:bonus_claim_completed", { talentId: talent.id, amount: bonusAmount });
      } else {
        throw new Error("Credit wallet ledger mutation failed to settle cleanly.");
      }

      window.open(whatsappUrl, "_blank");
    } catch (err: any) {
      const parsedErrorMessage = err instanceof Error ? err.message : String(err);

      // 4. Digital Workforce Escalation: Forward credit processing failures to the admin swarm instantly
      trackError(parsedErrorMessage, {
        component: "FloatingWhatsAppButton",
        action: "handleConnect_bonus_fault",
        talentId: talent.id,
        attemptedAmount: bonusAmount,
      });


      // Maintain automated efficiency focus by keeping channel navigation open for user conversions
      toast.error("Financing nodes are busy, but connecting you to channels...", { id: toastId });
      window.open(whatsappUrl, "_blank");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3 md:bottom-8 md:right-8 animate-in fade-in slide-in-from-bottom-4 duration-500 touch-manipulation">
      {/* Immersive Glassmorphic Promotion Prompt Bubble */}
      {showPrompt && !isPromptDismissed && !hasClaimedBonus && (
        <div className="relative bg-background/95 dark:bg-background/90 backdrop-blur-xl border border-border/40 shadow-xl rounded-2xl p-3.5 max-w-[240px] animate-in fade-in zoom-in-95 duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPromptDismissed(true);
              trackEvent("FloatingWhatsAppButton:prompt_dismissed", { talentId: talent.id });
            }}
            aria-label="Dismiss promotional offer"
            className="absolute -top-1.5 -right-1.5 bg-background border border-border shadow-sm rounded-full p-1 text-muted-foreground/80 hover:text-foreground hover:bg-muted active:scale-90 transition-all cursor-pointer"
          >
            <X className="h-3 w-3 stroke-[2.5]" />
          </button>

          <div className="flex gap-3 items-start text-left">
            <div className="bg-[#25D366]/10 p-2 rounded-xl shrink-0 border border-[#25D366]/20 shadow-inner">
              <Gift className="h-4 w-4 text-[#25D366]" />
            </div>
            <div className="space-y-1 w-full min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight tracking-tight">
                Get {bonusAmount} free credits
              </p>
              <p className="text-xs text-muted-foreground/90 leading-relaxed">
                Connect on WhatsApp to claim your welcome bonus.
              </p>
              <button
                onClick={handleConnect}
                className="inline-block text-xs font-bold text-primary hover:text-primary/80 transition-colors pt-1 cursor-pointer focus-visible:outline-none focus-visible:underline"
              >
                Connect now &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Floating Button Ring */}
      <div className="relative group">
        <Button
          onClick={handleConnect}
          disabled={isProcessing}
          aria-label="Chat on verified support channel"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg border border-[#25D366]/10 transform-gpu cursor-pointer transition-all duration-300",
            "bg-[#25D366] hover:bg-[#1FB855] text-white p-0",
            "hover:scale-105 hover:shadow-[#25D366]/20 hover:shadow-xl active:scale-95",
            isProcessing && "opacity-80 cursor-wait",
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin stroke-[2.5]" />
          ) : (
            <MessageCircle className="h-6 w-6 fill-current transition-transform group-hover:scale-105" />
          )}
        </Button>

        {/* Dynamic Pulse Signal Indicator */}
        {!hasClaimedBonus && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 pointer-events-none select-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-background" />
          </span>
        )}
      </div>
    </div>
  );
}
