import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase } from "lucide-react";

interface RelatedJobsProps {
  currentJobId: string;
  companyName: string;
  location: string | null;
  linkPrefix: "/jobs" | "/app/jobs";
}

function extractCountry(location: string | null): string | null {
  if (!location) return null;
  const trimmed = location.trim().toLowerCase();
  if (trimmed === "remote" || trimmed === "remote/hybrid") return null;
  const parts = location.split(",");
  const last = parts[parts.length - 1].trim();
  return last.length >= 2 ? last : null;
}

export function RelatedJobs({ currentJobId, companyName, location, linkPrefix }: RelatedJobsProps) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionTitle, setSectionTitle] = useState("You Might Also Like");

  useEffect(() => {
    fetchRelatedJobs();
  }, [currentJobId, companyName, location]);

  const fetchRelatedJobs = async () => {
    setLoading(true);
    try {
      const collected: JobCardData[] = [];
      const excludeIds = new Set<string>([currentJobId]);

      // 1. Same company jobs
      const { data: companyJobs } = await supabase
        .from("jobs")
        .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
        .ilike("company_name", companyName)
        .neq("id", currentJobId)
        .eq("is_active", true)
        .limit(3);

      if (companyJobs?.length) {
        for (const j of companyJobs) {
          collected.push(j);
          excludeIds.add(j.id);
        }
        setSectionTitle(`More from ${companyName}`);
      }

      // 2. Same country jobs
      const country = extractCountry(location);
      if (country && collected.length < 6) {
        const remaining = 6 - collected.length;
        let query = supabase
          .from("jobs")
          .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
          .ilike("location", `%${country}%`)
          .eq("is_active", true)
          .limit(remaining);

        // Exclude already collected ids
        for (const eid of excludeIds) {
          query = query.neq("id", eid);
        }

        const { data: countryJobs } = await query;

        if (countryJobs?.length) {
          for (const j of countryJobs) {
            collected.push(j);
            excludeIds.add(j.id);
          }
          if (!companyJobs?.length) {
            setSectionTitle(`More Jobs in ${country}`);
          }
        }
      }

      // 3. Featured fallback
      if (collected.length < 3) {
        const remaining = 6 - collected.length;
        let query = supabase
          .from("jobs")
          .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
          .eq("is_featured", true)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(remaining);

        for (const eid of excludeIds) {
          query = query.neq("id", eid);
        }

        const { data: featuredJobs } = await query;

        if (featuredJobs?.length) {
          for (const j of featuredJobs) {
            collected.push(j);
          }
          if (!companyJobs?.length && !country) {
            setSectionTitle("You Might Also Like");
          }
        }
      }

      setJobs(collected.slice(0, 6));
    } catch (err) {
      console.error("Failed to load related jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (jobId: string) => {
    if (linkPrefix === "/app/jobs") {
      navigate(`${linkPrefix}/${jobId}`);
    } else {
      window.location.href = `${linkPrefix}/${jobId}`;
    }
  };

  if (loading) {
    return (
      <div className="mt-8">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Briefcase className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-base font-bold">{sectionTitle}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            variant="default"
            onClick={() => handleJobClick(job.id)}
          />
        ))}
      </div>
    </section>
  );
}
