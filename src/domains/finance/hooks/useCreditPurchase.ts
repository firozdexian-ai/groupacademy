import { useSyncExternalStore } from "react";
import { getCurrentUser } from "@/lib/auth";
import { logMonetizationIntent } from "@/domains/finance/repo/financeRepo";

/**
 * GroUp Academy: Credit Purchase UI Sheet State Orchestrator (V5.5.0)
 * CTO Reference: Global programmatic interceptor for triggering monetization viewports.
 * Architecture: Digital Workforce enabled - logs checkout node entry telemetry to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Candidate).
 */

let isOpenState = false;
const listeners = new Set<() => void>();

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const getSnapshot = () => isOpenState;

/**
 * Mutates state nodes globally across the single-page shell execution timeline.
 */
const setOpen = (next: boolean) => {
  if (isOpenState === next) return;
  isOpenState = next;

  // Digital Workforce Telemetry: Enqueue monetization intent signals on initialization
  if (next) {
    try {
      getCurrentUser().then((user) => {
        if (user) {
          // HUD: Pipeline conversion track telemetry dispatch
          void logMonetizationIntent(user.id, "CreditPurchaseSheet").then(() => {
            console.log("[Digital Workforce] SIGNAL: Monetization intent enqueued for lead tracking.");
          });
        }
      });
    } catch {
      /* Safeguard backdrop tracing execution loops */
    }
  }

  listeners.forEach((l) => l());
};

export const openCreditPurchase = () => setOpen(true);
export const closeCreditPurchase = () => setOpen(false);

export function useCreditPurchase() {
  const isOpen = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    isOpen,
    open: openCreditPurchase,
    close: closeCreditPurchase,
  };
}
