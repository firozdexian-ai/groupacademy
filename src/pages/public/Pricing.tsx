import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Check, Info, HelpCircle, Gift, Sparkles, Zap, ShieldAlert, Cpu } from "lucide-react";

export default function Pricing() {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate("/auth?tab=signup");
  };

  const pricingTiers = [
    {
      name: "Starter",
      price: "$10",
      credits: "100 credits",
      description: "Perfect for a quick career check-up or single interview practice session.",
      features: [
        "100 platform credits",
        "Full AI CV Coach review (10cr / run)",
        "Mock Interview practice (75cr / session)",
        "Standard response times",
        "Email support",
      ],
      popular: false,
      ctaText: "Buy Starter Pack",
    },
    {
      name: "Professional",
      price: "$25",
      credits: "300 credits",
      description: "Our most popular pack for active job seekers needing continuous preparation.",
      features: [
        "300 platform credits (save 17%)",
        "Priority AI coach processing",
        "Unlimited CV reviews",
        "Multiple mock interview sessions",
        "Access to advanced interview simulators",
        "Priority chat support",
      ],
      popular: true,
      ctaText: "Get Professional Pack",
    },
    {
      name: "Enterprise",
      price: "Custom",
      credits: "Bulk credits",
      description: "For universities, coding bootcamps, and organizations training multiple cohorts.",
      features: [
        "Custom credit allocations",
        "Dedicated workspace & recruiter seat",
        "Custom company-branded interview questions",
        "Detailed performance analytics dashboard",
        "API access & team integrations",
        "Dedicated account manager",
      ],
      popular: false,
      ctaText: "Contact Sales",
    },
  ];

  const creditCosts = [
    { activity: "AI CV Analysis & ATS Check", cost: "10 credits", details: "Upload your CV and get immediate keyword optimization suggestions." },
    { activity: "Mock AI Interview Session", cost: "75 credits", details: "Interactive voice practice with real-time scorecards and response audit." },
    { activity: "Salary Analysis & Valuation", cost: "50 credits", details: "Calculate your current market value based on live global benchmarks." },
    { activity: "AI Specialist Coach (Per Session)", cost: "20 credits", details: "Dedicated chat mentoring sessions with Aisha or other specialists." },
  ];

  return (
    <PublicLayout>
      <main className="relative pt-20 pb-32 overflow-hidden selection:bg-primary/10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-6 mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 fill-primary" /> Premium V1.0 Credit Packages
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
              Pay Only For <span className="text-primary">What You Use</span>.
            </h1>
            <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              No complex monthly contracts. Purchase credits to unlock premium AI audits, coaching, and interview prep.
            </p>

            {/* Welcome Bonus Callout */}
            <div className="inline-flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 max-w-md mx-auto text-left">
              <Gift className="w-10 h-10 shrink-0 text-emerald-500" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Welcome Offer</p>
                <p className="text-xs font-semibold leading-relaxed">
                  Sign up today and get <strong className="font-black">+250 free platform credits</strong> credited to your profile instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch mb-24">
            {pricingTiers.map((tier, idx) => (
              <Card
                key={idx}
                className={`rounded-[32px] border-border/40 bg-card/40 backdrop-blur-md flex flex-col justify-between transition-all duration-300 relative group overflow-hidden ${
                  tier.popular ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-2xl" : "hover:border-primary/20 hover:shadow-xl"
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                    Most Popular
                  </div>
                )}
                <div>
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">{tier.name}</CardTitle>
                    <CardDescription className="text-xs font-medium mt-1 min-h-[40px] leading-relaxed">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-6">
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl md:text-5xl font-black tracking-tight">{tier.price}</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        / {tier.credits}
                      </span>
                    </div>
                    <div className="space-y-3.5">
                      {tier.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-xs text-muted-foreground font-semibold leading-tight">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
                <CardFooter className="p-8 pt-0">
                  <Button
                    onClick={handleCTA}
                    className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all"
                    variant={tier.popular ? "default" : "outline"}
                  >
                    {tier.ctaText}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Credits Transparency Table */}
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tighter uppercase">Credit Value Guide</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Transparent credit usage breakdown
              </p>
            </div>

            <div className="bg-card/30 backdrop-blur-sm border border-border/40 rounded-3xl overflow-hidden shadow-lg">
              <div className="grid grid-cols-1 divide-y divide-border/40">
                {creditCosts.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-card/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-foreground uppercase tracking-tight">
                        {item.activity}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                        {item.details}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start md:self-auto bg-primary/5 border border-primary/20 text-primary font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest">
                      <Zap className="w-3.5 h-3.5 fill-primary" /> {item.cost}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantee / FAQ */}
            <div className="grid md:grid-cols-2 gap-6 pt-10">
              <div className="p-6 rounded-2xl bg-muted/30 border border-border/30 flex gap-4">
                <Info className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider">Do credits expire?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No. Once purchased, your credits remain active in your account indefinitely, ready for when you need to run mock interviews or optimize your resume.
                  </p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-muted/30 border border-border/30 flex gap-4">
                <Cpu className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider">Refund Policy</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If you are unsatisfied with the quality of an AI interview feedback report or CV optimization audit, contact us for a full refund of that session's credits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}
