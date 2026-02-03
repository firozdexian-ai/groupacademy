import { formatDistanceToNow } from "date-fns";
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
  const timeAgo = lastMessageTime
    ? formatDistanceToNow(new Date(lastMessageTime), { addSuffix: false })
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 rounded-xl transition-all duration-200",
        "hover:bg-accent/50 active:scale-[0.99]",
        "text-left group",
        isActive && "bg-green-50/50 dark:bg-green-950/20 ring-1 ring-green-200 dark:ring-green-800"
      )}
    >
      {/* Avatar */}
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
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-sm truncate">{name}</h3>
            {isActive && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0 h-4">
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {timeAgo && (
              <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            )}
            {!lastMessage && (
              <span className="text-[10px] font-medium text-primary flex items-center gap-0.5">
                <Coins className="h-3 w-3" />
                {creditCost}
              </span>
            )}
          </div>
        </div>

        {/* Last message or description */}
        {lastMessage ? (
          <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1.5">
            <MessageCircle className="h-3 w-3 shrink-0" />
            <span className="truncate">{lastMessage}</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
        )}

        {/* Expertise tags (only show when no last message) */}
        {!lastMessage && expertise.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {expertise.slice(0, 3).map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 font-normal bg-background"
              >
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Arrow indicator */}
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
