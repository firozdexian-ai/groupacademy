import { useSyncExternalStore } from "react";
import { getCurrentUser } from "@/lib/auth";
import { logMonetizationIntent } from "@/domains/finance/repo/financeRepo";

/**
 * GroUp Academy: Credit Purchase Sheet State Controller
 * Manages global cross-component sheet visibility for candidate or employer credit checkout workflows.
 * Telemetry: Dispatches monetization intent logs to the administrative pipeline when a purchase flow begins.
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

const setOpen = (next: boolean) => {
  if (isOpenState === next) return;
  isOpenState = next;

  // Digital Workforce Telemetry: Logs monetization intent if the purchase interface is triggered
  if (next) {
    try {
      getCurrentUser().then((user) => {
        if (user) {
          void logMonetizationIntent(user.id, "CreditPurchaseSheet").then(() => {
            console.log("[Digital Workforce] Quota tracking log: User monetization intent recorded.");
          });
        }
      });
    } catch (error) {
      console.error("[Telemetry Fail] Failed to record monetization tracking data:", error);
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
