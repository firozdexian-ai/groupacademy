import { useState } from "react";
import { Building2, MapPin, Clock, ArrowRight, Bookmark, Star, Banknote, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  JOB_TYPE_COLORS,
  getJobTypeLabel,
  getExperienceLevelLabel,
  isDeadlineUrgent,
  isDeadlinePassed,
} from "@/lib/constants/jobTypes";

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
  salary_currency?: string | null;
}

export interface JobMatchInfo {
  match_score: number;
  reason: string;
}

interface JobCardProps {
  job: JobCardData;
  variant?: "default" | "compact" | "featured";
  isSaved?: boolean;
  onSaveToggle?: () => void;
  onClick: () => void;
  className?: string;
  matchInfo?: JobMatchInfo;
}

export function JobCard({
  job,
  variant = "default",
  isSaved = false,
  onSaveToggle,
  onClick,
  className,
  matchInfo,
}: JobCardProps) {
  const isCompact = variant === "compact";
  const isClosed = isDeadlinePassed(job.deadline || null);
  const [logoError, setLogoError] = useState(false);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveToggle?.();
  };

  const formatSalary = () => {
    if (!job.salary_range_min && !job.salary_range_max) return null;
    const currency = job.salary_currency || "BDT";
    const symbol = currency === "USD" ? "$" : currency === "BDT" ? "৳" : currency;
    const isPrefix = currency === "USD";

    const formatNum = (num: number | null | undefined) => {
      if (!num) return "";
      if (num >= 1000) return `${Math.round(num / 1000)}k`;
      return num.toString();
    };

    const min = formatNum(job.salary_range_min);
    const max = formatNum(job.salary_range_max);

    if (min && max) {
      return isPrefix ? `${symbol}${min} - ${symbol}${max}` : `${min} - ${max} ${symbol}`;
    }
    const val = min || max;
    return isPrefix ? `${symbol}${val}` : `${val} ${symbol}`;
  };

  if (isCompact) {
    return (
      <Card
        className={cn(
          "cursor-pointer overflow-hidden hover:shadow-md transition-all hover:border-primary/30 group",
          isClosed && "opacity-60",
          className,
        )}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border overflow-hidden">
              {job.company_logo_url && !logoError ? (
                <img
                  src={job.company_logo_url}
                  alt={job.company_name}
                  className="object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Building2 className="w-4 h-4 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{job.company_name}</p>
            </div>

            {matchInfo && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 text-[10px]">
                <Brain className="w-3 h-3" /> {matchInfo.match_score}%
              </Badge>
            )}

            <Badge variant="secondary" className={cn("text-[10px] h-5", JOB_TYPE_COLORS[job.job_type])}>
              {getJobTypeLabel(job.job_type)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden transition-all group h-full flex flex-col relative",
        "hover:shadow-lg hover:border-primary/50",
        // CTO Audit Fix: Semantic ring for featured jobs
        job.is_featured && "ring-2 ring-amber-500/20 border-amber-500/30 bg-amber-500/[0.02]",
        isClosed && "opacity-60",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-5 flex flex-col h-full space-y-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex gap-4 items-start flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border overflow-hidden">
              {job.company_logo_url && !logoError ? (
                <img
                  src={job.company_logo_url}
                  alt={job.company_name}
                  className="object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Building2 className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors leading-tight">
                {job.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{job.company_name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 hover:bg-primary/10"
            onClick={handleSaveClick}
          >
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary text-primary")} />
          </Button>
        </div>

        {/* Audit Fix: Show Match Reason if available */}
        {matchInfo && (
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-2 flex items-start gap-2">
            <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-primary/80 line-clamp-2 italic">"{matchInfo.reason}"</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className={cn("text-[10px] py-0 h-6 px-2 border-0", JOB_TYPE_COLORS[job.job_type])}
          >
            {getJobTypeLabel(job.job_type)}
          </Badge>
          {formatSalary() && (
            <Badge
              variant="outline"
              className="text-[10px] py-0 h-6 px-2 bg-emerald-500/5 text-emerald-700 border-emerald-500/20"
            >
              <Banknote className="w-3 h-3 mr-1" /> {formatSalary()}
            </Badge>
          )}
          {job.is_featured && (
            <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 h-6 text-[10px]">
              <Star className="w-3 h-3 fill-current mr-1" /> Featured
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 mt-auto">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{job.location || "Remote"}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
