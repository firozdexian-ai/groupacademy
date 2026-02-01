import { useState } from 'react';
import { MessageCircle, X, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTalent } from '@/hooks/useTalent';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getWhatsAppLink, getWhatsAppConnectMessage } from '@/lib/constants/support';
import { CREDIT_CONFIG } from '@/lib/creditPricing';

interface FloatingWhatsAppButtonProps {
  showPrompt?: boolean;
}

export function FloatingWhatsAppButton({ showPrompt = true }: FloatingWhatsAppButtonProps) {
  const { talent, refreshTalent } = useTalent();
  const { addCredits } = useCredits();
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    if (isProcessing || !talent) return;

    setIsProcessing(true);
    try {
      // 1. Add bonus credits
      const success = await addCredits(
        CREDIT_CONFIG.WHATSAPP_CONNECT_BONUS,
        'welcome_bonus',
        'WhatsApp connect bonus - 10 credits'
      );

      if (success) {
        // 2. Update the whatsapp_bonus_claimed_at timestamp
        await supabase
          .from('talents')
          .update({ whatsapp_bonus_claimed_at: new Date().toISOString() })
          .eq('id', talent.id);

        // 3. Refresh talent to update UI state
        await refreshTalent();

        // 4. Show success toast
        toast.success('🎉 You earned 10 bonus credits!', {
          description: 'Thanks for connecting on WhatsApp!'
        });
      }

      // 5. Open WhatsApp with pre-filled message
      const message = getWhatsAppConnectMessage(talent.fullName || 'there');
      const whatsappUrl = getWhatsAppLink(message);
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error claiming WhatsApp bonus:', error);
      // Still open WhatsApp even if credit fails
      const message = getWhatsAppConnectMessage(talent?.fullName || 'there');
      window.open(getWhatsAppLink(message), '_blank');
    } finally {
      setIsProcessing(false);
    }
  };

  const dismissPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPromptDismissed(true);
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6">
      {/* Tooltip/Prompt */}
      {showPrompt && !isPromptDismissed && (
        <div className="animate-in slide-in-from-right-2 fade-in bg-card border shadow-lg rounded-lg p-3 max-w-[200px] relative">
          <button
            onClick={dismissPrompt}
            className="absolute -top-2 -right-2 bg-muted rounded-full p-1 hover:bg-muted-foreground/20"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="flex items-start gap-2">
            <Gift className="h-4 w-4 text-[#25D366] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">Connect on WhatsApp</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get 10 free credits! 🎁
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-all duration-200',
          'bg-[#25D366] hover:bg-[#128C7E]',
          'touch-action-manipulation',
          isHovered && 'scale-110',
          isProcessing && 'opacity-70 cursor-wait'
        )}
        style={{ touchAction: 'manipulation' }}
        onClick={handleClick}
        disabled={isProcessing}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleClick();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
}
