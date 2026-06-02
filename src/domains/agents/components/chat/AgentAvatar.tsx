import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Bot, Sparkles, type LucideIcon } from "lucide-react";

/**
 * Group Academy — Agent Avatar Identity Component
 * Version: Phase 10j.5 Hardened
 * Purpose: Visual identity node for conversational agents in the Admin Messenger.
 * Constraints: Enforces standardized iconography and institutional badging.
 */

interface AgentAvatarProps {
  name: string;
  avatarUrl?: string | null;
  icon?: LucideIcon;
  bgColor?: string;
  iconColor?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  isCompanyAgent?: boolean;
  isCreatorAgent?: boolean;
  companyName?: string;
  className?: string;
}

const sizeRegistry = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const iconRegistry = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

const telemetryRegistry = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
  xl: "h-4 w-4",
};

export function AgentAvatar({
  name = "AI",
  avatarUrl,
  icon: Icon,
  bgColor,
  iconColor,
  size = "md",
  isOnline = false,
  isCompanyAgent = false,
  isCreatorAgent = false,
  companyName,
  className,
}: AgentAvatarProps) {
  const initials = useMemo(() => {
    const cleanName = String(name || "AI").trim();
    const tokens = cleanName.split(/\s+/).filter(Boolean);
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return (tokens[0].charAt(0) + tokens[1].charAt(0)).toUpperCase();
  }, [name]);

  const fallbackStyles = useMemo(() => {
    const defaultBg = isCreatorAgent ? "rgba(245, 158, 11, 0.1)" : "rgba(99, 102, 241, 0.1)";
    const defaultColor = isCreatorAgent ? "rgb(245, 158, 11)" : "rgb(99, 102, 241)";
    return {
      backgroundColor: bgColor || defaultBg,
      color: iconColor || defaultColor,
    };
  }, [bgColor, iconColor, isCreatorAgent]);

  return (
    <div className={cn("relative flex-shrink-0 select-none", className)} aria-label={name}>
      <Avatar
        className={cn(
          sizeRegistry[size],
          "ring-2 ring-background shadow-sm border-2 transition-transform duration-300",
          isCompanyAgent ? "rounded-[35%] border-blue-500/20" : "rounded-full",
          isCreatorAgent ? "border-amber-500/30 ring-amber-500/10" : "border-border/10",
        )}
      >
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
        <AvatarFallback className="font-black uppercase italic tracking-tighter" style={fallbackStyles}>
          {Icon ? (
            <Icon className={cn(iconRegistry[size])} />
          ) : avatarUrl ? (
            <Bot className={cn(iconRegistry[size], "animate-pulse")} />
          ) : (
            <span className={size === "xl" ? "text-lg" : "text-[10px]"}>{initials}</span>
          )}
        </AvatarFallback>
      </Avatar>

      {/* Online Status Telemetry */}
      {isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-background shadow-md",
            telemetryRegistry[size],
            isCompanyAgent && "right-0.5 bottom-0.5",
          )}
        >
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </span>
      )}

      {/* Institutional Badge Overlay */}
      {isCompanyAgent && (
        <div className="absolute -top-1 -right-1 z-10">
          <Badge
            variant="secondary"
            className={cn(
              "p-0 flex items-center justify-center rounded-lg bg-blue-600 border-2 border-background shadow-sm",
              size === "xl" ? "h-6 w-6" : "h-4 w-4",
            )}
            title={companyName ? `Verified: ${companyName}` : "Corporate Agent"}
          >
            <Building2 className={size === "xl" ? "h-3.5 w-3.5 text-white" : "h-2.5 w-2.5 text-white"} />
          </Badge>
        </div>
      )}

      {/* Creator Badge Overlay */}
      {isCreatorAgent && !isCompanyAgent && (
        <div className="absolute -top-1 -left-1 z-10">
          <Badge
            variant="secondary"
            className={cn(
              "p-0 flex items-center justify-center rounded-full bg-amber-500 border-2 border-background shadow-sm",
              size === "xl" ? "h-6 w-6" : "h-4 w-4",
            )}
            title="Community Creator"
          >
            <Sparkles className={size === "xl" ? "h-3.5 w-3.5 text-white" : "h-2.5 w-2.5 text-white"} />
          </Badge>
        </div>
      )}
    </div>
  );
}
