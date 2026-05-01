import { LucideIcon, MessageCircle, Coins, Bot, Star, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Phase 11H: Marketplace card — dense, profile-first.
 * Primary CTA: View Profile. Secondary: Message.
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
  onViewProfile,
  onMessage,
  onClick,
}: AgentCardProps) {
  const handleViewProfile = onViewProfile || onClick;
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card p-3 flex flex-col gap-2 transition-all hover:shadow-md hover:border-primary/40 cursor-pointer",
        hasActiveSession && "ring-1 ring-emerald-500/40",
      )}
      onClick={handleViewProfile}
    >
      <div className="flex items-start gap-2.5">
        <Avatar className="h-12 w-12 rounded-full shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
          <AvatarFallback
            className="rounded-full text-white"
            style={{
              backgroundColor: isHex(bgColor) ? bgColor : isHex(color) ? color : "#2A7DDE",
            }}
          >
            {Icon ? <Icon className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-tight line-clamp-1">{name}</h3>
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug mt-0.5">{description}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        {rating && rating > 0 ? (
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
          </span>
        ) : (
          <span className="flex items-center gap-0.5 opacity-60">
            <Star className="h-3 w-3" /> New
          </span>
        )}
        <span>·</span>
        <span className="flex items-center gap-0.5">
          <Users className="h-3 w-3" /> {users || 0}
        </span>
        <span className="ml-auto flex items-center gap-0.5 text-foreground font-semibold">
          <Coins className="h-3 w-3 text-primary" /> {creditCost ?? 1}
        </span>
      </div>

      {/* CTAs */}
      <div className="flex gap-1.5 pt-0.5">
        <Button
          size="sm"
          className="flex-1 h-8 text-xs font-semibold rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile?.();
          }}
        >
          View Profile
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 rounded-full shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onMessage?.();
          }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
