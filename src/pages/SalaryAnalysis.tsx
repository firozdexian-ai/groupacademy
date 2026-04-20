import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  TrendingUp,
  Target,
  Lightbulb,
  FileText,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Brand icon
import iconSalary from "@/assets/icons/icon-salary.png";

const SalaryAnalysis = () => {
  const deliverables = [
    {
      icon: BarChart3,
      title: "Neural Market Benchmarks",
      description: "Precise salary ranges mapped to global demand and regional economic nodes.",
      color: "text-primary",
    },
    {
      icon: Target,
      title: "Logic Gap Analysis",
      description: "Identification of technical and behavioral deficiencies affecting your market value.",
      color: "text-amber-500",
    },
    {
      icon: Lightbulb,
      title: "Negotiation Protocol",
      description: "Tactical response scripts and psychological anchors for high-stakes offers.",
      color: "text-emerald-500",
    },
    {
      icon: FileText,
      title: "Strategic Action Plan",
      description: "A chronological blueprint to optimize your career trajectory and earnings.",
      color: "text-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <Navbar />

      {/* Executive Hero Architecture */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-40 overflow-hidden border-b border-border/40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10 animate-in fade-in duration-700">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 rounded-[24px] bg-primary/10 animate-ping" />
              <div className="relative h-20 w-20 rounded-[24px] bg-primary/5 border border-primary/20 flex items-center justify-center shadow-2xl">
                <img src={iconSalary} alt="Salary Analysis" className="w-10 h-10 object-contain" />
              </div>
            </div>

            <div className="space-y-4">
              <Badge
                variant="outline"
                className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em]"
              >
                <Sparkles className="w-3 h-3 mr-2 fill-primary" /> Founding Grant: First Analysis Free
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-foreground">
                Know Your <span className="text-primary">Market Alpha.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                Utilize proprietary AI modeling to audit your career value. Align your compensation with global industry
                benchmarks and tactical negotiation logic.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                <Link to="/salary-analysis/setup">
                  Initialize Free Audit <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-border/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Standard Protocol: 50 Credits
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deliverable Bento Grid */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <header className="text-center mb-16 space-y-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase">Intelligence Deliverables</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Neural System Output</p>
          </header>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {deliverables.map((item, index) => (
              <Card
                key={index}
                className="rounded-[32px] border-border/40 bg-card/50 backdrop-blur-sm group hover:border-primary/20 hover:shadow-2xl transition-all duration-500"
              >
                <CardHeader className="pb-4">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
                      item.color,
                    )}
                  >
                    <item.icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-lg font-black tracking-tight uppercase">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Logic Verification Section */}
      <section className="py-24 px-6 bg-muted/20 border-y border-border/40">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tighter uppercase">
                  Compensation <br />
                  <span className="text-primary">Logic Audit.</span>
                </h2>
                <p className="text-lg font-medium text-muted-foreground leading-relaxed">
                  Negotiating without structured market intelligence is a logical error. Our AI decrypts industry data
                  to provide the psychological anchors needed for successful outcomes.
                </p>
              </div>
              <ul className="space-y-4">
                {[
                  "CV vs. Market Artifact Analysis",
                  "Geographic-Adjusted Salary Nodes",
                  "Behavioral Negotiation Tactics",
                  "Skill-to-Value Mapping",
                  "Real-time Industry Demand Index",
                  "Downloadable Executive PDF",
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-tighter text-foreground/80">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Card className="rounded-[40px] border-border/40 shadow-2xl bg-card overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-border/10 bg-muted/30">
                <CardTitle className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary fill-primary" /> Pipeline Sequence
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {[
                  { step: "01", title: "Identity Ingestion", desc: "Upload PDF or paste career artifacts." },
                  { step: "02", title: "Target Calibration", desc: "Define target role and market sector." },
                  { step: "03", title: "Intelligence Generation", desc: "AI synthesizes and benchmarks data." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start relative group">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs shrink-0 shadow-lg shadow-primary/20">
                      {item.step}
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-sm uppercase tracking-tight">{item.title}</p>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                    {i < 2 && (
                      <div className="absolute left-5 top-10 w-0.5 h-8 bg-border group-hover:bg-primary/20 transition-colors" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Global CTA Node */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full opacity-50 pointer-events-none" />
        <div className="container mx-auto max-w-2xl text-center space-y-8 relative z-10">
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tighter uppercase">Initialize Valuation.</h2>
            <p className="text-muted-foreground font-medium text-lg leading-relaxed">
              Secure your professional market position today. Your first executive audit is complimentary.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20"
          >
            <Link to="/salary-analysis/setup">
              Launch Free Audit <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">
            GroUp Academy Intelligence Systems v2.6
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SalaryAnalysis;
