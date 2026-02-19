import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, BriefcaseIcon, Settings, Loader2, Coins, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useProgressiveLoadingMessage } from "@/hooks/useProgressiveLoadingMessage";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { RetryErrorCard, getErrorType } from "@/components/ui/retry-error-card";

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
  const { deductCredits, canAfford, refreshBalance, addCredits } = useCredits();

  const [step, setStep] = useState<SetupStep>("job-description");
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);

  // Initialize state from LocalStorage (Draft Saving)
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

  // Save draft on change
  useEffect(() => {
    const draftData = { jobDescription, config };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
  }, [jobDescription, config]);

  useEffect(() => {
    if (talent?.email) setEmail(talent.email);
    else if (user?.email) setEmail(user.email);
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
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Error loading categories:", error);
    }
  };

  const { message: loadingMessage } = useProgressiveLoadingMessage(isGenerating);

  const handleClearDraft = () => {
    setJobDescription("");
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    toast.success("Draft cleared");
  };

  const handleJobDescriptionSubmit = () => {
    if (!jobDescription.trim() || jobDescription.length < 50) {
      toast.error("Please enter a complete job description (at least 50 characters)");
      return;
    }
    setStep("configuration");
  };

  const handleRefund = async () => {
    if (!talent?.id) return;
    try {
      const success = await addCredits(MOCK_INTERVIEW_COST, "refund", "Refund: Mock Interview Generation Failed");
      if (success) {
        toast.info("Credits have been refunded to your account.");
      }
    } catch (err) {
      console.error("Refund failed:", err);
    }
  };

  const handleStartInterview = async () => {
    // --- PAYMENT CHECK ---
    if (!canAfford("MOCK_INTERVIEW")) {
      toast.error(`Insufficient credits. You need ${MOCK_INTERVIEW_COST} credits.`);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setStep("generating");

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Generation timed out")), TIMEOUTS.AI_GENERATION);
    });

    try {
      // 1. Deduct Credits
      const paid = await deductCredits("MOCK_INTERVIEW", undefined, "AI Mock Interview Generation");
      if (!paid) throw new Error("Payment failed. Please try again.");

      // 2. Prepare Context
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

      // 3. Call AI
      const functionPromise = supabase.functions.invoke("generate-interview-questions", {
        body: {
          jobDescription,
          questionCount: config.questionCount,
          difficulty: config.difficulty,
          professionCategoryId: config.professionCategoryId,
          additionalNotes: config.additionalNotes,
          candidateProfile,
        },
      });

      const { data, error } = (await Promise.race([functionPromise, timeoutPromise])) as any;

      if (error) throw new Error(error.message || "Failed to generate questions");
      if (!data || !data.questions) throw new Error("Invalid response from AI. Please try again.");

      // 4. Save Interview
      const tempInterviewId = crypto.randomUUID();
      const { error: insertError } = await supabase.from("mock_interviews").insert({
        id: tempInterviewId,
        email: email.toLowerCase().trim(),
        full_name: talent?.fullName || "",
        phone: talent?.phone || null,
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

      if (insertError) throw new Error("Failed to save interview. Please try again.");

      if (talent?.id) await addServiceUsed("MOCK_INTERVIEW");

      // Clear draft on success
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      toast.success("Questions generated! Starting your interview...");
      navigate(`/mock-interview/questions/${tempInterviewId}`);
    } catch (error: any) {
      console.error("Error generating questions:", error);

      // Attempt Refund since service failed
      await handleRefund();

      setGenerationError(error);
      setStep("configuration");
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Back Button */}
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/app/services")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Services
      </Button>

      <ProfileCompletionPrompt variant="banner" className="mb-6" />

      {/* Job Description Step */}
      {step === "job-description" && (
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Describe the Job Position</CardTitle>
            <CardDescription>Paste the job description for the position you're preparing for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="jobDescription">Job Description</Label>
                {jobDescription.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearDraft}
                    className="h-6 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear Draft
                  </Button>
                )}
              </div>
              <Textarea
                id="jobDescription"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px]"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Save className="w-3 h-3" /> Draft saved automatically
                </span>
                <span>{jobDescription.length} / 50 characters</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleJobDescriptionSubmit} disabled={jobDescription.length < 50}>
              Continue to Configuration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configuration Step */}
      {step === "configuration" && (
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Configure Your Interview</CardTitle>
            <CardDescription>Customize the interview to match your preparation needs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generationError && (
              <RetryErrorCard
                type={getErrorType(generationError)}
                onRetry={handleStartInterview}
                description={generationError.message}
              />
            )}

            {/* Config Form Fields */}
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Number of Questions</Label>
                <RadioGroup
                  value={String(config.questionCount)}
                  onValueChange={(v) => setConfig((prev) => ({ ...prev, questionCount: Number(v) }))}
                  className="flex gap-4"
                >
                  {[3, 5, 7, 10].map((num) => (
                    <div key={num} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(num)} id={`q-${num}`} />
                      <Label htmlFor={`q-${num}`} className="cursor-pointer">
                        {num}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Difficulty Level</Label>
                <RadioGroup
                  value={config.difficulty}
                  onValueChange={(v: "easy" | "medium" | "hard") => setConfig((prev) => ({ ...prev, difficulty: v }))}
                  className="flex gap-4"
                >
                  {["easy", "medium", "hard"].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem value={level} id={`d-${level}`} />
                      <Label htmlFor={`d-${level}`} className="cursor-pointer capitalize">
                        {level}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Profession Category (Optional)</Label>
                <Select
                  value={config.professionCategoryId || ""}
                  onValueChange={(v) => setConfig((prev) => ({ ...prev, professionCategoryId: v || null }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category for targeted questions" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific topics or skills you want to focus on..."
                  value={config.additionalNotes}
                  onChange={(e) => setConfig((prev) => ({ ...prev, additionalNotes: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>

              {talent && (
                <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                  <input
                    type="checkbox"
                    id="useProfile"
                    checked={config.useProfileContext}
                    onChange={(e) => setConfig((prev) => ({ ...prev, useProfileContext: e.target.checked }))}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="useProfile" className="cursor-pointer font-medium">
                      Use my profile context
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI will use your skills and experience to generate more relevant questions.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Service Cost</span>
                </div>
                <div className="text-sm font-bold">{MOCK_INTERVIEW_COST} Credits</div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("job-description")} disabled={isGenerating}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button className="flex-1" onClick={handleStartInterview} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {loadingMessage}
                    </>
                  ) : (
                    <>
                      Start Interview <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generating Step */}
      {step === "generating" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="font-semibold text-lg">Generating Your Interview</h3>
                <p className="text-muted-foreground">{loadingMessage}</p>
                <p className="text-xs text-muted-foreground mt-2">This usually takes about 20-30 seconds.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
