import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ClipboardCheck,
  Mic,
  DollarSign,
  Palette,
  Coins,
  Sparkles,
  History,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { ServiceHistoryCard } from "@/components/credits/ServiceHistoryCard";
import { useCredits } from "@/hooks/useCredits";
import { ServiceType } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";

/**
 * Platform Logic: Service Orchestration Node
 * High-fidelity hub for AI-powered career calibration and performance tools.
 * 2026 Standard: Executive Logic geometry with real-time economic telemetry.
 */

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
    description: "Multi-modal readiness & skills gap calibration",
    icon: ClipboardCheck,
    href: "/app/services/assessment",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    tagline: "AI Assessment",
  },
  {
    id: "MOCK_INTERVIEW",
    title: "Interview Synthesis",
    description: "Practice with high-fidelity AI-driven scenarios",
    icon: Mic,
    href: "/app/services/mock-interview",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
    tagline: "Voice Setup",
  },
  {
    id: "SALARY_ANALYSIS",
    title: "Market Benchmarking",
    description: "Precise market worth indexing and negotiation logic",
    icon: DollarSign,
    href: "/app/services/salary-analysis",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tagline: "Economic Intel",
  },
  {
    id: "PORTFOLIO",
    title: "Artifact Showcase",
    description: "Build and share your professional profile",
    icon: Palette,
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
          console.error("Tracking failed", err);
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
    <div className="max-w-5xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Executive Header: Tracking Connection */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/20">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Service Node</h1>
          </div>
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] ml-16 italic">
            Neural Career Setup v2.6
          </p>
        </div>

        {/* Economic Ledger HUD */}
        <Card className="rounded-[32px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden min-w-[320px] group transition-all hover:border-primary/40">
          <CardContent className="p-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-[24px] bg-primary flex items-center justify-center rotate-3 shadow-primary/20 shadow-xl group-hover:rotate-0 transition-transform">
                <Coins className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black tracking-tighter italic leading-none">{balance}</p>
                <p className="text-[9px] font-black uppercase text-primary tracking-widest mt-1 italic">
                  Active Ledger Balance
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-11 px-5 border-2 font-black uppercase text-[9px] tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
              onClick={() => setShowPurchaseSheet(true)}
            >
              Inject Credits
            </Button>
          </CardContent>
        </Card>
      </header>

      {/* Main Orchestration Viewport */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
            <Target className="h-4 w-4" /> Available Protocols
          </h2>
          <Badge
            variant="outline"
            className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest italic px-3 py-1"
          >
            4 Logic Chains Sync'd
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAREER_SERVICES.map((service, index) => {
            const cost = getServiceCost(service.id);
            const affordable = canAfford(service.id);

            return (
              <Card
                key={service.id}
                className={cn(
                  "group cursor-pointer rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/40 hover:shadow-2xl overflow-hidden flex flex-col",
                  !affordable && "opacity-80 grayscale-[0.5]",
                )}
                onClick={() => handleServiceClick(service)}
              >
                <CardContent className="p-8 flex flex-col h-full">
                  <div
                    className={cn(
                      "h-16 w-16 rounded-[24px] flex items-center justify-center mb-8 transition-all duration-500 group-hover:rotate-6 shadow-inner",
                      service.iconBg,
                    )}
                  >
                    <service.icon className={cn("h-8 w-8", service.iconColor)} />
                  </div>

                  <div className="space-y-2 flex-1">
                    <p className={cn("text-[9px] font-black uppercase tracking-widest italic", service.iconColor)}>
                      {service.tagline}
                    </p>
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed italic pt-2">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between w-full mt-10 pt-6 border-t border-border/10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-muted rounded-lg shadow-inner">
                        <Coins className={cn("h-4 w-4", affordable ? "text-amber-500" : "text-destructive")} />
                      </div>
                      <span
                        className={cn(
                          "text-lg font-black tracking-tighter italic",
                          affordable ? "text-foreground" : "text-destructive",
                        )}
                      >
                        {cost}{" "}
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-bold ml-1">
                          Credits
                        </span>
                      </span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Historical Tracking List */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Service Tracking List</h2>
        </div>
        <div className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden shadow-sm">
          <ServiceHistoryCard />
        </div>
      </section>

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Service Node List: Active Sync</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest italic">
            Protocol: Verified Executive Logic 2026.4
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>

      {/* Logic Connection Overlays */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        onConfirm={handleConfirmService}
        onBuyCredits={() => {
          setShowCreditGate(false);
          setShowPurchaseSheet(true);
        }}
        serviceName={selectedService?.title || "Career Module"}
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
