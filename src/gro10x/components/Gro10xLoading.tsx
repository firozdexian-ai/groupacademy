import { Loader2 } from "lucide-react";

/**
 * Standardized inline loading state used across Gro10x pages.
 * Keeps spinner+label consistent — replaces the mix of bare "Loading…" strings.
 */
export function Gro10xLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="px-4 py-10 w-full text-center text-sm text-slate-400 inline-flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
