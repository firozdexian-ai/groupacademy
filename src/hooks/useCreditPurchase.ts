import { create } from "zustand";

/**
 * Global "Buy Credits" sheet opener.
 * Lets any component anywhere in the talent app trigger the
 * CreditPurchaseSheet (mounted once in TalentAppShell).
 */
interface CreditPurchaseStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useCreditPurchase = create<CreditPurchaseStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
