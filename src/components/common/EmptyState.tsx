import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Standard empty / error state used across talent pages.
 * Replaces bespoke "Registry Sync Failure" / "Arena Empty" blocks.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 py-10 rounded-2xl border border-dashed border-border/40 bg-muted/10",
        className,
      )}
    >
      <div className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs mb-3">{description}</p>
      )}
      {action && (
        <Button size="sm" onClick={action.onClick} className="h-8 rounded-lg text-xs">
          {action.label}
        </Button>
      )}
    </div>
  );
}
