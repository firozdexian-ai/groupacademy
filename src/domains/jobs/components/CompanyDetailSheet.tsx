import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MapPin, Briefcase, TrendingUp } from "lucide-react";
import { useCompanyDetail } from "@/domains/companies/hooks/useCompanyDetail";
import { useFollowedCompanies, useToggleFollowCompany } from "@/domains/companies/hooks/useFollowedCompanies";
import { useSavedItems } from "@/hooks/useSavedItems";
import { JobCard } from "./JobCard";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface Props {
  companyName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
 * Company detail sheet — slide-up panel with company info, job-type / location chips, and open roles.
 */
export function CompanyDetailSheet({ companyName, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && companyName) {
      trackEvent("company_detail_sheet_opened", { companyName });
    }
  }, [open, companyName]);

  const { data, isLoading, error: detailLoadError } = useCompanyDetail(open ? companyName : null);
  const { data: followedSet } = useFollowedCompanies();
  const { mutateAsync: toggleFollow } = useToggleFollowCompany();
  const { isSaved, toggleSave } = useSavedItems();

  useEffect(() => {
    if (detailLoadError) {
      trackError(detailLoadError, {
        component: "CompanyDetailSheet",
        action: "fetch_company_details",
        companyName,
      });
    }
  }, [detailLoadError, companyName]);

  const header = data?.header;
  const jobs = data?.jobs ?? [];
  const isFollowing = companyName ? !!followedSet?.has(companyName) : false;

  const handleFollowToggle = async () => {
    if (!companyName) return;

    trackEvent("company_sheet_follow_toggled", {
      companyName,
      newState: !isFollowing,
    });

    try {
      await toggleFollow(companyName);
      queryClient.invalidateQueries({ queryKey: ["company-detail", companyName] });
      queryClient.invalidateQueries({ queryKey: ["followed-companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies-list"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    } catch (err) {
      trackError(err, {
        component: "CompanyDetailSheet",
        action: "toggle_follow",
        companyName,
      });
    }
  };

  const companyInitials =
    companyName
      ?.split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CO";

  return (
    <Sheet
      open={open}
      onOpenChange={(visibleState) => {
        onOpenChange(visibleState);
        if (!visibleState) {
          trackEvent("company_detail_sheet_dismissed", { companyName });
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[92vh] max-h-[92svh] h-[92vh] p-0 flex flex-col rounded-t-3xl bg-background/98 backdrop-blur-xl border-t border-border/40 select-none sm:select-text transform-gpu shadow-2xl transition-all duration-300 overflow-hidden"
        style={{ contentVisibility: "auto" }}
      >
        <div className="mx-auto w-12 h-1 bg-muted/60 rounded-full mt-2.5 shrink-0 select-none" />

        <SheetHeader className="px-5 pt-3 pb-3 border-b border-border/20 text-left select-none shrink-0 w-full">
          <SheetTitle className="sr-only">{companyName || "Company details"}</SheetTitle>
          {isLoading || !header ? (
            <div className="flex items-center gap-3 w-full animate-pulse">
              <Skeleton className="h-12 w-12 rounded-xl opacity-60 shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-[40%] rounded opacity-70" />
                <Skeleton className="h-3 w-[25%] rounded opacity-40" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3.5 w-full min-w-0">
              <Avatar className="h-12 w-12 border border-border/30 shrink-0 shadow-sm">
                {header.logo_url && (
                  <AvatarImage
                    src={header.logo_url}
                    alt={`${header.company_name} logo`}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="text-xs font-extrabold bg-primary/10 text-primary uppercase tracking-tight">
                  {companyInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 text-left flex flex-col justify-center">
                <p className="text-base font-bold text-foreground/90 tracking-tight truncate pr-1 select-text">
                  {header.company_name}
                </p>
                <div className="text-xs font-semibold text-muted-foreground/80 flex items-center gap-1.5 mt-0.5 tabular-nums flex-wrap w-full">
                  <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>
                    {header.active_jobs || 0} {header.active_jobs === 1 ? "open role" : "open roles"}
                  </span>

                  {header.jobs_last_14d > 0 && (
                    <Badge className="bg-success/10 text-success dark:text-success border border-success/10 text-[9px] font-bold px-2 h-5 gap-1 shrink-0">
                      <TrendingUp className="h-3 w-3" />
                      <span>+{header.jobs_last_14d} this fortnight</span>
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                type="button"
                variant={isFollowing ? "default" : "outline"}
                className={cn(
                  "h-8 px-3 gap-1.5 text-xs font-bold rounded-xl shrink-0 active:scale-95",
                  isFollowing && "bg-primary text-primary-foreground border-transparent hover:bg-primary/90",
                )}
                onClick={handleFollowToggle}
                aria-label={isFollowing ? `Unfollow ${header.company_name}` : `Follow ${header.company_name}`}
              >
                <Heart className={cn("h-3.5 w-3.5", isFollowing && "fill-current")} />
                <span>{isFollowing ? "Following" : "Follow"}</span>
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-safe-bottom w-full">
          {/* Job-type counts + top locations */}
          {data && (
            <div className="flex flex-wrap items-center gap-1.5 select-none w-full animate-in fade-in duration-300 border-b border-border/10 pb-3">
              {data.types?.map((typeItem) => {
                if (!typeItem || !typeItem.type) return null;
                return (
                  <Badge
                    key={typeItem.type}
                    variant="outline"
                    className="text-[10px] font-bold uppercase tracking-wide border-border/40 text-muted-foreground/80 bg-background/50 shadow-sm px-2.5 py-0.5 rounded-lg tabular-nums"
                  >
                    {TYPE_LABEL[typeItem.type] ?? typeItem.type?.replace(/_/g, " ")} &bull; {typeItem.count || 0}
                  </Badge>
                );
              })}

              {data.locations?.slice(0, 4).map((locationItem) => {
                if (!locationItem || !locationItem.location) return null;
                return (
                  <Badge
                    key={locationItem.location}
                    variant="secondary"
                    className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground bg-muted/40 border border-border/20 px-2.5 py-0.5 rounded-lg gap-1 flex items-center tabular-nums shadow-sm max-w-[45%] truncate text-ellipsis"
                  >
                    <MapPin className="h-3 w-3 text-primary shrink-0 stroke-[2.2]" />
                    <span className="truncate text-ellipsis select-text select-none">{locationItem.location}</span>
                    <span className="opacity-40 font-medium">&bull;</span>
                    <span>{locationItem.count || 0}</span>
                  </Badge>
                );
              })}
            </div>
          )}

          <div className="space-y-3 w-full text-left">
            <h3 className="text-xs font-bold text-foreground/90 uppercase tracking-wider pl-0.5">
              Open roles
            </h3>

            {isLoading ? (
              <div className="space-y-2.5 w-full animate-pulse">
                <Skeleton className="h-16 w-full rounded-2xl opacity-60" />
                <Skeleton className="h-16 w-full rounded-2xl opacity-40" />
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-xs font-medium text-muted-foreground/80 py-6 text-center max-w-xs mx-auto">
                No open roles at this company right now.
              </p>
            ) : (
              <div className="space-y-2 w-full">
                {jobs.map((jobItem: any) => {
                  if (!jobItem || !jobItem.id) return null;
                  return (
                    <JobCard
                      key={jobItem.id}
                      job={jobItem}
                      variant="compact"
                      isSaved={!!isSaved(jobItem.id, "job")}
                      onSaveToggle={() => {
                        trackEvent("company_sheet_job_save_toggled", { jobId: jobItem.id, companyName });
                        toggleSave(jobItem.id, "job");
                      }}
                      onClick={() => {
                        trackEvent("company_sheet_job_opened", { jobId: jobItem.id, companyName });
                        onOpenChange(false);
                        navigate(`/app/jobs/${jobItem.id}`);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
