import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { CoursesTab } from "@/domains/learning/components/talent/CoursesTab";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Knowledge Indexing Directory Node (AppCourses)
 * Hardened course catalog platform wrapper delivering fluid scannability and absolute geometric alignment parity.
 * Version: Launch Candidate · Phase Z1 Production Tokens Locked
 */
export default function AppCourses() {
  const executeNavigationHook = useNavigate();

  const handleReturnToHubSequence = React.useCallback(() => {
    executeNavigationHook("/app/learning");
  }, [executeNavigationHook]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32 text-left antialiased block transform-gpu w-full animate-in fade-in duration-300">
      {/* HUD LEVEL 1: ARCHITECTURAL CATALOG SUMMARY RUNWAY HEADER */}
      <header className="flex flex-col gap-6 mb-8 select-none w-full shrink-0">
        <div className="flex items-center justify-between gap-4 leading-none w-full block">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReturnToHubSequence}
            className="group rounded-lg h-9 pl-2.5 pr-4 border border-border/5 text-xs font-bold uppercase tracking-wide cursor-pointer transition-transform hover:bg-muted active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 stroke-[2.5] transition-transform group-hover:-translate-x-0.5 shrink-0" />
            <span>Return to Learning Hub</span>
          </Button>

          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 px-3 h-6 rounded font-mono text-[9px] font-black uppercase tracking-wide shrink-0 pointer-events-none leading-none pt-0.5"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse stroke-[2] shrink-0" />
            <span>Premium Catalog Active</span>
          </Badge>
        </div>

        <div className="block w-full border-b border-border/10 pb-4">
          <div className="flex items-center gap-3.5 leading-none w-full block">
            <div className="h-11 w-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 shadow-2xs pointer-events-none">
              <BookOpen className="h-5 w-5 text-primary stroke-[2.2]" />
            </div>
            <div className="leading-none space-y-1 block flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-foreground pt-0.5 block truncate">
                Academy Certification Courses
              </h1>
              <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 leading-none">
                <p className="italic">Self-Paced Core Syllabus Blocks</p>
                <span className="h-1 w-1 rounded-full bg-border/80 select-none pointer-events-none" />
                <p className="text-primary font-black">Edition Index: 2026</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HUD LEVEL 2: COMPREHENSIVE CURRICULUM DIRECTORY LIST VIEWPORT */}
      <main className="min-h-[60vh] block w-full">
        <CoursesTab />
      </main>

      {/* HUD LEVEL 3: COMPLIANCE TELEMETRY TERMINAL FOOTER */}
      <footer className="mt-16 pt-6 border-t border-border/40 flex items-center justify-between opacity-25 select-none pointer-events-none leading-none w-full shrink-0 uppercase tracking-widest font-mono text-[9px] font-bold text-muted-foreground/50">
        <p className="italic">Catalog Encryption Handshake Protocol Active</p>
        <div className="flex gap-2 shrink-0 items-center">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
        </div>
      </footer>
    </div>
  );
}
