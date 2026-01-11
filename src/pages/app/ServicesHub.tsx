import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Mic, DollarSign, Palette, Coins, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { ServiceUsageBadge } from "@/components/credits/ServiceUsageBadge";
import { ServiceHistoryCard } from "@/components/credits/ServiceHistoryCard";
import { useCredits } from "@/hooks/useCredits";
import { ServiceType } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

interface ServiceCardData {
  id: ServiceType;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  iconColor: string;
  iconBg: string;
}

const CAREER_SERVICES: ServiceCardData[] = [
  {
    id: "CAREER_ASSESSMENT",
    title: "Career Scorecard",
    description: "Evaluate your readiness",
    icon: ClipboardCheck,
    href: "/app/services/assessment",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    id: "MOCK_INTERVIEW",
    title: "Mock Interview",
    description: "Practice with AI",
    icon: Mic,
    href: "/app/services/mock-interview",
    iconColor: "text-accent-foreground",
    iconBg: "bg-accent/10",
  },
  {
    id: "SALARY_ANALYSIS",
    title: "Salary Analysis",
    description: "Know your worth",
    icon: DollarSign,
    href: "/app/services/salary-analysis",
    iconColor: "text-warning",
    iconBg: "bg-warning/10",
  },
  {
    id: "PORTFOLIO",
    title: "Portfolio",
    description: "Showcase your work",
    icon: Palette,
    href: "/app/services/portfolio",
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10",
  },
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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header with Credits */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Career Services
          </h1>
          <p className="text-sm text-muted-foreground">AI-powered tools to accelerate your career</p>
        </div>

        {/* Compact Credits Card */}
        <Card className="overflow-hidden border-0 shadow-md md:w-auto w-full">
          <div className="bg-gradient-primary p-3 px-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-foreground/20 rounded-xl backdrop-blur-sm">
                  <Coins className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xl font-bold text-primary-foreground leading-none">{balance}</p>
                  <p className="text-[10px] text-primary-foreground/80 font-medium uppercase tracking-wide">
                    Available Credits
                  </p>
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
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CAREER_SERVICES.map((service, index) => {
          const cost = getServiceCost(service.id);
          const affordable = canAfford(service.id);

          return (
            <Card
              key={service.id}
              className="cursor-pointer border-0 shadow-sm hover:shadow-md transition-all overflow-hidden press-scale rounded-2xl group"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleServiceClick(service)}
            >
              <CardContent className="p-4 flex flex-col h-full">
                {/* Icon */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-300",
                    service.iconBg,
                  )}
                >
                  <service.icon className={cn("h-6 w-6", service.iconColor)} />
                </div>

                {/* Title & Desc */}
                <div className="flex-1 mb-3">
                  <h3 className="font-semibold text-sm text-foreground mb-1">{service.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{service.description}</p>
                </div>

                {/* Footer: Cost & Usage */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Coins className={cn("h-3.5 w-3.5", affordable ? "text-warning" : "text-muted-foreground")} />
                    <span className={cn("text-xs font-bold", affordable ? "text-foreground" : "text-destructive")}>
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
