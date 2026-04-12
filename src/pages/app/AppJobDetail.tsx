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
  Banknote,
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
  salary_currency: string | null; // CTO FIX: Added currency support
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

// ... (Existing Company and ExistingApplication interfaces)

export default function AppJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { talent } = useTalent();
  const { isSaved: checkIsSaved, toggleSave, isLoading: saveLoading } = useSavedItems();

  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showApplyAI, setShowApplyAI] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { balance } = useCredits();

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

  // ... (trackSource and trackRefClick logic remains the same)

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
          .select("*")
          .eq("id", jobData.company_id)
          .single();
        if (companyData) setCompany(companyData);
      }

      if (talent?.id) {
        const { data: appData } = await supabase
          .from("job_applications")
          .select(`id, created_at, application_status, job_assessments(id, status, ai_score)`)
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
      setLoadError("Job details could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  // CTO FIX: Currency-Aware Salary Formatter
  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return null;
    const symbol = currency === "USD" ? "$" : currency === "BDT" ? "৳" : currency || "";
    const isPrefix = currency === "USD";

    const formatNum = (num: number) => {
      if (num >= 1000) return (num / 1000).toFixed(0) + "k";
      return num.toLocaleString();
    };

    if (min && max)
      return isPrefix
        ? `${symbol}${formatNum(min)} - ${symbol}${formatNum(max)}`
        : `${formatNum(min)} - ${formatNum(max)} ${symbol}`;
    if (min) return isPrefix ? `${symbol}${formatNum(min)}+` : `${formatNum(min)}+ ${symbol}`;
    if (max) return isPrefix ? `Up to ${symbol}${formatNum(max)}` : `Up to ${formatNum(max)} ${symbol}`;
    return null;
  };

  const handleSaveToggle = async () => {
    if (!id) return;
    if (!talent) {
      toast.error("Please login to save jobs");
      return;
    }
    await toggleSave(id, "job");
  };

  const handleApply = async () => {
    if (job?.application_type === "link" && job.application_url) {
      const cost = CREDIT_CONFIG.SERVICES.EXTERNAL_APPLICATION.cost;
      if ((balance ?? 0) < cost) {
        toast.error(`Insufficient credits. This service requires ${cost} credits.`);
        return;
      }
      setShowApplyAI(true);
    } else {
      navigate(`/app/jobs/${id}/apply`);
    }
  };

  // ... (renderActionButton and Loading/Error States remain same)

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28 md:pb-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="flex gap-3 items-start mb-2">
        <div className="shrink-0">
          {(job.company_logo_url || company?.logo_url) && !logoError ? (
            <img
              src={job.company_logo_url || company?.logo_url || ""}
              alt={job.company_name}
              className="w-12 h-12 rounded-xl object-cover border bg-white"
              onError={() => setLogoError(true)}
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
              <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 h-5 text-[10px]">
                <Star className="w-3 h-3 fill-current" /> Featured
              </Badge>
            )}
            {job.ai_assessment_enabled && (
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 h-5 text-[10px]">
                <Brain className="w-3 h-3 mr-1" /> AI Assessment
              </Badge>
            )}
          </div>
          <h1 className="text-lg md:text-xl font-bold leading-tight">{job.title}</h1>
          <p className="text-sm text-muted-foreground font-medium">{job.company_name}</p>
        </div>

        <Button
          variant={isSaved ? "default" : "outline"}
          size="sm"
          className="shrink-0"
          onClick={handleSaveToggle}
          disabled={saveLoading}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
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
        {/* CTO FIX: Applied currency-aware formatter */}
        {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency) && (
          <Badge variant="outline" className="gap-1 py-1 px-2 text-xs border-primary/20 bg-primary/5 text-primary">
            <Banknote className="w-3.5 h-3.5" />
            {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency)}
          </Badge>
        )}
      </div>

      {talent?.id && !existingApp && !deadlinePassed && (
        <div className="mb-3">
          <AIJobInsights jobId={job.id} talentId={talent.id} />
        </div>
      )}

      {renderActionButton()}

      <div className="space-y-4 mt-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-base font-semibold mb-2">Job Description</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
              {job.ai_enhanced_description || job.description}
            </div>
          </CardContent>
        </Card>

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

        <RelatedJobs
          currentJobId={job.id}
          companyName={job.company_name}
          location={job.location}
          linkPrefix="/app/jobs"
        />
      </div>

      {/* Sticky Bottom Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 backdrop-blur-sm border-t p-3 flex gap-2 z-40">
        <Button variant="outline" size="lg" className="shrink-0" onClick={handleSaveToggle} disabled={saveLoading}>
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current text-primary" : ""}`} />
        </Button>
        <Button size="lg" className="flex-1 h-12" onClick={handleApply} disabled={deadlinePassed || !!existingApp}>
          {deadlinePassed ? (
            "Closed"
          ) : existingApp ? (
            "Applied"
          ) : job?.application_type === "link" ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" /> Apply with AI
            </>
          ) : (
            "Apply Now"
          )}
        </Button>
      </div>

      {showApplyAI && job.application_url && (
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
