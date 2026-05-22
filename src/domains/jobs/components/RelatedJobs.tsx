import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listRelatedJobsByCompany,
  listRelatedJobsByLocation,
  listRelatedJobsFeatured,
} from "@/domains/jobs/repo/jobsRepo";
import { JobCard, type JobCardData } from "./JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Compass } from "lucide-react";

interface RelatedJobsProps {
  currentJobId: string;
  companyName: string;
  location: string | null;
  linkPrefix: "/jobs" | "/app/jobs";
}

function extractCountry(location: string | null): string | null {
  if (!location) return null;
  const sanitized = location.trim().toLowerCase();
  if (sanitized.includes("remote") || sanitized.includes("hybrid")) return null;
  const components = location.split(",");
  const country = components[components.length - 1].trim();
  return country.length >= 2 ? country : null;
}

/**
 * Related jobs rail. Tiers: same company → same country → featured fallback.
 */
export function RelatedJobs({ currentJobId, companyName, location, linkPrefix }: RelatedJobsProps) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionTitle, setSectionTitle] = useState("Recommended for you");

  useEffect(() => {
    loadRelatedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentJobId, companyName, location]);

  const loadRelatedJobs = async () => {
    if (!currentJobId || !companyName) return;

    setLoading(true);
    trackEvent("related_jobs_load", { currentJobId, companyName });

    try {
      const buffer: JobCardData[] = [];
      const excludeIds = new Set<string>([currentJobId]);

      // 1. Same company
      const sameCompany = await listRelatedJobsByCompany(companyName, currentJobId, 3);
      if (sameCompany.length) {
        sameCompany.forEach((node) => {
          buffer.push(node as unknown as JobCardData);
          excludeIds.add(node.id);
        });
        setSectionTitle(`More at ${companyName.trim()}`);
      }

      // 2. Same country
      const country = extractCountry(location);
      if (country && buffer.length < 6) {
        const quota = 6 - buffer.length;
        const exclude = Array.from(excludeIds);
        const nearby = await listRelatedJobsByLocation(country, exclude, quota);
        if (nearby.length) {
          nearby.forEach((node) => {
            buffer.push(node as unknown as JobCardData);
            excludeIds.add(node.id);
          });
          if (!sameCompany.length) setSectionTitle(`Other jobs in ${country.trim()}`);
        }
      }

      // 3. Featured fallback
      if (buffer.length < 3) {
        const quota = 6 - buffer.length;
        const exclude = Array.from(excludeIds);
        const featured = await listRelatedJobsFeatured(exclude, quota);
        if (featured.length) {
          featured.forEach((node) => buffer.push(node as unknown as JobCardData));
          if (!sameCompany.length && !country) setSectionTitle("Featured jobs");
        }
      }

      const finalList = buffer.slice(0, 6);
      setJobs(finalList);

      trackEvent("related_jobs_loaded", {
        currentJobId,
        count: finalList.length,
        mode: sectionTitle,
      });
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      trackError(msg, {
        component: "RelatedJobs",
        action: "load_related_jobs",
        currentJobId,
        companyName,
      });
      setSectionTitle("Recommended for you");
    } finally {
      setLoading(false);
    }
  };

  const openJob = (jobId: string) => {
    if (!jobId) return;
    trackEvent("related_jobs_open", { targetJobId: jobId, prefixMode: linkPrefix });
    if (linkPrefix === "/app/jobs") {
      navigate(`${linkPrefix}/${jobId}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.href = `${linkPrefix}/${jobId}`;
    }
  };

  if (loading) {
    return (
      <div className="mt-12 space-y-6 w-full animate-in fade-in duration-200">
        <Skeleton className="h-5 w-56 bg-muted/30 rounded-lg opacity-80" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl bg-card/40 opacity-60" />
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <section className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex items-center gap-2.5 mb-5 px-0.5 w-full">
        <div className="p-1.5 rounded-xl bg-primary/10 border border-primary/5 shrink-0">
          <Compass className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-bold tracking-tight text-foreground truncate">{sectionTitle}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {jobs.map((job) => {
          if (!job || !job.id) return null;
          return (
            <JobCard
              key={job.id}
              job={job}
              variant="default"
              className="hover:shadow-md transition-all duration-300"
              onClick={() => openJob(job.id)}
            />
          );
        })}
      </div>
    </section>
  );
}
