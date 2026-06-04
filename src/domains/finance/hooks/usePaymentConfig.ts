import { useQuery } from "@tanstack/react-query";
import { getPaymentConfigSettings } from "@/domains/finance/repo/financeRepo";

export type PaymentGateway = "whatsapp" | "stripe" | "both";

export interface PaymentConfig {
  gateway: PaymentGateway;
  stripePublishableKey: string | null;
  stripeMode: "test" | "live";
  currency: string;
  whatsappEnabled: boolean;
  isStripeConfigured: boolean;
}

/**
 * GroUp Academy: Payment Infrastructure Configuration Sensor Hook
 * Orchestrates platform-wide transaction routing preferences, publishable keys, and localized checkout channels.
 * Implements a strict 5-minute cache visibility window to minimize repetitive configuration database round-trips.
 */
export function usePaymentConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ["payment-config"],
    // Performance Baseline: 5-minute cache residency for shared workspace properties
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PaymentConfig> => {
      let settings: Array<{ key: string; value: string }>;
      try {
        settings = await getPaymentConfigSettings();
      } catch (error: any) {
        console.error("[Payment Configuration] Error loading gateway parameters from repository logs:", error);
        throw error;
      }

      const registry = new Map(settings?.map((s) => [s.key, s.value]) || []);
      const stripeKey = registry.get("stripe_publishable_key") || null;
      const rawGateway = registry.get("payment_gateway");
      const rawMode = registry.get("stripe_mode");

      const gateway: PaymentGateway =
        rawGateway === "stripe" || rawGateway === "both" || rawGateway === "whatsapp" ? rawGateway : "whatsapp";

      const stripeMode: "test" | "live" = rawMode === "live" ? "live" : "test";

      return {
        gateway,
        stripePublishableKey: stripeKey,
        stripeMode,
        currency: registry.get("currency") || "USD",
        whatsappEnabled: registry.get("whatsapp_purchase_enabled") !== "false",
        isStripeConfigured: !!stripeKey,
      };
    },
  });

  // Provides high-velocity flags for conditional checkout layout rendering blocks.
  return {
    config: data,
    isLoading,
    gateway: data?.gateway || "whatsapp",
    isStripeConfigured: data?.isStripeConfigured || false,
    showWhatsApp: !data || data.gateway === "whatsapp" || data.gateway === "both",
    showStripe: data?.gateway === "stripe" || data?.gateway === "both",
    currency: data?.currency || "USD",
  };
}
