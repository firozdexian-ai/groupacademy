import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProfessionSelector } from "@/components/assessment/ProfessionSelector";
import { AssessmentStepper } from "@/components/assessment/AssessmentStepper";
import { LeadCaptureForm } from "@/components/assessment/LeadCaptureForm";
import { ProcessingCard } from "@/components/ui/processing-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Target, TrendingUp, CheckCircle, Sparkles, AlertTriangle } from "lucide-react";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { useToast } from "@/hooks/use-toast";

const ASSESSMENT_PROCESSING_STAGES = [
  { progress: 0, message: "Preparing your assessment..." },
  { progress: 15, message: "Analyzing your responses..." },
  { progress: 35, message: "AI is evaluating your career readiness..." },
  { progress: 55, message: "Identifying strengths and improvement areas..." },
  { progress: 75, message: "Generating personalized insights..." },
  { progress: 90, message: "Creating your report..." },
];

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

type AssessmentStep = "intro" | "profession" | "questions" | "lead-capture" | "processing";

// Progress Map for Step Indicator
const STEP_PROGRESS: Record<AssessmentStep, number> = {
  intro: 0,
  profession: 25,
  questions: 50,
  "lead-capture": 75,
  processing: 90,
};

const IS_PAID_ASSESSMENT = true;
const ASSESSMENT_COST = 50;

export default function AppCareerAssessment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, user, addServiceUsed } = useTalent();
  const { canAfford, deductCredits } = useCredits();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<AssessmentStep>("intro");
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProfessionCategory | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [urlProfessionId] = useState(() => searchParams.get("profession"));
  const [isProcessing, setIsProcessing] = useState(false);

  // Ref to prevent double-processing in Strict Mode
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (talent?.email) {
      setEmail(talent.email);
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [talent, user]);

  useEffect(() => {
    if (categories.length === 0) return;

    if (urlProfessionId && !selectedCategory) {
      const urlCategory = categories.find((c) => c.id === urlProfessionId);
      if (urlCategory) {
        setSelectedCategory(urlCategory);
        return;
      }
    }

    if (talent?.professionCategoryId && !selectedCategory) {
      const talentCategory = categories.find((c) => c.id === talent.professionCategoryId);
      if (talentCategory) {
        setSelectedCategory(talentCategory);
      }
    }
  }, [talent, categories, selectedCategory, urlProfessionId]);

  useEffect(() => {
    loadCategories();
  }, []);

  // Trigger processing ONLY when step becomes 'processing'
  useEffect(() => {
    if (step === "processing" && !isProcessing && !hasProcessedRef.current) {
      processAssessment();
    }
  }, [step]);

  const loadCategories = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.CATEGORY_LOAD);

    try {
      const { data, error } = await supabase
        .from("profession_categories")
        .select("*")
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

  const handleCategorySelect = (category: ProfessionCategory) => {
    setSelectedCategory(category);
    setStep("questions");
  };

  const handleQuestionsComplete = (questionAnswers: Record<string, any>) => {
    setAnswers(questionAnswers);
    setStep("lead-capture");
  };

  const handleLeadCaptureComplete = (capturedEmail?: string) => {
    if (capturedEmail) setEmail(capturedEmail);
    setStep("processing");
  };

  const processAssessment = async () => {
    if (!selectedCategory || hasProcessedRef.current) return;

    setIsProcessing(true);
    hasProcessedRef.current = true;

    try {
      // 1. Credit Check
      if (IS_PAID_ASSESSMENT && !canAfford("CAREER_ASSESSMENT")) {
        toast({
          title: "Insufficient Credits",
          description: `This detailed analysis requires ${ASSESSMENT_COST} credits.`,
          variant: "destructive",
        });
        setStep("lead-capture");
        hasProcessedRef.current = false; // Reset lock
        return;
      }

      // 2. Deduct Credits
      if (IS_PAID_ASSESSMENT) {
        const paid = await deductCredits("CAREER_ASSESSMENT", undefined, "Career Assessment Analysis");
        if (!paid) throw new Error("Payment failed");
      }

      // 3. Analyze
      const { data, error } = await supabase.functions.invoke("analyze-career-assessment", {
        body: {
          answers,
          professionCategoryId: selectedCategory.id,
          email,
          talentId: talent?.id,
        },
      });

      if (error) throw error;

      // 4. Record Usage
      if (talent?.id) {
        await addServiceUsed("CAREER_ASSESSMENT");
      }

      toast({
        title: "Assessment Complete",
        description: "Your personalized report is ready!",
      });

      // 5. Navigate
      if (data?.assessmentId) {
        navigate(`/assessment-results/${data.assessmentId}`);
      } else {
        // Safe fallback
        navigate("/app/services");
      }
    } catch (error: any) {
      console.error("Assessment processing failed:", error);
      toast({
        title: "Analysis Failed",
        description: "We couldn't generate your report. Please try again.",
        variant: "destructive",
      });
      setStep("lead-capture");
      hasProcessedRef.current = false; // Reset lock to allow retry
    } finally {
      setIsProcessing(false);
    }
  };

  // Safe navigation fallback for 'Back' button
  const handleBack = () => {
    if (step === "intro") navigate("/app/services");
    else if (step === "profession") setStep("intro");
    else if (step === "questions") setStep("profession");
    else if (step === "lead-capture") setStep("questions");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 min-h-screen">
      {/* Progress Bar (Visual Step Indicator) */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
          <span>Start</span>
          <span>Role</span>
          <span>Questions</span>
          <span>Review</span>
          <span>Finish</span>
        </div>
        <Progress value={STEP_PROGRESS[step]} className="h-1.5" />
      </div>

      {/* Back Button */}
      {step !== "processing" && (
        <Button variant="ghost" className="mb-4 -ml-2" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step === "intro" ? "Back to Services" : "Back"}
        </Button>
      )}

      {/* Intro Step */}
      {step === "intro" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="px-4 py-1">
              Career Readiness Assessment
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">Discover Your Career Potential</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Our AI-powered assessment analyzes your skills, interests, and experience to provide actionable career
              insights tailored just for you.
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-8 pb-8 px-6">
              <div className="grid gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Role Specific</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Questions tailored to your target profession line.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">AI Analysis</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Get a detailed breakdown of your strengths & gaps.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Action Plan</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Receive a personalized roadmap for growth.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                <Button
                  className="w-full md:w-auto md:min-w-[200px] h-12 text-base shadow-lg"
                  size="lg"
                  onClick={() => setStep("profession")}
                >
                  Start Assessment
                  <CheckCircle className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profession Selection */}
      {step === "profession" && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <ProfessionSelector categories={categories} onSelect={handleCategorySelect} onBack={() => setStep("intro")} />
        </div>
      )}

      {/* Questions */}
      {step === "questions" && selectedCategory && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <AssessmentStepper
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            onComplete={handleQuestionsComplete}
            onBack={() => setStep("profession")}
          />
        </div>
      )}

      {/* Lead Capture */}
      {step === "lead-capture" && selectedCategory && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <LeadCaptureForm
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            answers={answers}
            email={email}
            onComplete={handleLeadCaptureComplete}
            onBack={() => setStep("questions")}
          />
        </div>
      )}

      {/* Processing */}
      {step === "processing" && (
        <div className="py-12 animate-in fade-in duration-700">
          <ProcessingCard stages={ASSESSMENT_PROCESSING_STAGES} title="Generating Your Career Report" />
        </div>
      )}
    </div>
  );
}
