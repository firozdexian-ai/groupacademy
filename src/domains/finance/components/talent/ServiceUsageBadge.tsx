import { useMemo } from "react";
import { Coins, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getServiceCost, ServiceType } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

interface ServiceUsageBadgeProps {
  serviceType: ServiceType;
  className?: string;
  showIcon?: boolean;
}

/**
 * GroUp Academy: Fiscal Unit Artifact (V5.6.0)
 * CTO Reference: High-performance discrete badge showing micro-credit transaction costs.
 * Architecture: Reference-stable configuration values memoization blocking component layout loops.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function ServiceUsageBadge({ serviceType, className, showIcon = true }: ServiceUsageBadgeProps) {
  // --- PHASE: CONFIGURATION_YIELD_MEMOIZATION ---
  // Architecture Fix: Shield system grids from redundant calculation passes during intensive canvas view sorting sweeps
  const computedServiceCostValue = useMemo((): number => {
    if (!serviceType) return 0;

    try {
      const rawCostValue = getServiceCost(serviceType);
      return Math.max(0, Number(rawCostValue ?? 0));
    } catch (err) {
      console.error("[Digital Workforce] FAULT: Failed to resolve core service pricing boundaries.", {
        serviceType,
        err,
      });
      return 0; // Safe fallback prevents visual layout splits during configuration drops
    }
  }, [serviceType]);

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-300 select-none cursor-default font-sans",
        "bg-warning/5 border-warning/20 hover:border-warning/40 shadow-inner group",
        className,
      )}
    >
      {/* GLYPH SECTOR: HIGH_INTENSITY METRIC SIGNAL */}
      {showIcon && (
        <div className="relative h-3 w-3 flex items-center justify-center shrink-0">
          <Coins className="h-3 w-3 text-warning fill-current group-hover:scale-110 transition-transform duration-300" />
          <Zap className="absolute -top-1 -right-1 h-1.5 w-1.5 text-primary fill-current animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      )}

      {/* TYPOGRAPHY: TABULAR NUMBERS LOCK */}
      <span className="font-mono text-[10px] font-black uppercase italic tracking-tighter text-warning leading-none tabular-nums">
        {computedServiceCostValue}
        <span className="ml-0.5 opacity-60 text-[8px] font-black tracking-widest not-italic">_CR</span>
      </span>
    </Badge>
  );
}
