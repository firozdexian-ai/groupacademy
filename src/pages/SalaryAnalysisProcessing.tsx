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
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

const SalaryAnalysisProcessing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, addServiceUsed } = useTalent();
  const { deductCredits } = useCredits();
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [creditsDeducted, setCreditsDeducted] = useState(false);

  const runAnalysis = async () => {
    if (!id) return;

    setError(null);
    setProgress(10);
    setStatus("Preparing your CV and job description...");

    try {
      setProgress(30);
      setStatus("Analyzing market data...");

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Analysis timed out. Please try again.")), 90000)
      );

      const analysisPromise = supabase.functions.invoke("analyze-salary", {
        body: { analysisId: id }
      });

      setProgress(50);
      setStatus("AI is analyzing your profile...");

      const { data, error: fnError } = await Promise.race([analysisPromise, timeoutPromise]) as any;

      if (fnError) throw fnError;

      if (data?.error) {
        throw new Error(data.error);
      }

      setProgress(90);
      setStatus("Finalizing results...");

      // Deduct credits and track service usage after successful analysis (only once)
      if (talent && !creditsDeducted) {
        await deductCredits('SALARY_ANALYSIS', id, 'AI Salary Analysis');
        await addServiceUsed('salary_analysis');
        setCreditsDeducted(true);
      }

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress(100);
      setStatus("Complete!");

      navigate(`/salary-analysis/results/${id}`);
    } catch (error) {
      console.error("Analysis error:", error);
      setError(error instanceof Error ? error.message : "Analysis failed. Please try again.");
      toast({
        title: "Analysis failed",
        description: "Please try again",
        variant: "destructive"
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-xl py-20 px-4">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl">
              {error ? "Analysis Error" : "Analyzing Your Profile"}
            </CardTitle>
            <CardDescription>
              {error ? "Something went wrong" : "This usually takes 30-60 seconds"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <>
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={handleRetry} disabled={isRetrying}>
                  {isRetrying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">{status}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>• Comparing your skills to market requirements</p>
                  <p>• Calculating salary benchmarks for your market</p>
                  <p>• Generating personalized negotiation tips</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default SalaryAnalysisProcessing;
