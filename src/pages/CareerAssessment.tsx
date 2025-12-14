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
import { ArrowRight, Clock, Target, TrendingUp, CheckCircle, Lock, KeyRound, CalendarDays, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

// Brand icon
import iconScorecard from "@/assets/icons/icon-scorecard.png";

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

type AssessmentStep = "landing" | "email-check" | "cooldown" | "access-code" | "profession" | "questions" | "lead-capture" | "processing";

export default function CareerAssessment() {
  const [step, setStep] = useState<AssessmentStep>("landing");
  const [email, setEmail] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProfessionCategory | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [existingAssessment, setExistingAssessment] = useState<any>(null);
  const [accessCode, setAccessCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Categories loading timed out")), 10000);
      });

      const queryPromise = supabase
        .from("profession_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      // Categories are non-critical, silently fail
    }
  };

  const handleEmailCheck = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setCheckingEmail(true);
    setEmailCheckError(null);
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), 15000);
    });

    try {
      const queryPromise = supabase
        .from("career_assessments")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Race between query and timeout
      const { data: existing, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error("Database error checking email:", error);
        throw new Error("Failed to check email. Please try again.");
      }

      if (existing && new Date(existing.expires_at) > new Date()) {
        setExistingAssessment(existing);
        const expiresAt = new Date(existing.expires_at);
        const now = new Date();
        const diffTime = expiresAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays);
        setStep("cooldown");
      } else {
        setStep("profession");
      }
    } catch (error: any) {
      console.error("Error checking email:", error);
      const errorMessage = error?.message === "Request timed out" 
        ? "Connection timed out. Please check your internet and try again."
        : "Something went wrong. Please try again.";
      setEmailCheckError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleAccessCodeValidation = async () => {
    if (!accessCode.trim()) {
      toast.error("Please enter an access code");
      return;
    }

    setValidatingCode(true);
    try {
      // Check if the access code is valid
      const { data: codeData, error: codeError } = await supabase
        .from("assessment_access_codes")
        .select("*")
        .eq("code", accessCode.trim().toUpperCase())
        .eq("email", email.toLowerCase().trim())
        .eq("is_used", false)
        .maybeSingle();

      if (codeError || !codeData) {
        toast.error("Invalid or expired access code");
        return;
      }

      // Check if code is expired
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast.error("This access code has expired");
        return;
      }

      // Mark code as used
      await supabase
        .from("assessment_access_codes")
        .update({ is_used: true })
        .eq("id", codeData.id);

      toast.success("Access code validated! You can now retake the assessment.");
      setStep("profession");
    } catch (error) {
      console.error("Error validating code:", error);
      toast.error("Failed to validate access code");
    } finally {
      setValidatingCode(false);
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailCheckError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && !checkingEmail && handleEmailCheck()}
                  />
                </div>
                
                {emailCheckError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {emailCheckError}
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  onClick={handleEmailCheck}
                  disabled={checkingEmail}
                >
                  {checkingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : emailCheckError ? (
                    <>
                      Try Again
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "cooldown" && existingAssessment && (
          <div className="container max-w-lg mx-auto px-4 py-16">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle>Assessment Cooldown Active</CardTitle>
                <CardDescription>
                  You've already completed an assessment recently
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Previous Assessment Info */}
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Assessment</span>
                    <span className="font-medium">
                      {new Date(existingAssessment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Your Score</span>
                    <Badge variant="secondary" className="text-lg">
                      {existingAssessment.percentage}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Readiness Level</span>
                    <Badge variant="outline" className="capitalize">
                      {existingAssessment.readiness_level}
                    </Badge>
                  </div>
                </div>

                {/* Days Remaining */}
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <CalendarDays className="w-5 h-5" />
                    <span className="text-sm">Free Retake Available In</span>
                  </div>
                  <p className="text-3xl font-bold text-primary">{daysRemaining} days</p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => window.location.href = `/assessment-results/${existingAssessment.id}`}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Previous Results
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or retake now
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => setStep("access-code")}
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Use Access Code (BDT 100)
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Contact us on WhatsApp at +8801708459008 to purchase an access code
                  </p>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setStep("email-check")}
                >
                  Use Different Email
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "access-code" && (
          <div className="container max-w-md mx-auto px-4 py-16">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Enter Access Code</CardTitle>
                <CardDescription>
                  Enter your paid access code to retake the assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Access Code</Label>
                  <Input
                    id="accessCode"
                    type="text"
                    placeholder="XXXXXXXX"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleAccessCodeValidation()}
                    className="text-center text-lg tracking-widest font-mono"
                    maxLength={8}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAccessCodeValidation}
                  disabled={validatingCode}
                >
                  {validatingCode ? "Validating..." : "Validate & Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <div className="text-center space-y-2 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Don't have an access code?
                  </p>
                  <Button 
                    variant="link" 
                    className="text-primary"
                    onClick={() => window.open("https://wa.me/8801708459008?text=Hi, I want to purchase an assessment retake access code for " + email, "_blank")}
                  >
                    Purchase on WhatsApp (BDT 100)
                  </Button>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setStep("cooldown")}
                >
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "profession" && (
          <ProfessionSelector
            categories={categories}
            onSelect={handleCategorySelect}
            onBack={() => existingAssessment ? setStep("cooldown") : setStep("email-check")}
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
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 via-secondary/5 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="icon-container-lg mx-auto mb-6">
              <img src={iconScorecard} alt="Career Scorecard" className="w-11 h-11 object-contain" />
            </div>
            <Badge className="mb-4 gap-2 border-primary/30 text-primary" variant="outline">
              <Sparkles className="w-3 h-3" />
              FREE Assessment • 5 Minutes
            </Badge>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
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
