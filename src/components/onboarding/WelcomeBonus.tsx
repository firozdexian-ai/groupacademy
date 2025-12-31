import { useState, useEffect } from 'react';
import { Coins, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WelcomeBonusProps {
  onContinue: () => void;
}

export function WelcomeBonus({ onContinue }: WelcomeBonusProps) {
  const [displayedCredits, setDisplayedCredits] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Animate credit counter from 0 to 250
  useEffect(() => {
    const targetCredits = 250;
    const duration = 2000; // 2 seconds
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Celebration icon */}
      <div className="relative mb-6">
        <div className={cn(
          "w-24 h-24 rounded-full bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center",
          animationComplete && "animate-pulse"
        )}>
          <Coins className="h-12 w-12 text-warning" />
        </div>
        {animationComplete && (
          <>
            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-warning animate-bounce" />
            <Sparkles className="absolute -bottom-1 -left-3 h-5 w-5 text-warning/70 animate-bounce delay-100" />
          </>
        )}
      </div>

      {/* Welcome message */}
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Welcome to GroUp Academy!
      </h1>
      <p className="text-muted-foreground text-lg mb-8">
        Here's a gift to get you started
      </p>

      {/* Credit counter */}
      <div className="bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border border-warning/20 rounded-2xl p-8 mb-6">
        <div className="text-6xl font-bold text-warning mb-2 tabular-nums">
          {displayedCredits}
        </div>
        <p className="text-lg text-foreground font-medium">Credits</p>
        <p className="text-sm text-muted-foreground mt-1">Worth ৳500</p>
      </div>

      {/* What are credits expandable */}
      <button
        onClick={() => setShowExplanation(!showExplanation)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        What are credits?
        {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showExplanation && (
        <div className="bg-muted/50 rounded-lg p-4 mb-6 max-w-md text-left animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm text-muted-foreground">
            Credits are your currency for premium career services. Use them for:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• AI Mock Interviews</li>
            <li>• Salary Analysis Reports</li>
            <li>• Job Applications</li>
            <li>• Career Assessments</li>
            <li>• And more!</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            <span className="text-warning font-medium">1 credit = ৳2</span>
          </p>
        </div>
      )}

      {/* Continue button */}
      <Button 
        size="lg" 
        onClick={onContinue}
        className="min-w-[200px]"
        disabled={!animationComplete}
      >
        {animationComplete ? "Let's Set Up Your Profile" : "Loading..."}
      </Button>
    </div>
  );
}
