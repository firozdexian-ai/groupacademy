import * as React from "react";

/**
 * GroUp Academy: Viewport Intelligence Hook
 * CTO Reference: Authoritative sensor for responsive layout orchestration.
 * Logic: Synchronizes UI state with hardware viewport dimensions.
 * Phase: Z0 Code Freeze Optimized.
 */

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // PROTOCOL: Initialize as undefined to prevent SSR identity drift (Hydration Safety)
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // SYNC: Establish Media Query List node for the 768px threshold
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      // Direct parity check against hardware innerWidth
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // HUD: REGISTER_VIEWPORT_LISTENERS
    // Optimized for modern browsers with legacy fallback for older mobile clients
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
    } else {
      // Fallback for legacy Safari/Mobile browsers
      mql.addListener(onChange);
    }

    // Initialize baseline state on mount
    setIsMobile(mql.matches);

    // CLEANUP: Prevent listener accumulation during hot-reloads or route changes
    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", onChange);
      } else {
        mql.removeListener(onChange);
      }
    };
  }, []);

  // Registry Default: Return '!!' to ensure a boolean during render,
  // though 'undefined' is internally preserved until the first mount.
  return !!isMobile;
}
