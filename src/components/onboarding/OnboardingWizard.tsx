import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { WelcomeBonus } from './WelcomeBonus';
import { CVUploadStep } from './CVUploadStep';
import { ServicesTour } from './ServicesTour';
import { useOnboarding } from '@/hooks/useOnboarding';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  onComplete: () => void;
}

// 4 steps: Welcome → CV Upload → Profile → Explore
// Simplified 3 steps: Welcome → Profile → Explore (CV upload integrated into Profile)
const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'profile', label: 'Profile' },
  { id: 'explore', label: 'Explore' },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { completeOnboarding, skipOnboarding, updateStep } = useOnboarding();

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      await updateStep(nextStep);
      setCurrentStep(nextStep);
    }
  };

  const handleSkipAll = async () => {
    const success = await skipOnboarding();
    if (success) {
      toast.success('Welcome to GroUp Academy!');
      onComplete();
    }
  };

  const handleComplete = async () => {
    const success = await completeOnboarding();
    if (success) {
      toast.success("You're all set! Let's explore.", {
        description: 'Your 250 welcome credits are ready to use',
      });
      onComplete();
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeBonus onContinue={handleNext} />;
      case 'profile':
        // Show CV upload first, then profile setup on continue
        return <CVUploadStep onContinue={handleNext} onSkip={handleNext} />;
      case 'explore':
        return <ServicesTour onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkipAll}
          className="ml-4 text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Skip
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-3 border-b border-border/50">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`text-xs font-medium transition-colors ${
              index === currentStep
                ? 'text-primary'
                : index < currentStep
                ? 'text-muted-foreground'
                : 'text-muted-foreground/50'
            }`}
          >
            {index > 0 && <span className="mx-2 text-border">•</span>}
            {step.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderStep()}
      </div>
    </div>
  );
}
