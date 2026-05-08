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
  const hasClaimedBonus = !!talent?.whatsappBonusClaimedAt;

  const handleConnect = async () => {
    if (isProcessing || !talent) return;

    const message = getWhatsAppConnectMessage(talent.fullName || "Academy Member");
    const whatsappUrl = getWhatsAppLink(message);

    if (hasClaimedBonus) {
      window.open(whatsappUrl, "_blank");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Claiming your bonus…");

    try {
      const success = await addCredits(bonusAmount, "welcome_bonus", `WhatsApp Connect Bonus - ${bonusAmount} credits`);

      if (success) {
        const { error } = await supabase
          .from("talents")
          .update({ whatsapp_bonus_claimed_at: new Date().toISOString() })
          .eq("id", talent.id);

        if (error) throw error;

        await refreshTalent();
        toast.success(`+${bonusAmount} credits added to your wallet`, { id: toastId });
      }

      window.open(whatsappUrl, "_blank");
    } catch (error: any) {
      console.error("[WhatsAppConnect]", error);
      window.open(whatsappUrl, "_blank");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!talent) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3 md:bottom-8 md:right-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showPrompt && !isPromptDismissed && !hasClaimedBonus && (
        <div className="relative bg-background border border-border/60 shadow-lg rounded-2xl p-3 max-w-[240px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPromptDismissed(true);
            }}
            aria-label="Dismiss"
            className="absolute -top-2 -right-2 bg-background border border-border shadow-sm rounded-full p-1 hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
          </button>

          <div className="flex gap-3 items-start text-left">
            <div className="bg-[#25D366]/10 p-2 rounded-xl shrink-0 border border-[#25D366]/20">
              <Gift className="h-4 w-4 text-[#25D366]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Get {bonusAmount} free credits
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect on WhatsApp to claim your welcome bonus.
              </p>
              <button
                onClick={handleConnect}
                className="text-xs font-semibold text-primary hover:underline pt-1"
              >
                Connect now →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <Button
          onClick={handleConnect}
          disabled={isProcessing}
          aria-label="Chat on WhatsApp"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-transform duration-200",
            "bg-[#25D366] hover:bg-[#1FB855] text-white p-0",
            "hover:scale-105 active:scale-95",
            isProcessing && "opacity-80 cursor-wait",
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <MessageCircle className="h-7 w-7 fill-current" />
          )}
        </Button>

        {!hasClaimedBonus && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-background" />
          </span>
        )}
      </div>
    </div>
  );
}
