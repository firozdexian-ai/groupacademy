import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  markMockInterviewAccessCodeUsed,
  insertMockInterview,
} from "@/domains/marketing/repo/marketingRepo";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  KeyRound,
  CalendarDays,
  ExternalLink,
  BriefcaseIcon,
  Settings,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useProgressiveLoadingMessage } from "@/hooks/useProgressiveLoadingMessage";
import { AuthGate } from "@/components/AuthGate";
import { useTalent } from "@/hooks/useTalent";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { RetryErrorCard, getErrorType } from "@/components/ui/retry-error-card";
import { cn } from "@/lib/utils";
import { generateInterviewQuestions } from "@/domains/jobs/api/jobsApi";

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
}
type SetupStep = "job-description" | "configuration" | "generating" | "cooldown" | "access-code";

interface InterviewConfig {
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  professionCategoryId: string | null;
  additionalNotes: string;
  useProfileContext: boolean;
}

function MockInterviewSetupContent() {
  const navigate = useNavigate();
  const { talent, user, addServiceUsed } = useTalent();
  const [step, setStep] = useState<SetupStep>("job-description");

  const [email, setEmail] = useState("");
  const [checkingCooldown, setCheckingCooldown] = useState(false);
  const [existingInterview, setExistingInterview] = useState<any>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [accessCode, setAccessCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [jobDescription, setJobDescription] = useState("");

  const [config, setConfig] = useState<InterviewConfig>({
    questionCount: 5,
    difficulty: "medium",
    professionCategoryId: null,
    additionalNotes: "",
    useProfileContext: true,
  });

  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);

  useEffect(() => {
    if (talent?.email) setEmail(talent.email);
    else if (user?.email) setEmail(user.email);
  }, [talent, user]);

  useEffect(() => {
    if (talent?.professionCategoryId) {
      setConfig((prev) => ({ ...prev, professionCategoryId: talent.professionCategoryId || null }));
    }
  }, [talent]);

  useEffect(() => {
    loadCategories();
    if (email) checkCooldown();
  }, [email]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("profession_categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("display_order");
    if (data) setCategories(data);
  };

  const checkCooldown = async () => {
    setCheckingCooldown(true);
    const { data: existing } = await supabase
      .from("mock_interviews")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && new Date(existing.expires_at) > new Date()) {
      setExistingInterview(existing);
      setDaysRemaining(Math.ceil((new Date(existing.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      setStep("cooldown");
    }
    setCheckingCooldown(false);
  };

  const handleAccessCodeValidation = async () => {
    if (!accessCode.trim()) return toast.error("Verification code required.");
    setValidatingCode(true);
    try {
      const { data, error } = await supabase
        .from("mock_interview_access_codes")
        .select("*")
        .eq("code", accessCode.trim().toUpperCase())
        .eq("email", email.toLowerCase().trim())
        .eq("is_used", false)
        .maybeSingle();

      if (error || !data) throw new Error("Invalid or expired code.");
      await markMockInterviewAccessCodeUsed(data.id);
      setStep("job-description");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setValidatingCode(false);
    }
  };

  const handleStartInterview = async () => {
    setIsGenerating(true);
    setStep("generating");

    try {
      let candidateProfile = null;
      if (config.useProfileContext && talent) {
        candidateProfile = {
          skills: talent.skills || [],
          experience: talent.experience || [],
          education: talent.education || [],
          cvSummary: talent.cvText?.substring(0, 1500) || null,
        };
      }

      const data: any = await generateInterviewQuestions({
        jobDescription,
        questionCount: config.questionCount,
        difficulty: config.difficulty,
        professionCategoryId: config.professionCategoryId,
        additionalNotes: config.additionalNotes,
        candidateProfile,
      });
      const interviewId = crypto.randomUUID();

      const { error: insertError } = await insertMockInterview({
        id: interviewId,
        email: email.toLowerCase().trim(),
        full_name: talent?.fullName || "",
        job_description: jobDescription,
        job_title: data.jobTitle,
        company_name: data.companyName,
        question_count: config.questionCount,
        difficulty: config.difficulty,
        questions: data.questions,
        status: "in_progress",
        talent_id: talent?.id || null,
      });

      if (insertError) throw insertError;
      navigate(`/mock-interview/questions/${interviewId}`);
    } catch (e: any) {
      setGenerationError(e);
      setStep("configuration");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <Navbar />
      <main className="flex-1 container max-w-2xl mx-auto px-6 py-12">
        <header className="mb-10 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black border",
                step === "job-description"
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              1
            </div>
            <div className="h-px flex-1 bg-border" />
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black border",
                step === "configuration"
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              2
            </div>
            <div className="h-px flex-1 bg-border" />
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black border",
                step === "generating"
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              3
            </div>
          </div>
          <ProfileCompletionPrompt variant="banner" className="rounded-2xl" />
        </header>

        {step === "job-description" && (
          <Card className="rounded-[32px] border-border/40 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <BriefcaseIcon className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter uppercase">JD Ingestion</CardTitle>
              <CardDescription className="text-xs font-medium tracking-widest uppercase">
                Paste the target Job Description to begin neural mapping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Job Description Artifact
                </Label>
                <Textarea
                  placeholder="Paste roles, responsibilities, and requirements..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[300px] rounded-2xl border-border/40 bg-muted/20 resize-none font-medium leading-relaxed"
                />
                <p className="text-[9px] font-black uppercase tracking-tighter text-right text-muted-foreground/60">
                  {jobDescription.length} / 50 Chars Required
                </p>
              </div>
              <Button
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs"
                onClick={() => setStep("configuration")}
                disabled={jobDescription.length < 50}
              >
                Next: Calibration <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "configuration" && (
          <Card className="rounded-[32px] border-border/40 shadow-2xl animate-in zoom-in-95 duration-500">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter uppercase">Calibration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Depth of Analysis
                </Label>
                <RadioGroup
                  value={String(config.questionCount)}
                  onValueChange={(v) => setConfig({ ...config, questionCount: Number(v) })}
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { v: "5", l: "Sprint", d: "5 Qs" },
                    { v: "8", l: "Standard", d: "8 Qs" },
                    { v: "10", l: "Deep", d: "10 Qs" },
                  ].map((o) => (
                    <Label
                      key={o.v}
                      htmlFor={`q-${o.v}`}
                      className={cn(
                        "flex flex-col items-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
                        config.questionCount === Number(o.v)
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/20",
                      )}
                    >
                      <RadioGroupItem value={o.v} id={`q-${o.v}`} className="sr-only" />
                      <span className="font-black text-[10px] uppercase tracking-widest">{o.l}</span>
                      <span className="text-[9px] text-muted-foreground font-bold">{o.d}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Sector Alignment
                </Label>
                <Select
                  value={config.professionCategoryId || "none"}
                  onValueChange={(v) => setConfig({ ...config, professionCategoryId: v === "none" ? null : v })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-border/40 font-bold">
                    <SelectValue placeholder="Select Domain" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none" className="text-[10px] font-bold uppercase">
                      General Domain
                    </SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold uppercase">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {talent && (
                <div className="flex items-start gap-3 p-5 rounded-[24px] border-border/40 bg-primary/[0.03] border relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <input
                    type="checkbox"
                    id="useProfile"
                    checked={config.useProfileContext}
                    onChange={(e) => setConfig({ ...config, useProfileContext: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-primary"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="useProfile"
                      className="cursor-pointer font-black text-[10px] uppercase tracking-widest text-primary"
                    >
                      Neural Context Injection
                    </Label>
                    <p className="text-[10px] font-medium text-muted-foreground leading-relaxed mt-1">
                      Cross-reference questions with your specific skills and experience in your profile.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="rounded-xl h-14 px-8 font-black uppercase text-[10px] tracking-widest border-border/40"
                  onClick={() => setStep("job-description")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                  onClick={handleStartInterview}
                >
                  Initialize Terminal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "generating" && (
          <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden py-20 text-center">
            <CardContent className="space-y-8">
              {generationError ? (
                <RetryErrorCard
                  type={getErrorType(generationError)}
                  description={generationError.message}
                  onRetry={handleStartInterview}
                />
              ) : (
                <div className="animate-in zoom-in-95 duration-1000">
                  <div className="relative w-24 h-24 mx-auto mb-10">
                    <div className="absolute inset-0 rounded-3xl bg-primary/10 animate-ping" />
                    <div className="relative h-24 w-24 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                      <Sparkles className="h-10 w-10 text-white animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Synthesizing Scenarios</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                    Gemini 1.5 Pro: Mapping Job Logic to Interview Branches
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "cooldown" && (
          <Card className="rounded-[40px] border-amber-500/20 bg-amber-500/[0.02] shadow-2xl p-10 text-center space-y-8">
            <div className="h-16 w-16 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter uppercase">Circuit Cooldown</h2>
              <p className="text-xs font-bold text-amber-700/60 uppercase tracking-widest">
                Free retake window opens in {daysRemaining} days
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                className="h-14 rounded-2xl font-black uppercase text-xs shadow-lg shadow-primary/20"
                onClick={() => setStep("access-code")}
              >
                <KeyRound className="mr-2 h-4 w-4" /> Bypas with Priority Code
              </Button>
              <Button
                variant="ghost"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                onClick={() => navigate("/mock-interview")}
              >
                Return to Hub
              </Button>
            </div>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function MockInterviewSetup() {
  return (
    <AuthGate message="Secure your professional roadmap. Results are archived to your encrypted career profile.">
      <MockInterviewSetupContent />
    </AuthGate>
  );
}
