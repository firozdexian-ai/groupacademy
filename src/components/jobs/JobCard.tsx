import { Building2, MapPin, Clock, ArrowRight, Bookmark, Star, AlertTriangle, Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { JOB_TYPE_COLORS, getJobTypeLabel, getExperienceLevelLabel, isDeadlineUrgent, isDeadlinePassed } from "@/lib/constants/jobTypes";

export interface JobCardData {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: string;
  experience_level?: string;
  is_featured?: boolean;
  created_at: string;
  deadline?: string | null;
  salary_range_min?: number | null;
  salary_range_max?: number | null;
}

interface JobCardProps {
  job: JobCardData;
  variant?: "default" | "compact" | "featured";
  isSaved?: boolean;
  onSaveToggle?: () => void;
  onClick: () => void;
  className?: string;
}

export function JobCard({ 
  job, 
  variant = "default", 
  isSaved = false, 
  onSaveToggle, 
  onClick,
  className 
}: JobCardProps) {
  const isCompact = variant === "compact";
  const showUrgency = isDeadlineUrgent(job.deadline || null);
  const isClosed = isDeadlinePassed(job.deadline || null);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveToggle?.();
  };

  const formatSalary = () => {
    if (!job.salary_range_min && !job.salary_range_max) return null;
    const min = job.salary_range_min ? `${Math.round(job.salary_range_min / 1000)}k` : "";
    const max = job.salary_range_max ? `${Math.round(job.salary_range_max / 1000)}k` : "";
    if (min && max) return `${min} - ${max}`;
    return min || max;
  };

  if (isCompact) {
    return (
      <Card
        className={cn(
          "cursor-pointer overflow-hidden hover:shadow-md transition-all hover:border-primary/30 group",
          isClosed && "opacity-60",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Logo */}
            {job.company_logo_url ? (
              <img
                src={job.company_logo_url}
                alt={job.company_name}
                className="w-10 h-10 rounded-lg object-cover bg-muted shrink-0 border"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{job.company_name}</p>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 shrink-0">
              {showUrgency && (
                <Badge variant="destructive" className="text-[10px] h-5 px-1.5 gap-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  Closing
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={cn("text-xs", JOB_TYPE_COLORS[job.job_type])}
              >
                {job.job_type === "full_time" ? "Full-time" : job.job_type === "part_time" ? "Part-time" : getJobTypeLabel(job.job_type)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default & Featured variant
  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden transition-all group h-full flex flex-col",
        "hover:shadow-lg hover:border-primary/50",
        job.is_featured && "ring-1 ring-yellow-500/30 bg-yellow-500/[0.02]",
        isClosed && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex gap-3">
          {/* Logo */}
          {job.company_logo_url ? (
            <img
              src={job.company_logo_url}
              alt={job.company_name}
              className="w-12 h-12 rounded-xl object-cover border bg-muted shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}

          {/* Title & Company */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              {job.is_featured && (
                <Badge className="shrink-0 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 px-1.5 h-5 text-[10px]">
                  <Star className="w-3 h-3 fill-current mr-0.5" /> Featured
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">{job.company_name}</p>
          </div>

          {/* Save Button */}
          {onSaveToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-9 w-9 hover:bg-primary/10"
              onClick={handleSaveClick}
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary text-primary")} />
            </Button>
          )}
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge
            variant="secondary"
            className={cn("text-[10px] h-6 px-2 border-0", JOB_TYPE_COLORS[job.job_type])}
          >
            <Clock className="w-3 h-3 mr-1" />
            {getJobTypeLabel(job.job_type)}
          </Badge>

          {formatSalary() && (
            <Badge variant="outline" className="text-[10px] h-6 px-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
              <Banknote className="w-3 h-3 mr-1" />
              {formatSalary()}
            </Badge>
          )}

          {showUrgency && (
            <Badge variant="destructive" className="text-[10px] h-6 px-2 gap-1">
              <AlertTriangle className="w-3 h-3" />
              Closing soon
            </Badge>
          )}
        </div>

        {/* Location & Experience */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground flex-1">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{job.location || "Remote"}</span>
          </div>
          {job.experience_level && (
            <span className="capitalize">{getExperienceLevelLabel(job.experience_level)}</span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <span className="flex items-center text-xs font-medium text-primary group-hover:underline">
            View Details <ArrowRight className="ml-1 w-3 h-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
