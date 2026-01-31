import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Building2,
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  Coins,
  Sparkles,
  Brain,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { SUPPORT_CONFIG, getExpediteMessage } from "@/lib/constants/support";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { InlineCVUpload } from "@/components/job-application/InlineCVUpload";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  application_email: string | null;
  ai_assessment_enabled: boolean | null;
}

const SUBMISSION_STAGES = [
  { progress: 20, message: "Creating your application..." },
  { progress: 40, message: "Sending to employer..." },
  { progress: 60, message: "Generating AI assessment..." },
  { progress: 80, message: "Preparing interview questions..." },
  { progress: 95, message: "Almost ready..." },
];

export default function AppJobApplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();
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

  // Prevent double submission
  const isSubmittingRef = useRef(false);

  const applicationCost = getServiceCost("JOB_APPLICATION");
  const hasEnoughCredits = canAfford("JOB_APPLICATION");

  useEffect(() => {
    if (id) fetchJobAndCheckStatus();
  }, [id, talent?.id]);

  const fetchJobAndCheckStatus = async () => {
    try {
      // 1. Fetch Job
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("id, title, company_name, company_logo_url, application_email, ai_assessment_enabled")
        .eq("id", id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // 2. Check for existing application
      if (talent?.id) {
        const { data: existingApp } = await supabase
          .from("job_applications")
          .select("id, job_assessments(id)")
          .eq("job_id", id)
          .eq("talent_id", talent.id)
          .maybeSingle();

        if (existingApp) {
          setSubmitted(true);
          if (existingApp.job_assessments?.[0]?.id) {
            setGeneratedAssessmentId(existingApp.job_assessments[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
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
        toast.success("Cover letter generated!");
      }
    } catch (error: any) {
      console.error("Error generating cover letter:", error);
      if (error.message?.includes("429")) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
      } else {
        toast.error("Failed to generate cover letter");
      }
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
      toast.error("Please upload your CV first");
      navigate("/app/profile/edit");
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    setSubmissionProgress(0);
    setSubmissionMessage(SUBMISSION_STAGES[0].message);

    // Progress simulation
    let stageIndex = 0;
    const progressInterval = setInterval(() => {
      if (stageIndex < SUBMISSION_STAGES.length - 1) {
        stageIndex++;
        setSubmissionProgress(SUBMISSION_STAGES[stageIndex].progress);
        setSubmissionMessage(SUBMISSION_STAGES[stageIndex].message);
      }
    }, 2000);

    try {
      // 1. Create Application
      setSubmissionProgress(20);
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

      // 2. Deduct Credits
      await deductCredits("JOB_APPLICATION", job.id, `Application to ${job.title}`);

      // 3. Send Email (Async)
      setSubmissionProgress(40);
      setSubmissionMessage("Sending to employer...");
      await supabase.functions.invoke("send-job-application", {
        body: { applicationId: appData.id },
      });

      // 4. Generate AI Assessment (if enabled)
      if (job.ai_assessment_enabled) {
        setSubmissionProgress(60);
        setSubmissionMessage("Generating AI assessment...");

        try {
          const { data: assessmentData, error: assessmentError } = await supabase.functions.invoke(
            "generate-job-assessment",
            {
              body: {
                jobId: job.id,
                talentId: talent.id,
                jobApplicationId: appData.id, // Ensure this matches what the edge function expects
              },
            },
          );

          if (!assessmentError && assessmentData?.assessmentId) {
            setGeneratedAssessmentId(assessmentData.assessmentId);
          }
        } catch (err) {
          console.error("Assessment generation warning:", err);
          // Don't block submission if assessment fails, just log it
        }
      }

      clearInterval(progressInterval);
      setSubmissionProgress(100);
      setSubmitted(true);
      toast.success("Application submitted successfully!");
      refreshBalance();
    } catch (error: any) {
      console.error("Error submitting application:", error);
      clearInterval(progressInterval);

      if (error?.message?.includes("duplicate")) {
        toast.info("You have already applied to this job.");
        setSubmitted(true); // Treat as success
      } else {
        toast.error("Failed to submit application. Please try again.");
      }
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Job not found</p>
            <Button variant="outline" onClick={() => navigate("/app/jobs")} className="mt-4">
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="border-green-100 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Your application for <span className="font-semibold text-foreground">{job.title}</span> at{" "}
              {job.company_name} has been sent.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {job.ai_assessment_enabled && generatedAssessmentId ? (
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => navigate(`/app/job-assessment/${generatedAssessmentId}`)}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Take Assessment Now
                </Button>
              ) : (
                <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate("/app/applications")}>
                  View My Applications
                </Button>
              )}

              <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => navigate("/app/jobs")}>
                Browse More Jobs
              </Button>
            </div>

            {/* Expedite via WhatsApp - Pull Strategy */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Want faster processing? Ping our career counselor
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => {
                  const message = getExpediteMessage(job.title, job.company_name);
                  window.open(`${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Expedite via WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Apply Now</h1>
          <p className="text-sm text-muted-foreground">Submit your application</p>
        </div>
      </div>

      {/* Job Info */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            {job.company_logo_url ? (
              <img
                src={job.company_logo_url}
                alt={job.company_name}
                className="w-12 h-12 rounded-lg object-cover bg-white border"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-lg">{job.title}</h2>
              <p className="text-sm text-muted-foreground">{job.company_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CV Status - Inline Upload */}
      <Card className="mb-6">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Resume / CV
          </CardTitle>
          {!talent?.cvUrl && (
            <CardDescription className="text-xs">
              Upload your CV to apply — we'll auto-fill your profile
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <InlineCVUpload />
        </CardContent>
      </Card>

      {/* Cover Letter */}
      <Card className="mb-6">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-medium">Cover Letter</CardTitle>
            <CardDescription className="text-xs">Optional but recommended</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateCoverLetter}
            disabled={isGeneratingCoverLetter || !talent?.cvUrl}
            className="h-8 text-xs gap-1.5"
          >
            {isGeneratingCoverLetter ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 text-primary" />
            )}
            {isGeneratingCoverLetter ? "Generating..." : "AI Generate"}
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <Textarea
            placeholder="Introduce yourself and explain why you're a great fit for this role..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Cost & Submit */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:relative md:p-0 md:border-0 md:bg-transparent z-10">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-muted-foreground">
              Cost: <span className="font-medium text-foreground">{applicationCost} credits</span>
            </span>
            <span className={!hasEnoughCredits ? "text-destructive font-medium" : "text-muted-foreground"}>
              Balance: {balance}
            </span>
          </div>

          {submitting ? (
            <div className="w-full bg-primary/5 border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                {job?.ai_assessment_enabled ? (
                  <Brain className="h-5 w-5 text-primary animate-pulse" />
                ) : (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                <span className="text-sm font-medium">{submissionMessage}</span>
              </div>
              <Progress value={submissionProgress} className="h-2" />
            </div>
          ) : (
            <Button
              className="w-full h-12 text-base shadow-lg"
              size="lg"
              onClick={handleSubmit}
              disabled={!talent?.cvUrl}
            >
              {!hasEnoughCredits ? (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Get Credits & Apply
                </>
              ) : (
                <>
                  Submit Application <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
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
