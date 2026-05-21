import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackServiceClick } from "@/domains/analytics/repo/analyticsRepo";
import { Coins, Sparkles, Zap, History, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { ServiceHistoryCard } from "@/components/credits/ServiceHistoryCard";
import { useCredits } from "@/hooks/useCredits";
import { ServiceType } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";

// Production Data Contracts[cite: 8]
interface ServiceCardData {
  id: ServiceType;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  iconColor: string;
  iconBg: string;
  tagline: string;
}

const CAREER_SERVICES: ServiceCardData[] = [
  {
    id: "CAREER_ASSESSMENT",
    title: "Logic Scorecard",
    description: "Readiness & skills gap calibration",
    icon: Target,
    href: "/app/services/assessment",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    tagline: "AI Assessment",
  },
  {
    id: "MOCK_INTERVIEW",
    title: "Interview Synthesis",
    description: "Practice high-fidelity AI-driven scenarios",
    icon: Zap,
    href: "/app/services/mock-interview",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
    tagline: "Voice Setup",
  },
  {
    id: "SALARY_ANALYSIS",
    title: "Market Benchmarking",
    description: "Precise market worth indexing",
    icon: Coins,
    href: "/app/services/salary-analysis",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tagline: "Economic Intel",
  },
  {
    id: "PORTFOLIO",
    title: "Artifact Showcase",
    description: "Build your professional profile",
    icon: Sparkles,
    href: "/app/services/portfolio",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tagline: "Digital Identity",
  },
];

export default function ServicesHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { balance, getServiceCost, canAfford } = useCredits();

  const [selectedService, setSelectedService] = useState<ServiceCardData | null>(null);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);

  // Digital Workforce Anomaly Protocol[cite: 6]
  const reportAnomalyToAdmin = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    await adminSupportAssistant({ type: "services_hub_error", event, context });
  };

  useEffect(() => {
    const source = searchParams.get("source");
    const serviceSlug = searchParams.get("service");

    if (source && serviceSlug) {
      const trackClick = async () => {
        try {
          await trackServiceClick({ slug: serviceSlug, source });
        } catch (err) {
          await reportAnomalyToAdmin("TrackServiceClickFailure", { serviceSlug, error: err });
        }
      };
      trackClick();
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

  return (
    <div className={PAGE_SHELL_WIDE}>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/20">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className={PAGE_TITLE}>Service Node</h1>
          </div>
          <p className={cn(PAGE_SUBTITLE, "ml-16")}>Neural Career Setup v2.6</p>
        </div>

        <Card className={cn(CARD, "min-w-[320px] shadow-2xl")}>
          <CardContent className="p-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-[24px] bg-primary flex items-center justify-center rotate-3 shadow-xl">
                <Coins className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black tracking-tighter italic leading-none">{balance}</p>
                <p className="text-[9px] font-black uppercase text-primary tracking-widest mt-1 italic">
                  Active Balance
                </p>
              </div>
            </div>
            <Button size="sm" className="rounded-xl h-11 px-5 shadow-sm" onClick={() => setShowPurchaseSheet(true)}>
              Inject Credits
            </Button>
          </CardContent>
        </Card>
      </header>

      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
            <Target className="h-4 w-4" /> Available Protocols
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAREER_SERVICES.map((service) => {
            const cost = getServiceCost(service.id);
            const affordable = canAfford(service.id);
            return (
              <Card
                key={service.id}
                className={cn(CARD, "cursor-pointer transition-all duration-500 hover:border-primary/40 flex flex-col")}
                onClick={() => handleServiceClick(service)}
              >
                <CardContent className="p-8 flex flex-col h-full">
                  <div
                    className={cn(
                      "h-16 w-16 rounded-[24px] flex items-center justify-center mb-8 shadow-inner",
                      service.iconBg,
                    )}
                  >
                    <service.icon className={cn("h-8 w-8", service.iconColor)} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className={cn("text-[9px] font-black uppercase tracking-widest italic", service.iconColor)}>
                      {service.tagline}
                    </p>
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium italic pt-2">{service.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Service Tracking List</h2>
        </div>
        <div className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl">
          <ServiceHistoryCard />
        </div>
      </section>

      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        onConfirm={handleConfirmService}
        onBuyCredits={() => {
          setShowCreditGate(false);
          setShowPurchaseSheet(true);
        }}
        serviceName={selectedService?.title || "Service"}
        cost={selectedService ? getServiceCost(selectedService.id) : 0}
        currentBalance={balance}
      />
      <CreditPurchaseSheet
        isOpen={showPurchaseSheet}
        onClose={() => setShowPurchaseSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
