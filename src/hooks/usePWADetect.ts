import { useSyncExternalStore, useCallback } from "react";

/**
 * GroUp Academy: Environment Detection Sentinel (V5.6.0)
 * CTO Reference: Authoritative controller identifying PWA sandbox and TWA standalone layers.
 * Architecture: Optimized via useSyncExternalStore to eliminate hydration presentation shifts.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Variant).
 */

/**
 * Evaluates ambient browser environment flags against diverse mobile distribution frameworks.
 */
function evaluateStandaloneStatus(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  // Standard: Modern display-mode query configuration
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  // iOS: Proprietary webkit navigation layer parameters
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // Android: Trusted Web Activity (TWA) origin referrer footprints
  const isAndroidTWA = document.referrer.includes("android-app://");

  return isStandalone || isIOSStandalone || isAndroidTWA;
}

/**
 * Real-time hardware and sandboxing environment inspector.
 * Ensures instant environment synchronization without flash-of-unstyled-content (FOUC).
 */
export function usePWADetect() {
  // --- HUD: DISPLAY_MODE_SUBSCRIPTION_ORCHESTRATOR ---
  const subscribe = useCallback((callback: () => void) => {
    if (typeof window === "undefined") return () => {};

    try {
      const mediaQuery = window.matchMedia("(display-mode: standalone)");
      mediaQuery.addEventListener("change", callback);

      return () => mediaQuery.removeEventListener("change", callback);
    } catch (err) {
      console.error("[Digital Workforce] ANOMALY: Native device display-mode subscription layer failed to bind.", err);
      return () => {};
    }
  }, []);

  // --- HUD: SNAPSHOT_EXTRACTORS ---
  const getSnapshot = () => evaluateStandaloneStatus();
  const getServerSnapshot = () => false; // Server compilation maps securely to fallback parameters

  const isPWA = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    isPWA,
    isLoading: false, // Instant calculation via Sync Store completely eradicates the manual loading step transit
  };
}

export default usePWADetect;
