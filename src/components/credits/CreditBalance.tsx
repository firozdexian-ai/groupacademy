import { Coins } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CreditBalanceProps {
  variant?: 'default' | 'compact' | 'full';
  onClick?: () => void;
  className?: string;
}

export function CreditBalance({ variant = 'default', onClick, className }: CreditBalanceProps) {
  const { balance, isLoading } = useCredits();

  if (isLoading) {
    return <Skeleton className="h-8 w-16" />;
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Coins className="h-4 w-4 text-warning" />
        <span className="font-medium text-sm">{balance}</span>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn('flex items-center justify-between p-3 bg-muted rounded-lg', className)}>
        <span className="text-sm text-muted-foreground">Credits</span>
        <div className="flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-warning" />
          <span className="font-semibold">{balance}</span>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('flex items-center gap-1.5 text-muted-foreground', className)}
      onClick={onClick}
    >
      <Coins className="h-4 w-4 text-warning" />
      <span className="font-medium">{balance}</span>
    </Button>
  );
}
