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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { SUPPORT_CONFIG, getExpediteMessage } from "@/lib/constants/support";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";

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
      console.error("Error fetching job:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !talent) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
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
      toast.success("CV uploaded and secured!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload CV. Please try again.");
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
        toast.success("Cover letter generated!");
      }
    } catch (error: any) {
      toast.error("AI enhancement currently unavailable.");
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
      toast.error("Please upload your CV to continue.");
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

      await deductCredits("JOB_APPLICATION", job.id, `Application to ${job.title}`);

      setSubmissionProgress(40);
      setSubmissionMessage("Notifying employer...");
      await supabase.functions.invoke("send-job-application", {
        body: { applicationId: appData.id },
      });

      if (job.ai_assessment_enabled) {
        setSubmissionProgress(60);
        setSubmissionMessage("Preparing AI interview...");

        try {
          const { data: assessmentData, error: assessmentError } = await supabase.functions.invoke(
            "generate-job-assessment",
            { body: { jobId: job.id, talentId: talent.id, jobApplicationId: appData.id } },
          );

          if (!assessmentError && assessmentData?.assessmentId) {
            setGeneratedAssessmentId(assessmentData.assessmentId);
          } else {
            // CTO FIX: Handle generation delay/error without blocking application success
            toast.info(
              "Application sent! Your AI assessment is being prepared—check 'My Applications' in a few moments.",
            );
          }
        } catch (err) {
          console.error("Delayed Assessment Gen:", err);
        }
      }

      setSubmissionProgress(100);
      setSubmitted(true);
      toast.success("Applied successfully!");
      refreshBalance();
    } catch (error: any) {
      if (error?.message?.includes("duplicate")) {
        toast.info("Already applied to this role.");
        setSubmitted(true);
      } else {
        toast.error("Application failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (loading)
    return (
      <div className="max-w-2xl mx-auto p-12">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center py-12 bg-emerald-50/20 border-emerald-100 shadow-xl">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-50">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Application Received!</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Good luck! Your profile for <span className="text-foreground font-semibold">{job?.title}</span> has been
                shared.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              {generatedAssessmentId ? (
                <Button
                  size="lg"
                  className="px-8 shadow-lg shadow-primary/20"
                  onClick={() => navigate(`/app/job-assessment/${generatedAssessmentId}`)}
                >
                  <Brain className="mr-2 h-4 w-4" /> Start AI Interview
                </Button>
              ) : (
                <Button size="lg" onClick={() => navigate("/app/applications")}>
                  View My Dashboard
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={() => navigate("/app/jobs")}>
                Back to Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 min-h-screen">
      {/* CTO FIX: Applied pb-40 to inner content to prevent mobile overlap (Audit # Polish) */}
      <div className="space-y-5 pb-40">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Apply Now</h1>
            <p className="text-xs text-muted-foreground">Standard Application</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 flex gap-4 items-center">
            <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center border shrink-0 overflow-hidden">
              {job?.company_logo_url ? (
                <img src={job.company_logo_url} className="object-cover w-full h-full" alt="logo" />
              ) : (
                <Building2 className="text-primary w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">{job?.title}</h2>
              <p className="text-sm text-muted-foreground">{job?.company_name}</p>
            </div>
          </CardContent>
        </Card>

        <Card id="cv-upload-section" className={!talent?.cvUrl ? "border-primary bg-primary/[0.02]" : ""}>
          <CardHeader className="pb-3 border-b py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" /> Professional Resume
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {talent?.cvUrl ? (
              <div className="flex items-center justify-between p-3 border rounded-xl bg-background shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500 font-bold text-[10px]">
                    PDF
                  </div>
                  <span className="text-sm font-medium">Resume_Profile.pdf</span>
                </div>
                <Label htmlFor="cv-up" className="cursor-pointer text-xs text-primary font-bold hover:underline">
                  Replace
                </Label>
                <input id="cv-up" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleCVUpload} />
              </div>
            ) : (
              <div className="flex flex-col items-center p-8 border-2 border-dashed rounded-xl bg-muted/20">
                {isUploadingCV ? (
                  <Loader2 className="animate-spin text-primary mb-2" />
                ) : (
                  <UploadCloud className="text-muted-foreground/50 mb-3 w-8 h-8" />
                )}
                <h3 className="text-sm font-semibold mb-1">Upload CV</h3>
                <p className="text-[10px] text-muted-foreground mb-4">PDF, DOC, DOCX up to 5MB</p>
                <Label
                  htmlFor="cv-new"
                  className="cursor-pointer bg-primary text-primary-foreground px-6 py-2 rounded-lg text-xs font-bold shadow-md"
                >
                  Select File
                </Label>
                <input id="cv-new" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleCVUpload} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 border-b flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm">Cover Letter (Optional)</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateCoverLetter}
              disabled={isGeneratingCoverLetter || !talent?.cvUrl}
              className="h-7 text-[10px] gap-1 px-2 border"
            >
              {isGeneratingCoverLetter ? (
                <Loader2 className="animate-spin h-3 w-3" />
              ) : (
                <Sparkles className="h-3 w-3 text-primary" />
              )}{" "}
              AI Help
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <Textarea
              placeholder="Tell the hiring team about your background and motivation..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={8}
              className="resize-none rounded-xl"
            />
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t z-20">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex justify-between text-[11px] font-bold tracking-tight px-1">
            <span className="text-muted-foreground uppercase">Estimated Cost: {applicationCost} credits</span>
            <span className={!hasEnoughCredits ? "text-destructive" : "text-muted-foreground"}>BALANCE: {balance}</span>
          </div>
          {submitting ? (
            <div className="space-y-3 p-2 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center gap-3 text-xs font-bold">
                <Brain className="h-4 w-4 animate-pulse text-primary" /> {submissionMessage}
              </div>
              <Progress value={submissionProgress} className="h-2" />
            </div>
          ) : (
            <Button
              className="w-full h-14 text-base font-bold shadow-2xl rounded-xl"
              size="lg"
              onClick={handleSubmit}
              disabled={isUploadingCV}
            >
              {hasEnoughCredits ? "Submit Application" : "Purchase Credits"} <ArrowRight className="ml-2 h-5 w-5" />
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
