import { useEffect, useMemo, useState } from "react";

/**
 * GroUp Academy: Perceptual Latency Sentinel
 * CTO Reference: Authoritative hook for dynamic loading states and UX continuity.
 * Performance: Memoized message derivation with atomic interval management.
 */

export type ProgressiveLoadingMessageOptions = {
  /** Thresholds defined in monotonic seconds */
  thresholds?: {
    connecting?: number;
    long?: number;
    veryLong?: number;
  };
};

export function useProgressiveLoadingMessage(active: boolean, options: ProgressiveLoadingMessageOptions = {}) {
  const { thresholds } = options;
  const [seconds, setSeconds] = useState(0);

  // PHASE: Temporal_Lifecycle_Management
  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }

    // Initialize monotonic incrementor
    setSeconds(0);
    const intervalId = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [active]);

  // PHASE: Semantic_Message_Derivation
  const message = useMemo(() => {
    // HUD: Define default institutional thresholds
    const t = {
      connecting: thresholds?.connecting ?? 5,
      long: thresholds?.long ?? 15,
      veryLong: thresholds?.veryLong ?? 30,
    };

    if (seconds < t.connecting) return "Initializing trajectory…";
    if (seconds < t.long) return "Connecting to neural server…";
    if (seconds < t.veryLong) return "Optimizing connection (this may take a moment)…";

    return "Finalizing handshake… almost there.";
  }, [seconds, thresholds]);

  return { seconds, message };
}
