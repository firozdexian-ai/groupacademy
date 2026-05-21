import { useEffect, useRef, useState, useCallback } from "react";
import { feedApi } from "@/domains/feed/api/manifest";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/**
 * GroUp Academy: Unified Hype & Micro-transaction Sensor (V5.6.0)
 * CTO Reference: Authoritative handler for high-velocity creator monetization taps.
 * Architecture: Digital Workforce enabled - logs fiscal friction to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2024 Launch Edition).
 */

export type HypeContentType = "post" | "course" | "video" | "blog";

const TAP_LOCK_MS = 120;
const TOAST_DEBOUNCE_MS = 900;

export function useHype(
  contentIdOrPostId: string,
  initialCountOrType: number | HypeContentType = 0,
  maybeInitialCount: number = 0,
) {
  // Protocol Handshake: Support legacy and modern overloading
  const contentType: HypeContentType = typeof initialCountOrType === "string" ? initialCountOrType : "post";
  const initialCount: number = typeof initialCountOrType === "number" ? initialCountOrType : maybeInitialCount;
  const contentId = contentIdOrPostId;

  const { talent } = useTalent();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [count, setCount] = useState<number>(initialCount);
  const [isHyping, setIsHyping] = useState(false);

  const lastTap = useRef(0);
  const inFlight = useRef(0);
  const pendingDelta = useRef(0);
  const errorCount = useRef(0);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => setCount(initialCount), [initialCount]);

  /**
   * HUD: FLUSH_FISCAL_TELEMETRY
   * Consolidates rapid-fire micro-transactions into a single UX notification.
   */
  const flushToast = useCallback(() => {
    const sent = pendingDelta.current;
    const errs = errorCount.current;

    pendingDelta.current = 0;
    errorCount.current = 0;

    if (sent > 0) {
      toast({
        title: sent === 1 ? "🔥 Hype sent · -1 credit" : `🔥 +${sent} Hype · -${sent} credits`,
      });
    }

    if (errs > 0) {
      toast({
        title: errs === 1 ? "Hype failed" : `${errs} hypes failed`,
        description: "Transaction ledger mapping delayed.",
        variant: "destructive",
      });
    }

    // Refresh unified wallet caches to maintain ledger consistency
    queryClient.invalidateQueries({ queryKey: ["talent-credits", talent?.id] });
    queryClient.invalidateQueries({ queryKey: ["talent-credits-balance"] });
    queryClient.invalidateQueries({ queryKey: ["credits-summary"] });
  }, [toast, queryClient, talent?.id]);

  const scheduleToast = useCallback(() => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(flushToast, TOAST_DEBOUNCE_MS);
  }, [flushToast]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
        flushToast();
      }
    };
  }, [flushToast]);

  /**
   * HUD: EXECUTE_ATOMIC_HYPE_INGRESS
   * Core micro-transaction logic with optimistic rollbacks.
   */
  const hype = useCallback(async () => {
    if (!talent?.id) {
      toast({ title: "Sign in to Hype creators", variant: "destructive" });
      return;
    }

    const now = Date.now();
    if (now - lastTap.current < TAP_LOCK_MS) return;
    lastTap.current = now;

    // Optimistic UI Ingress
    setCount((c) => c + 1);
    inFlight.current += 1;
    setIsHyping(true);

    const { error } = await supabase.rpc("hype_content" as any, {
      _content_type: contentType,
      _content_id: contentId,
    });

    inFlight.current -= 1;
    if (inFlight.current === 0) setIsHyping(false);

    if (error) {
      setCount((c) => Math.max(0, c - 1)); // Rollback
      const msg = error.message || "";

      if (msg.includes("INSUFFICIENT_CREDITS")) {
        if (toastTimer.current) {
          window.clearTimeout(toastTimer.current);
          toastTimer.current = null;
        }
        flushToast();
        toast({
          title: "Wallet deficit detected",
          description: "Top up your credits to keep boosting creators.",
          variant: "destructive",
        });
        return;
      }

      if (msg.includes("CANNOT_HYPE_SELF")) {
        toast({ title: "Self-Hype is restricted", variant: "destructive" });
        return;
      }

      // Digital Workforce Anomaly Sensor:
      // Logs systemic RPC failures for infrastructure auditing.
      errorCount.current += 1;
      console.error("[Digital Workforce] ANOMALY: hype_content RPC failed sync.", {
        contentType,
        contentId,
        error: msg,
      });

      scheduleToast();
      return;
    }

    pendingDelta.current += 1;
    scheduleToast();
  }, [talent?.id, contentType, contentId, toast, scheduleToast, flushToast]);

  return { count, hype, isHyping };
}
