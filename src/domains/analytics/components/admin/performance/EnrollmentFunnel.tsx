/**
 * Enrollment Funnel Analytics Sub-Widget (Phase 10i — Hardened).
 * Renders horizontal relative conversion indicators for customer acquisition pipelines.
 * Fully optimized to align with 2024 Highly Professional SaaS UI guidelines.
 */

interface FunnelStep {
  label: string;
  value: number;
}

interface EnrollmentFunnelProps {
  funnel: FunnelStep[];
}

export default function EnrollmentFunnel({ funnel }: EnrollmentFunnelProps) {
  // Guard against divide-by-zero errors when scaling empty array sets
  const maximumBoundValue = Math.max(1, ...funnel.map((step) => step.value));
  const topOfFunnelBaseline = funnel[0]?.value ?? 0;

  return (
    <div className="space-y-4">
      {funnel.map((step, index) => {
        // Calculate percentages safely following standard data visualization design tokens
        const relativeWidthPercentage = (step.value / maximumBoundValue) * 100;
        const netConversionPercentage =
          index === 0 ? 100 : topOfFunnelBaseline > 0 ? (step.value / topOfFunnelBaseline) * 100 : 0;

        return (
          <div key={step.label} className="space-y-1.5 group">
            <div className="flex items-center justify-between text-xs leading-none">
              <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                {step.label}
              </span>
              <span className="font-semibold text-foreground tabular-nums flex items-center gap-1.5">
                <span>{step.value.toLocaleString("en-US")}</span>
                <span className="text-muted-foreground font-normal text-2xs">
                  ({netConversionPercentage.toFixed(0)}%)
                </span>
              </span>
            </div>

            {/* Hardened system background tracking rails */}
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-indigo-500 to-accent transition-all duration-500 ease-out"
                style={{ width: `${relativeWidthPercentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
