import * as React from "react";

/**
 * GroUp Academy: Viewport Intelligence Hook
 * CTO Reference: Authoritative sensor for responsive layout orchestration.
 * Logic: Synchronizes UI state with hardware viewport dimensions.
 */

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // PROTOCOL: Initialize as undefined to prevent SSR identity drift
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // SYNC: Establish Media Query List node
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const executeViewportSync = () => {
      // Direct parity check against breakpoint threshold
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initialize baseline state on mount
    setIsMobile(mql.matches);

    // HUD: REGISTER_VIEWPORT_LISTENERS
    // Hardened for cross-browser event handling
    try {
      mql.addEventListener("change", executeViewportSync);
    } catch (err) {
      // Fallback for legacy mobile browsers
      mql.addListener(executeViewportSync);
    }

    return () => {
      try {
        mql.removeEventListener("change", executeViewportSync);
      } catch (err) {
        mql.removeListener(executeViewportSync);
      }
    };
  }, []);

  // Registry Default: false during hydration, verified boolean post-mount
  return !!isMobile;
}
