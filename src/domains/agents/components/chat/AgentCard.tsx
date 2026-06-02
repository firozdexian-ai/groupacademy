import { useMemo } from "react";
import { LucideIcon, Coins, Star, Users, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "@/domains/agents/components/chat/AgentAvatar";

/**
 * Group Academy — Marketplace Agent Card Node
 * Version: Phase 10j.5 Hardened
 * Purpose: Interactive profile node for corporate and creator agents.
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
  name = "Agent",
  description = "No description available.",
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
  const validatedIconColor = useMemo(() => (isHex(color) ? color : undefined), [color]);
  const validatedBgColor = useMemo(() => (isHex(bgColor) ? bgColor : undefined), [bgColor]);

  const handleCardClick = () => {
    if (onViewProfile) onViewProfile();
    else if (onClick) onClick();
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onMessage) onMessage();
    else if (onViewProfile) onViewProfile();
    else if (onClick) onClick();
  };

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "relative overflow-hidden rounded-[24px] border-2 border-border/40 bg-card/50 backdrop-blur-sm p-5 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group text-left select-none",
        hasActiveSession ? "border-emerald-500/50 bg-emerald-500/5" : "hover:border-primary/40",
      )}
    >
      {hasActiveSession && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />}

      <div className="flex items-start gap-4">
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
          <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-t border-border/50 pt-3 mt-auto">
        {rating > 0 ? (
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-foreground">{rating.toFixed(1)}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 opacity-60">
            <Star className="h-3 w-3" /> NEW
          </span>
        )}

        <span className="opacity-30">|</span>

        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" /> {users.toLocaleString()}
        </span>

        <span className="ml-auto flex items-center gap-1.5 text-foreground">
          <Coins className="h-3.5 w-3.5 text-primary" />
          {creditCost} Credits
        </span>
      </div>

      <Button
        size="sm"
        type="button"
        onClick={handleButtonClick}
        className={cn(
          "w-full h-10 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
          hasActiveSession
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-primary hover:bg-primary/90 text-primary-foreground",
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
