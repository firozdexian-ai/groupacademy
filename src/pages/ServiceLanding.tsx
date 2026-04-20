import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Target,
  Mic,
  DollarSign,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  TrendingUp,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SERVICES: Record<
  string,
  {
    title: string;
    tagline: string;
    description: string;
    metaDescription: string;
    icon: any;
    benefits: string[];
    howItWorks: { step: string; desc: string }[];
    cta: string;
    ctaLink: string;
    color: string;
    themeColor: string;
    jsonLdType: string;
  }
> = {
  "career-assessment": {
    title: "Career Readiness Scorecard",
    tagline: "Decode your professional logic with AI-powered auditing.",
    description:
      "Multi-dimensional analysis evaluating technical logic, communication flow, and industry contextual awareness. Receive a personalized artifact with actionable recommendations.",
    metaDescription:
      "AI-powered Career Readiness Scorecard. Audit your skills and benchmark against industry standards with GroUp Academy.",
    icon: Target,
    benefits: [
      "Granular skill mapping across 6 competencies",
      "Strategic improvement blueprint",
      "Industry-specific market benchmarking",
      "Downloadable Intelligence Artifact (PDF)",
      "Neural career path recommendations",
    ],
    howItWorks: [
      { step: "Node Selection", desc: "Choose from 30+ career verticals" },
      { step: "Logic Assessment", desc: "Complete targeted queries in 12 minutes" },
      { step: "Artifact Generation", desc: "Receive your AI-optimized scorecard" },
    ],
    cta: "Initialize Assessment",
    ctaLink: "/career-assessment",
    color: "text-primary",
    themeColor: "primary",
    jsonLdType: "Service",
  },
  "mock-interview": {
    title: "AI Interview Simulation",
    tagline: "Execute high-performance responses in a safe environment.",
    description:
      "Dynamic simulation with realistic AI personas tailored to specific organizational JDs. Get real-time logic feedback and behavioral scoring.",
    metaDescription:
      "AI Mock Interview Practice — role-specific questions and detailed performance analysis by GroUp Academy.",
    icon: Mic,
    benefits: [
      "JD-specific AI interviewer personas",
      "Real-time Logic & Tone analysis",
      "Performance scoring vs. Market benchmarks",
      "Tactical behavioral round preparation",
      "Downloadable improvement report",
    ],
    howItWorks: [
      { step: "Target Calibration", desc: "Select role and organization tier" },
      { step: "Execution Phase", desc: "Respond to AI-curated logic queries" },
      { step: "Neural Feedback", desc: "Audit your performance metrics" },
    ],
    cta: "Launch Simulation",
    ctaLink: "/mock-interview",
    color: "text-blue-500",
    themeColor: "blue",
    jsonLdType: "Service",
  },
  "salary-analysis": {
    title: "AI Market Valuation",
    tagline: "Know your market alpha with data-driven benchmarking.",
    description:
      "Leverage global market data nodes to understand your true compensation potential. Negotiate with structured intelligence.",
    metaDescription: "AI Salary Analysis — know your market value. Data-driven salary insights by GroUp Academy.",
    icon: DollarSign,
    benefits: [
      "Real-time market rate benchmarking",
      "Experience-adjusted compensation nodes",
      "Skill-to-Value mapping (Alpha identification)",
      "Tactical negotiation protocol scripts",
      "Industry growth trajectory insights",
    ],
    howItWorks: [
      { step: "Identity Ingestion", desc: "Provide role and market details" },
      { step: "Market Sync", desc: "AI cross-references global benchmarks" },
      { step: "Valuation Delivery", desc: "Get your strategic salary artifact" },
    ],
    cta: "Calculate Valuation",
    ctaLink: "/salary-analysis",
    color: "text-emerald-500",
    themeColor: "emerald",
    jsonLdType: "Service",
  },
  portfolio: {
    title: "Artifact Engineering (Portfolio)",
    tagline: "High-conversion digital presence engineered for trust.",
    description:
      "Let AI translate your career logic into a stunning digital portfolio. Optimized for ATS bypassing and executive review.",
    metaDescription: "AI Portfolio Builder — create professional online artifacts. Built by GroUp Academy engineers.",
    icon: Briefcase,
    benefits: [
      "AI-curated logic from CV artifacts",
      "Executive responsive design protocols",
      "Secure global endpoint (Public URL)",
      "Integrated project logic showcase",
      "Zero-code identity management",
    ],
    howItWorks: [
      { step: "Artifact Upload", desc: "Provide your CV or career nodes" },
      { step: "Build Sequence", desc: "AI engineers your digital layout" },
      { step: "Deployment", desc: "Receive your live shareable endpoint" },
    ],
    cta: "Engineer Portfolio",
    ctaLink: "/portfolio-request",
    color: "text-primary",
    themeColor: "primary",
    jsonLdType: "Service",
  },
};

export default function ServiceLanding() {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const navigate = useNavigate();
  const service = serviceSlug ? SERVICES[serviceSlug] : null;

  useEffect(() => {
    if (!service) return;
    document.title = `${service.title} | GroUp Intelligence Lab`;

    // Schema Logic: Dynamic Metadata
    const url = `https://groupacademy.lovable.app/services/${serviceSlug}`;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": service.jsonLdType,
      name: service.title,
      description: service.description,
      provider: {
        "@type": "EducationalOrganization",
        name: "GroUp Academy",
        url: "https://groupacademy.lovable.app",
      },
      serviceType: "Professional Career Development",
    };

    let script = document.querySelector("script[data-service-ld]") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-service-ld", "true");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
    return () => {
      script?.remove();
    };
  }, [serviceSlug, service]);

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-6">
            <div className="h-20 w-20 rounded-[32px] bg-muted flex items-center justify-center mx-auto">
              <Layers className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Node Not Found</h1>
            <p className="text-muted-foreground font-medium">
              The requested intelligence service is currently offline or has been rotated.
            </p>
            <Button
              onClick={() => navigate("/services")}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest"
            >
              Explore Intelligence Hub
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const ServiceIcon = service.icon;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <Navbar />

      {/* Executive Hero Architecture */}
      <section className="relative overflow-hidden pt-20 pb-32 border-b border-border/40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.03)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 text-center space-y-10 animate-in fade-in duration-700">
          <Badge
            variant="outline"
            className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em]"
          >
            <Sparkles className="w-3 h-3 mr-2 fill-primary" /> Intelligence Service Protocol
          </Badge>

          <div className="space-y-4">
            <div className="h-20 w-20 rounded-[28px] bg-card border border-border/40 shadow-2xl flex items-center justify-center mx-auto mb-8">
              <ServiceIcon className={cn("h-10 w-10", service.color)} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] text-foreground uppercase">
              {service.title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed italic">
              "{service.tagline}"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate(service.ctaLink)}
              className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
            >
              {service.cta} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth?tab=signup")}
              className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs border-border/40 hover:bg-muted"
            >
              Secure Grant Access
            </Button>
          </div>
        </div>
      </section>

      {/* Logic Verification (Benefits) */}
      <section className="py-24 bg-muted/20 border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6">
          <header className="text-center mb-16 space-y-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase">Intelligence Deliverables</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">System Output Matrix</p>
          </header>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {service.benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-card rounded-[32px] p-6 border border-border/40 hover:border-primary/20 transition-all shadow-sm group"
              >
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-sm font-bold uppercase tracking-tighter leading-tight text-foreground/80 pt-1">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline HUD (How It Works) */}
      <section className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <header className="text-center mb-16 space-y-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase text-primary">Pipeline Sequence</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Neural Execution Flow</p>
          </header>
          <div className="grid gap-8 md:grid-cols-3 relative">
            {service.howItWorks.map((step, i) => (
              <div key={i} className="relative z-10 text-center space-y-6 group">
                <div className="w-16 h-16 rounded-[24px] bg-primary text-white font-black text-xl flex items-center justify-center mx-auto shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform">
                  0{i + 1}
                </div>
                <div className="space-y-2 px-4">
                  <h3 className="font-black text-sm uppercase tracking-tight">{step.step}</h3>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">{step.desc}</p>
                </div>
              </div>
            ))}
            {/* Visual connector for desktop */}
            <div className="absolute top-8 left-[15%] right-[15%] h-px bg-border/40 hidden md:block" />
          </div>
        </div>
      </section>

      {/* Strategic Call-to-Action */}
      <section className="py-24 bg-card border-y border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.03),transparent_50%)]" />
        <div className="max-w-3xl mx-auto px-6 text-center space-y-10 relative z-10">
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Zap className="h-7 w-7 text-primary fill-primary" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-tight">
              Initialize Your <br /> professional <span className="text-primary">trajectory.</span>
            </h2>
            <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl mx-auto">
              Join 50k+ professionals utilizing GroUp Academy intelligence nodes to out-compete the modern market.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate(service.ctaLink)}
              className="h-16 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/30 group"
            >
              Launch Sequence <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Authorized Academic Hub
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
