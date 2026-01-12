import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  suggestions?: string[];
  variant?: 'card' | 'inline';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  suggestions = [],
  variant = 'card',
  className
}: EmptyStateProps) {
  const content = (
    <>
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-bold text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
        {description}
      </p>
      
      {suggestions.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 mb-4 text-left max-w-xs mx-auto">
          <p className="text-xs font-medium text-muted-foreground mb-2">Try these:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {actions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant || (i === 0 ? 'default' : 'outline')}
              className="rounded-full h-10 px-5 press-scale"
              onClick={action.onClick}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </>
  );

  if (variant === 'inline') {
    return (
      <div className={cn("py-12 text-center", className)}>
        {content}
      </div>
    );
  }

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="py-12 text-center">
        {content}
      </CardContent>
    </Card>
  );
}
