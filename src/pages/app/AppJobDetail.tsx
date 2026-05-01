import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Briefcase,
  Bookmark,
  Brain,
  ArrowRight,
  ShieldCheck,
  Flame,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AIJobInsights } from "@/components/jobs/AIJobInsights";
import { ExternalApplicationPrep } from "@/components/jobs/ExternalApplicationPrep";
import { useCredits } from "@/hooks/useCredits";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { RelatedJobs } from "@/components/jobs/RelatedJobs";
import { getJobTypeLabel, getExperienceLevelLabel, isDeadlinePassed } from "@/lib/constants/jobTypes";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Job Files
 * High-fidelity role orchestration with neural fit analysis.
 * 2026 Standard: Executive Logic geometry with reinforced CTA hierarchy.
 */

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
  ai_assessment_enabled: boolean;
}

interface ExistingApplication {
  id: string;
  application_status: string;
  assessment_id?: string;
  assessment_status?: string;
}

export default function AppJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { isSaved: checkIsSaved, toggleSave } = useSavedItems();
  const { balance } = useCredits();

  const [job, setJob] = useState<Job | null>(null);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyAI, setShowApplyAI] = useState(false);

  const isSaved = id ? checkIsSaved(id, "job") : false;
  const deadlinePassed = job?.deadline ? isDeadlinePassed(job.deadline) : false;

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: jobData, error: jobError } = await supabase.from("jobs").select("*").eq("id", id).single();
      if (jobError) throw jobError;
      setJob(jobData as Job);

      if (talent?.id) {
        const { data: appData } = await supabase
          .from("job_applications")
          .select(`id, application_status, job_assessments(id, status)`)
          .eq("job_id", id)
          .eq("talent_id", talent.id)
          .maybeSingle();

        if (appData) {
          const assessment = (appData as any).job_assessments?.[0];
          setExistingApp({
            id: appData.id,
            application_status: appData.application_status,
            assessment_id: assessment?.id,
            assessment_status: assessment?.status,
          });
        }
      }
    } catch (error) {
      toast.error("Failed to load registry entry.");
    } finally {
      setLoading(false);
    }
  }, [id, talent?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = () => {
    if (job?.application_type === "link") {
      const cost = CREDIT_CONFIG.SERVICES.EXTERNAL_APPLICATION.cost;
      if ((balance ?? 0) < cost) return toast.error(`Need ${cost} credits.`);
      setShowApplyAI(true);
    } else {
      navigate(`/app/jobs/${id}/apply`);
    }
  };

  if (loading)
    return (
      <div className="max-w-6xl mx-auto p-8 space-y-10 animate-pulse">
        <Skeleton className="h-12 w-48 rounded-full bg-muted/40" />
        <Skeleton className="h-40 w-full rounded-[32px] bg-muted/40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-[600px] rounded-[32px] bg-muted/40" />
          <Skeleton className="h-[400px] rounded-[32px] bg-muted/40" />
        </div>
      </div>
    );

  if (!job)
    return (
      <div className="p-32 text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-20">
        List Entry Not Found.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Structural Connection: Navigation */}
      <header className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="group rounded-xl px-4 h-11 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 transition-all"
        >
          <ArrowLeft className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Career List
        </Button>
      </header>

      {/* Artifact Hero: Role Identity */}
      <div
        className={cn(
          "flex flex-col md:flex-row gap-8 items-start justify-between p-10 rounded-[40px] transition-all",
          "bg-card/30 backdrop-blur-xl border-2 border-border/40 shadow-2xl",
        )}
      >
        <div className="flex gap-6 items-center">
          <div className="w-20 h-20 rounded-[24px] bg-primary/5 flex items-center justify-center border-2 border-border/40 shrink-0 overflow-hidden shadow-inner">
            {job.company_logo_url ? (
              <img src={job.company_logo_url} alt="logo" className="object-cover w-full h-full" />
            ) : (
              <Building2 className="text-primary w-8 h-8" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black uppercase tracking-tighter leading-none italic">{job.title}</h1>
              {job.is_featured && (
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">
                  <Flame className="w-3 h-3 mr-1.5" /> Featured Logic
                </Badge>
              )}
            </div>
            <p className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
              <span className="text-foreground">{job.company_name}</span>
              <span className="h-1 w-1 rounded-full bg-primary/30" />
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {job.location || "Remote"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <Button
            variant={isSaved ? "default" : "outline"}
            className="h-14 w-14 rounded-2xl border-2 transition-all active:scale-90"
            onClick={() => toggleSave(job.id, "job")}
          >
            <Bookmark className={cn("w-5 h-5", isSaved ? "fill-current" : "")} />
          </Button>
          <Button
            size="lg"
            className="flex-1 md:min-w-[200px] h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            onClick={handleApply}
            disabled={deadlinePassed || !!existingApp}
          >
            {deadlinePassed ? "Closed" : existingApp ? "File saved" : "Initialize Application"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content: Neural Analysis & Artifacts */}
        <div className="lg:col-span-2 space-y-12">
          {talent?.id && <AIJobInsights jobId={job.id} talentId={talent.id} />}

          <Card className="rounded-[32px] border-border/40 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/20 px-8 py-6 border-b">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                List Narrative
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-foreground/80 font-medium leading-relaxed italic text-sm selection:bg-primary/10">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {job.ai_enhanced_description || job.description}
              </div>
            </CardContent>
          </Card>

          <RelatedJobs
            currentJobId={job.id}
            companyName={job.company_name}
            location={job.location || "Remote"}
            linkPrefix="/app/jobs"
          />
        </div>

        {/* Sidebar: Operational Parameters */}
        <aside className="space-y-8 sticky top-24">
          {existingApp && job.ai_assessment_enabled && existingApp.assessment_status !== "completed" && (
            <Card className="rounded-[32px] border-2 border-primary/20 bg-primary/5 shadow-2xl animate-in zoom-in-95 duration-1000">
              <CardContent className="p-8 space-y-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-[24px] flex items-center justify-center mx-auto border border-primary/20 rotate-3">
                  <Brain className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-black uppercase tracking-tighter text-lg">AI Interview Required</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-relaxed italic">
                    Initialize the neural assessment to finalize your registry ranking.
                  </p>
                </div>
                <Button
                  className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                  onClick={() => navigate(`/app/job-assessment/${existingApp.assessment_id}`)}
                >
                  Start Assessment <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-[32px] border-border/40 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-muted/20 px-8 py-5 border-b">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
                Operational Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {[
                { icon: Briefcase, label: "Type", value: getJobTypeLabel(job.job_type) },
                { icon: ShieldCheck, label: "Exp Level", value: getExperienceLevelLabel(job.experience_level) },
                {
                  icon: Clock,
                  label: "Deadline",
                  value: job.deadline ? new Date(job.deadline).toLocaleDateString() : "Open Sequence",
                  destructive: deadlinePassed,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest"
                >
                  <span className="flex items-center gap-3 text-muted-foreground/40">
                    <item.icon className="w-4 h-4" /> {item.label}
                  </span>
                  <span className={cn("text-foreground text-right", item.destructive ? "text-destructive italic" : "")}>
                    {item.value}
                  </span>
                </div>
              ))}

              <div className="pt-6 border-t border-border/40">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 italic leading-none">
                    Neural Match Active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
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
