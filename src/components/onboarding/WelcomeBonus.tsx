import { useState, useEffect } from "react";
import { Coins, Sparkles, ChevronDown, ChevronUp, Zap, ShieldCheck, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatEventTime, DEFAULT_EVENT_TZ } from "@/lib/eventTime";

interface WelcomeBonusProps {
  onContinue: () => void;
}

export function WelcomeBonus({ onContinue }: WelcomeBonusProps) {
  const [displayedCredits, setDisplayedCredits] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  const navigate = useNavigate();

  // Featured upcoming live event (within next 14 days)
  const { data: upcomingEvent } = useQuery({
    queryKey: ["welcome-upcoming-event"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const inTwoWeeks = new Date(Date.now() + 14 * 86_400_000).toISOString();
      const { data } = await supabase
        .from("content")
        .select("title, slug, event_date, event_timezone, price")
        .in("content_type", ["live_webinar", "batch_class"])
        .eq("is_published", true)
        .eq("is_private", false)
        .gte("event_date", new Date().toISOString())
        .lte("event_date", inTwoWeeks)
        .order("event_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    const targetCredits = 250;
    const duration = 2000;
    const steps = 50;
    const increment = targetCredits / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= targetCredits) {
        setDisplayedCredits(targetCredits);
        setAnimationComplete(true);
        clearInterval(interval);
      } else {
        setDisplayedCredits(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 w-full max-w-lg mx-auto animate-in fade-in duration-1000">
      <div className="relative mb-8">
        <div
          className={cn(
            "w-32 h-32 rounded-[40px] bg-emerald-50 flex items-center justify-center border-4 border-white shadow-lg transition-all duration-700 z-10 relative",
            animationComplete ? "scale-105" : "scale-100",
          )}
        >
          <Coins
            className={cn(
              "h-14 w-14 text-emerald-500 transition-transform duration-700",
              animationComplete ? "scale-110" : "scale-100",
            )}
          />
        </div>

        {animationComplete && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <Sparkles className="absolute -top-6 -right-6 h-10 w-10 text-emerald-400 animate-pulse" />
            <Zap className="absolute -bottom-4 -left-6 h-8 w-8 text-emerald-300 fill-emerald-300 animate-bounce" />
            <div className="absolute -inset-10 rounded-full bg-emerald-100 blur-3xl opacity-50 animate-pulse" />
          </div>
        )}
      </div>

      <div className="space-y-3 mb-10 relative z-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-tight">Welcome Bonus</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Your initial career capital is ready.
        </p>
      </div>

      <div className="w-full relative z-10 mb-8">
        <div className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>

          <div className="text-6xl md:text-7xl font-black text-emerald-500 mb-3 tracking-tighter relative z-10">
            {displayedCredits}
          </div>

          <div className="flex flex-col gap-2 relative z-10">
            <p className="text-xs font-black uppercase tracking-widest text-slate-900">Free Credits Awarded</p>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">$5.00 USD Value</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowExplanation(!showExplanation)}
        className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-500 transition-all mb-8 relative z-10"
      >
        How can I use these?
        {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showExplanation && (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-[32px] p-8 mb-10 text-left animate-in slide-in-from-bottom-4 duration-500 shadow-sm relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-5">Credit Value Breakdown</p>
          <ul className="space-y-4">
            {[
              { label: "Career Readiness Audit", val: "50 Credits" },
              { label: "AI Mock Interview", val: "50 Credits" },
              { label: "Salary Analysis", val: "50 Credits" },
              { label: "AI Job Application", val: "25 Credits" },
            ].map((item, i) => (
              <li key={i} className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  {item.val}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {animationComplete && upcomingEvent && (
        <div className="w-full mb-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5 p-5 text-left">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  🎁 Your first event is on us
                </p>
                <h3 className="text-sm font-bold leading-tight mb-1.5 line-clamp-2">{upcomingEvent.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {formatEventTime(upcomingEvent.event_date, upcomingEvent.event_timezone || DEFAULT_EVENT_TZ)}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs rounded-lg w-full"
                  onClick={() => navigate(`/app/learning/courses/${upcomingEvent.slug}`)}
                >
                  Reserve my seat (free with bonus) <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Button
        size="lg"
        onClick={onContinue}
        disabled={!animationComplete}
        className="w-full h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-sm transition-all active:scale-95 gap-3 relative z-10"
      >
        {animationComplete ? (
          <>
            Build Your Profile <ArrowRight className="h-4 w-4" />
          </>
        ) : (
          "Loading..."
        )}
      </Button>
    </div>
  );
}
