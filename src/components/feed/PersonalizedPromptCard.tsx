import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Briefcase, ClipboardCheck, Wallet, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";

type PromptType = "cv" | "assessment" | "jobs" | "portfolio";

interface Prompt {
  type: PromptType;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  path: string;
  priority: number;
  cost?: number;
}

export function PersonalizedPromptCard() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { balance, deductCredits } = useCredits();
  const [loading, setLoading] = useState<string | null>(null);

  // Determine which prompts to show based on user state
  const getPrompts = (): Prompt[] => {
    const prompts: Prompt[] = [];

    // No CV uploaded
    if (!talent?.cvUrl) {
      prompts.push({
        type: "cv",
        title: "Upload your CV",
        description: "Get AI-powered job matches and career insights",
        icon: <FileText className="h-5 w-5" />,
        action: "Upload CV",
        path: "/app/profile/edit",
        priority: 1,
      });
    }

    // Has CV but no assessment
    const servicesUsed = talent?.servicesUsed || [];
    const hasAssessment = servicesUsed.includes("career_assessment");

    if (talent?.cvUrl && !hasAssessment) {
      prompts.push({
        type: "assessment",
        title: "Get your Career Scorecard",
        description: "AI analysis of your job readiness and skills gaps",
        icon: <ClipboardCheck className="h-5 w-5" />,
        action: "Start Assessment",
        path: "/app/services/assessment",
        priority: 2,
        cost: 50, // Assessment cost
      });
    }

    // Job seeker with no applications
    if (talent?.currentStatus === "job_seeking" || talent?.currentStatus === "actively_job_seeking") {
      prompts.push({
        type: "jobs",
        title: "Find your next role",
        description: "Browse jobs matching your profile",
        icon: <Briefcase className="h-5 w-5" />,
        action: "Browse Jobs",
        path: "/app/jobs",
        priority: 3,
      });
    }

    // No portfolio request
    const hasPortfolio = servicesUsed.includes("portfolio_request");
    if (!hasPortfolio && balance >= 100) {
      prompts.push({
        type: "portfolio",
        title: "Build your portfolio",
        description: "Stand out with a professional portfolio website",
        icon: <Wallet className="h-5 w-5" />,
        action: "Get Started",
        path: "/app/services",
        priority: 4,
      });
    }

    // Sort by priority and return top 2
    return prompts.sort((a, b) => a.priority - b.priority).slice(0, 2);
  };

  const handleAction = async (prompt: Prompt) => {
    if (prompt.type === "assessment" && prompt.cost) {
      // Special handling for assessment to deduct credits
      if (balance < prompt.cost) {
        toast.error("Insufficient credits to start assessment");
        return;
      }

      setLoading(prompt.type);
      try {
        // --- CRITICAL FIX ---
        // We pass 'undefined' as the second argument (referenceId).
        // This ensures the database receives a NULL instead of an invalid text string.
        const success = await deductCredits("CAREER_ASSESSMENT", undefined, "Started AI Career Assessment");

        if (success) {
          toast.success("Assessment started!");
          navigate(prompt.path);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to start assessment");
      } finally {
        setLoading(null);
      }
    } else {
      // Standard navigation for other prompts
      navigate(prompt.path);
    }
  };

  const prompts = getPrompts();

  if (prompts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Recommended for you</span>
      </div>

      <div className="grid gap-3">
        {prompts.map((prompt) => (
          <Card
            key={prompt.type}
            className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-transparent hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => handleAction(prompt)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {prompt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{prompt.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{prompt.description}</p>
                </div>
                <Button size="sm" variant="ghost" className="shrink-0" disabled={loading === prompt.type}>
                  {loading === prompt.type ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {prompt.action}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
