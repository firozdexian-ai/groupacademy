import { useNavigate } from "react-router-dom";
import {
  Building2,
  Briefcase,
  Users,
  BarChart3,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Zap,
  Globe,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "Precision Sourcing",
    description: "Target pre-vetted candidates filtered by AI readiness scores.",
    icon: ShieldCheck,
    tint: "primary",
  },
  {
    title: "Talent Acquisition",
    description: "Instant access to the fastest-growing professional pool in the region.",
    icon: Globe,
    tint: "secondary",
  },
  {
    title: "Hiring Analytics",
    description: "Deep insights into candidate logic and behavioral performance.",
    icon: BarChart3,
    tint: "accent",
  },
];

export default function Organization() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("organization_waitlist").insert({
        email: email.toLowerCase().trim(),
        company_name: companyName.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("Verification Complete: You are already in the priority sequence.");
          setSubmitted(true);
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast.success("Waitlist Confirmed. You will receive an executive brief soon.");
      }
    } catch (error) {
      console.error("Critical: Waitlist ingestion failure:", error);
      toast.error("Network handshake failed. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <Navbar />

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          {/* Executive Hero */}
          <section className="text-center mb-20 space-y-8 animate-in fade-in duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Partner with GroUp Academy
              </span>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                Build Your Elite <br />
                <span className="text-primary">Global Workforce.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                Unlock early access to our proprietary AI vetting engine. Post roles, audit candidate logic, and scale
                your organization with job-ready talent.
              </p>
            </div>
          </section>

          {/* Value Bento Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-24">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className="rounded-[32px] border-border/40 bg-card/50 backdrop-blur-sm group hover:border-primary/20 transition-all"
              >
                <CardHeader className="pb-4">
                  <div
                    className={cn(
                      "p-4 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform",
                      `bg-${feature.tint}/10`,
                    )}
                  >
                    <feature.icon className={cn("h-6 w-6", `text-${feature.tint}`)} />
                  </div>
                  <CardTitle className="text-lg font-black tracking-tight uppercase">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Waitlist Handshake */}
          <section className="relative">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-50 pointer-events-none" />
            <Card className="max-w-xl mx-auto rounded-[40px] border-primary/10 shadow-2xl overflow-hidden relative">
              <CardHeader className="text-center p-10 pb-6">
                <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-3xl font-black tracking-tighter">Reserve Priority Access</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest mt-2">
                  Be the first to integrate AI vetting into your pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0">
                {submitted ? (
                  <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                      <ShieldCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-black tracking-tight">Access Sequence Logged</p>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        We have added {email} to our priority onboarding queue. <br /> Our B2B team will be in touch
                        shortly.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Work Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 rounded-xl border-border/40 bg-muted/20 focus-visible:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Entity Name
                      </Label>
                      <Input
                        type="text"
                        placeholder="Company Name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="h-12 rounded-xl border-border/40 bg-muted/20"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all mt-4"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Initialize Partnership
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Lateral Navigation */}
          <div className="text-center mt-20 space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
              Switch Perspective
            </p>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 text-primary"
            >
              Launch Career Platform <Zap className="ml-2 h-3.5 w-3.5 fill-primary" />
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Internal Helper for Labels
function Label({ children, className, ...props }: any) {
  return (
    <label className={cn("block text-sm font-medium", className)} {...props}>
      {children}
    </label>
  );
}
