import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Sparkles, Target, Zap } from "lucide-react";
import { MyCoursesTab } from "@/components/learning/MyCoursesTab";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Personal Growth Pipeline
 * High-fidelity registry for active intellectual capital and certification progress.
 * Synchronized with the 2026 'Executive Logic' depth and typographic standards.
 */
export default function AppMyLearning() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Executive Command Header */}
      <header className="sticky top-0 z-20 w-full bg-background/60 backdrop-blur-2xl border-b border-border/40 transition-all duration-500">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app/learning")}
              className="group rounded-xl hover:bg-primary/10 h-11 w-11 transition-all active:scale-90"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </Button>

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Growth List</h1>
                <GraduationCap className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] leading-none">
                  Intellectual Capital
                </p>
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] leading-none">
                  Active Protocol
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                System Sync
              </span>
              <span className="text-[10px] font-black text-foreground">Verified 2026</span>
            </div>
            <div className="h-12 w-12 rounded-[20px] bg-primary/5 border border-primary/10 flex items-center justify-center shadow-inner group cursor-help">
              <Sparkles className="h-5 w-5 text-primary/40 group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Orchestration Viewport */}
      <main className="max-w-5xl mx-auto px-6 py-12 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* List Logic Context */}
        <div className="flex items-center justify-between mb-10 px-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Artifact Discovery</h2>
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent ml-6" />
        </div>

        <section className="relative z-10">
          <MyCoursesTab />
        </section>

        {/* Visual Terminal Trace */}
        <div className="mt-20 flex flex-col items-center justify-center opacity-20 pointer-events-none">
          <div className="h-12 w-[1px] bg-gradient-to-b from-primary to-transparent mb-4" />
          <p className="text-[8px] font-black uppercase tracking-[0.5em] italic">End of Active List</p>
        </div>
      </main>
    </div>
  );
}
