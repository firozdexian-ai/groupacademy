import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Mic, 
  DollarSign, 
  Palette,
  Coins
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  icon: React.ElementType;
  href: string;
  iconColor: string;
  iconBg: string;
}

const CAREER_SERVICES: ServiceCardData[] = [
  {
    id: 'CAREER_ASSESSMENT',
    title: 'Career Scorecard',
    icon: ClipboardCheck,
    href: '/app/services/assessment',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    id: 'MOCK_INTERVIEW',
    title: 'Mock Interview',
    icon: Mic,
    href: '/app/services/mock-interview',
    iconColor: 'text-accent-foreground',
    iconBg: 'bg-accent/10',
  },
  {
    id: 'SALARY_ANALYSIS',
    title: 'Salary Analysis',
    icon: DollarSign,
    href: '/app/services/salary-analysis',
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
  {
    id: 'PORTFOLIO',
    title: 'Portfolio',
    icon: Palette,
    href: '/app/services/portfolio',
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10',
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
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Compact Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">Career Services</h1>
        <p className="text-xs text-muted-foreground">AI-powered tools</p>
      </div>

      {/* Compact Credits Card */}
      <Card className="mb-4 overflow-hidden border-0 shadow-md">
        <div className="bg-gradient-primary p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-xl backdrop-blur-sm">
                <Coins className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">{balance}</p>
                <p className="text-xs text-primary-foreground/80">Credits</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="rounded-xl text-xs h-8 font-semibold press-scale shadow-sm"
              onClick={() => setShowPurchaseSheet(true)}
            >
              Buy More
            </Button>
          </div>
        </div>
      </Card>

      {/* 2x2 Compact Grid - bKash Style */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {CAREER_SERVICES.map((service, index) => {
          const cost = getServiceCost(service.id);
          const affordable = canAfford(service.id);
          
          return (
            <Card 
              key={service.id}
              className="cursor-pointer border-0 shadow-sm overflow-hidden press-scale rounded-xl animate-bounce-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleServiceClick(service)}
            >
              <CardContent className="p-3">
                {/* Compact Icon */}
                <div className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center mb-2',
                  service.iconBg
                )}>
                  <service.icon className={cn('h-5 w-5', service.iconColor)} />
                </div>
                
                {/* Title */}
                <h3 className="font-semibold text-xs text-foreground mb-1.5 leading-tight">{service.title}</h3>
                
                {/* Cost & Usage - Inline */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Coins className="h-3 w-3 text-warning" />
                    <span className={cn(
                      'text-xs font-medium',
                      affordable ? 'text-foreground' : 'text-destructive'
                    )}>
                      {cost}
                    </span>
                  </div>
                  <ServiceUsageBadge serviceType={service.id} />
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
