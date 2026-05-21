import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { markAssessmentAccessCodeUsed } from "@/domains/marketing/repo/marketingRepo";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProfessionSelector } from "@/components/assessment/ProfessionSelector";
import { AssessmentStepper } from "@/components/assessment/AssessmentStepper";
import { LeadCaptureForm } from "@/components/assessment/LeadCaptureForm";
import { ProcessingCard } from "@/components/ui/processing-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  Lock,
  KeyRound,
  CalendarDays,
  ExternalLink,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useProgressiveLoadingMessage } from "@/hooks/useProgressiveLoadingMessage";
import { AuthGate } from "@/components/AuthGate";
import { useTalent } from "@/hooks/useTalent";
import { cn } from "@/lib/utils";

// Brand icon
import iconScorecard from "@/assets/icons/icon-scorecard.png";

const ASSESSMENT_PROCESSING_STAGES = [
  { progress: 0, message: "Initializing Neural Engine..." },
  { progress: 20, message: "Mapping professional responses..." },
  { progress: 45, message: "Cross-referencing industry benchmarks..." },
  { progress: 70, message: "Gemini AI: Generating strategic report..." },
  { progress: 95, message: "Finalizing readiness certificate..." },
];

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

type AssessmentStep =
  | "landing"
  | "email-check"
  | "cooldown"
  | "access-code"
  | "profession"
  | "questions"
  | "lead-capture"
  | "processing";

function CareerAssessmentContent() {
  const { talent, user } = useTalent();
  const [searchParams] = useSearchParams();
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

  // Auto-fill and State Sync
  useEffect(() => {
    if (talent?.email) setEmail(talent.email);
    else if (user?.email) setEmail(user.email);
  }, [talent, user]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("profession_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      if (data) setCategories(data);
    } catch (err) {
      console.error("Critical: Failed to load taxonomy.");
    }
  };

  const { message: loadingMessage } = useProgressiveLoadingMessage(checkingEmail);

  const handleEmailCheck = async () => {
    if (!email.trim()) return toast.error("Entry identity required.");
    setCheckingEmail(true);

    try {
      const { data: existing, error } = await supabase
        .from("career_assessments")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (existing && new Date(existing.expires_at) > new Date()) {
        setExistingAssessment(existing);
        const diffDays = Math.ceil((new Date(existing.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays);
        setStep("cooldown");
      } else {
        setStep("profession");
      }
    } catch (err) {
      setEmailCheckError("Network handshake failed. Please refresh.");
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleAccessCodeValidation = async () => {
    if (!accessCode.trim()) return toast.error("Verification code required.");
    setValidatingCode(true);
    try {
      const { data: codeData, error } = await supabase
        .from("assessment_access_codes")
        .select("*")
        .eq("code", accessCode.trim().toUpperCase())
        .eq("email", email.toLowerCase().trim())
        .eq("is_used", false)
        .maybeSingle();

      if (error || !codeData) throw new Error("Invalid sequence.");

      await markAssessmentAccessCodeUsed(codeData.id);
      toast.success("Retake Authorized.");
      setStep("profession");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setValidatingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <Navbar />
      <main className="flex-1">
        {step === "landing" && <LandingSection onStart={() => setStep("email-check")} />}

        {step === "email-check" && (
          <div className="container max-w-md mx-auto px-4 py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="rounded-[32px] border-border/40 shadow-2xl overflow-hidden">
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tighter">Initialize Identity</CardTitle>
                <CardDescription className="font-medium text-xs uppercase tracking-widest">
                  Saving your progress to the cloud
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest ml-1">
                    Work Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-border/40 focus-visible:ring-primary/20"
                  />
                </div>
                <Button
                  className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                  onClick={handleEmailCheck}
                  disabled={checkingEmail}
                >
                  {checkingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {checkingEmail ? loadingMessage : "Begin Handshake"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "cooldown" && existingAssessment && (
          <div className="container max-w-lg mx-auto px-4 py-20 animate-in zoom-in-95 duration-500">
            <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden">
              <div className="bg-amber-500/5 p-8 text-center border-b border-amber-500/10">
                <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tighter text-amber-900">Analysis Cooldown</CardTitle>
                <p className="text-xs font-bold text-amber-700/60 uppercase tracking-widest mt-1">
                  One assessment per quarter permitted
                </p>
              </div>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/40">
                    <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground mb-1">
                      Previous Score
                    </p>
                    <p className="text-xl font-black text-primary">{existingAssessment.percentage}%</p>
                  </div>
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/40">
                    <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground mb-1">
                      Status
                    </p>
                    <p className="text-xl font-black uppercase text-foreground/40">
                      {existingAssessment.readiness_level}
                    </p>
                  </div>
                </div>

                <div className="text-center py-6 px-4 bg-primary/5 rounded-3xl border border-primary/10 relative overflow-hidden group">
                  <div className="relative z-10">
                    <CalendarDays className="w-6 h-6 text-primary mx-auto mb-2 opacity-50" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                      Free Retake Window
                    </p>
                    <p className="text-4xl font-black text-primary tracking-tighter mt-1">{daysRemaining} Days</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs"
                    variant="outline"
                    onClick={() => (window.location.href = `/assessment-results/${existingAssessment.id}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Review Current Report
                  </Button>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/40" />
                    </div>
                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                      <span className="bg-card px-4 text-muted-foreground/40">Override Protocol</span>
                    </div>
                  </div>
                  <Button
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => setStep("access-code")}
                  >
                    <KeyRound className="mr-2 h-4 w-4" /> Use Priority Access Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "access-code" && (
          <div className="container max-w-md mx-auto px-4 py-20 animate-in fade-in duration-500">
            <Card className="rounded-[32px] border-border/40 shadow-2xl">
              <CardHeader className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-primary fill-primary" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tighter">Bypass Cooldown</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                  Enter priority access sequence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="CODE-XXXX"
                  className="h-14 text-center text-xl font-black tracking-[0.3em] rounded-xl border-border/40 bg-muted/20"
                  maxLength={8}
                />
                <Button
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                  onClick={handleAccessCodeValidation}
                  disabled={validatingCode}
                >
                  {validatingCode ? <Loader2 className="animate-spin h-4 w-4" /> : "Verify Code"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                  onClick={() => setStep("cooldown")}
                >
                  Abort Bypass
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "profession" && (
          <ProfessionSelector
            categories={categories}
            onSelect={(c) => {
              setSelectedCategory(c);
              setStep("questions");
            }}
            onBack={() => (existingAssessment ? setStep("cooldown") : setStep("email-check"))}
          />
        )}
        {step === "questions" && selectedCategory && (
          <AssessmentStepper
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            onComplete={(a) => {
              setAnswers(a);
              setStep("lead-capture");
            }}
            onBack={() => setStep("profession")}
          />
        )}
        {step === "lead-capture" && selectedCategory && (
          <LeadCaptureForm
            email={email}
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            answers={answers}
            onComplete={() => setStep("processing")}
            onBack={() => setStep("questions")}
          />
        )}
        {step === "processing" && (
          <div className="container max-w-md mx-auto px-4 py-32">
            <ProcessingCard title="Synthesizing Career DNA" stages={ASSESSMENT_PROCESSING_STAGES} duration={60000} />
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
      <section className="relative py-20 md:py-32 bg-background overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)]" />
        <div className="container mx-auto px-6 relative text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              Gemini-Powered Professional Audit
            </span>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
              Are You Truly <br />
              <span className="text-primary">Market Ready?</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Discover your professional velocity. Our AI-driven scorecard identifies your elite strengths and critical
              gaps in under 5 minutes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={onStart}
              className="h-16 px-10 rounded-[20px] text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Analyze Readiness <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Free Performance Report
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20 border-t border-border/40">
        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              icon: Target,
              title: "Precision Mapping",
              desc: "Identify exact skills required for your next tier of professional growth.",
              tint: "primary",
            },
            {
              icon: TrendingUp,
              title: "Velocity Gaps",
              desc: "AI detects the missing links preventing your promotion or salary increase.",
              tint: "secondary",
            },
            {
              icon: ShieldCheck,
              title: "Industry Standard",
              desc: "Benchmark your score against 10k+ professionals in your specific niche.",
              tint: "accent",
            },
          ].map((feat, i) => (
            <div key={i} className="space-y-4 group">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                  `bg-${feat.tint}/10`,
                )}
              >
                <feat.icon className={cn("w-7 h-7", `text-${feat.tint}`)} />
              </div>
              <h3 className="text-lg font-black tracking-tight uppercase">{feat.title}</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default function CareerAssessment() {
  return (
    <AuthGate message="Secure your professional roadmap. Results are archived to your encrypted career profile.">
      <CareerAssessmentContent />
    </AuthGate>
  );
}
