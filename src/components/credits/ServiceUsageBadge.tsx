import { Coins, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getServiceCost, ServiceType } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Fiscal Unit Artifact (ServiceUsageBadge)
 * CTO Reference: High-intensity label for service valuation and credit commitment.
 */

interface ServiceUsageBadgeProps {
  serviceType: ServiceType;
  className?: string;
  showIcon?: boolean;
}

export function ServiceUsageBadge({ serviceType, className, showIcon = true }: ServiceUsageBadgeProps) {
  const cost = getServiceCost(serviceType);

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-300",
        "bg-warning/5 border-warning/20 hover:border-warning/40 shadow-inner group",
        className,
      )}
    >
      {showIcon && (
        <div className="relative">
          <Coins className="h-3 w-3 text-warning fill-current group-hover:scale-110 transition-transform" />
          <Zap className="absolute -top-1 -right-1 h-1.5 w-1.5 text-primary animate-pulse opacity-0 group-hover:opacity-100" />
        </div>
      )}

      <span className="font-mono text-[10px] font-black uppercase italic tracking-tighter text-warning">
        {cost}
        <span className="ml-0.5 opacity-60 text-[8px] font-bold not-italic">_CR</span>
      </span>
    </Badge>
  );
}
