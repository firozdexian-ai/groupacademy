import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Briefcase,
  Star,
  Share2,
  RefreshCw,
  AlertCircle,
  UserPlus,
  LogIn,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { RelatedJobs } from "@/components/jobs/RelatedJobs";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: string;
  experience_level: string;
  salary_range_min: number | null;
  salary_range_max: number | null;
  description: string;
  ai_enhanced_description: string | null;
  requirements: any;
  deadline: string | null;
  is_featured: boolean;
  created_at: string;
  source_image_url: string | null;
}

const JOB_TYPES: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
  remote: "Remote",
};

const EXPERIENCE_LEVELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior Level",
  executive: "Executive",
};

export default function PublicJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadJob();
      trackSource();
      trackRefClick();
    }
  }, [id]);

  const trackSource = async () => {
    const source = searchParams.get("source");
    if (source && id) {
      try {
        await supabase.rpc("track_job_click", {
          p_job_id: id,
          p_source: source,
        });

        const newParams = new URLSearchParams(searchParams);
        newParams.delete("source");
        window.history.replaceState({}, "", `${window.location.pathname}?${newParams.toString()}`);
      } catch (err) {
        console.error("Failed to track job click", err);
      }
    }
  };

  const trackRefClick = async () => {
    const ref = searchParams.get("ref");
    if (ref && id) {
      try {
        await supabase.rpc("track_shared_job_click", {
          p_job_id: id,
          p_ref_code: ref,
        });
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("ref");
        const remaining = newParams.toString();
        window.history.replaceState({}, "", window.location.pathname + (remaining ? `?${remaining}` : ""));
      } catch (err) {
        console.error("Failed to track shared job click", err);
      }
    }
  };

  const loadJob = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id).eq("is_active", true).single();

      if (error) throw error;
      setJob(data);
    } catch (error: any) {
      console.error("Error loading job:", error);
      setLoadError("Failed to load job details.");
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `BDT ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `BDT ${min.toLocaleString()}+`;
    if (max) return `Up to BDT ${max.toLocaleString()}`;
    return null;
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: job?.title,
      text: `${job?.title} at ${job?.company_name}`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard!");
        } catch {
          toast.error("Unable to share. Please copy the URL manually.");
        }
      }
    }
  };

  const handleSignUpToApply = async () => {
    // Track external apply click (anonymous - no talent_id)
    if (id) {
      try {
        await supabase.rpc("track_job_apply_click", {
          p_job_id: id,
          p_talent_id: null,
          p_source: "public_page",
        });
      } catch (err) {
        console.error("Failed to track apply click", err);
      }
    }
    navigate(`/auth?returnTo=/app/jobs/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2 mb-6" />
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (loadError || !job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {loadError || "This job may have been removed or is no longer available."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadJob} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => navigate("/auth?returnTo=/app/jobs")}>Browse Jobs</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayDescription = job.ai_enhanced_description || job.description;
  const isDeadlinePassed = job.deadline && new Date(job.deadline) < new Date();

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-primary">
            CareerPath
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth?returnTo=/app/jobs">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Company & Title */}
        <div className="flex gap-4 items-start mb-6">
          {job.company_logo_url ? (
            <img
              src={job.company_logo_url}
              alt={job.company_name}
              className="w-16 h-16 rounded-xl object-cover bg-muted"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {job.is_featured && (
                <Badge className="gap-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                  <Star className="w-3 h-3 fill-current" /> Featured
                </Badge>
              )}
              {isDeadlinePassed && <Badge variant="destructive">Deadline Passed</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
            <p className="text-lg text-muted-foreground">{job.company_name}</p>
          </div>

          <Button variant="outline" size="icon" onClick={handleShare} className="shrink-0">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            {JOB_TYPES[job.job_type] || job.job_type}
          </Badge>
          <Badge variant="secondary">{EXPERIENCE_LEVELS[job.experience_level] || job.experience_level}</Badge>
          {job.location && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </Badge>
          )}
          {formatSalary(job.salary_range_min, job.salary_range_max) && (
            <Badge variant="outline" className="gap-1">
              <DollarSign className="w-3 h-3" />
              {formatSalary(job.salary_range_min, job.salary_range_max)}
            </Badge>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button size="lg" className="flex-1" onClick={handleSignUpToApply} disabled={isDeadlinePassed}>
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up to Apply
          </Button>
          <Button size="lg" variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-center">
              <span className="font-medium">Create a free account</span> to apply for this job and access all career
              services including CV review, mock interviews, and more.
            </p>
          </CardContent>
        </Card>

        {/* Source Image */}
        {job.source_image_url && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold mb-3">Original Job Post</h2>
              <img src={job.source_image_url} alt="Original job post" className="w-full rounded-lg border" />
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-3">Job Description</h2>
            {/<[a-z][\s\S]*>/i.test(displayDescription || "") ? (
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: displayDescription || "" }} />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{displayDescription}</div>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        {Array.isArray(job.requirements) && job.requirements.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-3">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Details */}
        <Card className="mb-8">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-3">Job Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{JOB_TYPES[job.job_type] || job.job_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span>{EXPERIENCE_LEVELS[job.experience_level] || job.experience_level}</span>
              </div>
              {job.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Deadline: {format(new Date(job.deadline), "MMM d, yyyy")}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Posted: {format(new Date(job.created_at), "MMM d, yyyy")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Jobs */}
        <RelatedJobs
          currentJobId={job.id}
          companyName={job.company_name}
          location={job.location}
          linkPrefix="/jobs"
        />

        {/* Bottom CTA */}
        <div className="text-center mt-8">
          <Button size="lg" onClick={handleSignUpToApply} disabled={isDeadlinePassed}>
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up to Apply
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Already have an account?{" "}
            <Link to={`/auth?returnTo=/app/jobs/${id}`} className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
