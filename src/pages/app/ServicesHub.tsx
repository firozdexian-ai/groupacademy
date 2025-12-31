import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Mic, 
  DollarSign, 
  Palette,
  Coins,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { CreditGateModal } from '@/components/credits/CreditGateModal';
import { CreditPurchaseSheet } from '@/components/credits/CreditPurchaseSheet';
import { ServiceUsageBadge } from '@/components/credits/ServiceUsageBadge';
import { ServiceHistoryCard } from '@/components/credits/ServiceHistoryCard';
import { useCredits } from '@/hooks/useCredits';
import { ServiceType } from '@/lib/creditPricing';
import { cn } from '@/lib/utils';

interface ServiceCardData {
  id: ServiceType;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  iconBg: string;
}

const CAREER_SERVICES: ServiceCardData[] = [
  {
    id: 'CAREER_ASSESSMENT',
    title: 'Career Scorecard',
    description: 'AI-powered readiness analysis',
    icon: ClipboardCheck,
    href: '/app/services/assessment',
    gradient: 'from-primary/20 to-primary/5',
    iconBg: 'bg-primary/15',
  },
  {
    id: 'MOCK_INTERVIEW',
    title: 'Mock Interview',
    description: 'Practice with AI feedback',
    icon: Mic,
    href: '/app/services/mock-interview',
    gradient: 'from-accent/20 to-accent/5',
    iconBg: 'bg-accent/15',
  },
  {
    id: 'SALARY_ANALYSIS',
    title: 'Salary Analysis',
    description: 'Market insights & negotiation',
    icon: DollarSign,
    href: '/app/services/salary-analysis',
    gradient: 'from-warning/20 to-warning/5',
    iconBg: 'bg-warning/15',
  },
  {
    id: 'PORTFOLIO',
    title: 'Digital Portfolio',
    description: 'Professional showcase website',
    icon: Palette,
    href: '/app/services/portfolio',
    gradient: 'from-secondary/20 to-secondary/5',
    iconBg: 'bg-secondary/15',
  }
];

export default function ServicesHub() {
  const navigate = useNavigate();
  const { balance, getServiceCost, canAfford } = useCredits();
  
  const [selectedService, setSelectedService] = useState<ServiceCardData | null>(null);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);

  const handleServiceClick = (service: ServiceCardData) => {
    setSelectedService(service);
    setShowCreditGate(true);
  };

  const handleConfirmService = () => {
    if (selectedService) {
      if (!canAfford(selectedService.id)) {
        setShowPurchaseSheet(true);
        setShowCreditGate(false);
        return;
      }
      setShowCreditGate(false);
      navigate(selectedService.href);
    }
  };

  const handleBuyCredits = () => {
    setShowCreditGate(false);
    setShowPurchaseSheet(true);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Career Services</h1>
        <p className="text-muted-foreground">AI-powered tools for your career</p>
      </div>

      {/* Credits Hero Card */}
      <Card className="mb-6 overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-primary p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-foreground/20 rounded-2xl backdrop-blur-sm">
                <Coins className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-foreground">{balance}</p>
                <p className="text-sm text-primary-foreground/80">Credits Available</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="rounded-xl font-semibold press-scale shadow-md"
              onClick={() => setShowPurchaseSheet(true)}
            >
              Buy More
            </Button>
          </div>
        </div>
      </Card>

      {/* Services Grid - 2x2 bKash Style */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {CAREER_SERVICES.map((service, index) => {
          const cost = getServiceCost(service.id);
          const affordable = canAfford(service.id);
          
          return (
            <Card 
              key={service.id}
              className={cn(
                'cursor-pointer border-0 shadow-md overflow-hidden press-scale rounded-2xl',
                'animate-bounce-in'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleServiceClick(service)}
            >
              <CardContent className={cn('p-0')}>
                {/* Gradient Background */}
                <div className={cn('bg-gradient-to-br p-5', service.gradient)}>
                  {/* Icon */}
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm',
                    service.iconBg
                  )}>
                    <service.icon className="h-7 w-7 text-foreground" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-bold text-foreground mb-1">{service.title}</h3>
                  
                  {/* Description */}
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                    {service.description}
                  </p>
                  
                  {/* Cost & Usage */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-warning" />
                      <span className={cn(
                        'text-sm font-semibold',
                        affordable ? 'text-foreground' : 'text-destructive'
                      )}>
                        {cost}
                      </span>
                    </div>
                    <ServiceUsageBadge serviceType={service.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Service History */}
      <ServiceHistoryCard />

      {/* Credit Gate Modal */}
      {selectedService && (
        <CreditGateModal
          isOpen={showCreditGate}
          onClose={() => setShowCreditGate(false)}
          onConfirm={handleConfirmService}
          onBuyCredits={handleBuyCredits}
          serviceName={selectedService.title}
          cost={getServiceCost(selectedService.id)}
          currentBalance={balance}
        />
      )}

      {/* Credit Purchase Sheet */}
      <CreditPurchaseSheet
        isOpen={showPurchaseSheet}
        onClose={() => setShowPurchaseSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
