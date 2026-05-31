import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventsTab } from "@/domains/learning/components/talent/EventsTab";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE } from "@/lib/uiTokens";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Webinars & Broadcasters Directory Shell (AppEvents)
 * Hardened operational directory wrapping semantic components and protecting viewport rows from layout shifts.
 * Version: Launch Candidate · Phase Z1 Structure Token Locked
 */
export default function AppEvents() {
 const executeNavigationHook = useNavigate();

 const handleDefensiveReturnSequence = React.useCallback(() => {
 // Audit active stack state layout context ahead of enforcing routing maps
 if (window.history.length > 1) {
 executeNavigationHook(-1);
 } else {
 executeNavigationHook("/app/learning", { replace: true });
 }
 }, [executeNavigationHook]);

 return (
 <div className={cn(PAGE_SHELL, "text-left antialiased block transform-gpu w-full space-y-4")}>
 {/* HUD LEVEL 1: ADMINISTRATIVE HUBS BACKWARD NAVIGATION */}
 <div className="block select-none leading-none w-full shrink-0">
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={handleDefensiveReturnSequence}
 className="h-9 px-3 rounded-lg font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider gap-1.5 cursor-pointer hover:bg-muted"
 >
 <ArrowLeft className="w-4 h-4 stroke-[2.5] shrink-0" />
 <span>Return</span>
 </Button>
 </div>

 {/* HUD LEVEL 2: COMPOSITE PROFILE CONTEXT DESKTOP HEADER */}
 <header className="px-1 select-none pointer-events-none block leading-none w-full shrink-0 space-y-1">
 <h1
 className={cn(
 PAGE_TITLE,
 "text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground pt-0.5 leading-tight block",
 )}
 >
 Webinars & Events
 </h1>
 <p
 className={cn(PAGE_SUBTITLE, "text-xs sm:text-sm text-muted-foreground/60 font-medium leading-normal block")}
 >
 Live seminars, expert workshops, and application challenges.
 </p>
 </header>

 {/* HUD LEVEL 3: DYNAMIC SUB-COMPONENT PANEL DISPATCH MANIFEST */}
 <main className="min-h-[60vh] block w-full pt-1">
 <EventsTab />
 </main>
 </div>
 );
}
