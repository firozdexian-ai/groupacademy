import { EventsTab } from "@/components/learning/EventsTab";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Live Logic Synchronizer
 * High-fidelity directory for real-time webinars and professional networking.
 * 2026 Standard: Executive Logic geometry with real-time uplink telemetry.
 */
export default function AppEvents() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Navigation & Connection Context */}
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

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">
              Live Uplink Active
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-[24px] bg-primary/10 flex items-center justify-center border border-primary/20 rotate-3 shadow-xl">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Webinars & Events</h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                  Professional Networking Hub
                </p>
                <span className="h-1 w-1 rounded-full bg-primary/30" />
                <div className="flex items-center gap-1.5">
                  <Radio className="h-3 w-3 text-primary" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">
                    Real-Time Data Sync
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Logic Viewport: Events List */}
      <main className="min-h-[70vh] animate-in fade-in zoom-in-95 duration-700 delay-200">
        <EventsTab />
      </main>

      {/* Operational Metadata Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Event List: Verified 2026 Logic</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            UTC Synchronization Active
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-6 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
