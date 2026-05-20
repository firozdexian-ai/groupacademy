import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, Lightbulb, PartyPopper, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Sentiment Ingress Node (ReactionBar)
 * CTO Reference: Authoritative tactical module for community engagement telemetry.
 * Version: Launch Candidate · Phase Z0 Hardened
 */

export type ReactionType = "like" | "insightful" | "celebrate" | "support";

interface ReactionBarProps {
  reactions: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
  /** When true, renders buttons inline without wrapper borders (parent handles layout) */
  inline?: boolean;
  contextData?: {
    postId?: string;
    talentId?: string;
  };
}

const REACTION_CONFIG: Record<
  ReactionType,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    activeBg: string;
  }
> = {
  like: {
    icon: ThumbsUp,
    label: "Like",
    color: "text-blue-500 dark:text-blue-400",
    activeBg: "bg-blue-500/10 dark:bg-blue-500/5",
  },
  insightful: {
    icon: Lightbulb,
    label: "Insightful",
    color: "text-amber-500 dark:text-amber-400",
    activeBg: "bg-amber-500/10 dark:bg-amber-500/5",
  },
  celebrate: {
    icon: PartyPopper,
    label: "Celebrate",
    color: "text-emerald-500 dark:text-emerald-400",
    activeBg: "bg-emerald-500/10 dark:bg-emerald-500/5",
  },
  support: {
    icon: Heart,
    label: "Support",
    color: "text-rose-500 dark:text-rose-400",
    activeBg: "bg-rose-500/10 dark:bg-rose-500/5",
  },
};

export function ReactionBar({
  reactions,
  userReaction,
  onReact,
  disabled,
  inline = false,
  contextData,
}: ReactionBarProps) {
  const queryClient = useQueryClient();
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);

  // Monitor interaction impressions for analytical tracking
  useEffect(() => {
    if (contextData?.postId) {
      trackEvent("reaction_bar_rendered", { postId: contextData.postId, userHasReacted: !!userReaction });
    }
  }, [contextData, userReaction]);

  // Defensive Guard: Build a safe default structure to isolate layout math crashes completely
  const safeReactions =
    reactions && typeof reactions === "object" ? reactions : { like: 0, insightful: 0, celebrate: 0, support: 0 };

  const handleReactionClick = async (type: ReactionType) => {
    if (disabled || !type) return;

    trackEvent("reaction_bar_toggle_initiated", {
      type,
      postId: contextData?.postId,
      previousReaction: userReaction,
    });

    try {
      // Trigger the parent collection layout update handler
      await onReact(type);

      // Automated Efficiency: Broadcast cache invalidation across shared feed pools
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "ReactionBar",
        action: "execute_onReact_callback",
        targetReaction: type,
        ...contextData,
      });
    }
  };

  const reactionButtons = (Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG.like][]).map(
    ([type, config]) => {
      const Icon = config.icon;
      const isActive = userReaction === type;

      return (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          disabled={disabled}
          type="button"
          className={cn(
            "flex-1 h-9 text-[11px] sm:text-xs font-bold gap-2 transition-all duration-200 rounded-xl px-2.5 cursor-pointer transform-gpu select-none",
            isActive
              ? cn(config.color, config.activeBg, "scale-102 border border-current/10 shadow-sm font-extrabold")
              : "text-muted-foreground/80 hover:bg-muted/40 hover:text-foreground",
            !isActive && hoveredReaction === type && "scale-102 bg-muted/20",
            disabled && "opacity-40 cursor-not-allowed pointer-events-none",
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleReactionClick(type);
          }}
          onMouseEnter={() => !disabled && setHoveredReaction(type)}
          onMouseLeave={() => !disabled && setHoveredReaction(null)}
        >
          <Icon
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              isActive ? "fill-current scale-105 drop-shadow-sm" : "fill-none stroke-[2.2]",
            )}
          />
          <span className="hidden sm:inline tracking-tight font-bold">{config.label}</span>
        </Button>
      );
    },
  );

  if (inline) {
    return <div className="flex items-center gap-1.5 w-full select-none">{reactionButtons}</div>;
  }

  // STANDALONE TELEMETRY DATA CALCULATION MODE
  let totalReactions = 0;
  let topReactions: ReactionType[] = [];

  try {
    totalReactions = Object.values(safeReactions).reduce((sum, count) => sum + (Number(count) || 0), 0);
    topReactions = Object.entries(safeReactions)
      .filter(([_, count]) => (Number(count) || 0) > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type as ReactionType);
  } catch (mathErr) {
    trackError(mathErr instanceof Error ? mathErr : String(mathErr), {
      component: "ReactionBar",
      action: "aggregate_standalone_metrics",
      ...contextData,
    });
  }

  return (
    <div className="space-y-3.5 w-full animate-in fade-in duration-300 select-none">
      {totalReactions > 0 && (
        <div className="flex items-center gap-2 text-muted-foreground/70 px-1 select-text selection:bg-primary/10">
          {/* Stacked Sentiment Face Icons Wrapper Track */}
          <div className="flex -space-x-1.5 items-center">
            {topReactions.map((type) => {
              const config = REACTION_CONFIG[type];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <div
                  key={type}
                  className={cn(
                    "h-5.5 w-5.5 rounded-full flex items-center justify-center bg-background dark:bg-card border border-border/60 shadow-sm shrink-0",
                    config.color,
                  )}
                >
                  <Icon className="h-3 w-3 fill-current" />
                </div>
              );
            })}
          </div>
          <span className="text-[11px] font-bold tabular-nums tracking-tight text-muted-foreground/80 lowercase">
            {totalReactions.toLocaleString()} {totalReactions === 1 ? "reaction" : "reactions"}
          </span>
        </div>
      )}
      <div className="flex items-center gap-1.5 border-t border-border/30 pt-3">{reactionButtons}</div>
    </div>
  );
}
