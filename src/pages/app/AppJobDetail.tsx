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

// --- CTO FIX: RESTORED MISSING INTERFACES ---
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

  // --- CTO FIX: DEFINED TRACKING FUNCTIONS ---
  const trackSource = useCallback(async () => {
    const source = searchParams.get("source");
    if (source && id) {
      try {
        await supabase.rpc("track_job_click", {
          p_job_id: id,
          p_source: source,
        });
      } catch (err) {
        console.error("Failed to track job click", err);
      }
    }
  }, [id, searchParams]);

  const trackRefClick = useCallback(async () => {
    const ref = searchParams.get("ref");
    if (ref && id) {
      try {
        await supabase.rpc("track_shared_job_click", {
          p_job_id: id,
          p_ref_code: ref,
        });
      } catch (err) {
        console.error("Failed to track shared job click", err);
      }
    }
  }, [id, searchParams]);

  const loadJobAndApplication = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const { data: jobData, error: jobError } = await supabase.from("jobs").select("*").eq("id", id).single();

      if (jobError) throw jobError;

      // Explicitly handling salary_currency to satisfy TS
      setJob({
        ...jobData,
        salary_currency: jobData.salary_currency || "BDT",
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
      trackSource();
      trackRefClick();
      loadJobAndApplication();
    }
  }, [id, trackSource, trackRefClick, loadJobAndApplication]);

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

  // --- CTO FIX: RESTORED RENDER ACTION BUTTON ---
  const renderActionButton = () => {
    if (deadlinePassed)
      return (
        <Button size="lg" className="w-full mb-3" disabled>
          Closed
        </Button>
      );
    if (existingApp)
      return (
        <Button size="lg" className="w-full mb-3 bg-green-600" disabled>
          <CheckCircle className="mr-2 h-4 w-4" /> Already Applied
        </Button>
      );

    return (
      <Button size="lg" className="w-full mb-3 shadow-lg" onClick={handleApply}>
        {job?.application_type === "link" ? (
          <>
            <Sparkles className="w-4 h-4 mr-2" /> Apply with AI
          </>
        ) : (
          "Apply Now"
        )}
      </Button>
    );
  };

  if (loading)
    return (
      <div className="p-8 text-center">
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
        <div className="shrink-0">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border">
            {job.company_logo_url ? (
              <img src={job.company_logo_url} className="rounded-xl" alt="logo" />
            ) : (
              <Building2 className="w-6 h-6 text-primary" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-lg md:text-xl font-bold">{job.title}</h1>
          <p className="text-sm text-muted-foreground">{job.company_name}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <Badge variant="secondary">{getJobTypeLabel(job.job_type)}</Badge>
        {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency) && (
          <Badge variant="outline" className="text-primary">
            <Banknote className="w-3.5 h-3.5 mr-1" />
            {formatSalary(job.salary_range_min, job.salary_range_max, job.salary_currency)}
          </Badge>
        )}
      </div>

      {renderActionButton()}

      <Card className="mt-4">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Description</h3>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {job.ai_enhanced_description || job.description}
          </div>
        </CardContent>
      </Card>

      {/* Sticky Mobile Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 border-t p-3 flex gap-2">
        <Button size="lg" className="flex-1" onClick={handleApply} disabled={deadlinePassed || !!existingApp}>
          {deadlinePassed ? "Closed" : existingApp ? "Applied" : "Apply Now"}
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
