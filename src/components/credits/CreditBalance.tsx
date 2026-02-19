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
  const { balance, earnedBalance, freeBalance, isLoading } = useCredits();

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
      <div className={cn('space-y-2 p-3 bg-muted rounded-lg', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Credits</span>
          <div className="flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-warning" />
            <span className="font-semibold">{balance}</span>
          </div>
        </div>
        <div className="border-t border-border pt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-600 dark:text-emerald-400">Earned (withdrawable)</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{earnedBalance}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-sky-600 dark:text-sky-400">Free</span>
            <span className="font-medium text-sky-600 dark:text-sky-400">{freeBalance}</span>
          </div>
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
