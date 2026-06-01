/**
 * GroUp Academy: Employer CRM Surface Selector (CompaniesView)
 * CTO Reference: Authoritative component for candidate-to-employer subscription tracking.
 * Version: Launch Candidate · Phase Z0 Hardened
 * Enhancements: GPU performance acceleration, digital workforce logging, layout stabilization.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "@/domains/jobs/components/CompanyCard";
import { useFollowedCompanies, useToggleFollowCompany } from "@/domains/companies/hooks/useFollowedCompanies";
import type { CompanyWithSignal } from "@/domains/companies/hooks/useCompaniesWithSignal";
import { trackError, trackEvent } from "@/lib/errorTracking";

interface Props {
  companies?: CompanyWithSignal[];
}

export function CompaniesView({ companies }: Props) {
  const navigate = useNavigate();
  const { data: followed, isLoading: loadingFollowed } = useFollowedCompanies();
  const { mutate: toggleFollow } = useToggleFollowCompany();

  const list = (companies ?? []).slice(0, 24);

  // Monitor employer marketplace impression densities safely over active analytical paths
  useEffect(() => {
    if (list.length > 0) {
      trackEvent("employer_catalog_view_rendered", {
        renderedCount: list.length,
        totalPoolCount: companies?.length || 0,
      });
    }
  }, [list.length, companies?.length]);

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-3.5 py-14 px-6 rounded-2xl border border-dashed border-border/60 bg-card/20 backdrop-blur-md select-none animate-in fade-in duration-300 w-full">
        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-1 shadow-inner border border-border/10">
          <Building2 className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-semibold text-foreground/90 tracking-tight">No companies hiring right now</p>
        <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
          Check back soon — new employers post roles and connect with talent every day.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/app/jobs/all")}
          className="rounded-xl font-medium text-xs mt-1 shadow-sm border-border/60 bg-background hover:bg-muted"
        >
          Browse all jobs
        </Button>
      </div>
    );
  }

  const handleCompanyConnectionToggle = (companyName: string) => {
    const isCurrentlyFollowing = !!followed?.has(companyName);

    // Proactively emit workforce parameters before processing mutations
    trackEvent("employer_connection_toggled", {
      companyName,
      previousState: isCurrentlyFollowing ? "following" : "unconnected",
      targetState: isCurrentlyFollowing ? "unconnected" : "following",
    });

    try {
      toggleFollow(companyName);
    } catch (err) {
      trackError(err, {
        component: "CompaniesView",
        action: "toggle_follow_mutation",
        companyName,
      });
    }
  };

  return (
    <div className="space-y-6 antialiased select-none sm:select-text w-full">
      {/* High-performance GPU accelerated rendering grid layer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 transform-gpu">
        {list.map((c) => (
          <div key={c.company_name} className="transition-transform duration-200 hover:scale-[1.005] h-full">
            <CompanyCard
              company={c}
              isFollowing={!!followed?.has(c.company_name)}
              onToggleFollow={() => handleCompanyConnectionToggle(c.company_name)}
              onClick={() => {
                trackEvent("employer_catalog_card_clicked", { companyName: c.company_name });
                navigate(`/app/jobs/all?company=${encodeURIComponent(c.company_name)}`);
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2 select-none">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            trackEvent("employer_catalog_view_all_clicked");
            navigate("/app/jobs/all");
          }}
          className="text-xs font-semibold rounded-xl text-primary hover:text-primary hover:bg-primary/5 gap-1 transition-colors"
        >
          <span>View all jobs</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
