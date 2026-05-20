import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { Loader2, AlertCircle, RefreshCw, ShieldCheck, Database, Cpu, Globe, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeSalary } from "@/domains/talent/api/talentApi";

const SalaryAnalysisProcessing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, addServiceUsed } = useTalent();
  const { deductCredits } = useCredits();

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing Sequence...");
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [creditsDeducted, setCreditsDeducted] = useState(false);

  const runAnalysis = async () => {
    if (!id) return;

    setError(null);
    setProgress(10);
    setStatus("Identity Verification & Artifact Loading...");

    try {
      // Step 1: Market Intelligence Handshake
      setProgress(30);
      setStatus("Querying Global Market Benchmarks...");

      // Protocol Guard: 90s Timeout for Edge Compute
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Analysis connection timed out. Latency high.")), 90000),
      );

      // Step 2: Neural Processing Call
      const analysisPromise = analyzeSalary({ analysisId: id })
        .then((data) => ({ data, error: null }))
        .catch((error) => ({ data: null, error }));

      setProgress(50);
      setStatus("Synthesizing Neural Logic Analysis...");

      const { data, error: fnError } = (await Promise.race([analysisPromise, timeoutPromise])) as any;

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Step 3: Persistence & Credit Committal
      setProgress(85);
      setStatus("Finalizing Intelligence Report...");

      if (talent && !creditsDeducted) {
        try {
          await deductCredits("SALARY_ANALYSIS", id, "AI Salary Analysis");
          await addServiceUsed("salary_analysis");
          setCreditsDeducted(true);
        } catch (e) {
          console.error("Ledger Sync Fault:", e);
          // We continue as the analysis itself succeeded
        }
      }

      // Smooth transition for UX perception
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setProgress(100);
      setStatus("Artifact Optimized.");

      navigate(`/salary-analysis/results/${id}`, { replace: true });
    } catch (err: any) {
      console.error("Pipeline Failure:", err);
      setError(err.message || "Sequence Interrupted.");
      toast({
        title: "Engineering Fault",
        description: "The AI node failed to resolve your query.",
        variant: "destructive",
      });
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await runAnalysis();
    setIsRetrying(false);
  };

  useEffect(() => {
    runAnalysis();
  }, [id]);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <Navbar />

      <main className="flex-1 container max-w-xl mx-auto py-20 px-6 animate-in fade-in duration-700">
        <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-xl">
          <CardHeader className="text-center p-10 pb-6">
            <CardTitle className="text-3xl font-black tracking-tighter uppercase">
              {error ? "Protocol Error" : "Processing Logic"}
            </CardTitle>
            <CardDescription className="font-bold uppercase text-[10px] tracking-[0.2em] text-muted-foreground mt-2">
              {error ? "Node Communication Fault" : "Neural Analysis in Sequence"}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-10 pt-0 space-y-10">
            {error ? (
              <div className="space-y-8 text-center animate-in zoom-in-95">
                <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
                  <AlertCircle className="h-10 w-10 text-rose-500" />
                </div>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border/40">
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">{error}</p>
                </div>
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full h-14 rounded-2xl font-black uppercase text-xs shadow-xl shadow-primary/20"
                >
                  {isRetrying ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" /> Restart Sequence
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Visual Processing HUD */}
                <div className="relative h-32 w-32 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                  <div className="absolute inset-4 rounded-3xl bg-primary/5 flex items-center justify-center shadow-inner">
                    <Cpu className="h-10 w-10 text-primary animate-pulse" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{status}</span>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 rounded-full bg-muted overflow-hidden" />
                </div>

                {/* Technical Sub-tasks */}
                <div className="grid gap-3 pt-4">
                  {[
                    { icon: Globe, text: "Cross-referencing Global Market Nodes" },
                    { icon: Database, text: "Mapping Skill-to-Value Matrices" },
                    { icon: Sparkles, text: "Generating Psychological Negotiation Anchors" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/10 opacity-60 group"
                    >
                      <item.icon className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                <footer className="pt-6 border-t border-border/10 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                      Secure Neural Handshake Active
                    </span>
                  </div>
                </footer>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default SalaryAnalysisProcessing;
