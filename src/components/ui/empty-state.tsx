import { LucideIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  suggestions?: string[];
  variant?: "card" | "inline" | "hero";
  className?: string;
}

/**
 * GroUp Academy: Institutional Data Recovery Framework Node (EmptyState)
 * Authoritative interface managing alternative routing states and processing fallback interaction maps.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
export function EmptyState({
  icon: ActionIcon,
  title,
  description,
  actions = [],
  suggestions = [],
  variant = "card",
  className,
}: EmptyStateProps) {
  // HUD LAYER: Build unified structural contents safely isolated from parent layouts
  const renderedContentBlockNode = (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center text-center transform-gpu antialiased animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* HUD LEVEL 1: ICON HANDSHAKE TRACK CONTAINER */}
      <div className="relative w-12 h-12 mx-auto mb-4 select-none pointer-events-none shrink-0">
        <div className="absolute inset-0 bg-primary/10 rounded-xl rotate-6 animate-pulse" />
        <div className="absolute inset-0 bg-background border border-border/40 rounded-xl flex items-center justify-center shadow-xs">
          <ActionIcon className="h-5 w-5 text-primary/80 stroke-[2.2]" />
        </div>
      </div>

      {/* HUD LEVEL 2: TYPOGRAPHY DESCRIPTION MATRIX BLOCKS */}
      <div className="space-y-1.5 min-w-0 w-full mb-5 leading-none">
        <h3 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none pt-0.5">
          {title}
        </h3>
        <p className="text-[11px] font-semibold text-muted-foreground/60 leading-normal block italic select-text selection:bg-primary/10">
          {description}
        </p>
      </div>

      {/* HUD LEVEL 3: RECOVERY SYSTEM SUGGESTION ACCORDIONS */}
      {suggestions.length > 0 && (
        <div className="w-full text-left bg-muted/10 rounded-xl border border-border/40 p-4 mb-5 shadow-inner transition-colors hover:border-border/60">
          <div className="flex items-center gap-1.5 mb-2.5 leading-none select-none">
            <Sparkles className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-wide text-primary block pt-0.5">
              Recovery Diagnostics
            </span>
          </div>

          <ul className="space-y-2 select-text w-full block">
            {suggestions.map((suggestionStringItem, indexId) => (
              <li
                key={`suggestion-${suggestionStringItem.substring(0, 6)}-${indexId}`}
                className="flex items-start gap-2 text-[10px] sm:text-[11px] font-bold text-muted-foreground/80 leading-normal uppercase tracking-tight"
              >
                <span className="w-1 h-1 rounded-full bg-primary/40 mt-1.5 shrink-0 select-none pointer-events-none block" />
                <span className="flex-1 min-w-0 block">{suggestionStringItem}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* HUD LEVEL 4: INTERACTIVE ACTION TRIGGER SUBMISSION CONTROLS */}
      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full pt-1">
          {actions.map((actionRowButton, indexId) => {
            const calculatedUniqueKeyStr = `action-${actionRowButton.label.replace(/\s+/g, "-")}-${indexId}`;
            const CalculatedIconOverrideNode = actionRowButton.icon;

            return (
              <Button
                key={calculatedUniqueKeyStr}
                type="button"
                variant={actionRowButton.variant || (indexId === 0 ? "default" : "secondary")}
                onClick={actionRowButton.onClick}
                className={cn(
                  "h-9 px-4 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-sm transform-gpu active:scale-[0.985] transition-transform flex items-center justify-center cursor-pointer w-full sm:w-auto",
                  indexId === 0 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "",
                )}
              >
                {CalculatedIconOverrideNode && <CalculatedIconOverrideNode className="h-3.5 w-3.5 stroke-[2.5]" />}
                <span>{actionRowButton.label}</span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );

  // =========================================================================
  // INTERFACE PROTOCOL VARIANT ROUTERS: CONDITIONALLY PROCESS LAYER SHAPES
  // =========================================================================
  if (variant === "inline") {
    return (
      <div
        role="region"
        aria-label="Empty layout data response container block"
        className={cn(
          "py-12 sm:py-16 w-full px-4 text-center block select-none sm:select-text transform-gpu",
          className,
        )}
      >
        {renderedContentBlockNode}
      </div>
    );
  }

  return (
    <Card
      role="region"
      aria-label="Empty layout structural card data panel sheet"
      className={cn(
        "border border-dashed border-border/60 bg-card/40 rounded-xl overflow-hidden w-full block shadow-none transition-colors hover:border-border/100",
        className,
      )}
    >
      <CardContent className="py-12 sm:py-16 px-4 text-center border-none flex flex-col justify-center items-center w-full block">
        {renderedContentBlockNode}
      </CardContent>
    </Card>
  );
}
