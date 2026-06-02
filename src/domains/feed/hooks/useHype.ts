import { useEffect, useRef, useState, useCallback } from "react";
import { hypeContent as rpcHypeContent } from "@/domains/feed/repo/feedRepo";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export type HypeContentType = "post" | "course" | "video" | "blog";

const TAP_LOCK_MS = 120;
const TOAST_DEBOUNCE_MS = 900;

/**
 * Custom hook managing the optimistic state and micro-transaction adjustments for creator support.
 * Batches high-velocity clicks to minimize alert fatigue while maintaining an accurate wallet token state.
 */
export function useHype(
  contentIdOrPostId: string,
  initialCountOrType: number | HypeContentType = 0,
  maybeInitialCount: number = 0,
) {
  // Support legacy and modern function overloading styles safely
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
   * Consolidates high-frequency micro-transaction outcomes into a single user notification
   * and refreshes corresponding credit wallet caches.
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
        description: "Transaction update could not be completed.",
        variant: "destructive",
      });
    }

    // Refresh ledger balances instantly across parent containers
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
   * Dispatches an atomic hype update using optimistic UI increments and fallback mechanics.
   */
  const hype = useCallback(async () => {
    if (!talent?.id) {
      toast({ title: "Sign in to hype creators", variant: "destructive" });
      return;
    }

    const now = Date.now();
    if (now - lastTap.current < TAP_LOCK_MS) return;
    lastTap.current = now;

    // Optimistic UI state adjustment
    setCount((c) => c + 1);
    inFlight.current += 1;
    setIsHyping(true);

    let error: any = null;
    try {
      await rpcHypeContent({ _content_type: contentType, _content_id: contentId });
    } catch (e) {
      error = e;
    }

    inFlight.current -= 1;
    if (inFlight.current === 0) setIsHyping(false);

    if (error) {
      setCount((c) => Math.max(0, c - 1)); // Rollback state adjustment
      const msg = error.message || "";

      if (msg.includes("INSUFFICIENT_CREDITS")) {
        if (toastTimer.current) {
          window.clearTimeout(toastTimer.current);
          toastTimer.current = null;
        }
        flushToast();
        toast({
          title: "Not enough credits",
          description: "Top up your credits to keep supporting creators.",
          variant: "destructive",
        });
        return;
      }

      if (msg.includes("CANNOT_HYPE_SELF")) {
        toast({ title: "Self-hype is restricted", variant: "destructive" });
        return;
      }

      // Log systemic anomalies for infrastructure auditing logs
      errorCount.current += 1;
      console.error("Hype tracking execution process failed to synchronize:", {
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