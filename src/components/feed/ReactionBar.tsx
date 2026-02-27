import { useState } from 'react';
import { ThumbsUp, Lightbulb, PartyPopper, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ReactionType = 'like' | 'insightful' | 'celebrate' | 'support';

interface ReactionBarProps {
  reactions: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
  /** When true, renders buttons inline without wrapper borders (parent handles layout) */
  inline?: boolean;
}

const REACTION_CONFIG: Record<ReactionType, {
  icon: React.ElementType;
  label: string;
  color: string;
}> = {
  like: { icon: ThumbsUp, label: 'Like', color: 'text-primary' },
  insightful: { icon: Lightbulb, label: 'Insightful', color: 'text-yellow-500' },
  celebrate: { icon: PartyPopper, label: 'Celebrate', color: 'text-green-500' },
  support: { icon: Heart, label: 'Support', color: 'text-red-500' },
};

export function ReactionBar({
  reactions,
  userReaction,
  onReact,
  disabled,
  inline = false,
}: ReactionBarProps) {
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);

  const reactionButtons = (Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG.like][])
    .slice(0, 3)
    .map(([type, config]) => {
      const Icon = config.icon;
      const isActive = userReaction === type;
      const isHovered = hoveredReaction === type;
      return (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "flex-1 h-8 text-xs gap-1 transition-all rounded-sm px-0",
            isActive && config.color,
            isActive && "bg-muted/50",
            isHovered && !isActive && "scale-105"
          )}
          onClick={() => onReact(type)}
          onMouseEnter={() => setHoveredReaction(type)}
          onMouseLeave={() => setHoveredReaction(null)}
        >
          <Icon className={cn("h-3.5 w-3.5", isActive && "fill-current")} />
          <span className="hidden sm:inline">{config.label}</span>
        </Button>
      );
    });

  if (inline) {
    // Render just the buttons, no wrapper -- parent handles layout
    return <>{reactionButtons}</>;
  }

  // Legacy standalone mode (kept for backwards compat)
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  const topReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([type]) => type as ReactionType);

  return (
    <div className="space-y-2">
      {totalReactions > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
          <div className="flex -space-x-1">
            {topReactions.map(type => {
              const config = REACTION_CONFIG[type];
              const Icon = config.icon;
              return (
                <div key={type} className={cn("h-4 w-4 rounded-full flex items-center justify-center bg-background ring-1 ring-border", config.color)}>
                  <Icon className="h-2.5 w-2.5" />
                </div>
              );
            })}
          </div>
          <span>{totalReactions}</span>
        </div>
      )}
      <div className="flex items-center gap-1 border-t border-border/50 pt-2">
        {reactionButtons}
      </div>
    </div>
  );
}
