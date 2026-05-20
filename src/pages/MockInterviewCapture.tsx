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
import { ArrowRight, User, Loader2, ShieldCheck, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { analyzeMockInterview } from "@/domains/jobs/api/jobsApi";

const INTERVIEW_ANALYSIS_STAGES = [
  { progress: 0, message: "Aggregating performance nodes..." },
  { progress: 15, message: "Transmitting responses to Gemini AI..." },
  { progress: 35, message: "Evaluating technical logic..." },
  { progress: 55, message: "Auditing behavioral patterns..." },
  { progress: 75, message: "Generating strategic feedback..." },
  { progress: 95, message: "Finalizing selection score..." },
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

  useEffect(() => {
    if (talent && !autoFilled) {
      setFullName(talent.fullName || "");
      setPhone(talent.phone || "");
      setAutoFilled(true);
    }
  }, [talent, autoFilled]);

  useEffect(() => {
    if (id) loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      const { data, error } = await supabase.from("mock_interviews").select("*").eq("id", id).single();
      if (error) throw error;
      if (data.status === "completed") {
        navigate(`/mock-interview/results/${id}`, { replace: true });
        return;
      }
      setInterview(data);
    } catch (err) {
      toast.error("Session Expired: Handshake failed.");
      navigate("/mock-interview");
    } finally {
      setLoading(false);
    }
  };

  const executeAnalysis = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      await supabase
        .from("mock_interviews")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          talent_id: talent?.id || null,
        })
        .eq("id", id);

      await analyzeMockInterview({ interviewId: id });

      if (talent) {
        await deductCredits("MOCK_INTERVIEW", id, "Premium AI Mock Interview Analysis");
        await addServiceUsed("mock_interview");
      }

      toast.success("Intelligence analysis complete.");
      navigate(`/mock-interview/results/${id}`);
    } catch (err) {
      setSubmissionError("AI Neural link failed. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTrigger = () => {
    if (!fullName.trim()) return toast.error("Identity confirmation required.");
    if (talent && !canAfford("MOCK_INTERVIEW")) {
      setShowCreditGate(true);
      return;
    }
    executeAnalysis();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Synchronizing Session</p>
      </div>
    );

  if (isSubmitting)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <ProcessingCard
            title="Synthesizing Interview Performance"
            stages={INTERVIEW_ANALYSIS_STAGES}
            duration={45000}
            error={submissionError}
            onRetry={executeAnalysis}
          />
        </main>
        <Footer />
      </div>
    );

  const answered = (interview?.answers as any[])?.length || 0;
  const total = (interview?.questions as any[])?.length || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <Navbar />

      <main className="flex-1 container max-w-lg mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="rounded-[32px] border-border/40 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tighter">Final Handshake</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Session Artifact: {answered}/{total} Modules Completed
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {talent && autoFilled && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 animate-in zoom-in-95">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-bold text-muted-foreground leading-tight">
                  Talent profile identified. Securely mapped identity details.
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Identity Confirmation *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-primary/40" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full legal name"
                    className="h-11 rounded-xl border-border/40 bg-background/50 pl-10 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Contact Sequence (Optional)
                </Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3.5 h-4 w-4 text-primary/40" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880..."
                    className="h-11 rounded-xl border-border/40 bg-background/50 pl-10"
                  />
                </div>
                <p className="text-[9px] font-medium text-muted-foreground italic px-1">
                  Verified channel for high-priority career opportunities.
                </p>
              </div>
            </div>

            <Button
              className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
              onClick={handleSubmitTrigger}
              disabled={!fullName.trim()}
            >
              Initialize Analysis Engine
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />

      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        serviceName="Premium Interview Audit"
        cost={getServiceCost("MOCK_INTERVIEW")}
        currentBalance={balance}
        onConfirm={executeAnalysis}
        onBuyCredits={() => {
          setShowCreditGate(false);
          setShowCreditSheet(true);
        }}
      />

      <CreditPurchaseSheet
        isOpen={showCreditSheet}
        onClose={() => setShowCreditSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
