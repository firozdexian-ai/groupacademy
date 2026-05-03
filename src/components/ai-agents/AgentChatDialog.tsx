import { LucideIcon, MessageCircle, Coins, Bot, Star, Users, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// CTO FIX: Corrected import path to match your exact folder structure
import { AgentAvatar } from "@/components/agents/AgentAvatar";

/**
 * Phase 11H: Marketplace card — dense, profile-first.
 * CTO Audit: Upgraded to Premium SaaS aesthetic. Wired into the Creator Economy identity system.
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

const isHex = (s?: string) => !!s && /^#([0-9A-F]{3}){1,2}$/i.test(s);

export function AgentCard({
  name,
  description,
  icon: Icon,
  color,
  bgColor,
  creditCost,
  avatarUrl,
  hasActiveSession,
  rating,
  users,
  isCreatorAgent,
  isCompanyAgent,
  onViewProfile,
  onMessage,
  onClick,
}: AgentCardProps) {
  const handleViewProfile = onViewProfile || onClick;

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-[28px] border-2 border-border/40 bg-card/30 backdrop-blur-sm p-5 flex flex-col gap-4 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer group",
        hasActiveSession ? "border-emerald-500/50 bg-emerald-500/5" : "hover:border-primary/40",
        isCreatorAgent && !isCompanyAgent && "hover:border-amber-500/40",
      )}
      onClick={handleViewProfile}
    >
      {/* HUD: ACTIVE_SYNC_INDICATOR */}
      {hasActiveSession && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
      )}

      <div className="flex items-start gap-4">
        {/* CTO FIX: Utilizing the centralized AgentAvatar component */}
        <AgentAvatar
          name={name}
          avatarUrl={avatarUrl}
          icon={Icon}
          bgColor={isHex(bgColor) ? bgColor : undefined}
          iconColor={isHex(color) ? color : undefined}
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

      {/* Stats Row */}
      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 border-t border-border/10 pt-3">
        {rating && rating > 0 ? (
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
          <Users className="h-3 w-3" /> {users || 0}
        </span>

        <span className="ml-auto flex items-center gap-1.5 text-foreground">
          <Coins className="h-3.5 w-3.5 text-primary" />
          {creditCost ?? 1} TKN
        </span>
      </div>

      {/* CTA */}
      <Button
        size="sm"
        className={cn(
          "w-full h-10 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all",
          hasActiveSession ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "",
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleViewProfile?.();
        }}
      >
        {hasActiveSession ? (
          <>
            <Zap className="h-3 w-3 mr-2" /> Resume Sync
          </>
        ) : (
          "Initialize Profile"
        )}
      </Button>
    </Card>
  );
}
