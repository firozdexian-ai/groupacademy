import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Building2, MapPin, Clock, DollarSign, Calendar, 
  ExternalLink, Briefcase, Star, Share2, RefreshCw, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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
  application_type: string;
  application_email: string | null;
  application_url: string | null;
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

export default function AppJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadJob();
  }, [id]);

  const loadJob = async () => {
    setLoading(true);
    setLoadError(null);
    
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `${job?.title} at ${job?.company_name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  const handleApply = () => {
    if (job?.application_type === "link" && job.application_url) {
      window.open(job.application_url, "_blank");
    } else {
      navigate(`/jobs/${id}/apply`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (loadError || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to Load Job</h2>
            <p className="text-muted-foreground mb-4">{loadError || "Job not found"}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadJob}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/app/jobs")}>
                Back to Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayDescription = job.ai_enhanced_description || job.description;
  const isDeadlinePassed = job.deadline && new Date(job.deadline) < new Date();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate("/app/jobs")}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="flex gap-4 items-start mb-6">
        {job.company_logo_url ? (
          <img 
            src={job.company_logo_url} 
            alt={job.company_name}
            className="w-16 h-16 rounded-xl object-cover bg-muted"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {job.is_featured && (
              <Badge className="gap-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                <Star className="w-3 h-3 fill-current" /> Featured
              </Badge>
            )}
            {isDeadlinePassed && (
              <Badge variant="destructive">Deadline Passed</Badge>
            )}
          </div>
          <h1 className="text-xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">{job.company_name}</p>
        </div>

        <Button variant="outline" size="icon" onClick={handleShare}>
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="outline" className="gap-1">
          <Clock className="w-3 h-3" />
          {JOB_TYPES[job.job_type] || job.job_type}
        </Badge>
        <Badge variant="secondary">
          {EXPERIENCE_LEVELS[job.experience_level] || job.experience_level}
        </Badge>
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

      {/* Apply Button */}
      <Button 
        size="lg" 
        className="w-full mb-6"
        onClick={handleApply}
        disabled={isDeadlinePassed}
      >
        {job.application_type === "link" ? (
          <>Apply Now <ExternalLink className="w-4 h-4 ml-2" /></>
        ) : (
          "Apply Now"
        )}
      </Button>

      {/* Source Image */}
      {job.source_image_url && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">Original Job Post</h2>
            <img 
              src={job.source_image_url} 
              alt="Original job post" 
              className="w-full rounded-lg border"
            />
          </CardContent>
        </Card>
      )}

      {/* Description */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-3">Job Description</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
            {displayDescription}
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      {Array.isArray(job.requirements) && job.requirements.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">Requirements</h2>
            <ul className="space-y-2">
              {job.requirements.map((req: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Job Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
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
    </div>
  );
}
