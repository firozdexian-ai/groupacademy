import { useSyncExternalStore, useCallback } from "react";

/**
 * GroUp Academy: Viewport Responsive Sensor (V5.6.0)
 * CTO Reference: Authoritative hook for media-query synchronization.
 * Architecture: Optimized via useSyncExternalStore for zero-flicker hydration.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

export function useMediaQuery(query: string): boolean {
  // HUD: BINDING_VIEWPORT_LISTENER
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") return () => {};

      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);

      return () => mql.removeEventListener("change", callback);
    },
    [query],
  );

  // HUD: EXTRACTING_SNAPSHOT
  const getSnapshot = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };

  // HUD: SSR_FALLBACK
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
