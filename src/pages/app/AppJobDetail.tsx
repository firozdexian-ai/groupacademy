import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  Briefcase,
  Star,
  Share2,
  AlertCircle,
  CheckCircle,
  Brain,
  ArrowRight,
  Bookmark,
  Globe,
  Linkedin,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AIJobInsights } from "@/components/jobs/AIJobInsights";
import { ExternalApplicationPrep } from "@/components/jobs/ExternalApplicationPrep";
import { useCredits } from "@/hooks/useCredits";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { RelatedJobs } from "@/components/jobs/RelatedJobs";
import { getJobTypeLabel, getExperienceLevelLabel, isDeadlineUrgent, isDeadlinePassed } from "@/lib/constants/jobTypes";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  company_id: string | null;
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
  ai_assessment_enabled: boolean;
}

interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  linkedin_url: string | null;
  address: string | null;
  logo_url: string | null;
  is_verified: boolean | null;
}

interface ExistingApplication {
  id: string;
  created_at: string;
  application_status: string;
  assessment_id?: string;
  assessment_status?: string;
  assessment_score?: number | null;
}

export default function AppJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { talent } = useTalent();

  // FIX 1: Use the hook correctly for checking state AND toggling
  const { isSaved: checkIsSaved, toggleSave, isLoading: saveLoading } = useSavedItems();

  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showApplyAI, setShowApplyAI] = useState(false);
  const { balance } = useCredits();

  // FIX 2: Ensure ID exists before checking save status
  const isSaved = id ? checkIsSaved(id, "job") : false;

  const showUrgency = job?.deadline ? isDeadlineUrgent(job.deadline) : false;
  const deadlinePassed = job?.deadline ? isDeadlinePassed(job.deadline) : false;

  useEffect(() => {
    if (id) {
      trackSource();
      trackRefClick();
      loadJobAndApplication();
    }
  }, [id, talent?.id]);

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
        const remaining = newParams.toString();
        window.history.replaceState({}, "", window.location.pathname + (remaining ? `?${remaining}` : ""));
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

  const loadJobAndApplication = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      if (jobData.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("id, name, industry, website, linkedin_url, address, logo_url, is_verified")
          .eq("id", jobData.company_id)
          .single();

        if (companyData) setCompany(companyData);
      }

      if (talent?.id) {
        const { data: appData } = await supabase
          .from("job_applications")
          .select(
            `
            id, created_at, application_status,
            job_assessments(id, status, ai_score)
          `,
          )
          .eq("job_id", id)
          .eq("talent_id", talent.id)
          .maybeSingle();

        if (appData) {
          const assessment = appData.job_assessments?.[0];
          setExistingApp({
            id: appData.id,
            created_at: appData.created_at || new Date().toISOString(),
            application_status: appData.application_status || "submitted",
            assessment_id: assessment?.id,
            assessment_status: assessment?.status,
            assessment_score: assessment?.ai_score,
          });
        }
      }
    } catch (error: any) {
      console.error("Error loading job:", error);
      setLoadError("Failed to load job details.");
    } finally {
      setLoading(false);
    }
  };

  // FIX 3: Simplified save handler using hook
  const handleSaveToggle = async () => {
    if (!id) return;
    if (!talent) {
      toast.error("Please login to save jobs");
      return;
    }
    await toggleSave(id, "job");
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return null;
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/jobs/${id}`;
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
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Could not copy link.");
      }
    }
  };

  const handleApply = async () => {
    if (job?.application_type === "link" && job.application_url) {
      // Track external apply click
      try {
        await supabase.rpc("track_job_apply_click", {
          p_job_id: job.id,
          p_talent_id: talent?.id || null,
          p_source: "internal_app",
        });
      } catch (err) {
        console.error("Failed to track apply click", err);
      }

      // Check credits before opening AI dialog
      const cost = CREDIT_CONFIG.SERVICES.EXTERNAL_APPLICATION.cost;
      if ((balance ?? 0) < cost) {
        toast.error(`You need ${cost} credits for AI Application Assistant. Your balance: ${balance ?? 0}`);
        return;
      }

      setShowApplyAI(true);
    } else {
      navigate(`/app/jobs/${id}/apply`);
    }
  };

  const renderActionButton = () => {
    if (deadlinePassed) {
      return (
        <Button size="lg" className="w-full mb-3" disabled>
          Application Closed
        </Button>
      );
    }

    if (existingApp) {
      if (job?.ai_assessment_enabled && existingApp.assessment_status === "pending" && existingApp.assessment_id) {
        return (
          <div className="mb-3 space-y-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Assessment Incomplete</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You have applied, but your AI assessment is pending.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => navigate(`/app/job-assessment/${existingApp.assessment_id}`)}
            >
              <Brain className="w-4 h-4 mr-2" />
              Complete Assessment
            </Button>
          </div>
        );
      }

      if (job?.ai_assessment_enabled && existingApp.assessment_status === "completed") {
        return (
          <div className="mb-3 space-y-2">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Application Complete</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Applied on {format(new Date(existingApp.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/app/job-assessment/${existingApp.assessment_id}/results`)}
            >
              View Results <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );
      }

      return (
        <div className="mb-3">
          <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled>
            <CheckCircle className="w-4 h-4 mr-2" />
            Applied on {format(new Date(existingApp.created_at), "MMM d, yyyy")}
          </Button>
        </div>
      );
    }

    return (
      <Button
        size="lg"
        className="w-full mb-3 text-base h-12 shadow-lg hover:shadow-xl transition-all"
        onClick={handleApply}
      >
        {job?.application_type === "link" ? (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Apply with AI
            <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5">50 credits</Badge>
          </>
        ) : (
          "Apply Now"
        )}
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-24" />
        <div className="flex gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (loadError || !job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Job Unavailable</h2>
            <p className="text-muted-foreground mb-4">{loadError || "This job post may have been removed."}</p>
            <Button variant="outline" onClick={() => navigate("/app/jobs")}>
              Browse Other Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayDescription = job.ai_enhanced_description || job.description;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28 md:pb-4">
      {/* Navigation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Header Section */}
      <div className="flex gap-3 items-start mb-2">
        <div className="shrink-0">
          {job.company_logo_url ? (
            <img
              src={job.company_logo_url}
              alt={job.company_name}
              className="w-12 h-12 rounded-xl object-cover border bg-white"
            />
          ) : company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-12 h-12 rounded-xl object-cover border bg-white"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {job.is_featured && (
              <Badge className="gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 px-2 py-0.5 h-5 text-[10px]">
                <Star className="w-3 h-3 fill-current" /> Featured
              </Badge>
            )}
            {deadlinePassed && (
              <Badge variant="destructive" className="h-5 text-[10px]">
                Closed
              </Badge>
            )}
            {showUrgency && !deadlinePassed && (
              <Badge variant="destructive" className="gap-1 h-5 text-[10px]">
                <AlertTriangle className="w-3 h-3" /> Closing Soon
              </Badge>
            )}
            {job.ai_assessment_enabled && (
              <Badge
                variant="secondary"
                className="gap-1 bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 h-5 text-[10px]"
              >
                <Brain className="w-3 h-3" /> AI Assessment
              </Badge>
            )}
          </div>
          <h1 className="text-lg md:text-xl font-bold leading-tight mb-0.5">{job.title}</h1>
          <p className="text-sm text-muted-foreground font-medium">{job.company_name}</p>
        </div>

        {/* FIX 4: Use handleSaveToggle which uses hook logic */}
        <Button
          variant={isSaved ? "default" : "outline"}
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={handleSaveToggle}
          disabled={saveLoading}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
          {isSaved ? "Saved" : "Save"}
        </Button>
      </div>

      {/* Info Badges */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <Badge variant="secondary" className="gap-1 py-1 px-2 text-xs">
          <Clock className="w-3.5 h-3.5 opacity-70" />
          {getJobTypeLabel(job.job_type)}
        </Badge>
        <Badge variant="secondary" className="gap-1 py-1 px-2 text-xs">
          <Briefcase className="w-3.5 h-3.5 opacity-70" />
          {getExperienceLevelLabel(job.experience_level)}
        </Badge>
        {job.location && (
          <Badge variant="secondary" className="gap-1 py-1 px-2 text-xs">
            <MapPin className="w-3.5 h-3.5 opacity-70" />
            {job.location}
          </Badge>
        )}
        {formatSalary(job.salary_range_min, job.salary_range_max) && (
          <Badge variant="outline" className="gap-1 py-1 px-2 text-xs border-primary/20 bg-primary/5 text-primary">
            <DollarSign className="w-3.5 h-3.5" />
            {formatSalary(job.salary_range_min, job.salary_range_max)}
          </Badge>
        )}
      </div>

      {/* AI Insights Section */}
      {talent?.id && !existingApp && !deadlinePassed && (
        <div className="mb-3">
          <AIJobInsights jobId={job.id} talentId={talent.id} />
        </div>
      )}

      {/* Action Area */}
      {renderActionButton()}

      {/* Share Button */}
      <div className="flex justify-end mb-2">
        <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-2">
        {/* Description */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-base font-semibold mb-2">About the Role</h3>
            {/<[a-z][\s\S]*>/i.test(displayDescription || "") ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: displayDescription || "" }} />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                {displayDescription}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        {Array.isArray(job.requirements) && job.requirements.length > 0 && (
          <Card>
          <CardContent className="p-4">
              <h3 className="text-base font-semibold mb-2">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* About the Company */}
        {company && (
          <Card>
          <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                {company.logo_url && (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-10 h-10 rounded-lg object-cover border bg-white"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    About {company.name}
                    {company.is_verified && (
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] h-5"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </h3>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {company.industry && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry</span>
                    <span className="font-medium">{company.industry}</span>
                  </div>
                )}
                {company.address && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{company.address}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {company.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-1.5" />
                        Website
                      </a>
                    </Button>
                  )}
                  {company.linkedin_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4 mr-1.5" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Overview */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-base font-semibold mb-2">Job Overview</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Date Posted</p>
                <p className="font-medium">{format(new Date(job.created_at), "MMM d, yyyy")}</p>
              </div>
              {job.deadline && (
                <div>
                  <p className="text-muted-foreground mb-1">Deadline</p>
                  <p
                    className={`font-medium ${deadlinePassed ? "text-destructive" : showUrgency ? "text-amber-600" : ""}`}
                  >
                    {format(new Date(job.deadline), "MMM d, yyyy")}
                    {showUrgency && !deadlinePassed && " (Soon!)"}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1">Job Type</p>
                <p className="font-medium">{getJobTypeLabel(job.job_type)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Experience</p>
                <p className="font-medium">{getExperienceLevelLabel(job.experience_level)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Original Source Image */}
        {job.source_image_url && (
          <Card className="overflow-hidden">
            <div className="p-3 border-b bg-muted/30">
              <h3 className="text-sm font-medium">Original Job Post</h3>
            </div>
            <img src={job.source_image_url} alt="Original job post" className="w-full h-auto" />
          </Card>
        )}

        {/* Related Jobs */}
        <RelatedJobs
          currentJobId={job.id}
          companyName={job.company_name}
          location={job.location}
          linkPrefix="/app/jobs"
        />
      </div>

      {/* Sticky Bottom CTA Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 backdrop-blur-sm border-t p-3 flex gap-2 z-40">
        <Button
          variant="outline"
          size="lg"
          className="shrink-0 gap-2"
          onClick={handleSaveToggle}
          disabled={saveLoading}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current text-primary" : ""}`} />
          {isSaved ? "Saved" : "Save"}
        </Button>
        {deadlinePassed ? (
          <Button size="lg" className="flex-1" disabled>
            Closed
          </Button>
        ) : existingApp ? (
          <Button size="lg" className="flex-1 bg-green-600" disabled>
            <CheckCircle className="w-4 h-4 mr-2" />
            Applied
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={handleApply}>
            {job?.application_type === "link" ? (
              <><Sparkles className="w-4 h-4 mr-2" /> Apply with AI</>
            ) : (
              "Apply Now"
            )}
          </Button>
        )}
      </div>

      {/* Apply with AI Dialog */}
      {job?.application_type === "link" && job.application_url && (
        <ExternalApplicationPrep
          open={showApplyAI}
          onOpenChange={setShowApplyAI}
          jobId={job.id}
          applicationUrl={job.application_url}
          jobTitle={job.title}
          companyName={job.company_name}
        />
      )}
    </div>
  );
}
