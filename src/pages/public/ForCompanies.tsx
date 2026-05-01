import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Bot, Briefcase, ArrowRight, CheckCircle2, Building2, Sparkles, ShieldCheck } from "lucide-react";

const VALUE_PROPS = [
  {
    icon: Users,
    title: "Vetted talent pipeline",
    description: "Access pre-screened professionals trained in our academies — ready to hire, contract, or upskill.",
  },
  {
    icon: Bot,
    title: "AI Career Agents for your team",
    description: "Give every employee an AI coach for career growth, skill mapping, and performance support.",
  },
  {
    icon: Briefcase,
    title: "Managed gigs & projects",
    description: "Post jobs or short-term gigs and let our network deliver — with quality oversight built in.",
  },
];

const STEPS = [
  { n: 1, title: "Request access", description: "Tell us about your company in 2 minutes." },
  { n: 2, title: "Get approved", description: "We review and approve within 1 business day." },
  { n: 3, title: "Invite your team", description: "Add hiring managers and HR to your portal." },
  { n: 4, title: "Start hiring", description: "Post jobs, browse talent, deploy AI agents." },
];

export default function ForCompanies() {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Group Academy for Companies",
    provider: { "@type": "Organization", name: "Group Academy", url: "https://groupacademy.online" },
    description: "Hire pre-vetted talent and deploy AI Career Agents for your workforce.",
    areaServed: "Global",
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>For Companies — Hire Talent & Deploy AI Agents | Group Academy</title>
        <meta
          name="description"
          content="Hire pre-vetted talent, deploy AI Career Agents for your team, and manage gigs — all on Group Academy."
        />
        <link rel="canonical" href="https://groupacademy.online/for-companies" />
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
      </Helmet>

      {/* Top bar */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg">Group Academy</Link>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/for-companies/apply"><Button size="sm">Request access</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <Badge variant="secondary" className="mb-4">For Companies</Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Hire pre-vetted talent. Deploy AI agents for your team.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Group Academy gives your company access to a global talent pipeline, AI Career Agents for every employee, and a managed gigs marketplace.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/for-companies/apply">
            <Button size="lg" className="gap-2">
              Request company access <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="mailto:partners@groupacademy.online?subject=Talk%20to%20sales">
            <Button size="lg" variant="outline">Talk to sales</Button>
          </a>
        </div>
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Vetted talent</span>
          <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> AI-native</span>
          <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Global</span>
        </div>
      </section>

      {/* Value props */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {VALUE_PROPS.map((vp) => (
            <Card key={vp.title}>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <vp.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{vp.title}</h3>
                <p className="text-sm text-muted-foreground">{vp.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-3">
                {s.n}
              </div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 rounded-xl">
        <h2 className="text-3xl font-bold text-center mb-8">What's included</h2>
        <div className="max-w-2xl mx-auto space-y-3">
          {[
            "Dedicated company portal with team management",
            "Unlimited job postings on the talent board",
            "AI Career Agents for your employees (per-seat pricing)",
            "Search & shortlist from our talent database",
            "Managed gigs marketplace for short-term projects",
            "Email + Slack notifications for new applicants",
            "Dedicated onboarding & support",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to hire smarter?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join companies using Group Academy to find talent, develop teams, and deliver projects faster.
        </p>
        <Link to="/for-companies/apply">
          <Button size="lg" className="gap-2">
            Request access <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">·</span>
          <Link to="/for-companies" className="hover:text-foreground">For Companies</Link>
          <span className="mx-2">·</span>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
