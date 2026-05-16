import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Heart, MapPin, Briefcase, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyWithSignal } from "@/hooks/useCompaniesWithSignal";

interface Props {
  company: CompanyWithSignal;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onClick: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  remote: "Remote",
  freelance: "Freelance",
};

/**
 * GroUp Academy: Corporate Topology Node (CompanyCard)
 * CTO Reference: Authoritative interface component organizing organization tracking and hiring analytics.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function CompanyCard({ company, isFollowing, onToggleFollow, onClick }: Props) {
  const queryClient = useQueryClient();

  // Monitor campaign directory item impressions safely via telemetry logs
  useEffect(() => {
    if (company?.id) {
      trackEvent("company_directory_card_rendered", {
        companyName: company.company_name,
        activeJobsCount: company.active_jobs,
        userIsFollowing: isFollowing,
      });
    }
  }, [company, isFollowing]);

  if (!company || !company.company_name) {
    trackError("CompanyCard component mounted without explicit model bindings.", {
      component: "CompanyCard",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const handleRowNavigationClick = () => {
    trackEvent("company_directory_card_clicked", { companyName: company.company_name });
    try {
      onClick();
    } catch (err) {
      trackError(err, {
        component: "CompanyCard",
        action: "execute_onClick_navigation_callback",
        companyName: company.company_name,
      });
    }
  };

  const handleFollowRelationshipToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Shield primary container click handlers gracefully

    trackEvent("company_directory_follow_toggled", {
      companyName: company.company_name,
      transitionToState: !isFollowing,
    });

    try {
      await onToggleFollow();

      // Automated Efficiency: Synchronize cache pools instantly across vertical layouts
      queryClient.invalidateQueries({ queryKey: ["companies-list"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    } catch (err) {
      trackError(err, {
        component: "CompanyCard",
        action: "execute_onToggleFollow_callback",
        companyName: company.company_name,
      });
    }
  };

  // Safe split extractor parsing initials out of raw corporate names cleanly
  const corporateInitialsString =
    company.company_name
      ?.split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CO";

  return (
    <Card

      onClick={handleRowNavigationClick}
      className="w-full text-left rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm select-none transition-all duration-300 transform-gpu hover:border-primary/30 hover:bg-card/90 hover:shadow-md active:scale-[0.995] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring group"
    >
      <CardContent className="p-3.5 flex flex-col gap-2.5 w-full min-w-0">
        {/* TOP INTERACTIVE IDENTIFIER ROW TRACK */}
        <div className="flex items-start gap-3 w-full min-w-0">
          {/* Organization Branded Identity Profile Avatar Block */}
          <Avatar className="h-10 w-10 border border-border/30 shrink-0 shadow-sm transition-transform group-hover:scale-102 duration-300">
            {company.logo_url && (
              <AvatarImage
                src={company.logo_url}
                alt={`${company.company_name} organization identification branding logo`}
                className="object-cover"
                loading="lazy"
              />
            )}
            <AvatarFallback className="text-[10px] font-extrabold bg-primary/10 text-primary uppercase select-none tracking-tight">
              {corporateInitialsString}
            </AvatarFallback>
          </Avatar>

          {/* Typography Metadata Header Frame */}
          <div className="min-w-0 flex-1 flex flex-col justify-center text-left space-y-0.5">
            <p className="text-sm font-bold text-foreground/90 tracking-tight leading-snug truncate pr-1 select-text selection:bg-primary/20 group-hover:text-primary transition-colors">
              {company.company_name}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wide flex items-center gap-1.5 leading-none tabular-nums">
              <Briefcase className="h-3 w-3 text-primary stroke-[2.2] shrink-0" />
              <span>
                {company.active_jobs || 0} {company.active_jobs === 1 ? "active role" : "active roles"}
              </span>
            </p>
          </div>

          {/* Social Follow Dynamic Relationship Interaction Toggle Anchor */}
          <Button
            variant="ghost"
            size="icon"
      
            className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 shrink-0 cursor-pointer active:scale-90 transition-all select-none"
            onClick={handleFollowRelationshipToggle}
            aria-label={
              isFollowing
                ? `Stop tracking updates from ${company.company_name}`
                : `Track ecosystem career updates from ${company.company_name}`
            }
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 stroke-[2.2] transition-transform duration-300",
                isFollowing
                  ? "fill-rose-500 text-rose-500 scale-105 drop-shadow-[0_1px_4px_rgba(244,63,94,0.2)]"
                  : "text-muted-foreground/60",
              )}
            />
          </Button>
        </div>

        {/* BOTTOM METRIC compliance COMPONENT BADGES HORIZONTAL PORTAL */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 select-none w-full max-w-full">
          {/* High Influx Volume Dynamic Alert Indicator */}
          {company.jobs_last_14d > 0 && (
            <Badge className="bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 text-[9px] font-extrabold tracking-wide uppercase px-2 h-5.5 gap-1 shadow-sm shrink-0 tabular-nums animate-in slide-in-from-left-1 duration-200">
              <TrendingUp className="h-3 w-3 stroke-[2.5]" />
              <span>+{company.jobs_last_14d} fresh</span>
            </Badge>
          )}

          {/* Contract Classification Identifier Badge */}
          {company.top_type && (
            <Badge
              variant="outline"
              className="text-[9px] font-extrabold uppercase tracking-wide px-2 h-5.5 rounded-md border border-border/40 text-muted-foreground/80 bg-background/50 shadow-sm shrink-0"
            >
              {TYPE_LABEL[company.top_type] ?? company.top_type?.replace(/_/g, " ")}
            </Badge>
          )}

          {/* Geographical Location Bounds Tag Anchor */}
          {company.top_location && (
            <Badge
              variant="outline"
              className="text-[9px] font-extrabold uppercase tracking-wide px-2 h-5.5 rounded-md border border-border/40 text-muted-foreground/80 bg-background/50 shadow-sm max-w-[50%] sm:max-w-[60%] truncate text-ellipsis gap-1 flex items-center"
            >
              <MapPin className="h-3 w-3 text-primary shrink-0 stroke-[2.2]" />
              <span className="truncate text-ellipsis select-text select-none">{company.top_location}</span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
