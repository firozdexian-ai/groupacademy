import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardCheck, Mic, DollarSign, Palette, Coins, Sparkles, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { ServiceUsageBadge } from "@/components/credits/ServiceUsageBadge";
import { ServiceHistoryCard } from "@/components/credits/ServiceHistoryCard";
import { useCredits } from "@/hooks/useCredits";
import { ServiceType } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";

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
    description: "Evaluate your readiness & skills gap",
    icon: ClipboardCheck,
    href: "/app/services/assessment",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    id: "MOCK_INTERVIEW",
    title: "Mock Interview",
    description: "Practice with AI-driven scenarios",
    icon: Mic,
    href: "/app/services/mock-interview",
    iconColor: "text-accent-foreground",
    iconBg: "bg-accent/10",
  },
  {
    id: "SALARY_ANALYSIS",
    title: "Salary Analysis",
    description: "Know your market worth accurately",
    icon: DollarSign,
    href: "/app/services/salary-analysis",
    iconColor: "text-warning",
    iconBg: "bg-warning/10",
  },
  {
    id: "PORTFOLIO",
    title: "Portfolio",
    description: "Build & showcase your best work",
    icon: Palette,
    href: "/app/services/portfolio",
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10",
  },
];

export default function ServicesHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { balance, getServiceCost, canAfford } = useCredits();

  const [selectedService, setSelectedService] = useState<ServiceCardData | null>(null);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);

  // Track service clicks from external sources
  useEffect(() => {
    const source = searchParams.get("source");
    const serviceSlug = searchParams.get("service");
    
    if (source && serviceSlug) {
      const trackClick = async () => {
        try {
          await supabase.rpc("track_service_click", {
            p_slug: serviceSlug,
            p_source: source,
          });
        } catch (err) {
          console.error("Failed to track service click", err);
        }
      };
      trackClick();
      
      // Clean URL without reloading
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Header with Credits */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
            <Sparkles className="h-6 w-6 text-primary" />
            Career Services
          </h1>
          <p className="text-muted-foreground">AI-powered tools to accelerate your career growth</p>
        </div>

        {/* Compact Credits Card */}
        <Card className="overflow-hidden border-0 shadow-lg md:w-auto w-full bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
          <div className="p-4 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none mb-1">{balance}</p>
                <p className="text-[10px] uppercase tracking-wider font-medium opacity-90">Credits Available</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full px-4 h-9 font-semibold shadow-sm hover:bg-white text-primary"
              onClick={() => setShowPurchaseSheet(true)}
            >
              Get More
            </Button>
          </div>
        </Card>
      </div>

      {/* Services Grid */}
      <div>
        <SectionHeader icon={Sparkles} title="Available Tools" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {CAREER_SERVICES.map((service, index) => {
            const cost = getServiceCost(service.id);
            const affordable = canAfford(service.id);

            return (
              <Card
                key={service.id}
                className={cn(
                  "cursor-pointer border hover:border-primary/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group",
                  !affordable && "opacity-90",
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleServiceClick(service)}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col h-full items-center text-center sm:items-start sm:text-left">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-110 duration-300 shadow-inner",
                      service.iconBg,
                    )}
                  >
                    <service.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", service.iconColor)} />
                  </div>

                  {/* Title & Desc */}
                  <div className="flex-1 mb-3 sm:mb-4">
                    <h3 className="font-bold text-sm sm:text-base text-foreground mb-1 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{service.description}</p>
                  </div>

                  {/* Footer: Cost & Usage */}
                  <div className="flex items-center justify-between w-full mt-auto pt-3 sm:pt-4 border-t border-border/40">
                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                      <Coins className={cn("h-3.5 w-3.5", affordable ? "text-amber-500" : "text-muted-foreground")} />
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
      </div>

      {/* Service History */}
      <div>
        <SectionHeader icon={History} title="Recent Activity" />
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
