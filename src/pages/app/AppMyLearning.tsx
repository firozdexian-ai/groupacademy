import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Sparkles, Target } from "lucide-react";
import { MyCoursesTab } from "@/domains/learning/components/talent/MyCoursesTab";
import { UpcomingSessionsRail } from "@/domains/learning/components/talent/UpcomingSessionsRail";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Personal Learning & Progress Cockpit (AppMyLearning)
 * Hardened user-facing dashboard ensuring fluid scannability and unifying text scaling configurations across viewports.
 * Version: Launch Candidate · Phase Z1 Production Design Tokens Locked
 */
export default function AppMyLearning() {
 const executeNavigationHook = useNavigate();

 const handleDefensiveReturnSequence = React.useCallback(() => {
 if (window.history.length > 1) {
 executeNavigationHook(-1);
 } else {
 executeNavigationHook("/app/learning", { replace: true });
 }
 }, [executeNavigationHook]);

 return (
 <div className="min-h-screen bg-background text-left antialiased block transform-gpu w-full">
 {/* HUD LEVEL 1: EXECUTIVE HUB STICKY NAV RECONCILIATION COMMAND HEADER */}
 <header className="sticky top-0 z-50 w-full bg-background/80 border-b border-border/40 select-none">
 <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 leading-none w-full">
 <div className="flex items-center gap-3.5 min-w-0">
 <Button
 type="button"
 variant="ghost"
 size="icon" aria-label="Return to target reference directory"
 onClick={handleDefensiveReturnSequence}
 className="group rounded-lg hover:bg-muted h-9 w-9 cursor-pointer transition-transform active:scale-95 shrink-0"
 title="Return to target reference directory"
 >
 <ArrowLeft className="h-4 w-4 stroke-[2.5] transition-transform group-hover:-translate-x-0.5" />
 </Button>

 <div className="min-w-0 leading-none space-y-1 block">
 <div className="flex items-center gap-2 leading-none w-full block pt-0.5">
 <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide text-foreground truncate block">
 My Personal Growth Workspace
 </h1>
 <GraduationCap className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
 </div>
 <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 leading-none">
 <p className="italic">Active Intellectual Capital Balance</p>
 <span className="h-1 w-1 rounded-full bg-emerald-500 shrink-0 select-none pointer-events-none" />
 <p className="text-primary font-black">Live Progress Protocol Tracking</p>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-3.5 shrink-0 leading-none">
 <div className="hidden sm:flex flex-col items-end leading-none space-y-0.5 shrink-0">
 <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-muted-foreground/30 italic">
 Environment Sync
 </span>
 <span className="text-[10px] font-mono font-black uppercase text-foreground/80 tracking-tight select-text">
 Verified: 2026 Edition
 </span>
 </div>

 <div className="h-9 w-9 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/40 shadow-inner group shrink-0 select-none pointer-events-none">
 <Sparkles className="h-4 w-4 stroke-[2] text-primary/40 group-hover:text-primary transition-colors duration-100" />
 </div>
 </div>
 </div>
 </header>

 {/* HUD LEVEL 2: COMPOSITE SECTOR PORTFOLIO DISPATCH VIEWPORT */}
 <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32 block w-full space-y-6">
 {/* Artifact Exploration Reference Line */}
 <div className="flex items-center justify-between gap-4 leading-none w-full shrink-0 select-none pointer-events-none">
 <div className="flex items-center gap-2 max-w-[160px] sm:max-w-xs truncate leading-none">
 <div className="p-2 bg-primary/5 border border-primary/10 rounded text-primary shrink-0 block">
 <Target className="h-3.5 w-3.5 stroke-[2.2]" />
 </div>
 <h2 className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-primary pt-0.5 truncate block">
 My Learning
 </h2>
 </div>
 <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent block shrink-0" />
 </div>

 {/* Live Academic Session Broadcast Track */}
 <div className="block w-full">
 <UpcomingSessionsRail />
 </div>

 {/* Enrolled Courses Curriculum List Section Component */}
 <section className="relative z-10 block w-full pt-1">
 <MyCoursesTab />
 </section>

 {/* Platform Compliance Terminal Trace */}
 <div className="mt-16 flex flex-col items-center justify-center opacity-25 select-none pointer-events-none leading-none w-full shrink-0 uppercase tracking-widest font-mono text-[8px] font-bold text-muted-foreground/40">
 <div className="h-10 w-px bg-gradient-to-b from-primary/30 to-transparent mb-3.5 block" />
 <p className="italic tracking-widest">End of your active learning list</p>
 </div>
 </main>
 </div>
 );
}
