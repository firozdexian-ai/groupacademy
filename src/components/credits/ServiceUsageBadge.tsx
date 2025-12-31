import { Coins, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getServiceCost, ServiceType } from '@/lib/creditPricing';
import { cn } from '@/lib/utils';

interface ServiceUsageBadgeProps {
  serviceType: ServiceType;
  usageCount: number;
  className?: string;
}

export function ServiceUsageBadge({ serviceType, usageCount, className }: ServiceUsageBadgeProps) {
  const cost = getServiceCost(serviceType, usageCount);
  const isFirstUse = cost === 0;

  if (isFirstUse) {
    return (
      <Badge className={cn("bg-accent text-accent-foreground", className)}>
        <Sparkles className="h-3 w-3 mr-1" />
        FREE
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      <Coins className="h-3 w-3 text-warning" />
      {cost} credits
    </Badge>
  );
}
