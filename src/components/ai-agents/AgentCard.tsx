import { useMemo } from "react";
import { LucideIcon, Coins, Star, Users, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "@/components/ai-agents/AgentAvatar";

/**
 * GroUp Academy: Marketplace Agent Card Node (V5.6.0)
 * CTO Reference: High-performance profile card rendering corporate and creator agents.
 * Architecture: Isolated event handler routes eliminating dual action execution loops.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

interface AgentCardProps {
  id: string;
  agent_key?: string;
  name: string;
  description: string;
  icon?: LucideIcon;
  color: string;
  bgColor: string;
  expertise: string[];
  creditCost?: number;
  avatarUrl?: string | null;
  hasActiveSession?: boolean;
  rating?: number;
  users?: number;
  isCreatorAgent?: boolean;
  isCompanyAgent?: boolean;
  onViewProfile?: () => void;
  onMessage?: () => void;
  onClick?: () => void;
}

const isHex = (hexString?: string) => !!hexString && /^#([0-9A-F]{3}){1,2}$/i.test(hexString);

export function AgentCard({
  name = "AGENT_ENTITY_NODE",
  description = "No execution description provided.",
  icon: Icon,
  color,
  bgColor,
  creditCost = 1,
  avatarUrl,
  hasActiveSession = false,
  rating = 0,
  users = 0,
  isCreatorAgent = false,
  isCompanyAgent = false,
  onViewProfile,
  onMessage,
  onClick,
}: AgentCardProps) {
  // Isolate hex code color evaluation primitives cleanly
  const validatedIconColor = useMemo(() => (isHex(color) ? color : undefined), [color]);
  const validatedBgColor = useMemo(() => (isHex(bgColor) ? bgColor : undefined), [bgColor]);

  // --- HANDLER: CARD_CONTAINER_CLICK_ROUTING ---
  const handleCardClick = () => {
    // HUD: EXECUTING_PRIMARY_CARD_NAVIGATION_ROUTING
    if (onViewProfile) {
      onViewProfile();
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  // --- HANDLER: ACTION_BUTTON_CLICK_ROUTING ---
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // HUD: ISOLATING_BUTTON_INTERACTION_PROPAGATION
    e.stopPropagation(); // Seal macro card link triggers from executing concurrently

    if (onMessage) {
      onMessage();
      return;
    }

    // Fallback to standard tracking actions if conversational handlers are missing
    if (onViewProfile) {
      onViewProfile();
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card
      type="button"
      onClick={handleCardClick}
      className={cn(
        "relative overflow-hidden rounded-[28px] border-2 border-border/40 bg-card/30 backdrop-blur-sm p-5 flex flex-col gap-4 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer group text-left select-none",
        hasActiveSession ? "border-emerald-500/50 bg-emerald-500/5" : "hover:border-primary/40",
        isCreatorAgent && !isCompanyAgent && "hover:border-amber-500/40",
      )}
    >
      {/* HUD: ACTIVE_SYNC_INDICATOR */}
      {hasActiveSession && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
      )}

      <div className="flex items-start gap-4">
        {/* COMPONENT: ecosystem avatar primitive */}
        <AgentAvatar
          name={name}
          avatarUrl={avatarUrl}
          icon={Icon}
          bgColor={validatedBgColor}
          iconColor={validatedIconColor}
          size="lg"
          isOnline={hasActiveSession}
          isCreatorAgent={isCreatorAgent}
          isCompanyAgent={isCompanyAgent}
        />

        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-black text-lg uppercase italic tracking-tighter leading-none line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-xs font-medium italic text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* METRICS HUD: STATS_ROW_REGISTRY */}
      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 border-t border-border/10 pt-3 mt-auto">
        {rating > 0 ? (
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-foreground">{rating.toFixed(1)}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 opacity-60">
            <Star className="h-3 w-3" /> NEW_NODE
          </span>
        )}

        <span className="opacity-30">|</span>

        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" /> {users}
        </span>

        <span className="ml-auto flex items-center gap-1.5 text-foreground">
          <Coins className="h-3.5 w-3.5 text-primary" />
          {creditCost} TKN
        </span>
      </div>

      {/* CTA INTERFACE INTERACTION TRIGGER */}
      <Button
        size="sm"
        type="button"
        onClick={handleButtonClick}
        className={cn(
          "w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-[0.99]",
          hasActiveSession ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10" : "",
        )}
      >
        {hasActiveSession ? (
          <>
            <Zap className="h-3 w-3 mr-2 animate-pulse" /> Resume Sync
          </>
        ) : (
          "Initialize Profile"
        )}
      </Button>
    </Card>
  );
}
