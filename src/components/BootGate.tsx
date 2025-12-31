import React, { useEffect, useRef } from 'react';
import { warmupDatabase } from '@/lib/databaseWarmup';

interface BootGateProps {
  children: React.ReactNode;
}

/**
 * Non-blocking boot gate that triggers database warmup in the background.
 * Children are rendered immediately - warmup runs asynchronously.
 */
export function BootGate({ children }: BootGateProps) {
  const warmupStarted = useRef(false);

  useEffect(() => {
    // Only warmup once per app lifecycle
    if (warmupStarted.current) return;
    warmupStarted.current = true;

    // Check if we've already warmed up this session
    const hasBooted = sessionStorage.getItem('boot_complete');
    if (hasBooted === 'true') {
      console.log('[BootGate] Already booted this session, skipping warmup');
      return;
    }

    // Fire and forget - warmup runs in background
    warmupDatabase()
      .then(() => {
        sessionStorage.setItem('boot_complete', 'true');
        console.log('[BootGate] Warmup complete');
      })
      .catch((err) => {
        // Best effort - don't block app for warmup failures
        console.warn('[BootGate] Warmup failed (non-blocking):', err);
      });
  }, []);

  // Always render children immediately - no blocking
  return <>{children}</>;
}
