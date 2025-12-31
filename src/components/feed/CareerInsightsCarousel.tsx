import { useRef } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InsightCard } from './InsightCard';
import { cn } from '@/lib/utils';

interface CareerInsightsCarouselProps {
  insights: string[];
  className?: string;
}

export function CareerInsightsCarousel({ insights, className }: CareerInsightsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!insights || insights.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 280; // Card width + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Career Insights</h3>
        </div>
        
        {/* Navigation arrows */}
        {insights.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Horizontal scroll container */}
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {insights.map((insight, index) => (
          <div key={index} style={{ scrollSnapAlign: 'start' }}>
            <InsightCard insight={insight} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
