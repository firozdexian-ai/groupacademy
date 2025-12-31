import { useState } from 'react';
import { 
  ClipboardCheck, 
  MessageSquare, 
  TrendingUp, 
  Send, 
  Globe, 
  Bot,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CREDIT_CONFIG } from '@/lib/creditPricing';

interface ServicesTourProps {
  onComplete: () => void;
}

const SERVICES = [
  {
    icon: ClipboardCheck,
    name: 'Career Readiness Scorecard',
    description: 'AI-powered analysis of your career readiness with personalized improvement tips',
    cost: CREDIT_CONFIG.SERVICES.CAREER_ASSESSMENT.cost,
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-500',
  },
  {
    icon: MessageSquare,
    name: 'AI Mock Interview',
    description: 'Practice interviews with AI that gives real-time feedback on your answers',
    cost: CREDIT_CONFIG.SERVICES.MOCK_INTERVIEW.cost,
    color: 'from-purple-500/20 to-purple-500/5',
    iconColor: 'text-purple-500',
  },
  {
    icon: TrendingUp,
    name: 'Salary Analysis',
    description: 'Know your market value with AI-powered salary insights and negotiation tips',
    cost: CREDIT_CONFIG.SERVICES.SALARY_ANALYSIS.cost,
    color: 'from-green-500/20 to-green-500/5',
    iconColor: 'text-green-500',
  },
  {
    icon: Send,
    name: 'Job Applications',
    description: 'Apply to jobs with AI-enhanced cover letters and one-click submission',
    cost: CREDIT_CONFIG.SERVICES.JOB_APPLICATION.cost,
    color: 'from-orange-500/20 to-orange-500/5',
    iconColor: 'text-orange-500',
  },
  {
    icon: Globe,
    name: 'Digital Portfolio',
    description: 'Get a professional portfolio website built by our team',
    cost: CREDIT_CONFIG.SERVICES.PORTFOLIO.cost,
    color: 'from-pink-500/20 to-pink-500/5',
    iconColor: 'text-pink-500',
  },
  {
    icon: Bot,
    name: 'AI Career Agents',
    description: 'Chat with AI career experts for personalized guidance anytime',
    cost: CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost,
    color: 'from-cyan-500/20 to-cyan-500/5',
    iconColor: 'text-cyan-500',
  },
];

export function ServicesTour({ onComplete }: ServicesTourProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = () => {
    if (currentIndex < SERVICES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentService = SERVICES[currentIndex];
  const Icon = currentService.icon;
  const isLastSlide = currentIndex === SERVICES.length - 1;

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-md mx-auto min-h-[60vh]">
      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
        Discover Our Services
      </h2>
      <p className="text-muted-foreground text-center mb-6">
        Use your credits on career-boosting tools
      </p>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {SERVICES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex ? "w-6 bg-primary" : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* Service Card */}
      <div className="flex-1 w-full flex items-center justify-center">
        <div 
          className={cn(
            "w-full bg-gradient-to-br rounded-2xl p-6 transition-all duration-300",
            currentService.color
          )}
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-background/80 flex items-center justify-center shadow-lg">
              <Icon className={cn("h-8 w-8", currentService.iconColor)} />
            </div>
          </div>

          {/* Name */}
          <h3 className="text-xl font-bold text-foreground text-center mb-2">
            {currentService.name}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-center text-sm mb-4">
            {currentService.description}
          </p>

          {/* Cost Badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-warning/20 text-warning text-sm font-medium">
              {currentService.cost} credits per use
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between w-full mt-6 gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {isLastSlide ? (
          <Button size="lg" onClick={onComplete} className="flex-1">
            Get Started!
          </Button>
        ) : (
          <Button size="lg" variant="outline" onClick={goNext} className="flex-1">
            Next Service
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={isLastSlide}
          className="h-10 w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Skip */}
      <Button
        variant="ghost"
        onClick={onComplete}
        className="mt-4 text-muted-foreground"
      >
        Skip tour
      </Button>
    </div>
  );
}
