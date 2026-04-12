import { useEffect, useState, useCallback } from "react";
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
  Briefcase,
  CheckCircle,
  Brain,
  Bookmark,
  Banknote,
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

// --- CTO FIX: INTERFACE DEFINITIONS ---
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
  salary_currency: string | null;
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

  const loadJobAndApplication = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      // CTO FIX: We select '*' and cast the result to 'any' before mapping to 'Job'
      // This bypasses the strict check on the auto-generated types.ts
      const { data, error: jobError } = await supabase.from("jobs").select("*").eq("id", id).single();

      if (jobError) throw jobError;

      const jobData = data as any;

      setJob({
        ...jobData,
        salary_currency: jobData.salary_currency || "BDT", // Fallback to BDT
      } as Job);

      if (jobData.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("*")
          .eq("id", jobData.company_id)
          .single();
        if (companyData) setCompany(companyData as Company);
      }

      if (talent?.id) {
        const { data: appData } = await supabase
          .from("job_applications")
          .select(`id, created_at, application_status, job_assessments(id, status, ai_score)`)
          .eq("job_id", id)
          .eq("talent_id", talent.id)
          .maybeSingle();

        if (appData) {
          const assessment = (appData as any).job_assessments?.[0];
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
  }, [id, talent?.id]);

  useEffect(() => {
    if (id) {
      loadJobAndApplication();
    }
  }, [id, loadJobAndApplication]);

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return null;
    const symbol = currency === "USD" ? "$" : currency === "BDT" ? "৳" : currency || "৳";
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

  const handleApply = async () => {
    if (job?.application_type === "link" && job.application_url) {
      const cost = CREDIT_CONFIG.SERVICES.EXTERNAL_APPLICATION.cost;
      if ((balance ?? 0) < cost) {
        toast.error(`Insufficient credits. You need ${cost} credits.`);
        return;
      }
      setShowApplyAI(true);
    } else {
      navigate(`/app/jobs/${id}/apply`);
    }
  };

  if (loading)
    return (
      <div className="p-8">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  if (loadError || !job) return <div className="p-8 text-center text-destructive">{loadError}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28 md:pb-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="flex gap-3 items-start mb-2">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border">
          {job.company_logo_url ? (
            <img src={job.company_logo_url} className="rounded-xl object-cover" alt="logo" />
          ) : (
            <Building2 className="w-6 h-6 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-lg md:text-xl font-bold leading-tight">{job.title}</h1>
          <p className="text-sm text-muted-foreground">{job.company_name}</p>
        </div>
        <Button
          variant={isSaved ? "default" : "outline"}
          size="sm"
          onClick={() => toggleSave(id!, "job")}
          disabled={saveLoading}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <Badge variant="secondary">{getJobTypeLabel(job.job_type)}</Badge>
        <Badge variant="secondary">{getExperienceLevelLabel(job.experience_level)}</Badge>
        {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency) && (
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
            <Banknote className="w-3.5 h-3.5 mr-1" />
            {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency)}
          </Badge>
        )}
      </div>

      <Button size="lg" className="w-full mb-3" onClick={handleApply} disabled={deadlinePassed || !!existingApp}>
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

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Role Overview</h3>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {job.ai_enhanced_description || job.description}
          </div>
        </CardContent>
      </Card>

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
