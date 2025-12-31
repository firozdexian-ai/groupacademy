import { useState, useEffect } from "react";
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
import { 
  ArrowRight, 
  ArrowLeft, 
  BriefcaseIcon,
  Settings,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useProgressiveLoadingMessage } from "@/hooks/useProgressiveLoadingMessage";
import { useTalent } from "@/hooks/useTalent";
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

export default function AppMockInterviewSetup() {
  const navigate = useNavigate();
  const { talent, user, addServiceUsed } = useTalent();
  const [step, setStep] = useState<SetupStep>("job-description");
  
  const [email, setEmail] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  const [config, setConfig] = useState<InterviewConfig>({
    questionCount: 5,
    difficulty: "medium",
    professionCategoryId: null,
    additionalNotes: "",
    useProfileContext: true
  });
  
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);

  useEffect(() => {
    if (talent?.email) {
      setEmail(talent.email);
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [talent, user]);

  useEffect(() => {
    if (talent?.professionCategoryId && !config.professionCategoryId) {
      setConfig(prev => ({ ...prev, professionCategoryId: talent.professionCategoryId || null }));
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

    const isValidUUID = (str: string | null | undefined): boolean => {
      if (!str) return false;
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidV4Regex.test(str);
    };

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Generation timed out")), TIMEOUTS.AI_GENERATION);
    });

    try {
      let candidateProfile = null;
      if (config.useProfileContext && talent) {
        candidateProfile = {
          skills: Array.isArray(talent.skills) 
            ? talent.skills.map((s: any) => typeof s === 'string' ? s : s.name || s.skill || String(s))
            : [],
          experience: Array.isArray(talent.experience) 
            ? talent.experience.map((e: any) => `${e.position || e.title || ''} at ${e.company || ''}`.trim()).filter(Boolean)
            : [],
          education: Array.isArray(talent.education)
            ? talent.education.map((e: any) => `${e.degree || ''} from ${e.institution || ''}`.trim()).filter(Boolean)
            : [],
          cvSummary: talent.cvText?.substring(0, 1000) || null
        };
      }

      const functionPromise = supabase.functions.invoke("generate-interview-questions", {
        body: {
          jobDescription,
          questionCount: config.questionCount,
          difficulty: config.difficulty,
          professionCategoryId: isValidUUID(config.professionCategoryId) ? config.professionCategoryId : null,
          additionalNotes: config.additionalNotes,
          candidateProfile
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

      const tempInterviewId = crypto.randomUUID();
      
      const { error: insertError } = await supabase
        .from("mock_interviews")
        .insert({
          id: tempInterviewId,
          email: email.toLowerCase().trim(),
          full_name: talent?.fullName || "",
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

      if (talent?.id) {
        await addServiceUsed("mock_interview");
      }

      toast.success("Questions generated! Starting your interview...");
      navigate(`/mock-interview/questions/${tempInterviewId}`);
    } catch (error: any) {
      console.error("Error generating questions:", error);
      setGenerationError(error);
      setStep("configuration");
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate('/app/services')}
      >
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
            <CardDescription>
              Paste the job description for the position you're preparing for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground text-right">
                {jobDescription.length} / 50 minimum characters
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={handleJobDescriptionSubmit}
              disabled={jobDescription.length < 50}
            >
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
            <CardDescription>
              Customize the interview to match your preparation needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {generationError && (
              <RetryErrorCard
                type={getErrorType(generationError)}
                onRetry={handleStartInterview}
                description={generationError.message}
              />
            )}
            
            {/* Number of Questions */}
            <div className="space-y-3">
              <Label>Number of Questions</Label>
              <RadioGroup
                value={String(config.questionCount)}
                onValueChange={(v) => setConfig(prev => ({ ...prev, questionCount: Number(v) }))}
                className="flex gap-4"
              >
                {[3, 5, 7, 10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`q-${num}`} />
                    <Label htmlFor={`q-${num}`} className="cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Difficulty */}
            <div className="space-y-3">
              <Label>Difficulty Level</Label>
              <RadioGroup
                value={config.difficulty}
                onValueChange={(v: "easy" | "medium" | "hard") => setConfig(prev => ({ ...prev, difficulty: v }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="d-easy" />
                  <Label htmlFor="d-easy" className="cursor-pointer">Easy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="d-medium" />
                  <Label htmlFor="d-medium" className="cursor-pointer">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="d-hard" />
                  <Label htmlFor="d-hard" className="cursor-pointer">Hard</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Profession Category */}
            <div className="space-y-2">
              <Label>Profession Category (Optional)</Label>
              <Select
                value={config.professionCategoryId || ""}
                onValueChange={(v) => setConfig(prev => ({ ...prev, professionCategoryId: v || null }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category for targeted questions" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific topics or skills you want to focus on..."
                value={config.additionalNotes}
                onChange={(e) => setConfig(prev => ({ ...prev, additionalNotes: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            {/* Use Profile Context */}
            {talent && (
              <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  id="useProfile"
                  checked={config.useProfileContext}
                  onChange={(e) => setConfig(prev => ({ ...prev, useProfileContext: e.target.checked }))}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="useProfile" className="cursor-pointer font-medium">
                    Use my profile for personalized questions
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI will consider your skills and experience when generating questions
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
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
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingMessage}
                  </>
                ) : (
                  <>
                    Start Interview
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
