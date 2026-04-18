import { formatDistanceToNow, isValid } from "date-fns";
import { Coins, ArrowRight, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "./AgentAvatar";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface AgentListItemProps {
  id: string;
  name: string;
  description: string;
  icon?: LucideIcon;
  bgColor?: string;
  iconColor?: string;
  avatarUrl?: string | null;
  creditCost?: number;
  category?: string;
  isActive?: boolean;
  isCompanyAgent?: boolean;
  companyName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  expertise?: string[];
  onClick: () => void;
}

export function AgentListItem({
  name,
  description,
  icon,
  bgColor,
  iconColor,
  avatarUrl,
  creditCost = 10,
  isActive = false,
  isCompanyAgent = false,
  companyName,
  lastMessage,
  lastMessageTime,
  expertise = [],
  onClick,
}: AgentListItemProps) {
  // CTO Fix: Safe date resolution to prevent runtime crashes
  const getTimeAgo = () => {
    if (!lastMessageTime) return null;
    const date = new Date(lastMessageTime);
    if (!isValid(date)) return null;
    return formatDistanceToNow(date, { addSuffix: false });
  };

  const timeAgo = getTimeAgo();

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-4 p-4 transition-all duration-300 border-b border-border/40",
        "hover:bg-muted/50 active:scale-[0.98] group relative overflow-hidden",
        isActive && "bg-primary/[0.03] dark:bg-primary/[0.01]",
      )}
    >
      {/* Active Indicator Bar */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary animate-in slide-in-from-left duration-500" />
      )}

      {/* Avatar Layer */}
      <AgentAvatar
        name={name}
        avatarUrl={avatarUrl}
        icon={icon}
        bgColor={bgColor}
        iconColor={iconColor}
        size="lg"
        isOnline={isActive}
        isCompanyAgent={isCompanyAgent}
        companyName={companyName}
        className="shrink-0"
      />

      {/* Information Layer */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-sm truncate tracking-tight group-hover:text-primary transition-colors">
              {name}
            </h3>
            {isActive && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black uppercase tracking-widest h-4 px-1.5">
                Active
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {timeAgo ? (
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                {timeAgo}
              </span>
            ) : (
              !lastMessage && (
                <div className="flex items-center gap-1 text-primary/80">
                  <Coins className="h-3 w-3" />
                  <span className="text-[10px] font-black">{creditCost}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Dynamic Context: Show conversation snippet or expertise */}
        {lastMessage ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 font-medium italic">
            <MessageCircle className="h-3 w-3 shrink-0 text-primary/40" />
            <p className="truncate leading-none">{lastMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground line-clamp-1 leading-none font-medium">{description}</p>
            {expertise.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {expertise.slice(0, 2).map((skill) => (
                  <span
                    key={skill}
                    className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter bg-muted text-muted-foreground/70 border border-border/50"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Affordance Arrow */}
      <div className="flex items-center self-stretch pl-2">
        <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </button>
  );
}
