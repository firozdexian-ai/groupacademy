import { useState, useEffect } from "react";
import { Coins, Sparkles, ChevronDown, ChevronUp, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Welcome Bonus Artifact
 * CTO Reference: Authoritative node for credit initialization and reward signaling.
 */

interface WelcomeBonusProps {
  onContinue: () => void;
}

export function WelcomeBonus({ onContinue }: WelcomeBonusProps) {
  const [displayedCredits, setDisplayedCredits] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // PROTOCOL: Neural Counter Accumulation
  useEffect(() => {
    const targetCredits = 250;
    const duration = 2400; // Refined for higher tension
    const steps = 60;
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
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-6 animate-in fade-in duration-1000">
      {/* HUD: CELEBRATION_ARTIFACT */}
      <div className="relative mb-10">
        <div
          className={cn(
            "w-28 h-28 rounded-[35%] bg-gradient-to-br from-warning/30 to-warning/5 flex items-center justify-center border-2 border-warning/20 shadow-2xl transition-all duration-700",
            animationComplete ? "scale-110 rotate-3 shadow-warning/20" : "scale-100 rotate-0",
          )}
        >
          <Coins
            className={cn(
              "h-14 w-14 text-warning transition-transform duration-700",
              animationComplete ? "scale-110" : "scale-100",
            )}
          />
        </div>

        {animationComplete && (
          <div className="absolute inset-0 pointer-events-none">
            <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-warning animate-pulse" />
            <Zap className="absolute -bottom-2 -left-4 h-6 w-6 text-primary fill-current animate-bounce" />
            <div className="absolute inset-0 rounded-full bg-warning/20 blur-2xl animate-pulse" />
          </div>
        )}
      </div>

      {/* HUD: IDENTITY_CONFIRMATION */}
      <div className="space-y-3 mb-10">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-foreground leading-none">
          Academy_Entry_Bonus
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground italic">
          Synchronizing starting capital...
        </p>
      </div>

      {/* COMPONENT: CREDIT_SYNC_HUD */}
      <div className="relative group w-full max-w-sm">
        <div className="absolute -inset-0.5 bg-warning/20 rounded-[32px] blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-card/40 backdrop-blur-xl border-2 border-warning/20 rounded-[32px] p-10 mb-8 shadow-2xl overflow-hidden">
          <div className="text-7xl font-black text-warning mb-2 tabular-nums tracking-tighter drop-shadow-[0_10px_20px_rgba(var(--warning),0.3)]">
            {displayedCredits}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-foreground italic">GRO_CREDITS_GRANTED</p>
            <div className="flex items-center justify-center gap-2 opacity-40">
              <ShieldCheck className="h-3 w-3" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Market_Value: $5.00_USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* HUD: UTILITY_EXPANDABLE */}
      <button
        onClick={() => setShowExplanation(!showExplanation)}
        className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-all mb-8"
      >
        PROTOCOL_UTILITY_AUDIT
        {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showExplanation && (
        <div className="bg-muted/10 backdrop-blur-md border-2 border-border/10 rounded-3xl p-6 mb-10 max-w-md text-left animate-in slide-in-from-bottom-4 duration-500 shadow-inner">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 italic">
            Target_Yield_Map:
          </p>
          <ul className="space-y-3">
            {[
              { label: "Neural_Career_Assessment", val: "50_CR" },
              { label: "AI_Simulated_Interview", val: "50_CR" },
              { label: "Market_Salary_Sync", val: "50_CR" },
              { label: "Autonomous_Job_Ingress", val: "25_CR" },
            ].map((item, i) => (
              <li key={i} className="flex justify-between items-center border-b border-border/5 pb-1">
                <span className="text-[11px] font-bold text-muted-foreground/80">{item.label}</span>
                <span className="text-[10px] font-black text-warning italic">{item.val}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-border/10">
            <p className="text-[9px] font-medium leading-relaxed italic text-muted-foreground/40">
              <span className="text-primary font-black not-italic mr-1">STRATEGY:</span>
              This grant covers 5 full career assessments or 10 global job applications.
            </p>
          </div>
        </div>
      )}

      {/* ACTION: FINAL_INGRESS */}
      <Button
        size="xl"
        onClick={onContinue}
        disabled={!animationComplete}
        className="min-w-[280px] h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-95 gap-3"
      >
        {animationComplete ? (
          <>
            INITIALIZE_PROFILE <ShieldCheck className="h-5 w-5" />
          </>
        ) : (
          "AWAITING_SYNC..."
        )}
      </Button>
    </div>
  );
}
