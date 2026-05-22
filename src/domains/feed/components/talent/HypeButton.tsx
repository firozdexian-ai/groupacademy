import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContentHype, type HypeContentType } from "@/domains/feed/hooks/useContentHype";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface HypeButtonProps {
  postId?: string; // Backwards compatibility legacy anchor mapping
  contentType?: HypeContentType;
  contentId?: string;
  initialCount?: number;
  variant?: "default" | "compact";
  contextData?: {
    creatorTalentId?: string;
    senderTalentId?: string;
  };
}

/**
 * Universal Hype interaction trigger node — 1 credit/tap split matrix.
 * Standardized across posts, courses, videos, and articles with explicit
 * Phase Z0 fractional-credit telemetry and automated workspace agent logging triggers.
 */
export function HypeButton({
  postId,
  contentType,
  contentId,
  initialCount = 0,
  variant = "default",
  contextData,
}: HypeButtonProps) {
  const queryClient = useQueryClient();
  const finalType: HypeContentType = contentType ?? "post";
  const finalId = contentId ?? postId ?? "";

  // Authoritative content mutation server connection hook
  const { count, hype, isHyping } = useContentHype(finalType, finalId, initialCount);

  // Monitor interaction thresholds to notify the digital workforce of engagement spikes
  useEffect(() => {
    if (count > 0 && count % 50 === 0 && finalId) {
      trackEvent("UGC:hype_milestone_reached", {
        contentId: finalId,
        contentType: finalType,
        totalHypes: count,
      });
    }
  }, [count, finalId, finalType]);

  if (!finalId) {
    trackError("HypeButton component dropped into rendering context without structural content definitions.", {
      component: "HypeButton",
      action: "validation_assertion_failure",
    });
    return null;
  }

  const handleHypeClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (isHyping) return;

    // Asynchronously log interaction logs to protect telemetry tracking integrity
    trackEvent("hype_button_pressed", {
      contentId: finalId,
      contentType: finalType,
      senderId: contextData?.senderTalentId,
    });

    try {
      // Execute the native mutation hook layer
      await hype();

      // Automated Efficiency: Broadcast cache invalidation across shared balance viewports
      queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
    } catch (err: any) {
      const parsedMessage = err instanceof Error ? err.message : String(err);

      // Log financial exception securely to evaluate platform transactional metrics safely
      trackError(parsedMessage, {
        component: "HypeButton",
        action: "execute_hype_deduction",
        contentId: finalId,
        contentType: finalType,
        ...contextData,
      });

      // Digital Workforce Monitoring: Route balance lookups cleanly to errorTracking parameters
      if (parsedMessage.toLowerCase().includes("balance") || parsedMessage.toLowerCase().includes("credit")) {
        trackEvent("insufficient_funds_hype_blocked", {
          errorContext: parsedMessage,
          ...contextData,
        });
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isHyping}
      onClick={handleHypeClick}
      className={cn(
        "h-8 gap-1.5 rounded-lg px-2.5 text-[11px] font-bold tracking-tight select-none cursor-pointer transition-all duration-200",
        "text-orange-600 dark:text-orange-500 hover:text-orange-700 hover:bg-orange-500/10 active:scale-95",
        variant === "compact" && "px-2",
      )}
      title="Hype this asset content container (Costs 1 credit split)"
    >
      <Flame
        className={cn(
          "h-4 w-4 transition-transform duration-300",
          isHyping ? "animate-bounce fill-current text-orange-500" : "fill-none stroke-[2.2]",
        )}
      />
      <span className="tabular-nums font-semibold">{count > 0 ? count.toLocaleString() : "Hype"}</span>
    </Button>
  );
}
