import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  action?: { label: string; onClick: () => void } | React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onActionClick,
  action,
  className,
}: EmptyStateProps) {
  // action can be a ReactNode (preferred) or a {label, onClick} object (legacy)
  const isLegacyAction =
    action && typeof action === "object" && "label" in (action as any) && "onClick" in (action as any);
  const legacyAction = isLegacyAction ? (action as { label: string; onClick: () => void }) : null;
  const resolvedActionLabel = actionLabel ?? legacyAction?.label;
  const resolvedActionClick = onActionClick ?? legacyAction?.onClick;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 py-12 rounded-2xl border border-dashed border-border/60 bg-muted/10",
        className,
      )}
    >
      <div className="h-12 w-12 rounded-xl bg-muted/40 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-1 max-w-sm mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {resolvedActionLabel && resolvedActionClick ? (
        <Button size="sm" type="button" onClick={resolvedActionClick} className="h-9 rounded-xl">
          {resolvedActionLabel}
        </Button>
      ) : action && !isLegacyAction ? (
        <>{action as React.ReactNode}</>
      ) : null}
    </div>
  );
}
