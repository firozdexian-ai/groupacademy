import { useState, useEffect, useMemo } from "react";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WelcomeBonus } from "./WelcomeBonus";
import { CVUploadStep } from "./CVUploadStep";
import { ProfessionStep } from "./ProfessionStep";
import { GoalStep } from "./GoalStep";
import { ServicesTour } from "./ServicesTour";
import { PhoneCaptureStep } from "./PhoneCaptureStep";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTalent } from "@/hooks/useTalent";
import { trackOnboardingStep, trackOnboardingSkipped } from "@/lib/onboarding/telemetry";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Onboarding wizard. Steps: welcome → phone (if missing) → cv → profession → goal → tour.
 */

type StepId = "welcome" | "phone" | "cv" | "profession" | "goal" | "explore";

const ALL_NODES: Array<{ id: StepId; label: string }> = [
  { id: "welcome", label: "Welcome" },
  { id: "phone", label: "Phone" },
  { id: "cv", label: "Resume" },
  { id: "profession", label: "Profession" },
  { id: "goal", label: "Goal" },
  { id: "explore", label: "Tour" },
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { talent } = useTalent();
  const { completeOnboarding, skipOnboarding, updateStep, currentStep: savedStep } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  const nodes = useMemo(
    () => ALL_NODES.filter((n) => (n.id === "phone" ? !talent?.phone : true)),
    [talent?.phone],
  );

  useEffect(() => {
    if (savedStep !== undefined) {
      const validStep = Math.min(Math.max(0, savedStep), nodes.length - 1);
      if (!hasInitialized) {
        setCurrentStep(validStep);
        setHasInitialized(true);
      } else if (validStep > currentStep) {
        setCurrentStep(validStep);
      }
    }
  }, [savedStep, hasInitialized, currentStep, nodes.length]);

  const yieldProgress = ((currentStep + 1) / nodes.length) * 100;

  const goToNextStep = async () => {
    if (currentStep < nodes.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await updateStep(nextStep);
    }
  };

  const handleSkipConfirmed = async () => {
    setShowSkipDialog(false);
    const stepId = nodes[currentStep]?.id ?? "unknown";
    trackOnboardingSkipped(stepId, talent?.id);
    const result = await skipOnboarding();
    if (result?.success) {
      toast.success("Skipped for now", {
        description: "You can finish your profile anytime from your dashboard.",
      });
      trackOnboardingStep(stepId, "skip", { talentId: talent?.id });
      onComplete();
    }
  };

  const finishOnboarding = async () => {
    const result = await completeOnboarding();
    if (result?.success) {
      if (result.creditsAwarded) {
        toast.success("All set!", {
          description: "250 welcome credits are in your wallet.",
          icon: <Zap className="h-4 w-4 text-emerald-500 fill-current" />,
        });
      } else if (result.duplicate) {
        toast.success("Welcome back", {
          description:
            "Looks like you've used GroUp before. If you have an old account, contact support to recover it.",
        });
      } else {
        toast.success("You're all set!", { description: "Explore the platform anytime." });
      }
      trackOnboardingStep("explore", "complete", { talentId: talent?.id });
      onComplete();
    }
  };

  const renderActiveNode = () => {
    switch (nodes[currentStep]?.id) {
      case "welcome":
        return <WelcomeBonus onContinue={goToNextStep} />;
      case "phone":
        return <PhoneCaptureStep onContinue={goToNextStep} />;
      case "cv":
        return <CVUploadStep onContinue={goToNextStep} onSkip={goToNextStep} />;
      case "profession":
        return <ProfessionStep onContinue={goToNextStep} />;
      case "goal":
        return <GoalStep onContinue={goToNextStep} />;
      case "explore":
        return <ServicesTour onComplete={finishOnboarding} />;
      default:
        return null;
    }
  };

  // Phone step is mandatory — disable skip there
  const isPhoneStep = nodes[currentStep]?.id === "phone";

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col font-sans animate-in fade-in duration-700">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-5 md:px-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-blue-500 fill-blue-500" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold text-slate-900">Set up your account</span>
              <span className="text-xs text-slate-400">{nodes[currentStep]?.label}</span>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <Progress value={yieldProgress} className="h-2 bg-slate-100" />
          </div>

          {!isPhoneStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSkipDialog(true)}
              className="rounded-full h-10 px-5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all gap-2"
            >
              <X className="h-4 w-4" /> Skip for now
            </Button>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 pb-5 pt-2">
          {nodes.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 transition-all duration-500",
                index === currentStep ? "opacity-100 scale-105" : "opacity-50",
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors duration-500",
                  index === currentStep
                    ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    : index < currentStep
                      ? "bg-emerald-500"
                      : "bg-slate-200",
                )}
              />
              <span
                className={cn(
                  "text-xs font-semibold hidden sm:block",
                  index === currentStep ? "text-blue-500" : "text-slate-400",
                )}
              >
                {step.label}
              </span>
              {index < nodes.length - 1 && <div className="ml-3 h-[2px] w-6 bg-slate-100" />}
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center p-4 md:p-8">
          {renderActiveNode()}
        </div>
      </main>

      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip setup?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll miss your AI Career Coach and personalised job matches. You can finish anytime from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction onClick={handleSkipConfirmed}>Finish later</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
