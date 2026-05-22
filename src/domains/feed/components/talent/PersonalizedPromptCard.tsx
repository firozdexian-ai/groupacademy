import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Briefcase, ClipboardCheck, ChevronRight, Sparkles, Loader2, Zap, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { trackError, trackEvent } from "@/lib/errorTracking";
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

/**
 * Premium, performance-optimized Personalized Prompt Card Engine.
 * Built according to GroUp Academy Phase Z0 highly professional SAAS UI specifications,
 * ensuring strict credit ledger alignment and realtime cache cohesion across viewports.
 */
export function PersonalizedPromptCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { talent } = useTalent();
  const { balance, deductCredits } = useCredits();
  const [loading, setLoading] = useState<string | null>(null);

  // Monitor recommended prompt impressions for analytics evaluation pipelines
  useEffect(() => {
    if (talent?.id) {
      trackEvent("PersonalizedPromptCard:prompts_evaluated", {
        talentId: talent.id,
        currentBalance: balance,
        hasCv: !!talent.cvUrl,
      });
    }
  }, [talent, balance]);

  const getPrompts = (): Prompt[] => {
    if (!talent?.id) return [];
    const prompts: Prompt[] = [];
    const servicesUsed = talent?.servicesUsed || [];

    // 1. Core Onboarding Flow: CV Upload Verification Trigger
    if (!talent?.cvUrl) {
      prompts.push({
        type: "cv",
        title: "Upload your CV",
        description: "Add your CV so we can match you to the right professional roles.",
        icon: <FileText className="h-5 w-5" />,
        action: "Upload",
        path: "/app/profile/edit",
        priority: 1,
      });
    }

    // 2. Career Readiness Assessment: 50 Credits Gated Pipeline
    const hasAssessment = servicesUsed.includes("career_assessment");
    if (talent?.cvUrl && !hasAssessment) {
      prompts.push({
        type: "assessment",
        title: "Career Scorecard",
        description: "Get a deep AI audit of your structural skill gaps and market readiness.",
        icon: <ClipboardCheck className="h-5 w-5" />,
        action: "Start",
        path: "/app/services/assessment",
        priority: 2,
        cost: 50, // Standard Phase Z0 Ledger Cost Definition
      });
    }

    // 3. Pro Professional Portfolio Website Service: 100 Credits Gated Matrix
    const hasPortfolio = servicesUsed.includes("portfolio_request");
    if (!hasPortfolio && balance >= 100) {
      prompts.push({
        type: "portfolio",
        title: "Pro Portfolio",
        description: "Build a polished web portfolio infrastructure for your professional brand.",
        icon: <Zap className="h-5 w-5" />,
        action: "Create",
        path: "/app/services/portfolio",
        priority: 3,
        cost: 100, // Fixed cost token alignment mapping
      });
    }

    // 4. Recruitment Pipeline: Dynamic Match Sourcing Row
    if (talent?.currentStatus?.includes("job_seeking")) {
      prompts.push({
        type: "jobs",
        title: "Jobs for you",
        description: "See top ecosystem roles that match your verified skills and mastery metrics.",
        icon: <Briefcase className="h-5 w-5" />,
        action: "View",
        path: "/app/jobs",
        priority: 4,
      });
    }

    return prompts.sort((a, b) => a.priority - b.priority).slice(0, 2);
  };

  const handleAction = async (prompt: Prompt) => {
    trackEvent("prompt_card_action_clicked", {
      promptType: prompt.type,
      targetPath: prompt.path,
      talentId: talent?.id,
    });

    // Check transaction conditions for credit-gated ecosystem endpoints
    if (prompt.cost) {
      if (balance < prompt.cost) {
        toast.error(`Insufficient credit balance. This service requires ${prompt.cost} credits.`);
        return;
      }

      setLoading(prompt.type);
      const toastId = toast.loading(`Initializing transactional ledger settlement for ${prompt.title}…`);

      try {
        // Enforce upper-case billing mapping keys consistently across the transactional ledger
        const transactionServiceKey = prompt.type === "portfolio" ? "PORTFOLIO" : "CAREER_ASSESSMENT";

        const success = await deductCredits(
          transactionServiceKey,
          undefined,
          `Started AI Service Audit - ${prompt.title}`,
        );

        if (success) {
          // Automated Efficiency: Invalidate target balance keys across system layouts dynamically
          queryClient.invalidateQueries({ queryKey: ["credits-balance"] });

          toast.success(`${prompt.title} service unlocked successfully`, { id: toastId });
          navigate(prompt.path);
        } else {
          throw new Error("Ecosystem credits execution function declined the wallet mutation request.");
        }
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        trackError(errorMessage, {
          component: "PersonalizedPromptCard",
          action: "deduct_service_credits_fault",
          promptType: prompt.type,
          expectedCost: prompt.cost,
          talentId: talent?.id,
        });

        toast.error("Ledger connection timeout. Please verify your balance tokens.", { id: toastId });
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
    <div className="space-y-3 animate-in fade-in duration-500 touch-manipulation select-none sm:select-text">
      {/* Immersive Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs font-bold text-foreground tracking-tight uppercase">Suggested for you</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold border-border/40 tabular-nums">
          {prompts.length} {prompts.length === 1 ? "action" : "actions"}
        </Badge>
      </div>

      {/* Grid Track Viewport Compilation */}
      <div className="space-y-3">
        {prompts.map((prompt) => (
          <Card
            key={prompt.type}
            className={cn(
              "group relative overflow-hidden transition-all duration-300 rounded-2xl border border-border/40 bg-card/60 hover:bg-card backdrop-blur-md cursor-pointer hover:border-primary/30 shadow-sm hover:shadow-md",
              loading === prompt.type && "opacity-75 cursor-wait pointer-events-none",
            )}
            onClick={() => handleAction(prompt)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Visual Accent Icon Wrapper Node */}
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/20 shadow-inner transition-transform group-hover:scale-105 duration-200">
                  {prompt.icon}
                </div>

                <div className="flex-1 min-w-0 text-left space-y-1">
                  <p className="font-bold text-sm text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors">
                    {prompt.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{prompt.description}</p>

                  {/* Operational Controls Footer Strip */}
                  <div className="flex items-center gap-2 mt-3.5 flex-wrap">
                    {prompt.cost && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 select-none shadow-sm animate-in slide-in-from-left-2 duration-200">
                        <ShieldCheck className="h-3.5 w-3.5 stroke-[2.2]" />
                        <span className="text-[10px] font-bold tabular-nums tracking-wide uppercase">
                          {prompt.cost} credits
                        </span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(prompt);
                      }}
                      className="h-8 px-3.5 rounded-xl font-bold text-xs gap-1 active:scale-95 transition-transform shadow-sm cursor-pointer ml-auto"
                      disabled={loading === prompt.type}
                    >
                      {loading === prompt.type ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                      ) : (
                        <>
                          <span>{prompt.action}</span>
                          <ChevronRight className="h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
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
