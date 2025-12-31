import { Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getServiceCost, ServiceType } from '@/lib/creditPricing';
import { cn } from '@/lib/utils';

interface ServiceUsageBadgeProps {
  serviceType: ServiceType;
  className?: string;
}

export function ServiceUsageBadge({ serviceType, className }: ServiceUsageBadgeProps) {
  const cost = getServiceCost(serviceType);

  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      <Coins className="h-3 w-3 text-warning" />
      {cost} credits
    </Badge>
  );
}
