import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Zap, Compass } from "lucide-react";

interface RelatedJobsProps {
  currentJobId: string;
  companyName: string;
  location: string | null;
  linkPrefix: "/jobs" | "/app/jobs";
}

function extractInstitutionalGeography(location: string | null): string | null {
  if (!location) return null;
  const sanitized = location.trim().toLowerCase();
  if (sanitized.includes("remote") || sanitized.includes("hybrid")) return null;
  const components = location.split(",");
  const countryCluster = components[components.length - 1].trim();
  return countryCluster.length >= 2 ? countryCluster : null;
}

/**
 * GroUp Academy: Contextual Opportunity Recommender (RelatedJobs)
 * CTO Reference: Authoritative tiered engine for institutional, regional, and fallback job matching.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function RelatedJobs({ currentJobId, companyName, location, linkPrefix }: RelatedJobsProps) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionTitle, setSectionTitle] = useState("Recommended_Syncs");

  useEffect(() => {
    executeDiscoveryProtocol();
  }, [currentJobId, companyName, location]);

  const executeDiscoveryProtocol = async () => {
    if (!currentJobId || !companyName) return;

    setLoading(true);
    trackEvent("opportunity_discovery_initiated", { currentJobId, companyName });

    try {
      const trajectoryBuffer: JobCardData[] = [];
      const filterRegistry = new Set<string>([currentJobId]);

      const baseFields =
        "id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max, salary_currency";

      // PHASE 1: Institutional Core Sync (Same Company)
      const { data: institutionalNodes, error: instError } = await supabase
        .from("jobs")
        .select(baseFields)
        .ilike("company_name", companyName.trim())
        .neq("id", currentJobId)
        .eq("is_active", true)
        .limit(3);

      if (instError) throw instError;

      if (institutionalNodes?.length) {
        institutionalNodes.forEach((node) => {
          trajectoryBuffer.push(node as unknown as JobCardData);
          filterRegistry.add(node.id);
        });
        setSectionTitle(`Institutional_Sync: ${companyName.trim().toUpperCase()}`);
      }

      // PHASE 2: Geographic Vector Sync (Same Country)
      const targetCountry = extractInstitutionalGeography(location);
      if (targetCountry && trajectoryBuffer.length < 6) {
        const quota = 6 - trajectoryBuffer.length;
        const exclusionArray = Array.from(filterRegistry);

        // Optimization: Use array operations instead of iterative .neq loops
        const { data: geographicNodes, error: geoError } = await supabase
          .from("jobs")
          .select(baseFields)
          .ilike("location", `%${targetCountry.trim()}%`)
          .eq("is_active", true)
          .not("id", "in", `(${exclusionArray.join(",")})`)
          .limit(quota);

        if (geoError) throw geoError;

        if (geographicNodes?.length) {
          geographicNodes.forEach((node) => {
            trajectoryBuffer.push(node as unknown as JobCardData);
            filterRegistry.add(node.id);
          });
          if (!institutionalNodes?.length) {
            setSectionTitle(`Regional_Sync: ${targetCountry.trim().toUpperCase()}`);
          }
        }
      }

      // PHASE 3: High-Intensity Fallback (Featured Nodes)
      if (trajectoryBuffer.length < 3) {
        const fallbackQuota = 6 - trajectoryBuffer.length;
        const exclusionArray = Array.from(filterRegistry);

        const { data: featuredNodes, error: fallbackError } = await supabase
          .from("jobs")
          .select(baseFields)
          .eq("is_featured", true)
          .eq("is_active", true)
          .not("id", "in", `(${exclusionArray.join(",")})`)
          .order("created_at", { ascending: false })
          .limit(fallbackQuota);

        if (fallbackError) throw fallbackError;

        if (featuredNodes?.length) {
          featuredNodes.forEach((node) => trajectoryBuffer.push(node as unknown as JobCardData));
          if (!institutionalNodes?.length && !targetCountry) {
            setSectionTitle("Strategic_Deployments");
          }
        }
      }

      const finalizedCollection = trajectoryBuffer.slice(0, 6);
      setJobs(finalizedCollection);

      trackEvent("opportunity_discovery_success", {
        currentJobId,
        yieldedCount: finalizedCollection.length,
        strategyMode: sectionTitle,
      });
    } catch (err: any) {
      const exceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(exceptionMsg, {
        component: "RelatedJobs",
        action: "execute_discovery_protocol",
        currentJobId,
        companyName,
      });

      setSectionTitle("Recommended_Syncs");
    } finally {
      setLoading(false);
    }
  };

  const initializeJobHandshake = (jobId: string) => {
    if (!jobId) return;

    trackEvent("opportunity_discovery_navigation_redirect", { targetJobId: jobId, prefixMode: linkPrefix });

    if (linkPrefix === "/app/jobs") {
      navigate(`${linkPrefix}/${jobId}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.href = `${linkPrefix}/${jobId}`;
    }
  };

  if (loading) {
    return (
      <div className="mt-12 space-y-6 select-none w-full animate-in fade-in duration-200">
        <Skeleton className="h-5 w-56 bg-muted/30 rounded-lg opacity-80" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((skeletonIndex) => (
            <Skeleton key={skeletonIndex} className="h-40 rounded-2xl bg-card/40 opacity-60" />
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <section className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full w-full">
      {/* HUD: SECTION COMPLIANCE HEADER STRIP */}
      <div className="flex items-center justify-between mb-5 px-0.5 select-none w-full">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1.5 rounded-xl bg-primary/10 border border-primary/5 shadow-inner shrink-0">
            <Compass className="h-4 w-4 text-primary animate-pulse stroke-[2.2]" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/80 truncate">
            {sectionTitle.replace(/_/g, " ")}
          </h2>
        </div>
        <div className="flex items-center gap-1 opacity-40 shrink-0 text-muted-foreground">
          <Zap className="h-3 w-3 fill-primary/10 text-primary stroke-[2.2]" />
          <span className="text-[9px] font-extrabold uppercase tracking-widest leading-none">Discovery Active</span>
        </div>
      </div>

      {/* COMPONENT CARDS COMPILING GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {jobs.map((jobItem) => {
          if (!jobItem || !jobItem.id) return null;
          return (
            <JobCard
              key={jobItem.id}
              job={jobItem}
              variant="default"
              className="hover:shadow-md transition-all duration-300"
              onClick={() => initializeJobHandshake(jobItem.id)}
            />
          );
        })}
      </div>
    </section>
  );
}
