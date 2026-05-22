import { useQuery } from "@tanstack/react-query";
import { getPaymentConfigSettings } from "@/domains/finance/repo/financeRepo";

/**
 * GroUp Academy: Fiscal Gateway Orchestrator (V5.6.0)
 * CTO Reference: Authoritative controller for bimodal checkout infrastructure.
 * Architecture: Digital Workforce enabled - logs fiscal config drops to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

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
 * Orchestrates platform-wide payment infrastructure parameters.
 * Implements 5-minute cache stability to minimize repetitive configuration fetches.
 */
export function usePaymentConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ["payment-config"],
    // Performance Baseline: 5-minute cache residency for institutional settings
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PaymentConfig> => {
      // HUD: FETCH_INSTITUTIONAL_SETTINGS_REGISTRY
      let settings: Array<{ key: string; value: string }>;
      try {
        settings = await getPaymentConfigSettings();
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: platform_settings ingress failure.", error);
        throw error;
      }

        // Digital Workforce Anomaly Trigger:
        // Essential for monitoring fiscal pipeline accessibility.
        console.error("[Digital Workforce] ANOMALY: platform_settings ingress failure.", error);
        throw error;
      }

      // SYNC: ATOMIC_REGISTRY_MAPPING
      const registry = new Map(settings?.map((s) => [s.key, s.value]) || []);
      const stripeKey = registry.get("stripe_publishable_key") || null;
      const rawGateway = registry.get("payment_gateway");
      const rawMode = registry.get("stripe_mode");

      // HUD: FISCAL_PARAMETER_NORMALIZATION
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

  // --- HUD: VIEWPORT_DIAGNOSTIC_API ---
  // Provides high-velocity access flags for conditional checkout rendering.
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
