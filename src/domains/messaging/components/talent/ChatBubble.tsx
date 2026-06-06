import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface Props {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  ctaLabel?: string;
  ctaLink?: string;
}

/**
 * GroUp Academy: Core Conversational Dialog Interface Node (ChatBubble)
 * An authoritative component displaying messaging states, time markers, and generative action linkages.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ChatBubble({ role, content, timestamp, ctaLabel, ctaLink }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isUser = role === "user";

  // Monitor high-fidelity agent dialogue impressions cleanly over analytical telemetry channels
  useEffect(() => {
    if (role && content) {
      trackEvent("chat_bubble_node_rendered", {
        messageRole: role,
        hasActionTrigger: !!(ctaLabel && ctaLink),
        contentLength: content.length,
      });
    }
  }, [role, content, ctaLabel, ctaLink]);

  // SYSTEM LOG BRANCH RECONCILIATION: Render administrative systemic indicators globally
  if (role === "system") {
    return (
      <div className="flex justify-center w-full my-2.5 select-none animate-in fade-in duration-200">
        <div className="px-3.5 py-1 rounded-full bg-muted/40 border border-border/5 text-[10px] sm:text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider tabular-nums text-center max-w-[90%] truncate text-ellipsis select-text">
          {content}
        </div>
      </div>
    );
  }

  const handleActionNavigationTrigger = async () => {
    if (!ctaLink) return;

    trackEvent("chat_bubble_action_executed", { actionLabel: ctaLabel, destinationUrl: ctaLink });

    try {
      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      navigate(ctaLink);
    } catch (err) {
      trackError(err, {
        component: "ChatBubble",
        action: "execute_action_navigation_callback",
        destinationUrl: ctaLink,
      });
    }
  };

  return (
    <div className={cn("flex w-full mb-2 antialiased transform-gpu", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] sm:max-w-[75%] px-3.5 py-2.5 rounded-2xl shadow-sm text-left flex flex-col justify-center min-w-0 transition-all duration-200 border border-transparent select-text",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-none shadow-primary/5 select-all"
            : "bg-card/40 dark:bg-card/20 border-border/40 backdrop-blur-sm text-foreground/90 rounded-tl-none select-text",
        )}
      >
        {/* MESSAGING MAIN STRUCTURAL CONTENT PARAGRAPH */}
        <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap break-words pr-0.5 selection:bg-primary/20">
          {content || "Message is empty."}
        </p>

        {/* COMPONENT COMMAND INTERACTION CALL-TO-ACTION BUTTON LINKAGE */}
        {ctaLabel && ctaLink && (
          <Button
            size="sm"
            type="button"
            variant={isUser ? "secondary" : "default"}
            className={cn(
              "mt-2.5 h-8 text-[11px] font-extrabold uppercase tracking-wide w-full rounded-xl shadow-sm cursor-pointer transition-transform active:scale-[0.99]",
              isUser
                ? "bg-background text-primary hover:bg-background/90 border border-transparent"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            onClick={handleActionNavigationTrigger}
          >
            <span>{ctaLabel}</span>
          </Button>
        )}

        {/* CHRONOLOGY METADATA TIMESTAMP TEXT CONTAINER */}
        {timestamp && (
          <span
            className={cn(
              "block text-[9px] font-bold tracking-tight uppercase tabular-nums mt-1.5 select-none leading-none opacity-60",
              isUser ? "text-primary-foreground/80 text-right pr-0.5" : "text-muted-foreground pl-0.5",
            )}
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
