import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Sparkles, ChevronRight } from "lucide-react";
import { CoursesTab } from "@/components/learning/CoursesTab";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Knowledge Indexing Node
 * High-fidelity directory for self-paced certification and technical workshops.
 * 2026 Standard: Executive Logic typography with spatial luxury offsets.
 */
export default function AppCourses() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Navigation Connection & Contextual Metadata */}
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
            Back to List
          </Button>

          <Badge className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse" />
            Premium Catalog Active
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/20">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Academy Courses</h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                  Self-Paced Neural Certification
                </p>
                <span className="h-1 w-1 rounded-full bg-primary/30" />
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">
                  Logic Version 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hardened Courses Grid: Logic Viewport */}
      <main className="min-h-[70vh] animate-in fade-in zoom-in-95 duration-700 delay-200">
        <CoursesTab />
      </main>

      {/* Visual Terminal Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30 group hover:opacity-100 transition-opacity duration-500">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
          List Data: Encrypted Connection Active
        </p>
        <div className="flex gap-4">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/20" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/20" />
        </div>
      </footer>
    </div>
  );
}
