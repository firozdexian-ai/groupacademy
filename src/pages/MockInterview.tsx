import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  MessageSquare,
  Target,
  BarChart3,
  Clock,
  CheckCircle,
  Sparkles,
  BriefcaseIcon,
  ShieldCheck,
  Zap,
  Mic2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Brand icon
import iconMockInterview from "@/assets/icons/icon-mock-interview.png";

export default function MockInterview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <Navbar />

      <main className="flex-1">
        {/* Executive Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden border-b border-border/40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="container mx-auto px-6 relative text-center space-y-8 animate-in fade-in duration-1000">
            <div className="icon-container-lg mx-auto mb-2 bg-background shadow-2xl border border-primary/20">
              <img src={iconMockInterview} alt="Mock Interview" className="w-12 h-12 object-contain" />
            </div>

            <div className="space-y-4 max-w-4xl mx-auto">
              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                <Sparkles className="w-3 h-3 mr-2 fill-primary" /> Neural Practice Engine
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                Ace the Interview <br />
                <span className="text-primary">Before it Happens.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                Paste your Target Job Description. Our AI generates a custom 5-stage interview, analyzes your tone, and
                calculates your selection probability.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/mock-interview/setup")}
                className="h-16 px-10 rounded-[20px] text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all group"
              >
                Start Mission Prep{" "}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> First attempt Free
              </div>
            </div>
          </div>
        </section>

        {/* Process Bento Grid */}
        <section className="container mx-auto px-6 py-24">
          <header className="text-center mb-16 space-y-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase">The Preparation Protocol</h2>
            <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
              Four Steps to Employment Ready
            </p>
          </header>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                icon: BriefcaseIcon,
                title: "JD INGESTION",
                desc: "AI maps the required skills from your pasted Job Description.",
              },
              {
                step: "02",
                icon: Mic2,
                title: "NEURAL PROMPT",
                desc: "Face job-specific behavioral and technical questions.",
              },
              {
                step: "03",
                icon: Sparkles,
                title: "LOGIC AUDIT",
                desc: "Detailed sentiment and accuracy analysis of every response.",
              },
              {
                step: "04",
                icon: BarChart3,
                title: "SELECTION SCORE",
                desc: "Get a final percentage rating based on industry benchmarks.",
              },
            ].map((item, i) => (
              <Card
                key={i}
                className="rounded-[32px] border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all"
              >
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-primary/30 tracking-[0.3em]">{item.step}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-xs uppercase tracking-widest">{item.title}</h3>
                    <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Strategic Benefits Section */}
        <section className="bg-muted/30 py-24 border-y border-border/40">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-[20px] flex items-center justify-center mx-auto shadow-xl shadow-primary/5">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">JD Customization</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  No generic templates. Every session is hard-coded to your specific target role.
                </p>
              </div>
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 bg-secondary/10 rounded-[20px] flex items-center justify-center mx-auto shadow-xl shadow-secondary/5">
                  <Zap className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">Instant Feedback</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Real-time corrections on filler words, tone inconsistency, and technical errors.
                </p>
              </div>
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 bg-accent/10 rounded-[20px] flex items-center justify-center mx-auto shadow-xl shadow-accent/5">
                  <Clock className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">On-Demand Prep</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Simulate high-pressure interviews at 2 AM. The AI is always in the conference room.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Architecture */}
        <section className="container mx-auto px-6 py-24">
          <div className="max-w-2xl mx-auto space-y-12">
            <header className="text-center">
              <h2 className="text-3xl font-black tracking-tighter uppercase">Access Model</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Sustainable Skill Refinement
              </p>
            </header>

            <Card className="rounded-[40px] border-primary/20 bg-primary/[0.02] shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles className="h-32 w-32 text-primary" />
              </div>
              <CardContent className="p-10 space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left space-y-1">
                    <h3 className="text-lg font-black uppercase tracking-tight">Onboarding Session</h3>
                    <p className="text-xs font-medium text-muted-foreground">
                      Full AI diagnostic for your first interview
                    </p>
                  </div>
                  <Badge className="bg-emerald-500 text-white border-none font-black text-sm px-6 py-2 rounded-xl">
                    FREE
                  </Badge>
                </div>

                <div className="h-px bg-border/40 w-full" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left space-y-1">
                    <h3 className="text-lg font-black uppercase tracking-tight">Priority Retake</h3>
                    <p className="text-xs font-medium text-muted-foreground italic">
                      Instant reset (Bypasses 30-day cooldown)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="border-primary/40 text-primary font-black text-sm px-6 py-2 rounded-xl"
                    >
                      50 CREDITS
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-6 py-32 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Ready for the Hot Seat?</h2>
          <Button
            size="lg"
            onClick={() => navigate("/mock-interview/setup")}
            className="h-16 px-12 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            Launch Interview Terminal
          </Button>
          <div className="flex justify-center gap-6">
            {["Custom Questions", "AI Diagnostic", "PDF Export"].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60"
              >
                <CheckCircle className="h-3 w-3 text-primary" /> {item}
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
