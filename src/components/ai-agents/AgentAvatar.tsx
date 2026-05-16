import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Bot, Sparkles } from "lucide-react";
import { LucideIcon } from "lucide-react";

/**
 * GroUp Academy: Agent Identity Representation Node (V5.6.0)
 * CTO Reference: High-performance visual avatar card mapping custom workspace entity badges.
 * Architecture: Optimized via tokenized initials string parsing to protect container circles against layout breaks.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
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
  isCreatorAgent?: boolean; // Support for user-generated marketplace agents
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
  // --- PHASE: SAFE_INITIALS_COMPILATION ---
  const calculatedInitials = useMemo(() => {
    const cleanName = String(name || "AI").trim();
    if (!cleanName) return "AI";

    // Split text blocks explicitly by empty space characters to capture separate word clusters
    const wordTokens = cleanName.split(/\s+/).filter(Boolean);

    if (wordTokens.length === 1) {
      // Single word context: slice the first 2 characters safely
      return wordTokens[0].slice(0, 2).toUpperCase();
    }

    // Multi-word context: extract the first index item of each word boundary smoothly
    return (wordTokens[0].charAt(0) + wordTokens[1].charAt(0)).toUpperCase();
  }, [name]);

  // --- PHASE: THEME_PALETTE_NORMALIZATION ---
  const fallbackStyles = useMemo(() => {
    const defaultBg = isCreatorAgent ? "rgba(245, 158, 11, 0.1)" : "rgba(99, 102, 241, 0.1)";
    const defaultColor = isCreatorAgent ? "rgb(245, 158, 11)" : "rgb(99, 102, 241)";

    return {
      backgroundColor: bgColor || defaultBg,
      color: iconColor || defaultColor,
    };
  }, [bgColor, iconColor, isCreatorAgent]);

  return (
    <div
      className={cn("relative flex-shrink-0 animate-in fade-in duration-500 select-none", className)}
      aria-label={name}
    >
      {/* COMPONENT: MAIN_AVATAR_FRAME */}
      <Avatar
        className={cn(
          sizeRegistry[size] || sizeRegistry.md,
          "ring-2 ring-background shadow-xl border-2 transition-transform duration-500 hover:scale-110",
          isCompanyAgent ? "rounded-[35%] border-blue-500/20" : "rounded-full", // Squircle for Institutional Agents
          isCreatorAgent ? "border-amber-500/30 ring-amber-500/10" : "border-border/10", // Gold tint for creators
        )}
      >
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover w-full h-full" />}

        <AvatarFallback
          className="font-black uppercase italic tracking-tighter w-full h-full flex items-center justify-center"
          style={fallbackStyles}
        >
          {Icon ? (
            <Icon className={cn(iconRegistry[size] || iconRegistry.md)} />
          ) : avatarUrl ? (
            <Bot className={cn(iconRegistry[size] || iconRegistry.md, "animate-pulse")} />
          ) : (
            <span className={cn(size === "xl" ? "text-lg" : "text-[10px]")}>{calculatedInitials}</span>
          )}
        </AvatarFallback>
      </Avatar>

      {/* NODE: ONLINE_TELEMETRY_INDICATOR */}
      {isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-background z-10 shadow-lg",
            telemetryRegistry[size] || telemetryRegistry.md,
            isCompanyAgent && "right-0.5 bottom-0.5",
          )}
        >
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </span>
      )}

      {/* NODE: INSTITUTIONAL_BADGE_OVERLAY */}
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

      {/* NODE: CREATOR_ECONOMY_BADGE_OVERLAY */}
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
