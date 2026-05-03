import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Bot, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { LucideIcon } from "lucide-react";

/**
 * GroUp Academy: Agent Identity Representation Node
 * CTO Audit: Expanded visual registry to support the new Creator Economy (Community Agents).
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
  isCreatorAgent?: boolean; // CTO FIX: Added support for user-generated marketplace agents
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
  name = "AGENT_NODE",
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
  // PROTOCOL: Hardened Initial Extraction
  const initials = (name || "AI")
    .split(" ")
    .filter(Boolean)
    .map((n) => n)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("relative flex-shrink-0 animate-in fade-in duration-500", className)} aria-label={name}>
      <Avatar
        className={cn(
          sizeRegistry[size],
          "ring-2 ring-background shadow-xl border-2 transition-transform duration-500 hover:scale-110",
          isCompanyAgent ? "rounded-[35%] border-blue-500/20" : "rounded-full", // Squircle for Institutional Agents
          isCreatorAgent ? "border-amber-500/30 ring-amber-500/10" : "border-border/10", // Gold tint for creators
        )}
      >
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
        <AvatarFallback
          className="font-black uppercase italic tracking-tighter"
          style={{
            backgroundColor: bgColor || (isCreatorAgent ? "hsl(var(--amber-500) / 0.1)" : "hsl(var(--primary) / 0.1)"),
            color: iconColor || (isCreatorAgent ? "hsl(var(--amber-500))" : "hsl(var(--primary))"),
          }}
        >
          {Icon ? (
            <Icon className={cn(iconRegistry[size])} />
          ) : avatarUrl ? (
            <Bot className={cn(iconRegistry[size], "animate-pulse")} />
          ) : (
            <span className={cn(size === "xl" ? "text-lg" : "text-[10px]")}>{initials}</span>
          )}
        </AvatarFallback>
      </Avatar>

      {/* NODE: ONLINE_TELEMETRY */}
      {isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-background z-10 shadow-lg",
            telemetryRegistry[size],
            isCompanyAgent && "right-0.5 bottom-0.5",
          )}
        >
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </span>
      )}

      {/* NODE: INSTITUTIONAL_BADGE */}
      {isCompanyAgent && (
        <div className="absolute -top-1 -right-1 z-20">
          <Badge
            variant="secondary"
            className={cn(
              "p-0 flex items-center justify-center rounded-lg bg-blue-600 border-2 border-background shadow-2xl transition-all hover:rotate-12",
              size === "xl" ? "h-6 w-6" : "h-4 w-4",
            )}
            title={companyName ? `VERIFIED_AGENT: ${companyName.toUpperCase()}` : "CORPORATE_AGENT"}
          >
            <Building2 className={cn("text-white", size === "xl" ? "h-3.5 w-3.5" : "h-2.5 w-2.5")} />
          </Badge>
        </div>
      )}

      {/* CTO FIX: CREATOR_ECONOMY_BADGE */}
      {isCreatorAgent && !isCompanyAgent && (
        <div className="absolute -top-1 -left-1 z-20">
          <Badge
            variant="secondary"
            className={cn(
              "p-0 flex items-center justify-center rounded-full bg-amber-500 border-2 border-background shadow-2xl transition-all hover:-rotate-12",
              size === "xl" ? "h-6 w-6" : "h-4 w-4",
            )}
            title="COMMUNITY_CREATOR_AGENT"
          >
            <Sparkles className={cn("text-white", size === "xl" ? "h-3.5 w-3.5" : "h-2.5 w-2.5")} />
          </Badge>
        </div>
      )}
    </div>
  );
}
