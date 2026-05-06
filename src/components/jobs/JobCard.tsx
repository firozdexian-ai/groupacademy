import { useState } from "react";
import { Building2, MapPin, Clock, ArrowRight, Bookmark, Star, Banknote, Brain, Zap, ShieldCheck } from "lucide-react";
import { VerifiedMatchBadge } from "@/components/jobs/VerifiedMatchBadge";
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

/**
 * GroUp Academy: Professional Opportunities Node
 * CTO Reference: Authoritative component for job lead visualization and AI matching.
 */

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
  match_reason?: "verified_skill" | "keyword" | "location_only";
  verified_match?: {
    mastery_score?: number;
    verified_credentials?: Array<{ topic_tag: string; level: string; verify_code?: string }>;
  } | null;
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

  const formatSalarySync = () => {
    if (!job.salary_range_min && !job.salary_range_max) return null;
    const currency = job.salary_currency || "BDT";
    const symbol = currency === "USD" ? "$" : currency === "BDT" ? "৳" : currency;
    const isPrefix = currency === "USD";

    const formatProtocol = (num: number | null | undefined) => {
      if (!num) return "";
      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
      return num.toString();
    };

    const min = formatProtocol(job.salary_range_min);
    const max = formatProtocol(job.salary_range_max);

    if (min && max) {
      return isPrefix ? `${symbol}${min}-${symbol}${max}` : `${min}-${max}${symbol}`;
    }
    const val = min || max;
    return isPrefix ? `${symbol}${val}` : `${val}${symbol}`;
  };

  if (isCompact) {
    return (
      <Card
        className={cn(
          "cursor-pointer overflow-hidden transition-all duration-300 border-2 border-border/40 hover:border-primary/40 group",
          isClosed && "opacity-40 grayscale",
          className,
        )}
        onClick={onClick}
      >
        <CardContent className="p-3 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-border/10 overflow-hidden shadow-inner">
              {job.company_logo_url && !logoError ? (
                <img
                  src={job.company_logo_url}
                  alt={job.company_name}
                  className="object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Building2 className="w-4 h-4 text-primary/40" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <h3 className="font-black text-xs uppercase italic tracking-tighter line-clamp-1 group-hover:text-primary transition-colors">
                {job.title.replace(" ", "_")}
              </h3>
              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase truncate">{job.company_name}</p>
            </div>

            {matchInfo && (
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 gap-1 text-[9px] h-6 font-black italic"
              >
                <Brain className="w-3 h-3 fill-current" /> {matchInfo.match_score}%
              </Badge>
            )}
            {matchInfo?.match_reason === "verified_skill" && (
              <VerifiedMatchBadge
                compact
                credentials={matchInfo.verified_match?.verified_credentials}
                masteryScore={matchInfo.verified_match?.mastery_score}
              />
            )}

            <Badge
              variant="secondary"
              className={cn(
                "text-[8px] h-5 font-black uppercase italic tracking-widest",
                JOB_TYPE_COLORS[job.job_type],
              )}
            >
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
        "cursor-pointer overflow-hidden transition-all duration-500 group h-full flex flex-col relative border-2 border-border/40",
        "bg-card/40 backdrop-blur-xl hover:shadow-2xl hover:border-primary/40 hover:-translate-y-1",
        job.is_featured && "border-amber-500/30 bg-amber-500/[0.03] shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]",
        isClosed && "opacity-40 grayscale",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col h-full space-y-5 text-left">
        {/* HUD: NODE_HEADER */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex gap-4 items-start flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-background border-2 border-border/10 flex items-center justify-center shrink-0 overflow-hidden shadow-xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
              {job.company_logo_url && !logoError ? (
                <img
                  src={job.company_logo_url}
                  alt={job.company_name}
                  className="object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Building2 className="w-7 h-7 text-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-black text-lg uppercase italic tracking-tighter line-clamp-1 group-hover:text-primary transition-colors leading-none">
                {job.title.replace(" ", "_")}
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {job.company_name}
                </p>
                {job.is_featured && <Zap className="h-3 w-3 text-amber-500 fill-current animate-pulse" />}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10 rounded-xl hover:bg-primary/5 active:scale-90 transition-all border border-transparent hover:border-primary/20"
            onClick={handleSaveClick}
          >
            <Bookmark
              className={cn(
                "h-5 w-5 transition-all duration-500",
                isSaved ? "fill-primary text-primary scale-110" : "text-muted-foreground/40",
              )}
            />
          </Button>
        </div>

        {/* HUD: NEURAL_REASONING */}
        {matchInfo && (
          <div className="bg-primary/5 border-2 border-primary/10 rounded-[18px] p-4 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5 fill-current opacity-60" />
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase italic tracking-widest text-primary/60 leading-none">
                AI_Reasoning_Node
              </p>
              <p className="text-[11px] font-medium text-foreground/80 line-clamp-2 italic leading-relaxed">
                "{matchInfo.reason}"
              </p>
            </div>
          </div>
        )}

        {matchInfo?.match_reason === "verified_skill" && (
          <VerifiedMatchBadge
            credentials={matchInfo.verified_match?.verified_credentials}
            masteryScore={matchInfo.verified_match?.mastery_score}
          />
        )}

        {/* HUD: METADATA_STACK */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-black uppercase italic tracking-widest px-3 h-7 border-2",
              JOB_TYPE_COLORS[job.job_type],
            )}
          >
            {getJobTypeLabel(job.job_type)}
          </Badge>
          {formatSalarySync() && (
            <Badge
              variant="outline"
              className="text-[9px] font-black italic tracking-tighter px-3 h-7 bg-emerald-500/5 text-emerald-600 border-2 border-emerald-500/20 tabular-nums"
            >
              <Banknote className="w-3.5 h-3.5 mr-1.5 opacity-60" /> {formatSalarySync()}
            </Badge>
          )}
          {job.is_featured && (
            <Badge className="bg-amber-500 text-white border-none h-7 px-3 text-[9px] font-black uppercase italic tracking-widest shadow-lg shadow-amber-500/20">
              <Star className="w-3 h-3 fill-current mr-1.5" /> Featured_Node
            </Badge>
          )}
        </div>

        {/* HUD: FOOTER_TELEMETRY */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t-2 border-border/10">
          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest italic">
            <MapPin className="h-3.5 w-3.5 text-primary/40 shrink-0" />
            <span className="truncate">{job.location || "REMOTE_OPS"}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest italic tabular-nums">
            <Clock className="h-3.5 w-3.5 opacity-40" />
            <span>
              SYNC_
              {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
