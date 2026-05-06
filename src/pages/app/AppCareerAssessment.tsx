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
import { ArrowLeft, Target, TrendingUp, CheckCircle, Sparkles, Zap } from "lucide-react";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { recordToolRun } from "@/hooks/useToolRuns";
import { useToast } from "@/hooks/use-toast";

/**
 * Platform Logic: Career Readiness Connection
 * Orchestrates high-fidelity career diagnostics with AI-powered telemetry.
 */

const ASSESSMENT_PROCESSING_STAGES = [
  { progress: 0, message: "Connecting..." },
  { progress: 15, message: "Parsing Logic Artifacts..." },
  { progress: 35, message: "AI evaluation in progress..." },
  { progress: 55, message: "Mapping Competency Gaps..." },
  { progress: 75, message: "Generating Executive Report..." },
  { progress: 90, message: "Saving..." },
];

export type AssessmentStep = "intro" | "profession" | "questions" | "lead-capture" | "processing";

const STEP_PROGRESS: Record<AssessmentStep, number> = {
  intro: 5,
  profession: 25,
  questions: 50,
  "lead-capture": 75,
  processing: 95,
};

const ASSESSMENT_COST = 50;

export default function AppCareerAssessment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, user, addServiceUsed } = useTalent();
  const { canAfford, deductCredits } = useCredits();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<AssessmentStep>("intro");
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (talent?.email || user?.email) {
      setEmail(talent?.email || user?.email || "");
    }
  }, [talent, user]);

  useEffect(() => {
    loadCategories();
  }, []);

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
      console.error("Diagnostic Failure: Category Load", error);
    }
  };

  const processAssessment = async () => {
    if (!selectedCategory || hasProcessedRef.current) return;

    setIsProcessing(true);
    hasProcessedRef.current = true;

    try {
      if (!canAfford("CAREER_ASSESSMENT")) {
        toast({
          title: "Insufficient Credits",
          description: `This diagnostic requires ${ASSESSMENT_COST} credits.`,
          variant: "destructive",
        });
        setStep("lead-capture");
        hasProcessedRef.current = false;
        return;
      }

      const paid = await deductCredits("CAREER_ASSESSMENT", undefined, "Career Assessment Diagnostic");
      if (!paid) throw new Error("Credit handshake failed.");

      const { data, error } = await supabase.functions.invoke("analyze-career-assessment", {
        body: { answers, professionCategoryId: selectedCategory.id, email, talentId: talent?.id },
      });

      if (error) throw error;

      if (talent?.id) await addServiceUsed("CAREER_ASSESSMENT");

      toast({ title: "Analysis Finalized", description: "Your executive report is now active." });

      recordToolRun({ toolKey: "assessment", costCredits: 100, payload: { assessment_id: data?.assessmentId } });
      if (data?.assessmentId) navigate(`/assessment-results/${data.assessmentId}`);
      else navigate("/app/jobs?tab=tools");
    } catch (error: any) {
      toast({
        title: "Failed",
        description: "Network logic error. Re-initialize sequence.",
        variant: "destructive",
      });
      setStep("lead-capture");
      hasProcessedRef.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 min-h-svh space-y-10">
      <header className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Assessment Sequence</p>
            <h2 className="text-sm font-bold uppercase tracking-tight text-muted-foreground/60">
              {step.replace("-", " ")}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/40">{STEP_PROGRESS[step]}% Completion</span>
        </div>
        <Progress value={STEP_PROGRESS[step]} className="h-1.5 rounded-full bg-primary/10" />
      </header>

      {step !== "processing" && (
        <Button
          variant="ghost"
          className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 group"
          onClick={() => {
            if (step === "intro") navigate("/app/services");
            else if (step === "profession") setStep("intro");
            else if (step === "questions") setStep("profession");
            else if (step === "lead-capture") setStep("questions");
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Terminate / Revert
        </Button>
      )}

      <main className="relative">
        {step === "intro" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
              <Badge
                variant="outline"
                className="rounded-lg px-4 py-1 border-primary/20 text-primary font-black uppercase tracking-widest text-[9px]"
              >
                Diagnostic Protocol 2.0
              </Badge>
              <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Career Readiness</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 italic max-w-lg mx-auto">
                AI-powered skill mapping and neural career intelligence.
              </p>
            </div>

            <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-12">
                <div className="grid gap-12 md:grid-cols-3 mb-12">
                  {[
                    { icon: Target, title: "Precision Mapping", desc: "Role-specific telemetry." },
                    { icon: Sparkles, title: "AI Logic", desc: "Deep gap analysis." },
                    { icon: TrendingUp, title: "Strategic Plan", desc: "Executive roadmap." },
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center space-y-4">
                      <div className="p-5 bg-primary/10 rounded-[24px] rotate-3 shadow-xl">
                        <item.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-black uppercase tracking-tighter text-lg">{item.title}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full rounded-2xl h-14 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                  onClick={() => setStep("profession")}
                >
                  <Zap className="mr-3 h-5 w-5" />
                  Initialize Assessment
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "profession" && (
          <div className="animate-in zoom-in-95 duration-500">
            <ProfessionSelector
              categories={categories}
              onSelect={(c) => {
                setSelectedCategory(c);
                setStep("questions");
              }}
              onBack={() => setStep("intro")}
            />
          </div>
        )}

        {step === "questions" && selectedCategory && (
          <div className="animate-in slide-in-from-right-10 duration-500">
            <AssessmentStepper
              categoryId={selectedCategory.id}
              categoryName={selectedCategory.name}
              onComplete={(a) => {
                setAnswers(a);
                setStep("lead-capture");
              }}
              onBack={() => setStep("profession")}
            />
          </div>
        )}

        {step === "lead-capture" && selectedCategory && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <LeadCaptureForm
              categoryId={selectedCategory.id}
              categoryName={selectedCategory.name}
              answers={answers}
              email={email}
              // FIX: Connection aligned with () => void signature
              onComplete={() => {
                setStep("processing");
              }}
              onBack={() => setStep("questions")}
            />
          </div>
        )}

        {step === "processing" && (
          <div className="py-20 animate-in fade-in duration-1000">
            <ProcessingCard stages={ASSESSMENT_PROCESSING_STAGES} title="Profile Sync" />
          </div>
        )}
      </main>
    </div>
  );
}
