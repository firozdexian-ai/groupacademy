import { useRef } from "react";
import { Sparkles, ChevronLeft, ChevronRight, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InsightCard } from "./InsightCard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * GroUp Academy: Neural Strategy Carousel
 * CTO Reference: High-performance horizontal ingestion node for AI-driven insights.
 */

interface CareerInsightsCarouselProps {
  insights: string[];
  className?: string;
}

export function CareerInsightsCarousel({ insights, className }: CareerInsightsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!insights || insights.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    // PROTOCOL: Precision scroll calculation for variable viewports
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.85;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("group/carousel space-y-6 py-4 animate-in fade-in duration-700", className)}>
      {/* EXECUTIVE HUB HEADER */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4 text-left">
          <div className="relative">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner transition-transform group-hover/carousel:rotate-6">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <Sparkles className="h-4 w-4 text-amber-500 absolute -top-1.5 -right-1.5 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-black text-lg uppercase italic tracking-tighter leading-none">Growth Architecture</h3>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="h-5 px-2 rounded-md font-black text-[9px] uppercase italic border-primary/20 bg-primary/5 text-primary"
              >
                {insights.length} NODES_SYNCED
              </Badge>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                Neural Optimization Active
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION OVERRIDE */}
        {insights.length > 1 && (
          <div className="flex items-center gap-2">
            <NavButton onClick={() => scroll("left")} icon={ChevronLeft} />
            <NavButton onClick={() => scroll("right")} icon={ChevronRight} />
          </div>
        )}
      </div>

      {/* INDUSTRIAL SCROLL CHANNEL */}
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-5 overflow-x-auto pb-6 -mx-4 px-4",
          "scrollbar-hide snap-x snap-mandatory",
          "will-change-scroll transform-gpu", // CTO Note: Force GPU for 60FPS fluid motion
        )}
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {insights.map((insight, index) => (
          <div
            key={index}
            className="snap-start shrink-0 first:pl-2 last:pr-6"
            style={{ width: "calc(100% - 60px)", maxWidth: "340px" }}
          >
            <InsightCard
              insight={insight}
              index={index}
              className={cn(
                "h-full border-2 border-primary/10 bg-gradient-to-br from-background via-background to-primary/[0.03]",
                "shadow-lg hover:shadow-primary/5 transition-all duration-300 rounded-[28px]",
              )}
            />
          </div>
        ))}

        {/* END PROTOCOL NODE */}
        <div className="snap-start shrink-0 flex items-center justify-center pr-4">
          <div className="w-24 h-full flex flex-col items-center justify-center opacity-20 hover:opacity-50 transition-opacity cursor-pointer gap-2">
            <Target className="h-8 w-8" />
            <span className="text-[8px] font-black uppercase italic tracking-widest text-center">Audit_End</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Nav Unit for administrative focus.
 */
function NavButton({ onClick, icon: Icon }: { onClick: () => void; icon: any }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-xl border-2 border-border/40 bg-background/50 backdrop-blur-sm hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95"
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}
