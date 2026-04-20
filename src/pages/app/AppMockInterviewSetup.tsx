import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  BriefcaseIcon,
  Settings,
  Loader2,
  Coins,
  Trash2,
  Save,
  Zap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useProgressiveLoadingMessage } from "@/hooks/useProgressiveLoadingMessage";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { RetryErrorCard, getErrorType } from "@/components/ui/retry-error-card";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Neural Interview Orchestrator
 * High-fidelity setup for AI-driven mock interviews with auto-drafting.
 * Synchronized with the 2026 'Executive Logic' depth and transaction tokens.
 */

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

  // Initialize state from LocalStorage (Draft Persistence Layer)
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
      console.error("Diagnostic Failure: Category Load", error);
    }
  };

  const { message: loadingMessage } = useProgressiveLoadingMessage(isGenerating);

  const handleRefund = async () => {
    if (!talent?.id) return;
    try {
      await addCredits(MOCK_INTERVIEW_COST, "refund", "Refund: Neural Sync Failure");
      toast.info("Credits restored to registry.");
    } catch (err) {
      console.error("Refund block failure:", err);
    }
  };

  const handleStartInterview = async () => {
    if (!canAfford("MOCK_INTERVIEW")) {
      toast.error(`Registry balance low. Need ${MOCK_INTERVIEW_COST} credits.`);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setStep("generating");

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Neural handshake timeout")), TIMEOUTS.AI_GENERATION);
    });

    try {
      const paid = await deductCredits("MOCK_INTERVIEW", undefined, "AI Interview Synthesis");
      if (!paid) throw new Error("Credit handshake failed.");

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

      if (error) throw new Error(error.message || "Synthesis failed");

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

      if (insertError) throw new Error("Registry insertion failed.");
      if (talent?.id) await addServiceUsed("MOCK_INTERVIEW");

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      toast.success("Neural Link Active. Commencing Interview.");
      navigate(`/mock-interview/questions/${tempInterviewId}`);
    } catch (error: any) {
      await handleRefund();
      setGenerationError(error);
      setStep("configuration");
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 min-h-svh space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 group"
          onClick={() => navigate("/app/services")}
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Registry
        </Button>
        <Badge
          variant="outline"
          className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest"
        >
          Neural Interface 2026
        </Badge>
      </header>

      <ProfileCompletionPrompt variant="banner" className="rounded-[24px] border-2 border-dashed border-primary/20" />

      <main className="relative">
        {step === "job-description" && (
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <CardHeader className="text-center p-10 border-b border-border/10">
              <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center mx-auto mb-6 rotate-3 shadow-xl">
                <BriefcaseIcon className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Job Telemetry</CardTitle>
              <CardDescription className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                Input the target position parameters for neural calibration.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                    Job Description
                  </Label>
                  {jobDescription.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setJobDescription("");
                        localStorage.removeItem(DRAFT_STORAGE_KEY);
                      }}
                      className="h-8 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Purge Draft
                    </Button>
                  )}
                </div>
                <Textarea
                  placeholder="Paste the target role artifacts here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[240px] rounded-2xl bg-muted/10 border-2 border-border/40 p-6 italic font-medium text-sm leading-relaxed"
                />
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                  <span className="flex items-center gap-2">
                    <Save className="w-3 h-3" /> Auto-Sync Active
                  </span>
                  <span className={cn(jobDescription.length < 50 ? "text-amber-500" : "text-emerald-500")}>
                    {jobDescription.length} / 50 min. chars
                  </span>
                </div>
              </div>
              <Button
                className="w-full rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                onClick={() => setStep("configuration")}
                disabled={jobDescription.length < 50}
              >
                Next Phase: Configuration <ArrowRight className="ml-3 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "configuration" && (
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden animate-in slide-in-from-right-10 duration-500">
            <CardHeader className="text-center p-10 border-b border-border/10">
              <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center mx-auto mb-6 -rotate-3 shadow-xl">
                <Settings className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Calibration</CardTitle>
              <CardDescription className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                Fine-tune the neural simulation complexity.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              {generationError && (
                <RetryErrorCard
                  type={getErrorType(generationError)}
                  onRetry={handleStartInterview}
                  description={generationError.message}
                />
              )}

              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary text-left">
                    Quantity: Logic Iterations
                  </Label>
                  <RadioGroup
                    value={String(config.questionCount)}
                    onValueChange={(v) => setConfig((prev) => ({ ...prev, questionCount: Number(v) }))}
                    className="flex gap-6"
                  >
                    {[3, 5, 7, 10].map((num) => (
                      <div key={num} className="flex items-center space-x-3">
                        <RadioGroupItem value={String(num)} id={`q-${num}`} className="h-5 w-5" />
                        <Label htmlFor={`q-${num}`} className="font-black text-sm cursor-pointer">
                          {num}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary text-left">
                    Difficulty: Neural Load
                  </Label>
                  <RadioGroup
                    value={config.difficulty}
                    onValueChange={(v: any) => setConfig((prev) => ({ ...prev, difficulty: v }))}
                    className="flex gap-6"
                  >
                    {["easy", "medium", "hard"].map((level) => (
                      <div key={level} className="flex items-center space-x-3">
                        <RadioGroupItem value={level} id={`d-${level}`} className="h-5 w-5" />
                        <Label
                          htmlFor={`d-${level}`}
                          className="font-black uppercase tracking-tighter text-sm cursor-pointer"
                        >
                          {level}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary text-left">
                    Sector Selection
                  </Label>
                  <Select
                    value={config.professionCategoryId || ""}
                    onValueChange={(v) => setConfig((prev) => ({ ...prev, professionCategoryId: v || null }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-border/40 bg-background/50 font-bold">
                      <SelectValue placeholder="Standard Sector Selection" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="font-bold">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {talent && (
                  <div className="p-6 rounded-[24px] bg-primary/5 border border-primary/20 flex gap-4">
                    <input
                      type="checkbox"
                      id="useProfile"
                      checked={config.useProfileContext}
                      onChange={(e) => setConfig((prev) => ({ ...prev, useProfileContext: e.target.checked }))}
                      className="mt-1 h-5 w-5 rounded-md"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="useProfile"
                        className="cursor-pointer font-black uppercase tracking-tighter text-sm"
                      >
                        Integrate Talent Profile
                      </Label>
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                        The simulation will utilize your skills registry for higher fidelity targeting.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-border/10">
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <Coins className="h-5 w-5 text-amber-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Execution Cost
                    </span>
                  </div>
                  <div className="text-xl font-black uppercase tracking-tighter">{MOCK_INTERVIEW_COST} Credits</div>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="rounded-2xl h-14 px-8 border-2 font-black uppercase tracking-widest text-[10px]"
                    onClick={() => setStep("job-description")}
                    disabled={isGenerating}
                  >
                    <ArrowLeft className="mr-3 h-4 w-4" /> Revert
                  </Button>
                  <Button
                    className="flex-1 rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30"
                    onClick={handleStartInterview}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" /> {loadingMessage}
                      </>
                    ) : (
                      <>
                        <Zap className="mr-3 h-5 w-5" /> Initialize Simulation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "generating" && (
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden py-24 text-center">
            <CardContent className="space-y-10">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                <Loader2 className="h-20 w-20 animate-spin mx-auto text-primary relative z-10 stroke-[1.5px]" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Neural Synthesis Active</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary animate-pulse italic">
                  {loadingMessage}
                </p>
                <div className="flex items-center justify-center gap-3 pt-6 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                  <Sparkles className="h-4 w-4" /> Handshake Est. 20-30s
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
