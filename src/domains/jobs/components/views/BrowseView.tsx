/**
 * Jobs Section Browse Layout Core — Phase INST-Z2 Hardened
 * CTO Version: June 2026
 * Fixes: Fixed GraduationCap import error, mobile horizontal slider compression, custom type grids
 * Enhancements: Integrated pre-calculated AI Job Recommendations & Mastery Matching Signals
 */
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  TrendingUp,
  Briefcase,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  BriefcaseIcon,
  Globe,
  Award,
  ChevronDown,
  ChevronUp,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSavedItems } from "@/hooks/useSavedItems";
import { JobCard, type JobCardData } from "@/domains/jobs/components/JobCard";
import { InfiniteJobsList } from "@/domains/jobs/components/InfiniteJobsList";
import { ProfileCompletenessGate } from "@/components/jobs/ProfileCompletenessGate";
import { getJobTypeLabel } from "@/lib/constants/jobTypes";
import { useRef, useState, useMemo } from "react";

interface Props {
  dashboard?: {
    trending?: JobCardData[];
    in_field?: JobCardData[];
    type_counts?: Record<string, number>;
  };
  talent?: any;
}

const JOB_TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  full_time: Clock,
  remote: Globe,
  internship: GraduationCap,
  contract: Award,
  part_time: BriefcaseIcon,
};

function ResponsiveJobStrip({
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

        {/* Desktop Controls */}
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

      <div className="w-full">
        {/* Desktop Viewport Carousel */}
        <div className="hidden md:block relative w-full overflow-hidden rounded-xl">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <style>{`
              div::-webkit-scrollbar { display: none !important; }
            `}</style>
            {jobs.slice(0, 6).map((job) => (
              <div key={job.id} className="snap-start shrink-0 w-[290px]">
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
          <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-background/40 to-transparent pointer-events-none" />
        </div>

        {/* Mobile Viewport: Enhanced Clean Vertical Stack Layout */}
        <div className="block md:hidden space-y-3.5">
          {jobs.slice(0, 3).map((job) => (
            <JobCard
              key={job.id}
              job={job}
              variant="default"
              isSaved={!!isSaved(job.id, "job")}
              onSaveToggle={() => onSaveToggle(job.id)}
              onClick={() => onJobClick(job.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrowseView({ dashboard, talent }: Props) {
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSavedItems();
  const [showAllTypes, setShowAllTypes] = useState(false);

  const trending = dashboard?.trending ?? [];
  const inField = dashboard?.in_field ?? [];
  const typeCounts = dashboard?.type_counts ?? {};

  const onSaveToggle = (id: string) => toggleSave(id, "job");
  const onJobClick = (id: string) => navigate(`/app/jobs/${id}`);

  const allTypeChips = useMemo(() => {
    return Object.entries(typeCounts)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [typeCounts]);

  const visibleTypeChips = showAllTypes ? allTypeChips : allTypeChips.slice(0, 4);
  const hasHiddenTypes = allTypeChips.length > 4;

  if (!talent?.id) {
    return (
      <div className="space-y-8 max-w-full overflow-hidden px-1">
        <ResponsiveJobStrip
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
            <p className="text-sm font-semibold text-foreground">Sign in to unlock your custom recommendations</p>
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

  return (
    <div className="space-y-8 max-w-full overflow-hidden px-1">
      <ProfileCompletenessGate talent={talent} />

      {/* AI Recommended / Trending Pipeline Strip */}
      <ResponsiveJobStrip
        title="AI Recommended & Trending"
        icon={TrendingUp}
        jobs={trending}
        isSaved={isSaved}
        onSaveToggle={onSaveToggle}
        onJobClick={onJobClick}
      />

      {/* Profile Matched Sector Strip */}
      <ResponsiveJobStrip
        title="Matched For Your Field"
        icon={Briefcase}
        jobs={inField}
        emptyHint="Complete your profile keywords or industry sectors to generate custom alignments here."
        isSaved={isSaved}
        onSaveToggle={onSaveToggle}
        onJobClick={onJobClick}
      />

      {/* Browse by Type: Clean Grid Layout */}
      {allTypeChips.length > 0 && (
        <section className="space-y-3 bg-muted/10 p-5 rounded-2xl border border-border/40 text-left w-full min-w-0">
          <div className="flex items-center justify-between border-b border-border/5 pb-1.5">
            <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Browse by type</h2>
            {hasHiddenTypes && (
              <button
                type="button"
                onClick={() => setShowAllTypes(!showAllTypes)}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 focus:outline-none"
              >
                <span>{showAllTypes ? "Show less" : "View more"}</span>
                {showAllTypes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            {visibleTypeChips.map(([type, count]) => {
              const TypeIcon = JOB_TYPE_ICONS[type] || BriefcaseIcon;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => navigate(`/app/jobs/all?type=${encodeURIComponent(type)}`)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-all text-left shadow-sm active:scale-[0.99] group w-full min-w-0"
                >
                  <div className="h-7 w-7 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/5 text-primary/70 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <TypeIcon className="h-3.5 w-3.5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-[11px] font-bold text-foreground/90 uppercase tracking-tight truncate">
                      {getJobTypeLabel(type) || type.replace(/_/g, " ")}
                    </p>
                    <p className="font-mono text-[10px] font-semibold text-muted-foreground mt-0.5">
                      {count.toLocaleString()} roles
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Infinite Ranked Capability Matches Section */}
      <section className="space-y-4 pt-1">
        <div className="flex items-center justify-between border-b border-border/10 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Personalized Recommendations For You
            </h2>
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
