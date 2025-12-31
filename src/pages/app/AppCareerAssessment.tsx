import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProfessionSelector } from "@/components/assessment/ProfessionSelector";
import { AssessmentStepper } from "@/components/assessment/AssessmentStepper";
import { LeadCaptureForm } from "@/components/assessment/LeadCaptureForm";
import { ProcessingCard } from "@/components/ui/processing-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, TrendingUp, CheckCircle, Sparkles } from "lucide-react";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useTalent } from "@/hooks/useTalent";

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

export default function AppCareerAssessment() {
  const navigate = useNavigate();
  const { talent, user, addServiceUsed } = useTalent();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<AssessmentStep>("intro");
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProfessionCategory | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [urlProfessionId] = useState(() => searchParams.get("profession"));

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
      const urlCategory = categories.find(c => c.id === urlProfessionId);
      if (urlCategory) {
        setSelectedCategory(urlCategory);
        return;
      }
    }
    
    if (talent?.professionCategoryId && !selectedCategory) {
      const talentCategory = categories.find(c => c.id === talent.professionCategoryId);
      if (talentCategory) {
        setSelectedCategory(talentCategory);
      }
    }
  }, [talent, categories, selectedCategory, urlProfessionId]);

  useEffect(() => {
    loadCategories();
  }, []);

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

  const handleLeadCaptureComplete = () => {
    setStep("processing");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back Button - only show on intro/profession */}
      {(step === "intro" || step === "profession") && (
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => step === "intro" ? navigate('/app/services') : setStep("intro")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step === "intro" ? "Back to Services" : "Back"}
        </Button>
      )}

      {/* Intro Step */}
      {step === "intro" && (
        <div className="space-y-6">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">Career Readiness Assessment</Badge>
            <h1 className="text-2xl font-bold mb-2">Discover Your Career Readiness</h1>
            <p className="text-muted-foreground">
              Get AI-powered insights into your strengths and areas for improvement
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Profession-Specific</h3>
                  <p className="text-sm text-muted-foreground">Questions tailored to your career path</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">Get personalized recommendations</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Career Insights</h3>
                  <p className="text-sm text-muted-foreground">Actionable steps for growth</p>
                </div>
              </div>
              
              <Button 
                className="w-full mt-6" 
                size="lg"
                onClick={() => setStep("profession")}
              >
                Start Assessment
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profession Selection */}
      {step === "profession" && (
        <ProfessionSelector
          categories={categories}
          onSelect={handleCategorySelect}
          onBack={() => setStep("intro")}
        />
      )}

      {/* Questions */}
      {step === "questions" && selectedCategory && (
        <AssessmentStepper
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
          onComplete={handleQuestionsComplete}
          onBack={() => setStep("profession")}
        />
      )}

      {/* Lead Capture */}
      {step === "lead-capture" && selectedCategory && (
        <LeadCaptureForm
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
          answers={answers}
          email={email}
          onComplete={handleLeadCaptureComplete}
          onBack={() => setStep("questions")}
        />
      )}

      {/* Processing */}
      {step === "processing" && (
          <ProcessingCard
            stages={ASSESSMENT_PROCESSING_STAGES}
            title="Analyzing Your Responses"
          />
      )}
    </div>
  );
}
