import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface AgentAvatarProps {
  name: string;
  avatarUrl?: string | null;
  icon?: LucideIcon;
  bgColor?: string;
  iconColor?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  isCompanyAgent?: boolean;
  companyName?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

const statusSizeClasses = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5",
};

export function AgentAvatar({
  name,
  avatarUrl,
  icon: Icon,
  bgColor = "bg-primary/10",
  iconColor = "text-primary",
  size = "md",
  isOnline = false,
  isCompanyAgent = false,
  companyName,
  className,
}: AgentAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(sizeClasses[size], "ring-2 ring-background shadow-sm")}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
        ) : null}
        <AvatarFallback className={cn(bgColor, "font-semibold")}>
          {Icon ? (
            <Icon className={cn(iconSizeClasses[size], iconColor)} />
          ) : (
            <span className={cn("text-xs", iconColor)}>{initials}</span>
          )}
        </AvatarFallback>
      </Avatar>

      {/* Online Status Indicator */}
      {isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-green-500 ring-2 ring-background",
            statusSizeClasses[size]
          )}
        >
          <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
        </span>
      )}

      {/* Company Badge */}
      {isCompanyAgent && (
        <div className="absolute -bottom-1 -right-1">
          <Badge
            variant="secondary"
            className="h-4 w-4 p-0 flex items-center justify-center rounded-full bg-blue-100 border-2 border-background"
            title={companyName ? `Powered by ${companyName}` : "Company Agent"}
          >
            <Building2 className="h-2.5 w-2.5 text-blue-600" />
          </Badge>
        </div>
      )}
    </div>
  );
}
