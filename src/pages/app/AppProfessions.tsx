import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, ChevronRight, Zap } from "lucide-react";
import { TracksTab } from "@/components/learning/TracksTab";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Strategic Career Roadmap
 * High-fidelity directory for structured profession-based learning architectures.
 * Synchronized with the 2026 'Executive Logic' depth and typographic standards.
 */
export default function AppProfessions() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Navigation Connection */}
      <header className="flex flex-col gap-10 mb-12">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/learning")}
            className={cn(
              "group rounded-xl h-11 pl-3 pr-5 transition-all duration-300",
              "font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 -ml-3",
            )}
          >
            <ArrowLeft className="w-4 h-4 mr-3 transition-transform group-hover:-translate-x-1" />
            Back to Hub
          </Button>

          <Badge
            variant="outline"
            className="rounded-lg border-primary/20 text-primary font-black uppercase tracking-widest text-[9px] px-3 py-1"
          >
            Logic v2.6 Ready
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-[24px] bg-primary/10 flex items-center justify-center border-2 border-primary/20 rotate-3 shadow-xl">
              <Target className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Career Tracks</h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                  Structured Neural Paths
                </p>
                <span className="h-1 w-1 rounded-full bg-primary/30" />
                <div className="flex items-center gap-1.5 text-primary">
                  <Zap className="h-3 w-3 fill-current" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Executive Alignment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Orchestration Viewport */}
      <main className="min-h-[70vh] animate-in fade-in zoom-in-95 duration-700 delay-200">
        <TracksTab />
      </main>

      {/* Terminal Footer Metadata */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30 group hover:opacity-100 transition-opacity duration-500">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
          Blueprint List: Verified Connection Active
        </p>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
