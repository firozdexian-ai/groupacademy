import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Mic, 
  DollarSign, 
  Palette,
  Coins
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { CreditGateModal } from '@/components/credits/CreditGateModal';
import { CreditPurchaseSheet } from '@/components/credits/CreditPurchaseSheet';
import { ServiceUsageBadge } from '@/components/credits/ServiceUsageBadge';
import { ServiceHistoryCard } from '@/components/credits/ServiceHistoryCard';
import { useCredits } from '@/hooks/useCredits';
import { ServiceType } from '@/lib/creditPricing';

interface ServiceCardData {
  id: ServiceType;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
}

const CAREER_SERVICES: ServiceCardData[] = [
  {
    id: 'CAREER_ASSESSMENT',
    title: 'Career Readiness Scorecard',
    description: 'Discover your strengths and areas for improvement with AI-powered analysis',
    icon: ClipboardCheck,
    href: '/career-assessment',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'MOCK_INTERVIEW',
    title: 'AI Mock Interview',
    description: 'Practice with realistic interview questions and get instant AI feedback',
    icon: Mic,
    href: '/mock-interview',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    id: 'SALARY_ANALYSIS',
    title: 'AI Salary Analysis',
    description: 'Get market salary insights and negotiation strategies for your role',
    icon: DollarSign,
    href: '/salary-analysis',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    id: 'PORTFOLIO',
    title: 'Digital Portfolio',
    description: 'Get a professionally designed portfolio website to showcase your work',
    icon: Palette,
    href: '/portfolio-request',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
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
      setShowCreditGate(false);
      navigate(selectedService.href);
    }
  };

  const handleBuyCredits = () => {
    setShowCreditGate(false);
    setShowPurchaseSheet(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Career Services</h1>
        <p className="text-muted-foreground">AI-powered tools to accelerate your career</p>
      </div>

      {/* Credits info */}
      <Card className="mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-full">
                <Coins className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">Use your welcome credits to explore services</p>
                <p className="text-sm text-muted-foreground">
                  You have <CreditBalance variant="compact" className="inline-flex" />
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPurchaseSheet(true)}>
              Buy Credits
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {CAREER_SERVICES.map((service) => {
          const cost = getServiceCost(service.id);
          const affordable = canAfford(service.id);
          
          return (
            <Card 
              key={service.id}
              className="cursor-pointer hover:shadow-md transition-all group"
              onClick={() => handleServiceClick(service)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${service.bgColor} group-hover:scale-110 transition-transform`}>
                    <service.icon className={`h-6 w-6 ${service.color}`} />
                  </div>
                  <ServiceUsageBadge serviceType={service.id} />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-1">{service.title}</CardTitle>
                <CardDescription className="mb-3">{service.description}</CardDescription>
                
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="h-4 w-4 text-warning" />
                  <span className={affordable ? "text-muted-foreground" : "text-destructive"}>
                    {affordable ? `${cost} credits` : `Need ${cost - balance} more credits`}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Service History */}
      <div className="mt-8">
        <ServiceHistoryCard />
      </div>

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
