/**
 * Career Path view inside Learning Hub.
 * Composes the existing tracks browser + recommended-tracks preview.
 */
import { Target } from "lucide-react";
import { TracksTab } from "../TracksTab";
import { CareerTracksPreview } from "../CareerTracksPreview";

export function TracksView() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 w-full">
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Recommended for you
          </h2>
        </div>
        <CareerTracksPreview />
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            All career paths
          </h2>
        </div>
        <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
          <TracksTab />
        </div>
      </section>
    </div>
  );
}
