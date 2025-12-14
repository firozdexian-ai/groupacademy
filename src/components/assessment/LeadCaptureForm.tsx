import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Lock, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const leadSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(10, "Phone must be at least 10 digits").max(20),
});

interface LeadCaptureFormProps {
  email: string;
  categoryId: string;
  categoryName: string;
  answers: Record<string, any>;
  onComplete: () => void;
  onBack: () => void;
}

export function LeadCaptureForm({
  email,
  categoryId,
  categoryName,
  answers,
  onComplete,
  onBack,
}: LeadCaptureFormProps) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: email,
    phone: "",
    whatsapp_opt_in: true,
    terms_accepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateScore = () => {
    // This is a simplified scoring - the actual scoring will be done by AI
    let totalScore = 0;
    let maxScore = 0;

    Object.entries(answers).forEach(([questionId, answer]) => {
      if (typeof answer === "number") {
        // Scale questions: score is the value itself (1-10)
        totalScore += answer;
        maxScore += 10;
      } else if (typeof answer === "string") {
        // Single choice: need to look up score from options (simplified)
        totalScore += 3; // Average score placeholder
        maxScore += 5;
      } else if (Array.isArray(answer)) {
        // Multiple choice: count selections
        totalScore += answer.length * 2;
        maxScore += 10;
      }
    });

    return {
      totalScore: Math.round(totalScore),
      maxScore: Math.round(maxScore),
      percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    };
  };

  const determineReadinessLevel = (percentage: number): "beginner" | "developing" | "competent" | "proficient" | "expert" => {
    if (percentage >= 90) return "expert";
    if (percentage >= 75) return "proficient";
    if (percentage >= 60) return "competent";
    if (percentage >= 40) return "developing";
    return "beginner";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate terms
    if (!formData.terms_accepted) {
      toast.error("Please accept the terms to continue");
      return;
    }

    // Validate form data
    const result = leadSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    console.log("[LeadCaptureForm] Submitting assessment...");

    try {
      const scores = calculateScore();
      const readinessLevel = determineReadinessLevel(scores.percentage);

      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      // Generate a temporary ID for navigation (will query by email later)
      const tempAssessmentId = crypto.randomUUID();
      
      // Save assessment WITHOUT .select() to avoid RLS issues for anonymous users
      const { error } = await supabase
        .from("career_assessments")
        .insert({
          id: tempAssessmentId, // Use our generated ID
          user_id: user?.id || null,
          profession_category_id: categoryId,
          full_name: formData.full_name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim(),
          answers: answers,
          total_score: scores.totalScore,
          max_score: scores.maxScore,
          percentage: scores.percentage,
          readiness_level: readinessLevel,
          improvement_areas: [], // Will be filled by AI
          ai_analysis: null, // Will be filled by AI edge function
        });

      if (error) {
        console.error("[LeadCaptureForm] Database error:", error);
        throw error;
      }

      console.log("[LeadCaptureForm] Assessment saved successfully:", tempAssessmentId);
      
      // Create professional profile using upsert with ignoreDuplicates
      try {
        await supabase
          .from('professionals')
          .upsert({
            full_name: formData.full_name.trim(),
            email: formData.email.toLowerCase().trim(),
            phone: formData.phone.trim(),
            profession_category_id: categoryId,
            services_used: ['assessment'] as unknown as any,
          }, { onConflict: 'email', ignoreDuplicates: true });
      } catch (profError) {
        console.log('[LeadCaptureForm] Professional profile creation skipped:', profError);
      }
      
      // Call onComplete AFTER successful database insert
      onComplete();
      
      toast.success("Assessment submitted successfully!");
      
      // Navigate to results page
      navigate(`/assessment-results/${tempAssessmentId}`);
    } catch (error: any) {
      console.error("[LeadCaptureForm] Error submitting assessment:", error);
      const errorMessage = error.code === "23505" 
        ? "An assessment with this email already exists. Please use a different email."
        : "Failed to submit assessment. Please try again.";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSubmitError(null);
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <Button variant="ghost" onClick={onBack} className="mb-6" disabled={submitting}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Questions
      </Button>

      <Card>
        <CardHeader className="text-center">
          <CardTitle>Almost Done!</CardTitle>
          <CardDescription>
            Enter your details to receive your personalized Career Readiness Report
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitError && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-destructive font-medium">{submitError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetry}
                    className="mt-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={submitting}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={submitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+880 1XXX XXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={submitting}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="whatsapp"
                checked={formData.whatsapp_opt_in}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, whatsapp_opt_in: checked as boolean })
                }
                disabled={submitting}
              />
              <Label htmlFor="whatsapp" className="text-sm leading-relaxed cursor-pointer">
                I'd like to receive career tips and updates via WhatsApp
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={formData.terms_accepted}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, terms_accepted: checked as boolean })
                }
                disabled={submitting}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                I agree to the terms and privacy policy *
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Get My Results"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              Your information is secure and will never be shared
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}