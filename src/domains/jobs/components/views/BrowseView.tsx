import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSavedItems } from "@/hooks/useSavedItems";
import { JobCard, type JobCardData } from "@/domains/jobs/components/JobCard";
import { InfiniteJobsList } from "@/domains/jobs/components/InfiniteJobsList";
import { ProfileCompletenessGate } from "@/domains/jobs/components/ProfileCompletenessGate";
import { getJobTypeLabel } from "@/lib/constants/jobTypes";

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
  if (!jobs || jobs.length === 0) {
    if (!emptyHint) return null;
    return (
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 snap-x snap-mandatory">
        {jobs.slice(0, 6).map((job) => (
          <div key={job.id} className="snap-start shrink-0 w-[280px]">
            <JobCard
              job={job}
              variant="compact"
              isSaved={!!isSaved(job.id, "job")}
              onSaveToggle={() => onSaveToggle(job.id)}
              onClick={() => onJobClick(job.id)}
            />
          </div>
        ))}
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

  // Unauthenticated fallback
  if (!talent?.id) {
    return (
      <div className="space-y-6">
        <HorizontalStrip
          title="Trending now"
          icon={TrendingUp}
          jobs={trending}
          isSaved={isSaved}
          onSaveToggle={onSaveToggle}
          onJobClick={onJobClick}
        />
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center space-y-3">
          <Sparkles className="h-6 w-6 text-primary mx-auto" />
          <p className="text-sm font-semibold">Sign in to see jobs matched to your profile</p>
          <Button onClick={() => navigate("/auth?returnTo=/app/jobs")} size="sm">
            Sign in <ArrowRight className="h-4 w-4 ml-1" />
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
    <div className="space-y-6">
      {/* Profile completeness nudge (self-hides at >=60%) */}
      <ProfileCompletenessGate talent={talent} />

      {/* Trending */}
      <HorizontalStrip
        title="Trending now"
        icon={TrendingUp}
        jobs={trending}
        isSaved={isSaved}
        onSaveToggle={onSaveToggle}
        onJobClick={onJobClick}
      />

      {/* In your field */}
      <HorizontalStrip
        title="In your field"
        icon={Briefcase}
        jobs={inField}
        emptyHint="Add your profession to see roles in your field."
        isSaved={isSaved}
        onSaveToggle={onSaveToggle}
        onJobClick={onJobClick}
      />

      {/* Type-count chips */}
      {typeChips.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold">Browse by type</h2>
          <div className="flex flex-wrap gap-2">
            {typeChips.map(([type, count]) => (
              <Badge
                key={type}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 px-3 py-1.5 text-xs"
                onClick={() => navigate(`/app/jobs/all?type=${encodeURIComponent(type)}`)}
              >
                {getJobTypeLabel(type) || type}
                <span className="ml-1.5 text-muted-foreground">({count})</span>
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Recommended for you (full infinite list) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Recommended for you</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/app/jobs/all")}>
            View all
          </Button>
        </div>
        <InfiniteJobsList talentId={talent.id} />
      </section>
    </div>
  );
}
