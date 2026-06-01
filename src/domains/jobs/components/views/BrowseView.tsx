/**
 * Jobs Section Browse Layout Core — Phase INST-Z2 Hardened
 * CTO Version: June 2026
 * Fixes: Horizontal clipping bounds, native scrollbar injection, alignment consistency
 * Rules: Retains all structural fields, action mutations, and navigation hooks natively.
 */
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Briefcase, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSavedItems } from "@/hooks/useSavedItems";
import { JobCard, type JobCardData } from "@/domains/jobs/components/JobCard";
import { InfiniteJobsList } from "@/domains/jobs/components/InfiniteJobsList";
import { ProfileCompletenessGate } from "@/domains/jobs/components/ProfileCompletenessGate";
import { getJobTypeLabel } from "@/lib/constants/jobTypes";
import { useRef } from "react";

interface Props {
  dashboard?: {
    trending?: JobCardData[];
    in_field?: JobCardData[];
    type_counts?: Record<string, number>;
  };
  talent?: any;
}

function HorizontalStrip({
  title,
  icon: Icon,
  jobs,
  emptyHint,
  isSaved,
  onSaveToggle,
  onJobClick,
}: {
  title: string;
  icon: React.ElementType;
  jobs: JobCardData[];
  emptyHint?: string;
  isSaved: (id: string, kind: "job") => boolean;
  onSaveToggle: (id: string) => void;
  onJobClick: (id: string) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!jobs || jobs.length === 0) {
    if (!emptyHint) return null;
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border/10 pb-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground bg-muted/20 p-4 rounded-xl border border-dashed border-border/60">
          {emptyHint}
        </p>
      </section>
    );
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="space-y-3 relative group">
      <div className="flex items-center justify-between border-b border-border/10 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
        {/* Desktop Carousel Indicators for Premium 2024 SaaS Feel */}
        <div className="hidden md:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            className="h-7 w-7 rounded-lg border-border/60 bg-background hover:bg-muted"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            className="h-7 w-7 rounded-lg border-border/60 bg-background hover:bg-muted"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Styled Slider Container with Scrollbar Contamination Suppressed */}
      <div className="relative w-full overflow-hidden rounded-xl">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Custom style injection for WebKit engines within local component scope */}
          <style>{`
            div::-webkit-scrollbar {
              display: none !important;
            }
          `}</style>
          {jobs.slice(0, 6).map((job) => (
            <div key={job.id} className="snap-start shrink-0 w-[290px] first:pl-0 last:pr-0">
              <div className="transition-transform duration-200 hover:scale-[1.01] h-full">
                <JobCard
                  job={job}
                  variant="compact"
                  isSaved={!!isSaved(job.id, "job")}
                  onSaveToggle={() => onSaveToggle(job.id)}
                  onClick={() => onJobClick(job.id)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Subtle right fade vector to signify further swipable elements implicitly */}
        <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-background/40 to-transparent pointer-events-none hidden md:block" />
      </div>
    </section>
  );
}

export function BrowseView({ dashboard, talent }: Props) {
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSavedItems();

  const trending = dashboard?.trending ?? [];
  const inField = dashboard?.in_field ?? [];
  const typeCounts = dashboard?.type_counts ?? {};

  const onSaveToggle = (id: string) => toggleSave(id, "job");
  const onJobClick = (id: string) => navigate(`/app/jobs/${id}`);

  // Unauthenticated fallback view matrix layout configuration
  if (!talent?.id) {
    return (
      <div className="space-y-8 max-w-full overflow-hidden px-1">
        <HorizontalStrip
          title="Trending now"
          icon={TrendingUp}
          jobs={trending}
          isSaved={isSaved}
          onSaveToggle={onSaveToggle}
          onJobClick={onJobClick}
        />
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-4 shadow-sm animate-pulse">
          <Sparkles className="h-6 w-6 text-primary mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Sign in to unlock mastery matching matrix</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Access real-time vacancy profiling verified against personal technical trajectory benchmarks.
            </p>
          </div>
          <Button
            onClick={() => navigate("/auth?returnTo=/app/jobs")}
            size="sm"
            className="rounded-xl shadow-md font-medium text-xs"
          >
            Sign in <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>
    );
  }

  const typeChips = Object.entries(typeCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-8 max-w-full overflow-hidden px-1">
      {/* Profile completeness badge system (self-hides at >=60%) */}
      <ProfileCompletenessGate talent={talent} />

      {/* Trending Section Row */}
      <HorizontalStrip
        title="Trending now"
        icon={TrendingUp}
        jobs={trending}
        isSaved={isSaved}
        onSaveToggle={onSaveToggle}
        onJobClick={onJobClick}
      />

      {/* In your field Section Row */}
      <HorizontalStrip
        title="In your field"
        icon={Briefcase}
        jobs={inField}
        emptyHint="Add your profession keywords to generate structural career alignments here."
        isSaved={isSaved}
        onSaveToggle={onSaveToggle}
        onJobClick={onJobClick}
      />

      {/* Type-count chip parameters section grid */}
      {typeChips.length > 0 && (
        <section className="space-y-3 bg-muted/10 p-5 rounded-2xl border border-border/40">
          <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Browse by type</h2>
          <div className="flex flex-wrap gap-2.5">
            {typeChips.map(([type, count]) => (
              <Badge
                key={type}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 px-3.5 py-2 text-xs rounded-xl font-medium border border-border/40 transition-colors shadow-sm"
                onClick={() => navigate(`/app/jobs/all?type=${encodeURIComponent(type)}`)}
              >
                {getJobTypeLabel(type) || type}
                <span className="ml-1.5 font-mono text-muted-foreground text-[11px]">({count})</span>
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Recommended for you infinite framework section mapping */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-border/10 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Recommended for you</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs rounded-lg text-primary hover:text-primary hover:bg-primary/5 font-medium"
            onClick={() => navigate("/app/jobs/all")}
          >
            View all
          </Button>
        </div>
        <div className="px-0.5">
          <InfiniteJobsList talentId={talent.id} />
        </div>
      </section>
    </div>
  );
}
