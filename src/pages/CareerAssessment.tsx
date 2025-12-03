import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProfessionSelector } from "@/components/assessment/ProfessionSelector";
import { AssessmentStepper } from "@/components/assessment/AssessmentStepper";
import { LeadCaptureForm } from "@/components/assessment/LeadCaptureForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Target, TrendingUp, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

type AssessmentStep = "landing" | "email-check" | "profession" | "questions" | "lead-capture" | "processing";

export default function CareerAssessment() {
  const [step, setStep] = useState<AssessmentStep>("landing");
  const [email, setEmail] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProfessionCategory | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [existingAssessment, setExistingAssessment] = useState<any>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("profession_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order");
    if (data) setCategories(data);
  };

  const handleEmailCheck = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setCheckingEmail(true);
    try {
      const { data: existing } = await supabase
        .from("career_assessments")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing && new Date(existing.expires_at) > new Date()) {
        setExistingAssessment(existing);
        toast.info("You have a recent assessment. You can retake after 90 days or use an access code.");
      } else {
        setStep("profession");
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setStep("profession");
    } finally {
      setCheckingEmail(false);
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {step === "landing" && (
          <LandingSection onStart={() => setStep("email-check")} />
        )}

        {step === "email-check" && (
          <div className="container max-w-md mx-auto px-4 py-16">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Let's Get Started</CardTitle>
                <CardDescription>
                  Enter your email to begin or check your previous assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailCheck()}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleEmailCheck}
                  disabled={checkingEmail}
                >
                  {checkingEmail ? "Checking..." : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {existingAssessment && (
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Your last assessment was on{" "}
                      {new Date(existingAssessment.created_at).toLocaleDateString()}.
                      Score: <strong>{existingAssessment.percentage}%</strong>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/assessment-results/${existingAssessment.id}`}
                      >
                        View Results
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStep("profession")}
                      >
                        Retake with Code
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === "profession" && (
          <ProfessionSelector
            categories={categories}
            onSelect={handleCategorySelect}
            onBack={() => setStep("email-check")}
          />
        )}

        {step === "questions" && selectedCategory && (
          <AssessmentStepper
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            onComplete={handleQuestionsComplete}
            onBack={() => setStep("profession")}
          />
        )}

        {step === "lead-capture" && selectedCategory && (
          <LeadCaptureForm
            email={email}
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            answers={answers}
            onComplete={handleLeadCaptureComplete}
            onBack={() => setStep("questions")}
          />
        )}

        {step === "processing" && (
          <div className="container max-w-md mx-auto px-4 py-16 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Analyzing Your Responses</h2>
            <p className="text-muted-foreground">
              Our AI is generating your personalized career insights...
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function LandingSection({ onStart }: { onStart: () => void }) {
  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            FREE Assessment • 5 Minutes
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How Job-Ready Are You?
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Take our AI-powered Career Readiness Scorecard and discover your strengths, 
            areas for improvement, and personalized recommendations to accelerate your career.
          </p>
          <Button size="lg" onClick={onStart} className="text-lg px-8 py-6">
            Start Free Assessment
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-16 border-t">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Personalized Insights</h3>
            <p className="text-sm text-muted-foreground">
              Get AI-powered analysis tailored to your profession and experience level
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">Actionable Steps</h3>
            <p className="text-sm text-muted-foreground">
              Receive specific recommendations to improve your career readiness
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Quick & Free</h3>
            <p className="text-sm text-muted-foreground">
              Complete in just 5 minutes with instant results and PDF download
            </p>
          </div>
        </div>
      </section>

      {/* What You'll Get Section */}
      <section className="container mx-auto px-6 py-16 border-t">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">What You'll Get</h2>
          <div className="space-y-4">
            {[
              "Overall Career Readiness Score with industry benchmarks",
              "Detailed breakdown by skills, market awareness, and planning",
              "AI-generated strengths and improvement areas",
              "Personalized course and resource recommendations",
              "Downloadable PDF report to track your progress",
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button size="lg" onClick={onStart}>
              Take the Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
