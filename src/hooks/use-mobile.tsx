import * as React from "react";

/**
 * GroUp Academy: Viewport Intelligence Hook
 * CTO Reference: Governs UI degradation and component scaling for mobile nodes.
 * Prevents hydration mismatches by defaulting to safe false-state during SSR.
 */

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize as undefined or false to maintain SSR/Hydration parity
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // 1. Establish Media Query Listener Node
    const mql = window.matchMatch(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // 2. Optimized Event Handler
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // 3. Initial Pulse Check
    setIsMobile(mql.matches);

    // 4. Lifecycle Authority
    // Modern "change" listener with fallback support for legacy environments
    try {
      mql.addEventListener("change", onChange);
    } catch (e) {
      // Fallback for older Safari logic
      mql.addListener(onChange);
    }

    return () => {
      try {
        mql.removeEventListener("change", onChange);
      } catch (e) {
        mql.removeListener(onChange);
      }
    };
  }, []);

  // Return logic: Default to false if state is still initializing to prevent UI flickering
  return !!isMobile;
}
