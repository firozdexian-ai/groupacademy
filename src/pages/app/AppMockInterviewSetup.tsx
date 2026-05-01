import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, BriefcaseIcon, Settings, Loader2, Coins, Trash2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useProgressiveLoadingMessage } from "@/hooks/useProgressiveLoadingMessage";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { RetryErrorCard, getErrorType } from "@/components/ui/retry-error-card";
import { cn } from "@/lib/utils";
import { PAGE_SHELL, PAGE_TITLE, META_TEXT, CARD } from "@/lib/uiTokens";

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
}

type SetupStep = "job-description" | "configuration" | "generating";

interface InterviewConfig {
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  professionCategoryId: string | null;
  additionalNotes: string;
  useProfileContext: boolean;
}

const MOCK_INTERVIEW_COST = 50;
const DRAFT_STORAGE_KEY = "mock_interview_draft";

export default function AppMockInterviewSetup() {
  const navigate = useNavigate();
  const { talent, user, addServiceUsed } = useTalent();
  const { deductCredits, canAfford, addCredits } = useCredits();

  const [step, setStep] = useState<SetupStep>("job-description");
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);

  const [jobDescription, setJobDescription] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      return saved ? JSON.parse(saved).jobDescription : "";
    } catch {
      return "";
    }
  });

  const [config, setConfig] = useState<InterviewConfig>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      return saved
        ? JSON.parse(saved).config
        : {
            questionCount: 5,
            difficulty: "medium",
            professionCategoryId: null,
            additionalNotes: "",
            useProfileContext: true,
          };
    } catch {
      return {
        questionCount: 5,
        difficulty: "medium",
        professionCategoryId: null,
        additionalNotes: "",
        useProfileContext: true,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ jobDescription, config }));
  }, [jobDescription, config]);

  useEffect(() => {
    if (talent?.email || user?.email) setEmail(talent?.email || user?.email || "");
  }, [talent, user]);

  useEffect(() => {
    if (talent?.professionCategoryId && !config.professionCategoryId) {
      setConfig((prev) => ({ ...prev, professionCategoryId: talent.professionCategoryId || null }));
    }
  }, [talent?.professionCategoryId]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.CATEGORY_LOAD);
    try {
      const { data, error } = await supabase
        .from("profession_categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("display_order")
        .abortSignal(controller.signal);
      clearTimeout(timeoutId);
      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Category load error:", error);
    }
  };

  const { message: loadingMessage } = useProgressiveLoadingMessage(isGenerating);

  const handleRefund = async () => {
    if (!talent?.id) return;
    try {
      await addCredits(MOCK_INTERVIEW_COST, "refund", "Refund: interview generation failed");
      toast.info("Credits refunded.");
    } catch (err) {
      console.error("Refund failure:", err);
    }
  };

  const handleStartInterview = async () => {
    if (!canAfford("MOCK_INTERVIEW")) {
      toast.error(`Need ${MOCK_INTERVIEW_COST} credits to continue.`);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setStep("generating");

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Generation timed out")), TIMEOUTS.AI_GENERATION);
    });

    try {
      const paid = await deductCredits("MOCK_INTERVIEW", undefined, "AI mock interview");
      if (!paid) throw new Error("Payment failed.");

      let candidateProfile = null;
      if (config.useProfileContext && talent) {
        candidateProfile = {
          skills: Array.isArray(talent.skills)
            ? talent.skills.map((s: any) => (typeof s === "string" ? s : s.name || s.skill || String(s)))
            : [],
          experience: Array.isArray(talent.experience)
            ? talent.experience.map((e: any) => `${e.position} at ${e.company}`).filter(Boolean)
            : [],
          education: Array.isArray(talent.education)
            ? talent.education.map((e: any) => `${e.degree} from ${e.institution}`).filter(Boolean)
            : [],
          cvSummary: talent.cvText?.substring(0, 1000) || null,
        };
      }

      const { data, error } = (await Promise.race([
        supabase.functions.invoke("generate-interview-questions", {
          body: {
            jobDescription,
            questionCount: config.questionCount,
            difficulty: config.difficulty,
            professionCategoryId: config.professionCategoryId,
            additionalNotes: config.additionalNotes,
            candidateProfile,
          },
        }),
        timeoutPromise,
      ])) as any;

      if (error) throw new Error(error.message || "Generation failed");

      const tempInterviewId = crypto.randomUUID();
      const { error: insertError } = await supabase.from("mock_interviews").insert({
        id: tempInterviewId,
        email: email.toLowerCase().trim(),
        full_name: talent?.fullName || "",
        job_description: jobDescription,
        job_title: data.jobTitle,
        company_name: data.companyName,
        question_count: config.questionCount,
        difficulty: config.difficulty,
        profession_category_id: config.professionCategoryId,
        additional_notes: config.additionalNotes,
        questions: data.questions,
        status: "in_progress",
        user_id: user?.id || null,
        talent_id: talent?.id || null,
      });

      if (insertError) throw new Error("Could not save interview.");
      if (talent?.id) await addServiceUsed("MOCK_INTERVIEW");

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      toast.success("Starting your interview...");
      navigate(`/mock-interview/questions/${tempInterviewId}`);
    } catch (error: any) {
      await handleRefund();
      setGenerationError(error);
      setStep("configuration");
      setIsGenerating(false);
    }
  };

  return (
    <div className={PAGE_SHELL}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/app/services")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className={PAGE_TITLE}>Mock interview</h1>
          <p className={META_TEXT}>AI-powered practice for any role</p>
        </div>
      </div>

      <ProfileCompletionPrompt variant="banner" className="rounded-2xl border border-dashed border-primary/30" />

      {step === "job-description" && (
        <Card className={CARD}>
          <CardHeader className="p-3 pb-1">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Job description</CardTitle>
            </div>
            <CardDescription className="text-xs">Paste the role you're preparing for.</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-2 space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Description</Label>
                {jobDescription.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setJobDescription("");
                      localStorage.removeItem(DRAFT_STORAGE_KEY);
                    }}
                    className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[180px] rounded-xl text-sm"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Save className="w-3 h-3" /> Auto-saved
                </span>
                <span className={cn(jobDescription.length < 50 && "text-amber-600")}>
                  {jobDescription.length} / 50 min
                </span>
              </div>
            </div>
            <Button
              className="w-full h-11 rounded-xl text-sm"
              onClick={() => setStep("configuration")}
              disabled={jobDescription.length < 50}
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "configuration" && (
        <Card className={CARD}>
          <CardHeader className="p-3 pb-1">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Configure interview</CardTitle>
            </div>
            <CardDescription className="text-xs">Tune length and difficulty.</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-2 space-y-4">
            {generationError && (
              <RetryErrorCard
                type={getErrorType(generationError)}
                onRetry={handleStartInterview}
                description={generationError.message}
              />
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Number of questions</Label>
              <RadioGroup
                value={String(config.questionCount)}
                onValueChange={(v) => setConfig((prev) => ({ ...prev, questionCount: Number(v) }))}
                className="flex gap-4 flex-wrap"
              >
                {[3, 5, 7, 10].map((num) => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`q-${num}`} />
                    <Label htmlFor={`q-${num}`} className="text-sm cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Difficulty</Label>
              <RadioGroup
                value={config.difficulty}
                onValueChange={(v: any) => setConfig((prev) => ({ ...prev, difficulty: v }))}
                className="flex gap-4 flex-wrap"
              >
                {["easy", "medium", "hard"].map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <RadioGroupItem value={level} id={`d-${level}`} />
                    <Label htmlFor={`d-${level}`} className="text-sm capitalize cursor-pointer">{level}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Profession category</Label>
              <Select
                value={config.professionCategoryId || ""}
                onValueChange={(v) => setConfig((prev) => ({ ...prev, professionCategoryId: v || null }))}
              >
                <SelectTrigger className="h-10 rounded-xl text-sm">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {talent && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex gap-2.5">
                <input
                  type="checkbox"
                  id="useProfile"
                  checked={config.useProfileContext}
                  onChange={(e) => setConfig((prev) => ({ ...prev, useProfileContext: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded"
                />
                <div>
                  <Label htmlFor="useProfile" className="text-sm font-semibold cursor-pointer">
                    Use my profile
                  </Label>
                  <p className={META_TEXT}>Tailor questions using your skills and experience.</p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-border/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Coins className="h-3.5 w-3.5 text-amber-500" /> Cost
                </span>
                <span className="text-sm font-semibold">{MOCK_INTERVIEW_COST} credits</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl h-11 px-4 text-sm"
                  onClick={() => setStep("job-description")}
                  disabled={isGenerating}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1 rounded-xl h-11 text-sm"
                  onClick={handleStartInterview}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {loadingMessage}</>
                  ) : (
                    <>Start interview</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "generating" && (
        <Card className={CARD}>
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="text-base font-semibold">Generating questions...</h3>
              <p className={`${META_TEXT} mt-1`}>{loadingMessage}</p>
              <p className="text-[11px] text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Usually takes 20–30 seconds
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
