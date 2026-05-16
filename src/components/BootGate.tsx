import React, { useEffect, useRef } from "react";
import { warmupDatabase } from "@/lib/databaseWarmup";
import { trackError, trackEvent } from "@/lib/errorTracking";

interface BootGateProps {
  children: React.ReactNode;
}

/**
 * GroUp Academy: Non-Blocking Background Registry Hydration Wrapper (BootGate)
 * An authoritative non-blocking node initializing connection handshakes to eliminate cold starts on edge database clusters.
 * Version: Launch Candidate · Phase Z0 Hardened Engine Gate
 */
export function BootGate({ children }: BootGateProps) {
  const isMountedRef = useRef<boolean>(true);
  const warmupExecutionLockRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;

    // PHASE 1: Idempotency Verification Gating Check
    if (warmupExecutionLockRef.current) return;
    warmupExecutionLockRef.current = true;

    // PHASE 2: Session Persistence Registry Audit
    try {
      const sessionBootStatusStr = sessionStorage.getItem("academy_boot_verified");
      if (sessionBootStatusStr === "true") {
        trackEvent("boot_gate_warmup_skipped_session_active");
        return;
      }
    } catch (storageAccessError) {
      // Defensively catch sandboxed third-party or incognito storage access exceptions
      trackError(storageAccessError, { component: "BootGate", action: "session_storage_read" });
    }

    // PHASE 3: Background Hydration Protocol (Non-Blocking Transmissions)
    trackEvent("boot_gate_registry_sync_initiated");

    warmupDatabase()
      .then(() => {
        // Enforce structural boundary checks to discard logic mutations post-unmount
        if (!isMountedRef.current) return;

        try {
          sessionStorage.setItem("academy_boot_verified", "true");
        } catch (storageWriteError) {
          trackError(storageWriteError, { component: "BootGate", action: "session_storage_write" });
        }

        trackEvent("boot_gate_registry_sync_success");
      })
      .catch((caughtHandshakeExceptionErr) => {
        // Academy Protocol Graceful Degradation: Never halt client canvas ingress for warm-up faults
        trackError(caughtHandshakeExceptionErr, {
          component: "BootGate",
          action: "database_warmup_handshake_rpc",
          severity: "low",
        });

        trackEvent("boot_gate_registry_sync_graceful_degradation_active");
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // VIEWPORT INGRESS: Authorized immediate, un-blocked pass-through rendering of downstream child trees
  return <>{children}</>;
}

export default BootGate;
