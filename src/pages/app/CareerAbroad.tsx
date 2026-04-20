import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Briefcase,
  ChevronRight,
  Globe,
  Map,
  Sparkles,
  CheckCircle2,
  Zap,
  Target,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Global Mobility Registry
 * Orchestrates study, prep, and employment protocols for international deployment.
 * 2026 Standard: Executive Logic geometry with reinforced geospatial nodes.
 */

const POPULAR_DESTINATIONS = COUNTRIES.filter((c) =>
  ["US", "UK", "CA", "AU", "DE", "SG", "JP", "SE", "NL"].includes(c.code),
);

const ABROAD_SECTIONS = [
  {
    title: "Study Abroad",
    description: "Academic Registry & Scholarships",
    icon: GraduationCap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    href: "/app/abroad/study",
  },
  {
    title: "IELTS Prep",
    description: "Neural Language Calibration",
    icon: BookOpen,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    href: "/app/abroad/ielts",
  },
  {
    title: "Jobs Abroad",
    description: "Global Labor Handshakes",
    icon: Briefcase,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    href: "/app/jobs?location=abroad",
  },
];

export default function CareerAbroad() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Executive Header: Geospatial Handshake */}
      <header className="relative overflow-hidden rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <Globe className="h-40 w-40" />
        </div>
        <CardContent className="p-10 relative z-10">
          <div className="flex items-center gap-5 mb-6">
            <div className="h-14 w-14 rounded-[24px] bg-primary/10 flex items-center justify-center border-2 border-primary/20 rotate-3 shadow-xl">
              <Globe className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Global Mobility</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-2">
                Active Deployment Protocol v2.6
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl font-medium leading-relaxed italic">
            Strategic gateway for international career deployment. Synchronize with global university registries,
            language calibration modules, and international labor markets.
          </p>
        </CardContent>
      </header>

      {/* Primary Operation Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ABROAD_SECTIONS.map((section) => (
          <Card
            key={section.title}
            className="group cursor-pointer hover:border-primary/40 transition-all duration-500 border-2 bg-card/50 backdrop-blur-sm rounded-[32px] overflow-hidden shadow-lg"
            onClick={() => navigate(section.href)}
          >
            <CardContent className="p-8 space-y-6">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 shadow-inner",
                  section.bgColor,
                )}
              >
                <section.icon className={cn("h-7 w-7", section.color)} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tighter text-lg leading-none">{section.title}</h3>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">
                  {section.description}
                </p>
              </div>
              <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Initialize Node</span>
                <ChevronRight className="h-4 w-4 text-primary/40 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Geospatial Registry: Target Destinations */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
            <Target className="h-4 w-4" /> Destination Registry
          </h2>
          <Badge
            variant="outline"
            className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest px-3 py-1"
          >
            {POPULAR_DESTINATIONS.length} Active Nodes
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {POPULAR_DESTINATIONS.map((country) => (
            <Card
              key={country.code}
              className="group cursor-pointer border-2 border-border/40 bg-card/30 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:border-primary/40 hover:scale-105 active:scale-95"
              onClick={() => navigate(`/app/abroad/study?country=${country.code}`)}
            >
              <CardContent className="p-4 flex flex-col items-center gap-3">
                <span className="text-3xl shadow-sm filter grayscale group-hover:grayscale-0 transition-all duration-500">
                  {getCountryFlag(country.code)}
                </span>
                <span className="font-black uppercase tracking-tighter text-[10px] text-center line-clamp-1 group-hover:text-primary transition-colors">
                  {country.name}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Neural Roadmap CTA: Executive Insight */}
      <Card className="rounded-[40px] border-2 border-primary/40 bg-primary/5 shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.1),transparent)]" />
        <CardContent className="p-10 relative z-10 flex flex-col lg:flex-row items-center gap-10">
          <div className="h-20 w-20 rounded-[32px] bg-primary flex items-center justify-center rotate-3 shadow-2xl shadow-primary/40 flex-shrink-0">
            <Map className="h-10 w-10 text-primary-foreground" />
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/20 text-primary border-primary/40 text-[9px] font-black uppercase tracking-widest px-2 py-1">
                  Premium Logic
                </Badge>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Relocation Roadmap</h3>
              </div>
              <p className="text-sm text-muted-foreground/80 font-medium italic">
                Synthetic Intelligence synthesis of a 12-month tactical application sequence tailored to your registry
                profile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, label: "University Alignment" },
                { icon: Zap, label: "Timeline Telemetry" },
                { icon: CheckCircle2, label: "Budget Calibration" },
                { icon: Sparkles, label: "Scholarship Logic" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary/60"
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 min-w-[200px]">
            <Button
              size="lg"
              onClick={() => navigate("/app/abroad/roadmap")}
              className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
            >
              Generate Synthesis
            </Button>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
              <Zap className="h-3.5 w-3.5" /> {CREDIT_CONFIG.SERVICES.STUDY_ABROAD_ROADMAP?.cost || 100} Credits
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terminal Footer Metadata */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Geospatial Registry: Verified Handshake Active
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Protocol: International Deploy v2.6
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
