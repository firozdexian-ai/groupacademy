import { LucideIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Void Protocol
 * Orchestrates user recovery when a data query or registry handshake returns null.
 */
interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "glass";
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

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  suggestions = [],
  variant = "card",
  className,
}: EmptyStateProps) {
  const content = (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Icon Handshake Hub */}
      <div className="relative w-20 h-20 mx-auto mb-8">
        <div className="absolute inset-0 bg-primary/10 rounded-[24px] rotate-6 animate-pulse" />
        <div className="absolute inset-0 bg-background border border-border/40 rounded-[24px] flex items-center justify-center shadow-xl group-hover:rotate-0 transition-transform duration-500">
          <Icon className="h-10 w-10 text-primary opacity-80" />
        </div>
      </div>

      {/* Identity Logic */}
      <div className="space-y-3 mb-8">
        <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">{title}</h3>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 max-w-sm mx-auto leading-relaxed italic">
          {description}
        </p>
      </div>

      {/* Recovery Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-muted/30 backdrop-blur-sm rounded-[24px] border border-border/10 p-5 mb-8 text-left max-w-sm mx-auto group hover:border-primary/20 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3 w-3 text-primary" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Recovery Logic</p>
          </div>
          <ul className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-tight"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1 shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Primary Actions Terminal */}
      {actions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant || (i === 0 ? "default" : "secondary")}
              className={cn(
                "h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all",
                i === 0 && "shadow-primary/20 hover:shadow-primary/30",
              )}
              onClick={action.onClick}
            >
              {action.icon && <action.icon className="h-3.5 w-3.5 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  if (variant === "inline") {
    return <div className={cn("py-20 text-center", className)}>{content}</div>;
  }

  return (
    <Card
      className={cn("border-dashed border-2 border-border/40 bg-card/30 rounded-[40px] overflow-hidden", className)}
    >
      <CardContent className="py-20 text-center">{content}</CardContent>
    </Card>
  );
}
