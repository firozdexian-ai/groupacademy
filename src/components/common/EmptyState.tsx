import { useMemo } from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Hardened Empty State Shell (V5.6.0)
 * CTO Reference: Authoritative fallback view handling query dropouts or system sync anomalies.
 * Architecture: Reference-stable layout properties avoiding sub-object prop thrashing loops.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string; // Decomposed parameter shields component against object inline literals references
  onActionClick?: () => void; // Isolated click callback preventing child element layout loops
  action?: { label: string; onClick: () => void }; // Convenience grouped action prop
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "DATA_ARRAY_EMPTY",
  description,
  actionLabel,
  onActionClick,
  action,
  className,
}: EmptyStateProps) {
  const resolvedActionLabel = actionLabel ?? action?.label;
  const resolvedActionClick = onActionClick ?? action?.onClick;
  // Clean string title normalization ensures crisp typography alignment natively
  const standardizedTitleToken = useMemo(() => {
    return String(title || "").trim();
  }, [title]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 py-12 rounded-[24px] border-2 border-dashed border-border/30 bg-muted/10 backdrop-blur-sm select-none animate-in fade-in duration-300",
        className,
      )}
    >
      {/* HUD: GLYPH_MICRO_FRAME */}
      <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center mb-4 border border-border/10 shadow-inner">
        <Icon className="h-5 w-5 text-primary opacity-60 transition-transform duration-300 group-hover:scale-110" />
      </div>

      {/* TYPOGRAPHY: BALANCED_LABELS_CELL */}
      <div className="space-y-1.5 max-w-xs mb-4">
        <h3 className="text-sm font-black uppercase italic tracking-tight text-foreground leading-tight">
          {standardizedTitleToken}
        </h3>
        {description && (
          <p className="text-xs font-medium italic text-muted-foreground/70 leading-relaxed">
            {String(description).trim()}
          </p>
        )}
      </div>

      {/* ACTION TRIGGER SECTOR: DEFENSIVE EXPLICIT BEHAVIOR LOOKUPS */}
      {resolvedActionLabel && resolvedActionClick && (
        <Button
          size="sm"
          type="button"
          onClick={resolvedActionClick}
          className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest px-6 shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {String(resolvedActionLabel).trim()}
        </Button>
      )}
    </div>
  );
}
