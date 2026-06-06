import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/layouts/PublicLayout";
import {
  Target,
  Mic,
  DollarSign,
  FolderOpen,
  Bot,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICES = [
  {
    slug: "assessment",
    icon: Target,
    title: "Career Readiness Scorecard",
    description:
      "Multi-dimensional AI analysis evaluating technical logic, communication flow, and industry contextual awareness.",
    benefits: ["Industry benchmarking", "Granular skill mapping", "AI logic audit", "PDF Intelligence Report"],
    credits: 50,
    color: "text-primary",
    bgColor: "bg-primary/5",
  },
  {
    slug: "mock-interview",
    icon: Mic,
    title: "AI Mock Interview",
    description:
      "Dynamic simulation with realistic AI personas tailored to specific organizational JDs and difficulty tiers.",
    benefits: ["JD-specific branches", "Real-time logic feedback", "Behavioral scoring", "Refinement tips"],
    credits: 75,
    color: "text-amber-600",
    bgColor: "bg-amber-500/5",
  },
  {
    slug: "salary-analysis",
    icon: DollarSign,
    title: "Market Intelligence",
    description:
      "Comprehensive salary benchmarking leveraging real-time market data across global and regional sectors.",
    benefits: ["Rate comparison", "Adjusted ranges", "Negotiation logic", "Trend projections"],
    credits: 50,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/5",
  },
  {
    slug: "portfolio",
    icon: FolderOpen,
    title: "Artifact Engineering",
    description:
      "Conversion-optimized digital portfolios engineered to bypass ATS filters and impress human recruiters.",
    benefits: ["Custom architecture", "Secure endpoint URL", "Visual showcase", "Identity branding"],
    credits: 100,
    color: "text-blue-600",
    bgColor: "bg-blue-500/5",
  },
  {
    slug: "ai-agents",
    icon: Bot,
    title: "Career Oracle Agents",
    description:
      "24/7 access to specialized AI nodes for resume decryption, interview strategy, and technical mentorship.",
    benefits: ["Instant availability", "Vertical expertise", "Neural advice", "Multi-agent context"],
    credits: 10,
    color: "text-purple-600",
    bgColor: "bg-purple-500/5",
  },
];

export default function PublicServices() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Intelligence Suite - GroUp | AI Career Verification";
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "GroUp Academy Career Services",
    description: "AI-powered career acceleration and logic verification tools.",
    itemListElement: SERVICES.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.description,
        provider: { "@type": "Organization", name: "GroUp Academy" },
      },
    })),
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Architecture */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-border/40 bg-muted/20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-6 text-center space-y-8 relative z-10 animate-in fade-in duration-700">
          <Badge
            variant="outline"
            className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-tight"
          >
            <Sparkles className="w-3 h-3 mr-2 fill-primary" /> Professional Verification Protocol
          </Badge>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] max-w-4xl mx-auto">
            Tools for the <span className="text-primary">Logic-Driven</span> <br />
            Professional.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            High-fidelity AI services designed to audit your skills, simulate reality, and verify your professional
            trajectory.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth?tab=signup")}
              className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
            >
              Claim 250 Grant Credits <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-border/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Processing
            </div>
          </div>
        </div>
      </section>

      {/* Service Ledger */}
      <section className="container mx-auto px-6 py-20 flex-1">
        <div className="grid gap-8 max-w-5xl mx-auto">
          {SERVICES.map((service, idx) => (
            <Card
              key={service.slug}
              className="rounded-2xl border-border/40 shadow-xl overflow-hidden group hover:border-primary/20 transition-all duration-500 bg-card backdrop-blur-sm animate-in slide-in-from-bottom-8"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="flex-1 space-y-8">
                    <div className="flex items-center gap-5">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500",
                          service.bgColor,
                        )}
                      >
                        <service.icon className={cn("w-8 h-8", service.color)} />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tight uppercase">{service.title}</h2>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-background text-[9px] font-black uppercase tracking-widest px-2 border-border/60"
                          >
                            {service.credits} Credits
                          </Badge>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            Logic Tier 01
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-2xl">
                      {service.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {service.benefits.map((b, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/20"
                        >
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-tighter text-foreground/80">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center lg:min-w-[200px] border-t lg:border-t-0 lg:border-l border-border/20 pt-8 lg:pt-0 lg:pl-8">
                    <Button
                      className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg"
                      onClick={() => navigate(`/auth?tab=signup&returnTo=/app/services/${service.slug}`)}
                    >
                      Launch Sequence <Zap className="w-3.5 h-3.5 ml-2 fill-current" />
                    </Button>
                    <p className="mt-4 text-[9px] font-black uppercase tracking-tight text-muted-foreground opacity-40">
                      Ready for handshake
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
