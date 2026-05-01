import { useSyncExternalStore } from "react";

/**
 * Global "Buy Credits" sheet opener.
 * Lets any component anywhere in the talent app trigger the
 * CreditPurchaseSheet (mounted once in TalentAppShell).
 *
 * Implemented with a tiny external store + useSyncExternalStore
 * to avoid pulling in a state library.
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
