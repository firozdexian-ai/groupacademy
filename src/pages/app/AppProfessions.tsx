import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Zap } from "lucide-react";
import { TracksTab } from "@/components/learning/TracksTab";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Career Track Roadmaps Catalog (AppProfessions)
 * Hardened operational directory wrapping structured professional lines and ensuring fluid viewport typography scaling.
 * Version: Launch Candidate · Phase Z1 Design Tokens Locked
 */
export default function AppProfessions() {
  const executeNavigationHook = useNavigate();

  const handleDefensiveReturnSequence = React.useCallback(() => {
    // Check historical stack volume prior to enforcing route redirection paths
    if (window.history.length > 1) {
      executeNavigationHook(-1);
    } else {
      executeNavigationHook("/app/learning", { replace: true });
    }
  }, [executeNavigationHook]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32 text-left antialiased block transform-gpu w-full animate-in fade-in duration-300">
      {/* HUD LEVEL 1: ADMINISTRATIVE BACKWARD DIRECTORY HUB CONTROL BAR */}
      <header className="flex flex-col gap-6 mb-8 select-none w-full shrink-0">
        <div className="flex items-center justify-between gap-4 leading-none w-full block">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDefensiveReturnSequence}
            className="group rounded-lg h-9 pl-2.5 pr-4 border border-border/5 text-xs font-bold uppercase tracking-wide cursor-pointer transition-transform hover:bg-muted active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 stroke-[2.5] transition-transform group-hover:-translate-x-0.5 shrink-0" />
            <span>Return to Learning Hub</span>
          </Button>

          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 px-2.5 h-6 rounded font-mono text-[9px] font-black uppercase tracking-wide shrink-0 pointer-events-none leading-none pt-0.5"
          >
            <span>Logic Engine v2.6 Stacked</span>
          </Badge>
        </div>

        {/* HUD LEVEL 2: COMPOSITE DISCOVERY PROFILE CONTEXT MODULE */}
        <div className="block w-full border-b border-border/10 pb-4">
          <div className="flex items-center gap-3.5 leading-none w-full block">
            <div className="h-11 w-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 shadow-2xs rotate-2 pointer-events-none">
              <Target className="h-5 w-5 text-primary stroke-[2.2]" />
            </div>

            <div className="leading-none space-y-1 block flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-foreground pt-0.5 block truncate">
                Professional Career Tracks
              </h1>
              <div className="flex items-center gap-2 flex-wrap font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 leading-none">
                <p className="italic">Structured Career Progression Roadmaps</p>
                <span className="h-1 w-1 rounded-full bg-border/80 select-none pointer-events-none" />
                <div className="flex items-center gap-1 text-primary font-black">
                  <Zap className="h-3 w-3 fill-current text-primary shrink-0" />
                  <span>Executive Alignment Protocol</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HUD LEVEL 3: DYNAMIC ACCREDITATION BLUEPRINT CATALOG GRID */}
      <main className="min-h-[60vh] block w-full">
        <TracksTab />
      </main>

      {/* HUD LEVEL 4: PLATFORM COMPLIANCE METADATA TERMINAL FOOTER */}
      <footer className="mt-16 pt-6 border-t border-border/40 flex items-center justify-between opacity-25 select-none pointer-events-none leading-none w-full shrink-0 uppercase tracking-widest font-mono text-[9px] font-bold text-muted-foreground/50">
        <p className="italic">Blueprint Register Connection Protocol Active</p>
        <div className="flex gap-1.5 shrink-0 items-center">
          {Array.from({ length: 3 }).map((_, segmentIdx) => (
            <div
              key={`terminal-footer-trace-dash-${segmentIdx}`}
              className="h-1 w-6 rounded-xs bg-muted-foreground/20"
            />
          ))}
        </div>
      </footer>
    </div>
  );
}
