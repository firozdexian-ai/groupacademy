import React, { useEffect, useRef } from "react";
import { warmupDatabase } from "@/lib/databaseWarmup";

/**
 * GroUp Academy: Synchronous Delivery Ingress (BootGate)
 * CTO Reference: Authoritative non-blocking node for background registry hydration.
 * Purpose: Eliminates "Cold Start" latency for serverless database nodes.
 */

interface BootGateProps {
  children: React.ReactNode;
}

export function BootGate({ children }: BootGateProps) {
  const warmupExecutionLock = useRef(false);

  useEffect(() => {
    // PHASE 1: Idempotency Verification
    if (warmupExecutionLock.current) return;
    warmupExecutionLock.current = true;

    // PHASE 2: Session Persistence Audit
    const sessionBootStatus = sessionStorage.getItem("academy_boot_verified");
    if (sessionBootStatus === "true") {
      console.log("[BootGate] Registry_Warmup: SKIPPED (Session_Active)");
      return;
    }

    // PHASE 3: Background Hydration Protocol (Non-Blocking)
    console.log("[BootGate] Initializing_Registry_Sync...");

    // Execute Fire-and-Forget Handshake
    warmupDatabase()
      .then(() => {
        sessionStorage.setItem("academy_boot_verified", "true");
        console.log("[BootGate] Registry_Sync: VERIFIED");
      })
      .catch((err) => {
        // Academy Protocol: Never block talent ingress for warmup faults
        console.warn("[BootGate] Registry_Sync: FAULT (Graceful_Degradation_Active)", err);
      });
  }, []);

  // VIEWPORT_INGRESS: Immediate render of child nodes
  return <>{children}</>;
}
