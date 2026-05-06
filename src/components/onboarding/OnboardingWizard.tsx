import { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WelcomeBonus } from "./WelcomeBonus";
import { CVUploadStep } from "./CVUploadStep";
import { ServicesTour } from "./ServicesTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Onboarding wizard — 3 steps: welcome bonus, profile setup, quick tour.
 */

const ONBOARDING_NODES = [
  { id: "welcome", label: "Welcome" },
  { id: "profile", label: "Your profile" },
  { id: "explore", label: "Quick tour" },
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { completeOnboarding, skipOnboarding, updateStep, currentStep: savedStep } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Sync local step with persisted step, only allowing forward jumps
  useEffect(() => {
    if (savedStep !== undefined) {
      const validStep = Math.min(Math.max(0, savedStep), ONBOARDING_NODES.length - 1);
      if (!hasInitialized) {
        setCurrentStep(validStep);
        setHasInitialized(true);
      } else if (validStep > currentStep) {
        setCurrentStep(validStep);
      }
    }
  }, [savedStep, hasInitialized, currentStep]);

  const yieldProgress = ((currentStep + 1) / ONBOARDING_NODES.length) * 100;

  const goToNextStep = async () => {
    if (currentStep < ONBOARDING_NODES.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await updateStep(nextStep);
    }
  };

  const handleSkip = async () => {
    const success = await skipOnboarding();
    if (success) {
      toast.success("Skipped for now", { description: "You can finish your profile anytime from your dashboard." });
      onComplete();
    }
  };

  const finishOnboarding = async () => {
    const success = await completeOnboarding();
    if (success) {
      toast.success("All set!", {
        description: "250 welcome credits are in your wallet.",
        icon: <Zap className="h-4 w-4 text-emerald-500 fill-current" />,
      });
      onComplete();
    }
  };

  const renderActiveNode = () => {
    switch (ONBOARDING_NODES[currentStep].id) {
      case "welcome":
        return <WelcomeBonus onContinue={goToNextStep} />;
      case "profile":
        return <CVUploadStep onContinue={goToNextStep} onSkip={goToNextStep} />;
      case "explore":
        return <ServicesTour onComplete={finishOnboarding} />;
      default:
        return null;
    }
  };

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
              <span className="text-xs text-slate-400">{ONBOARDING_NODES[currentStep].label}</span>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <Progress value={yieldProgress} className="h-2 bg-slate-100" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="rounded-full h-10 px-5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all gap-2"
          >
            <X className="h-4 w-4" /> Skip for now
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 pb-5 pt-2">
          {ONBOARDING_NODES.map((step, index) => (
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
              {index < ONBOARDING_NODES.length - 1 && <div className="ml-3 h-[2px] w-6 bg-slate-100" />}
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center p-4 md:p-8">
          {renderActiveNode()}
        </div>
      </main>
    </div>
  );
}
