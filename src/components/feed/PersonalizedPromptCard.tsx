import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Briefcase,
  ClipboardCheck,
  ChevronRight,
  Sparkles,
  Loader2,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

  const getPrompts = (): Prompt[] => {
    if (!talent?.id) return [];
    const prompts: Prompt[] = [];
    const servicesUsed = talent?.servicesUsed || [];

    if (!talent?.cvUrl) {
      prompts.push({
        type: "cv",
        title: "Upload your CV",
        description: "Add your CV so we can match you to the right roles.",
        icon: <FileText className="h-5 w-5" />,
        action: "Upload",
        path: "/app/profile/edit",
        priority: 1,
      });
    }

    const hasAssessment = servicesUsed.includes("career_assessment");
    if (talent?.cvUrl && !hasAssessment) {
      prompts.push({
        type: "assessment",
        title: "Career Scorecard",
        description: "Get a deep audit of your skill gaps and market readiness.",
        icon: <ClipboardCheck className="h-5 w-5" />,
        action: "Start",
        path: "/app/services/assessment",
        priority: 2,
        cost: 50,
      });
    }

    const hasPortfolio = servicesUsed.includes("portfolio_request");
    if (!hasPortfolio && balance >= 100) {
      prompts.push({
        type: "portfolio",
        title: "Pro Portfolio",
        description: "Build a polished web portfolio for your professional brand.",
        icon: <Zap className="h-5 w-5" />,
        action: "Create",
        path: "/app/services",
        priority: 3,
      });
    }

    if (talent?.currentStatus?.includes("job_seeking")) {
      prompts.push({
        type: "jobs",
        title: "Jobs for you",
        description: "See top roles that match your current skills.",
        icon: <Briefcase className="h-5 w-5" />,
        action: "View",
        path: "/app/jobs",
        priority: 4,
      });
    }

    return prompts.sort((a, b) => a.priority - b.priority).slice(0, 2);
  };

  const handleAction = async (prompt: Prompt) => {
    if (prompt.type === "assessment" && prompt.cost) {
      if (balance < prompt.cost) {
        toast.error("Not enough credits to start your scorecard.");
        return;
      }

      setLoading(prompt.type);
      const toastId = toast.loading("Starting your career scorecard…");

      try {
        const success = await deductCredits("CAREER_ASSESSMENT", undefined, "Started AI Career Audit");
        if (success) {
          toast.success("Scorecard unlocked", { id: toastId });
          navigate(prompt.path);
        }
      } catch (error) {
        toast.error("Something went wrong. Please try again.", { id: toastId });
      } finally {
        setLoading(null);
      }
    } else {
      navigate(prompt.path);
    }
  };

  const prompts = getPrompts();
  if (prompts.length === 0) return null;

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Suggested for you</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-medium border-border/40">
          {prompts.length} {prompts.length === 1 ? "action" : "actions"}
        </Badge>
      </div>

      <div className="space-y-3">
        {prompts.map((prompt) => (
          <Card
            key={prompt.type}
            className={cn(
              "group relative overflow-hidden transition-all duration-300 rounded-2xl",
              "border border-border/40 hover:border-primary/40 bg-card",
              "hover:shadow-md cursor-pointer",
            )}
            onClick={() => handleAction(prompt)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    "bg-primary/10 text-primary border border-primary/20",
                  )}
                >
                  {prompt.icon}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-sm text-foreground leading-tight">
                    {prompt.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {prompt.description}
                  </p>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {prompt.cost && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                        <ShieldCheck className="h-3 w-3" />
                        <span className="text-[10px] font-semibold">{prompt.cost} credits</span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="h-8 px-3 rounded-lg font-semibold text-xs gap-1"
                      disabled={loading === prompt.type}
                    >
                      {loading === prompt.type ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          {prompt.action}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
