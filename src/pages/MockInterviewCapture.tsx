import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProcessingCard } from "@/components/ui/processing-card";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { 
  ArrowRight, 
  User,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

const INTERVIEW_ANALYSIS_STAGES = [
  { progress: 0, message: "Preparing your answers..." },
  { progress: 15, message: "Sending to AI for analysis..." },
  { progress: 35, message: "Evaluating your responses..." },
  { progress: 55, message: "Assessing interview performance..." },
  { progress: 75, message: "Generating detailed feedback..." },
  { progress: 90, message: "Finalizing your score..." },
];

export default function MockInterviewCapture() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { talent, addServiceUsed } = useTalent();
  const { canAfford, deductCredits, getServiceCost, balance } = useCredits();
  
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showCreditSheet, setShowCreditSheet] = useState(false);

  // Auto-fill from talent profile
  useEffect(() => {
    if (talent && !autoFilled) {
      if (talent.fullName && !fullName) setFullName(talent.fullName);
      if (talent.phone && !phone) setPhone(talent.phone);
      setAutoFilled(true);
    }
  }, [talent, autoFilled, fullName, phone]);

  useEffect(() => {
    if (id) loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      const { data, error } = await supabase
        .from("mock_interviews")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      if (data.status === "completed") {
        navigate(`/mock-interview/results/${id}`);
        return;
      }

      setInterview(data);
    } catch (error) {
      console.error("Error loading interview:", error);
      toast.error("Failed to load interview");
      navigate("/mock-interview");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    // Check credits for logged-in users
    if (talent && !canAfford('MOCK_INTERVIEW')) {
      setShowCreditGate(true);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Update interview with lead info and talent_id
      await supabase
        .from("mock_interviews")
        .update({ 
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          talent_id: talent?.id || null
        })
        .eq("id", id);

      // Call analysis edge function
      const { data, error } = await supabase.functions.invoke("analyze-mock-interview", {
        body: { interviewId: id }
      });

      if (error) throw error;

      // Deduct credits and track service usage for logged-in users
      if (talent) {
        await deductCredits('MOCK_INTERVIEW', id, 'AI Mock Interview Analysis');
        await addServiceUsed("mock_interview");
      }

      toast.success("Interview analyzed! Viewing your results...");
      navigate(`/mock-interview/results/${id}`);
    } catch (error) {
      console.error("Error submitting interview:", error);
      setSubmissionError("Failed to analyze interview. Please try again.");
    }
  };

  const handleBuyCredits = () => {
    setShowCreditGate(false);
    setShowCreditSheet(true);
  };

  const handleRetry = () => {
    setSubmissionError(null);
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <ProcessingCard
            title="Analyzing Your Interview"
            stages={INTERVIEW_ANALYSIS_STAGES}
            duration={45000}
            error={submissionError}
            onRetry={handleRetry}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const answeredCount = (interview?.answers as any[])?.length || 0;
  const totalQuestions = (interview?.questions as any[])?.length || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-md mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Almost Done!</CardTitle>
            <CardDescription>
              You've completed {answeredCount} of {totalQuestions} questions. 
              {talent ? " Confirm your details to get your personalized feedback." : " Enter your details to get your personalized feedback."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {talent && autoFilled && (
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20 mb-4">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  We've pre-filled your details from your profile
                </span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+880..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We'll use this to send you career tips and opportunities
              </p>
            </div>

            <Button 
              className="w-full mt-6" 
              onClick={handleSubmit}
              disabled={!fullName.trim()}
            >
              Get My Results
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* Credit Gate Modal */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        serviceName="Mock Interview Analysis"
        cost={getServiceCost('MOCK_INTERVIEW')}
        currentBalance={balance}
        onConfirm={handleSubmit}
        onBuyCredits={handleBuyCredits}
      />

      {/* Credit Purchase Sheet */}
      <CreditPurchaseSheet
        isOpen={showCreditSheet}
        onClose={() => setShowCreditSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
