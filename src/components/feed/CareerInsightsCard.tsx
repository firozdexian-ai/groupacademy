import { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp, Sparkles, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CareerInsightsCardProps {
  insights: string[];
}

export function CareerInsightsCard({ insights }: CareerInsightsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!insights || insights.length === 0) return null;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-500",
        "bg-gradient-to-br from-primary/[0.03] via-background to-accent/[0.03]",
        "border-primary/20 hover:border-primary/40 shadow-sm",
      )}
    >
      {/* Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />

      <CardContent className="p-5">
        {/* Interactive Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between group outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Lightbulb className="h-5 w-5 fill-current opacity-80" />
              </div>
              <Sparkles className="h-3 w-3 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
            </div>

            <div className="text-left">
              <h3 className="font-bold text-sm tracking-tight text-foreground flex items-center gap-2">
                AI Career Strategy
                {isExpanded && <Badge variant="pulse" />}
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Tailored for your background
              </p>
            </div>
          </div>

          <div
            className={cn(
              "p-1.5 rounded-full bg-muted/50 transition-all",
              "group-hover:bg-primary/10 group-hover:text-primary",
            )}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {/* Dynamic Content Body */}
        <div
          className={cn(
            "grid transition-all duration-500 ease-in-out",
            isExpanded ? "grid-rows-[1fr] opacity-100 mt-5" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <ul className="space-y-4">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-4 group/item">
                  <div
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-lg bg-background border border-primary/20",
                      "text-primary text-[10px] font-black flex items-center justify-center mt-0.5",
                      "shadow-sm transition-colors group-hover/item:bg-primary group-hover/item:text-white",
                    )}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm text-foreground/80 leading-relaxed font-medium">{insight}</span>
                </li>
              ))}
            </ul>

            {/* Smart Footer */}
            <div className="mt-6 pt-4 border-t border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <Zap className="h-3 w-3 text-amber-500" />
                Strategic Advantage Locked
              </div>
              <span className="text-[10px] text-primary hover:underline cursor-pointer font-bold">Learn More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Internal Mini-component for the pulse indicator
function Badge({ variant }: { variant: "pulse" }) {
  return (
    <span className="flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
    </span>
  );
}
