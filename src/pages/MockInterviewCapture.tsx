import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowRight, 
  User,
  Loader2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

export default function MockInterviewCapture() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    try {
      // Update interview with lead info
      await supabase
        .from("mock_interviews")
        .update({ 
          full_name: fullName.trim(),
          phone: phone.trim() || null
        })
        .eq("id", id);

      // Call analysis edge function
      const { data, error } = await supabase.functions.invoke("analyze-mock-interview", {
        body: { interviewId: id }
      });

      if (error) throw error;

      toast.success("Interview analyzed! Viewing your results...");
      navigate(`/mock-interview/results/${id}`);
    } catch (error) {
      console.error("Error submitting interview:", error);
      toast.error("Failed to analyze interview. Please try again.");
      setIsSubmitting(false);
    }
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
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="py-16 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold mb-2">Analyzing Your Interview</h2>
              <p className="text-muted-foreground">
                Our AI is evaluating your responses and generating detailed feedback...
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span>This may take a moment</span>
              </div>
            </CardContent>
          </Card>
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
              Enter your details to get your personalized feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
    </div>
  );
}
