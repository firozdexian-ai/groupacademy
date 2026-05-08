import { useState } from "react";
import { ThumbsUp, Lightbulb, PartyPopper, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Sentiment Ingress Node (ReactionBar)
 * CTO Reference: Authoritative tactical module for community engagement telemetry.
 */

export type ReactionType = "like" | "insightful" | "celebrate" | "support";

interface ReactionBarProps {
  reactions: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
  /** When true, renders buttons inline without wrapper borders (parent handles layout) */
  inline?: boolean;
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
  like: { icon: ThumbsUp, label: "AGREE", color: "text-blue-500", activeBg: "bg-blue-500/10" },
  insightful: { icon: Lightbulb, label: "STRATEGIC", color: "text-amber-500", activeBg: "bg-amber-500/10" },
  celebrate: { icon: PartyPopper, label: "BULLISH", color: "text-emerald-500", activeBg: "bg-emerald-500/10" },
  support: { icon: Heart, label: "EMPATHY", color: "text-rose-500", activeBg: "bg-rose-500/10" },
};

export function ReactionBar({ reactions, userReaction, onReact, disabled, inline = false }: ReactionBarProps) {
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);

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
          className={cn(
            "flex-1 h-9 text-xs font-medium gap-2 transition-all duration-200 rounded-lg px-3",
            isActive
              ? cn(config.color, config.activeBg, "scale-105 border border-current/20 shadow-sm")
              : "text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground",
            !isActive && hoveredReaction === type && "scale-105",
          )}
          onClick={(e) => {
            e.preventDefault();
            onReact(type);
          }}
          onMouseEnter={() => setHoveredReaction(type)}
          onMouseLeave={() => setHoveredReaction(null)}
        >
          <Icon
            className={cn("h-4 w-4 transition-all duration-500", isActive && "fill-current scale-110 drop-shadow-sm")}
          />
          <span className={cn("hidden md:inline uppercase tracking-widest")}>{config.label}</span>
        </Button>
      );
    },
  );

  if (inline) {
    return <div className="flex items-center gap-2 w-full">{reactionButtons}</div>;
  }

  // STANDALONE TELEMETRY MODE
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  const topReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type as ReactionType);

  return (
    <div className="space-y-4 w-full animate-in fade-in duration-500">
      {totalReactions > 0 && (
        <div className="flex items-center gap-2 text-muted-foreground/70 px-1">
          <div className="flex -space-x-2">
            {topReactions.map((type) => {
              const config = REACTION_CONFIG[type];
              const Icon = config.icon;
              return (
                <div
                  key={type}
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center bg-background border-2 border-muted shadow-lg",
                    config.color,
                  )}
                >
                  <Icon className="h-3 w-3 fill-current" />
                </div>
              );
            })}
          </div>
          <span className="text-[11px] font-medium normal-case tracking-normal text-muted-foreground">
            {totalReactions.toLocaleString()} {totalReactions === 1 ? "reaction" : "reactions"}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 border-t-2 border-border/10 pt-4">{reactionButtons}</div>
    </div>
  );
}
