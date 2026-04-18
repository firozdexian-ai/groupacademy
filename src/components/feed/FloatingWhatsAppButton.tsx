import { useState } from "react";
import { MessageCircle, X, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getWhatsAppLink, getWhatsAppConnectMessage } from "@/lib/constants/support";
import { CREDIT_CONFIG } from "@/lib/creditPricing";

interface FloatingWhatsAppButtonProps {
  showPrompt?: boolean;
}

export function FloatingWhatsAppButton({ showPrompt = true }: FloatingWhatsAppButtonProps) {
  const { talent, refreshTalent } = useTalent();
  const { addCredits } = useCredits();
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const bonusAmount = CREDIT_CONFIG.WHATSAPP_CONNECT_BONUS || 10;
  // Check if user has already claimed the bonus
  const hasClaimedBonus = !!talent?.whatsappBonusClaimedAt;

  const handleClick = async () => {
    if (isProcessing || !talent) return;

    const message = getWhatsAppConnectMessage(talent.fullName || "there");
    const whatsappUrl = getWhatsAppLink(message);

    // If already claimed, just open WhatsApp and exit
    if (hasClaimedBonus) {
      window.open(whatsappUrl, "_blank");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Transactional Add Credits
      const success = await addCredits(bonusAmount, "welcome_bonus", `WhatsApp connect bonus - ${bonusAmount} credits`);

      if (success) {
        // 2. Mark as claimed in DB immediately
        const { error } = await supabase
          .from("talents")
          .update({ whatsapp_bonus_claimed_at: new Date().toISOString() })
          .eq("id", talent.id);

        if (error) throw error;

        // 3. Sync local state
        await refreshTalent();

        toast.success(`🎉 +${bonusAmount} Credits Earned!`, {
          description: "Your bonus has been added to your wallet.",
        });
      }

      // 4. Trigger WhatsApp
      window.open(whatsappUrl, "_blank");
    } catch (error) {
      console.error("[WhatsAppButton] Bonus Error:", error);
      // Fallback: Always ensure support is reachable even if bonus fails
      window.open(whatsappUrl, "_blank");
    } finally {
      setIsProcessing(false);
    }
  };

  const dismissPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPromptDismissed(true);
  };

  if (!talent) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 md:bottom-8 md:right-8 group">
      {/* Tooltip/Prompt: Only show if NOT claimed and NOT dismissed */}
      {showPrompt && !isPromptDismissed && !hasClaimedBonus && (
        <div className="animate-in slide-in-from-bottom-2 zoom-in-95 fade-in duration-300 bg-card border shadow-xl rounded-2xl p-4 max-w-[220px] relative ring-1 ring-primary/10">
          <button
            onClick={dismissPrompt}
            className="absolute -top-2 -right-2 bg-background border shadow-sm rounded-full p-1 hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
          </button>

          <div className="flex gap-3">
            <div className="bg-[#25D366]/10 p-2 rounded-xl shrink-0 h-fit">
              <Gift className="h-5 w-5 text-[#25D366]" />
            </div>
            <div className="space-y-1">
              <p className="text-[13px] font-bold leading-tight">Instant Bonus</p>
              <p className="text-[11px] text-muted-foreground leading-snug font-medium">
                Connect on WhatsApp to get <span className="text-primary font-bold">{bonusAmount} free credits</span>!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <Button
        onClick={handleClick}
        disabled={isProcessing}
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
          "bg-[#25D366] hover:bg-[#128C7E] text-white p-0",
          "hover:scale-110 active:scale-95 border-4 border-white/20",
          isProcessing && "opacity-80 cursor-wait",
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <MessageCircle className="h-7 w-7 fill-current" />
        )}

        {/* Subtle indicator if bonus is available */}
        {!hasClaimedBonus && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white"></span>
          </span>
        )}
      </Button>
    </div>
  );
}
