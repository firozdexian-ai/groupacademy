import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PaymentGateway = 'whatsapp' | 'stripe' | 'both';

interface PaymentConfig {
  gateway: PaymentGateway;
  stripePublishableKey: string | null;
  stripeMode: 'test' | 'live';
  currency: string;
  whatsappEnabled: boolean;
  isStripeConfigured: boolean;
}

export function usePaymentConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ['payment-config'],
    queryFn: async (): Promise<PaymentConfig> => {
      const { data: settings, error } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', [
          'payment_gateway',
          'stripe_publishable_key',
          'stripe_mode',
          'currency',
          'whatsapp_purchase_enabled',
        ]);

      if (error) throw error;

      const map = new Map(settings?.map((s) => [s.key, s.value]) || []);

      const stripeKey = map.get('stripe_publishable_key') || null;

      return {
        gateway: (map.get('payment_gateway') as PaymentGateway) || 'whatsapp',
        stripePublishableKey: stripeKey,
        stripeMode: (map.get('stripe_mode') as 'test' | 'live') || 'test',
        currency: map.get('currency') || 'USD',
        whatsappEnabled: map.get('whatsapp_purchase_enabled') !== 'false',
        isStripeConfigured: !!stripeKey,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    config: data,
    isLoading,
    gateway: data?.gateway || 'whatsapp',
    isStripeConfigured: data?.isStripeConfigured || false,
    showWhatsApp: !data || data.gateway === 'whatsapp' || data.gateway === 'both',
    showStripe: data?.gateway === 'stripe' || data?.gateway === 'both',
  };
}
