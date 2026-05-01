import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  FileText,
  Loader2,
  Sparkles,
  Brain,
  ArrowRight,
  UploadCloud,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Job Application Connection
 * Orchestrates secure CV transmission and real-time AI interview synthesis.
 * 2026 Standard: Executive Logic geometry with reinforced transaction guards.
 */

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  application_email: string | null;
  ai_assessment_enabled: boolean | null;
}

const SUBMISSION_STAGES = [
  { progress: 20, message: "Syncing..." },
  { progress: 40, message: "Hardening CV Node..." },
  { progress: 60, message: "Generating interview..." },
  { progress: 85, message: "Finalizing..." },
];

export default function AppJobApplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { talent, refreshTalent } = useTalent();
  const { balance, canAfford, deductCredits, getServiceCost, refreshBalance } = useCredits();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [generatedAssessmentId, setGeneratedAssessmentId] = useState<string | null>(null);
  const [isUploadingCV, setIsUploadingCV] = useState(false);

  const isSubmittingRef = useRef(false);
  const applicationCost = getServiceCost("JOB_APPLICATION");
  const hasEnoughCredits = canAfford("JOB_APPLICATION");

  useEffect(() => {
    if (id) fetchJobAndCheckStatus();
  }, [id, talent?.id]);

  const fetchJobAndCheckStatus = async () => {
    try {
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("id, title, company_name, company_logo_url, application_email, ai_assessment_enabled")
        .eq("id", id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      if (talent?.id) {
        const { data: existingApp } = await supabase
          .from("job_applications")
          .select(`id, job_assessments(id)`)
          .eq("job_id", id)
          .eq("talent_id", talent.id)
          .maybeSingle();

        if (existingApp) {
          setSubmitted(true);
          const assessment = (existingApp as any).job_assessments?.[0];
          if (assessment?.id) setGeneratedAssessmentId(assessment.id);
        }
      }
    } catch (error) {
      console.error("Diagnostic Failure:", error);
      toast.error("Failed to load registry entry.");
    } finally {
      setLoading(false);
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !talent) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB limit.");
      return;
    }

    setIsUploadingCV(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${talent.id}/${Date.now()}-cv.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("talent-cvs").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: signedData, error: urlError } = await supabase.storage
        .from("talent-cvs")
        .createSignedUrl(filePath, 31536000);

      if (urlError) throw urlError;

      const { error: updateError } = await supabase
        .from("talents")
        .update({ cv_url: signedData.signedUrl })
        .eq("id", talent.id);

      if (updateError) throw updateError;

      await refreshTalent();
      toast.success("CV Node Secured.");
    } catch (error) {
      toast.error("CV upload failed.");
    } finally {
      setIsUploadingCV(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!talent || !job) return;
    setIsGeneratingCoverLetter(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-cover-letter", {
        body: {
          coverLetter:
            coverLetter || `I am writing to express my interest in the ${job.title} position at ${job.company_name}.`,
          jobTitle: job.title,
          companyName: job.company_name,
          candidateName: talent.fullName,
          skills: talent.skills,
        },
      });
      if (error) throw error;
      if (data?.enhancedCoverLetter) {
        setCoverLetter(data.enhancedCoverLetter);
        toast.success("Cover letter generated.");
      }
    } catch (error: any) {
      toast.error("AI service is busy. Please try again.");
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleSubmit = async () => {
    if (!talent || !job || isSubmittingRef.current) return;

    if (!hasEnoughCredits) {
      setShowPurchaseSheet(true);
      return;
    }

    if (!talent.cvUrl) {
      toast.error("No CV on file.");
      document.getElementById("cv-upload-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    setSubmissionProgress(20);
    setSubmissionMessage(SUBMISSION_STAGES[0].message);

    try {
      const { data: appData, error: appError } = await supabase
        .from("job_applications")
        .insert({
          job_id: job.id,
          talent_id: talent.id,
          cover_letter: coverLetter,
          cv_url: talent.cvUrl,
          delivery_status: "pending",
        })
        .select("id")
        .single();

      if (appError) throw appError;

      await deductCredits("JOB_APPLICATION", job.id, `Application: ${job.title}`);

      setSubmissionProgress(40);
      setSubmissionMessage("Broadcasting to Employer...");
      await supabase.functions.invoke("send-job-application", {
        body: { applicationId: appData.id },
      });

      if (job.ai_assessment_enabled) {
        setSubmissionProgress(65);
        setSubmissionMessage("Generating interview...");

        const { data: assessmentData, error: assessmentError } = await supabase.functions.invoke(
          "generate-job-assessment",
          { body: { jobId: job.id, talentId: talent.id, jobApplicationId: appData.id } },
        );

        if (!assessmentError && assessmentData?.assessmentId) {
          setGeneratedAssessmentId(assessmentData.assessmentId);
        }
      }

      setSubmissionProgress(100);
      setSubmitted(true);
      toast.success("Saved.");
      refreshBalance();
    } catch (error: any) {
      toast.error("Connection interrupted. Please retry.");
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (loading)
    return (
      <div className="max-w-2xl mx-auto p-12 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4 opacity-20" />
        <Skeleton className="h-80 w-full rounded-[32px] bg-muted/40" />
      </div>
    );

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 animate-in fade-in zoom-in-95 duration-700">
        <Card className="text-center py-16 bg-card/30 backdrop-blur-xl border-emerald-500/20 shadow-2xl rounded-[48px]">
          <CardContent className="space-y-8">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mx-auto border border-emerald-500/20 rotate-3">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Connection Finalized</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
                Application for {job?.title} active in registry.
              </p>
            </div>

            <div className="flex flex-col gap-4 max-w-sm mx-auto pt-6">
              {generatedAssessmentId && (
                <Button
                  size="lg"
                  className="rounded-[20px] h-14 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/30 animate-pulse"
                  onClick={() => navigate(`/app/job-assessment/${generatedAssessmentId}`)}
                >
                  <Brain className="mr-3 h-5 w-5" /> Initialize AI Interview
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="rounded-[20px] h-14 font-black uppercase tracking-widest text-[11px] border-2"
                onClick={() => navigate("/app/applications")}
              >
                View Applications List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 min-h-svh space-y-10">
      <div className="pb-40 space-y-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-11 w-11 hover:bg-primary/5"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Submit Protocol</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
                List: Standard Application
              </p>
            </div>
          </div>
          <Badge className="bg-primary/5 text-primary border-primary/20 rounded-lg px-3 py-1 font-black text-[9px] uppercase tracking-widest">
            Connection Node
          </Badge>
        </header>

        <Card className="rounded-[32px] border-2 border-primary/10 bg-card/30 backdrop-blur-xl overflow-hidden shadow-2xl">
          <CardContent className="p-8 flex gap-6 items-center">
            <div className="w-20 h-20 rounded-[24px] bg-primary/5 flex items-center justify-center border-2 border-border/40 shrink-0 overflow-hidden shadow-inner">
              {job?.company_logo_url ? (
                <img src={job.company_logo_url} className="object-cover w-full h-full" alt="logo" />
              ) : (
                <Building2 className="text-primary w-8 h-8" />
              )}
            </div>
            <div className="space-y-1">
              <h2 className="font-black text-2xl uppercase tracking-tighter leading-none">{job?.title}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                {job?.company_name}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CV List Section */}
        <Card
          id="cv-upload-section"
          className={cn(
            "rounded-[32px] transition-all duration-500 overflow-hidden",
            !talent?.cvUrl ? "border-primary/40 bg-primary/[0.03] shadow-2xl shadow-primary/5" : "border-border/40",
          )}
        >
          <CardHeader className="border-b bg-muted/20 px-8 py-5 flex flex-row items-center justify-between">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-primary" /> Professional List Node (CV)
            </CardTitle>
            {talent?.cvUrl && (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-black uppercase">
                Verified
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-8">
            {talent?.cvUrl ? (
              <div className="flex items-center justify-between p-5 border-2 border-dashed rounded-2xl bg-background/50 group hover:border-primary/40 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary font-black text-[10px] border shadow-inner">
                    PDF
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-sm font-black uppercase tracking-tight italic">Active_Resume_Node.pdf</span>
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                      Signed & Secure
                    </p>
                  </div>
                </div>
                <Label
                  htmlFor="cv-up"
                  className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Replace
                </Label>
                <input id="cv-up" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleCVUpload} />
              </div>
            ) : (
              <div className="flex flex-col items-center p-12 border-2 border-dashed rounded-[24px] bg-muted/10 group hover:bg-primary/[0.02] transition-all">
                {isUploadingCV ? (
                  <Loader2 className="animate-spin text-primary mb-4 h-8 w-8" />
                ) : (
                  <UploadCloud className="text-muted-foreground/30 mb-5 w-12 h-12 transition-transform group-hover:scale-110" />
                )}
                <h3 className="text-sm font-black uppercase tracking-widest mb-2">Upload CV Artifact</h3>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em] mb-6 italic">
                  Secure Upload • 5MB Limit
                </p>
                <Label
                  htmlFor="cv-new"
                  className="cursor-pointer bg-primary text-primary-foreground h-12 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Zap className="mr-2 h-4 w-4" /> Select File
                </Label>
                <input id="cv-new" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleCVUpload} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Narrative Engine (Cover Letter) */}
        <Card className="rounded-[32px] border-border/40 overflow-hidden shadow-lg">
          <CardHeader className="bg-muted/20 px-8 py-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-primary" /> Narrative Synthesis
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateCoverLetter}
              disabled={isGeneratingCoverLetter || !talent?.cvUrl}
              className="h-9 px-4 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest gap-2 bg-background hover:bg-primary/5"
            >
              {isGeneratingCoverLetter ? (
                <Loader2 className="animate-spin h-3.5 w-3.5" />
              ) : (
                <Zap className="h-3.5 w-3.5 text-primary" />
              )}
              Generate with AI
            </Button>
          </CardHeader>
          <CardContent className="p-8">
            <Textarea
              placeholder="Tell the hiring team about your background and motivation..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="min-h-[240px] resize-none rounded-2xl bg-muted/10 border-border/40 focus-visible:ring-primary/10 p-6 leading-relaxed italic text-sm font-medium"
            />
          </CardContent>
        </Card>
      </div>

      {/* Global Control Terminal */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-background/80 backdrop-blur-2xl border-t-2 border-border/10 z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-700 delay-300">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex justify-between items-end px-2">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                Estimated Cost
              </p>
              <p className="text-sm font-black uppercase tracking-tighter italic">{applicationCost} Neural Credits</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                Active Balance
              </p>
              <p
                className={cn(
                  "text-sm font-black uppercase tracking-tighter italic",
                  !hasEnoughCredits ? "text-destructive animate-pulse" : "text-primary",
                )}
              >
                {balance} Credits Available
              </p>
            </div>
          </div>

          {submitting ? (
            <div className="space-y-4 p-6 bg-primary/5 rounded-[24px] border border-primary/20 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
                  <Brain className="h-4 w-4 animate-pulse" /> {submissionMessage}
                </div>
                <span className="text-[10px] font-mono font-black text-primary">{submissionProgress}%</span>
              </div>
              <Progress value={submissionProgress} className="h-1.5 rounded-full" />
            </div>
          ) : (
            <Button
              className="w-full h-16 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden"
              onClick={handleSubmit}
              disabled={isUploadingCV}
            >
              <span className="relative z-10 flex items-center">
                {hasEnoughCredits ? "Confirm" : "Top-up Credits"}
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-2" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
          )}
        </div>
      </div>

      <CreditPurchaseSheet
        isOpen={showPurchaseSheet}
        onClose={() => setShowPurchaseSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
