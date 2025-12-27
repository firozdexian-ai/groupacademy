import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useProgressiveLoadingMessage } from "@/hooks/useProgressiveLoadingMessage";
import { AuthGate } from "@/components/AuthGate";
import { useTalent } from "@/hooks/useTalent";

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
}

type SetupStep = "email-check" | "cooldown" | "access-code" | "job-description" | "configuration" | "generating";

interface InterviewConfig {
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  professionCategoryId: string | null;
  additionalNotes: string;
}

function MockInterviewSetupContent() {
  const navigate = useNavigate();
  const { talent, user, addServiceUsed } = useTalent();
  const [step, setStep] = useState<SetupStep>("job-description"); // Skip email check - user is authenticated
  
  // Email from talent profile or auth session
  const [email, setEmail] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState<string | null>(null);
  const [existingInterview, setExistingInterview] = useState<any>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  
  // Access code state
  const [accessCode, setAccessCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  
  // Job description state
  const [jobDescription, setJobDescription] = useState("");
  
  // Configuration state
  const [config, setConfig] = useState<InterviewConfig>({
    questionCount: 5,
    difficulty: "medium",
    professionCategoryId: null,
    additionalNotes: ""
  });
  
  // Profession categories
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-fill email from talent profile
  useEffect(() => {
    if (talent?.email) {
      setEmail(talent.email);
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [talent, user]);

  // Auto-set profession category from talent profile
  useEffect(() => {
    if (talent?.professionCategoryId && !config.professionCategoryId) {
      setConfig(prev => ({ ...prev, professionCategoryId: talent.professionCategoryId || null }));
    }
  }, [talent?.professionCategoryId]);

  useEffect(() => {
    loadCategories();
  }, []);

  // Check cooldown when email is set
  useEffect(() => {
    if (email) {
      checkCooldown();
    }
  }, [email]);

  const checkCooldown = async () => {
    if (!email) return;
    
    try {
      setCheckingEmail(true);
      const { data: existing, error } = await supabase
        .from("mock_interviews")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setCheckingEmail(false);
      
      if (error) {
        console.error("Error checking cooldown:", error);
        return;
      }
      
      if (existing && new Date(existing.expires_at) > new Date()) {
        setExistingInterview(existing);
        const expiresAt = new Date(existing.expires_at);
        const now = new Date();
        const diffTime = expiresAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays);
        setStep("cooldown");
      }
    } catch (error) {
      console.error("Error checking cooldown:", error);
      setCheckingEmail(false);
    }
  };

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

  const { message: loadingMessage } = useProgressiveLoadingMessage(checkingEmail);

  const handleEmailCheck = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setCheckingEmail(true);
    setEmailCheckError(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.DEFAULT);

    try {
      const queryPromise = supabase
        .from("mock_interviews")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const abortPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => 
          reject(new Error("Request timed out"))
        );
      });

      const { data: existing, error } = await Promise.race([queryPromise, abortPromise]);
      clearTimeout(timeoutId);

      if (error) {
        console.error("Database error checking email:", error);
        throw new Error("Failed to check email. Please try again.");
      }

      if (existing && new Date(existing.expires_at) > new Date()) {
        setExistingInterview(existing);
        const expiresAt = new Date(existing.expires_at);
        const now = new Date();
        const diffTime = expiresAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays);
        setStep("cooldown");
      } else {
        setStep("job-description");
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Error checking email:", error);
      const errorMessage = error?.name === "AbortError" || error?.message?.includes("timed out")
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
      const { data: codeData, error: codeError } = await supabase
        .from("mock_interview_access_codes")
        .select("*")
        .eq("code", accessCode.trim().toUpperCase())
        .eq("email", email.toLowerCase().trim())
        .eq("is_used", false)
        .maybeSingle();

      if (codeError || !codeData) {
        toast.error("Invalid or expired access code");
        return;
      }

      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast.error("This access code has expired");
        return;
      }

      await supabase
        .from("mock_interview_access_codes")
        .update({ is_used: true })
        .eq("id", codeData.id);

      toast.success("Access code validated! You can now start your interview.");
      setStep("job-description");
    } catch (error) {
      console.error("Error validating code:", error);
      toast.error("Failed to validate access code");
    } finally {
      setValidatingCode(false);
    }
  };

  const handleJobDescriptionSubmit = () => {
    if (!jobDescription.trim() || jobDescription.length < 50) {
      toast.error("Please enter a complete job description (at least 50 characters)");
      return;
    }
    setStep("configuration");
  };

  const handleStartInterview = async () => {
    setIsGenerating(true);
    setStep("generating");

    // Validate UUID before submission
    const isValidUUID = (str: string | null | undefined): boolean => {
      if (!str) return false;
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidV4Regex.test(str);
    };

    // Create timeout promise (90 seconds for AI generation)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Generation timed out")), TIMEOUTS.AI_GENERATION);
    });

    try {
      // Call edge function to generate questions
      const functionPromise = supabase.functions.invoke("generate-interview-questions", {
        body: {
          jobDescription,
          questionCount: config.questionCount,
          difficulty: config.difficulty,
          professionCategoryId: isValidUUID(config.professionCategoryId) ? config.professionCategoryId : null,
          additionalNotes: config.additionalNotes
        }
      });

      const { data, error } = await Promise.race([
        functionPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to generate questions");
      }

      if (!data || !data.questions) {
        throw new Error("Invalid response from AI. Please try again.");
      }

      // Generate a temporary ID for the interview
      const tempInterviewId = crypto.randomUUID();
      
      // Create mock interview record with talent_id linkage
      const { error: insertError } = await supabase
        .from("mock_interviews")
        .insert({
          id: tempInterviewId,
          email: email.toLowerCase().trim(),
          full_name: talent?.fullName || "", // Pre-fill from talent profile
          phone: talent?.phone || null,
          job_description: jobDescription,
          job_title: data.jobTitle,
          company_name: data.companyName,
          question_count: config.questionCount,
          difficulty: config.difficulty,
          profession_category_id: isValidUUID(config.professionCategoryId) ? config.professionCategoryId : null,
          additional_notes: config.additionalNotes,
          questions: data.questions,
          status: "in_progress",
          user_id: user?.id || null,
          talent_id: talent?.id || null
        });

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw new Error("Failed to save interview. Please try again.");
      }

      // Track service usage
      if (talent?.id) {
        await addServiceUsed("mock_interview");
      }

      toast.success("Questions generated! Starting your interview...");
      navigate(`/mock-interview/questions/${tempInterviewId}`);
    } catch (error: any) {
      console.error("Error generating questions:", error);
      const errorMessage = error?.message === "Generation timed out"
        ? "Question generation took too long. Please try again."
        : error?.message || "Failed to generate questions. Please try again.";
      toast.error(errorMessage);
      setStep("configuration");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-12">
        {/* Email Check Step */}
        {step === "email-check" && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Let's Get Started</CardTitle>
              <CardDescription>
                Enter your email to begin your AI mock interview
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
                    {loadingMessage}
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
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => navigate("/mock-interview")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Overview
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cooldown Step */}
        {step === "cooldown" && existingInterview && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle>Interview Cooldown Active</CardTitle>
              <CardDescription>
                You've completed a mock interview recently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Interview</span>
                  <span className="font-medium">
                    {new Date(existingInterview.created_at).toLocaleDateString()}
                  </span>
                </div>
                {existingInterview.selection_percentage !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Selection Score</span>
                    <Badge variant="secondary" className="text-lg">
                      {existingInterview.selection_percentage}%
                    </Badge>
                  </div>
                )}
                {existingInterview.job_title && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Position</span>
                    <span className="font-medium text-sm">{existingInterview.job_title}</span>
                  </div>
                )}
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <CalendarDays className="w-5 h-5" />
                  <span className="text-sm">Free Retake Available In</span>
                </div>
                <p className="text-3xl font-bold text-primary">{daysRemaining} days</p>
              </div>

              <div className="space-y-3">
                {existingInterview.id && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate(`/mock-interview/results/${existingInterview.id}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Previous Results
                  </Button>
                )}
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or start new interview
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
                onClick={() => {
                  setEmail("");
                  setExistingInterview(null);
                  setStep("email-check");
                }}
              >
                Use Different Email
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Access Code Step */}
        {step === "access-code" && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Enter Access Code</CardTitle>
              <CardDescription>
                Enter your paid access code to start a new interview
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
                {validatingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    Validate & Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <div className="text-center space-y-2 pt-4">
                <p className="text-sm text-muted-foreground">
                  Don't have an access code?
                </p>
                <Button 
                  variant="link" 
                  className="text-primary"
                  onClick={() => window.open(`https://wa.me/8801708459008?text=Hi, I want to purchase a mock interview access code for ${email}`, "_blank")}
                >
                  Purchase on WhatsApp (BDT 100)
                </Button>
              </div>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setStep("cooldown")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Job Description Step */}
        {step === "job-description" && (
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <BriefcaseIcon className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Paste Job Description</CardTitle>
              <CardDescription>
                Copy and paste the job description you're preparing for. 
                Our AI will generate relevant interview questions based on it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the complete job description here including responsibilities, requirements, qualifications..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[250px] resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {jobDescription.length} characters (minimum 50)
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => existingInterview ? setStep("cooldown") : setStep("email-check")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleJobDescriptionSubmit}
                  disabled={jobDescription.length < 50}
                >
                  Continue to Settings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Step */}
        {step === "configuration" && (
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Configure Your Interview</CardTitle>
              <CardDescription>
                Customize your mock interview experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Count */}
              <div className="space-y-3">
                <Label>Number of Questions</Label>
                <RadioGroup
                  value={String(config.questionCount)}
                  onValueChange={(value) => setConfig({ ...config, questionCount: Number(value) })}
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { value: "5", label: "5 Questions", desc: "Quick" },
                    { value: "8", label: "8 Questions", desc: "Standard" },
                    { value: "10", label: "10 Questions", desc: "Comprehensive" }
                  ].map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`q-${option.value}`}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                        config.questionCount === Number(option.value)
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={`q-${option.value}`} className="sr-only" />
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.desc}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Difficulty */}
              <div className="space-y-3">
                <Label>Difficulty Level</Label>
                <RadioGroup
                  value={config.difficulty}
                  onValueChange={(value: "easy" | "medium" | "hard") => setConfig({ ...config, difficulty: value })}
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { value: "easy", label: "Easy", desc: "Entry-level" },
                    { value: "medium", label: "Medium", desc: "Mid-level" },
                    { value: "hard", label: "Hard", desc: "Senior-level" }
                  ].map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`d-${option.value}`}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                        config.difficulty === option.value
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={`d-${option.value}`} className="sr-only" />
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.desc}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Profession Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Profession Category (Optional)</Label>
                <Select
                  value={config.professionCategoryId || "none"}
                  onValueChange={(value) => setConfig({ ...config, professionCategoryId: value === "none" ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific areas you'd like to focus on, your experience level, etc."
                  value={config.additionalNotes}
                  onChange={(e) => setConfig({ ...config, additionalNotes: e.target.value })}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep("job-description")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleStartInterview}
                >
                  Start Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold mb-2">Generating Your Interview</h2>
                <p className="text-muted-foreground">
                  Our AI is analyzing the job description and creating tailored interview questions...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}

// Wrap with AuthGate to require authentication
export default function MockInterviewSetup() {
  return (
    <AuthGate message="Sign in to access AI Mock Interview. Your progress will be saved to your account.">
      <MockInterviewSetupContent />
    </AuthGate>
  );
}
