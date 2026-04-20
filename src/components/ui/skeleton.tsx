import { cn } from "@/lib/utils";

/**
 * Platform Logic: Kinetic Blueprint Node
 * Provides structural placeholder geometry during data handshake latency.
 * Synchronized with the platform's depth-based spatial logic.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // High-fidelity pulsing physics
        "animate-pulse rounded-xl bg-muted/40",
        // Subtle internal glow to signal "Active Handshake"
        "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
