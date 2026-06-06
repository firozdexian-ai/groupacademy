import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { getDefaultRouteFor } from "@/lib/postAuthRoute";
import { usePWADetect } from "@/hooks/usePWADetect";
import { listLatestPublishedBlogPostsLite } from "@/domains/marketing/repo/marketingRepo";
import logoIcon from "@/assets/logo-icon.png";
import { PublicLayout } from "@/layouts/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  Target,
  Mic,
  DollarSign,
  Briefcase,
  Bot,
  Building2,
  Users,
  BarChart3,
  Search,
  Sparkles,
  ShieldCheck,
  Globe,
  Zap,
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  published_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { accountType, isLoading: isAccountTypeLoading } = useAccountType();
  const { isPWA, isLoading: isPWALoading } = usePWADetect();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState({
    talents: 1240,
    companies: 42,
    jobs: 180,
    agents: 9,
    loading: true,
  });

  const isGlobalLoading = isAuthLoading || isPWALoading || (!!user && isAccountTypeLoading);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      const data = await listLatestPublishedBlogPostsLite(3);
      if (data) setBlogPosts(data as BlogPost[]);
    };
    fetchBlogPosts();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [talentsRes, companiesRes, jobsRes, agentsRes] = await Promise.all([
          supabase.from("talents").select("*", { count: "exact", head: true }),
          supabase.from("companies").select("*", { count: "exact", head: true }),
          supabase.from("jobs").select("*", { count: "exact", head: true }),
          supabase.from("ai_agents").select("*", { count: "exact", head: true }),
        ]);

        setStats({
          talents: talentsRes.count ?? 1240,
          companies: companiesRes.count ?? 42,
          jobs: jobsRes.count ?? 180,
          agents: agentsRes.count ?? 9,
          loading: false,
        });
      } catch (error) {
        console.error("Failed to fetch live stats, using fallbacks:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchStats();
  }, []);

  // CTO Routing Guard: Prevents landing page "flash" for authenticated/PWA users
  useEffect(() => {
    if (isGlobalLoading) return;

    // For signed-in users, wait until accountType is resolved (not "unknown")
    // to avoid sending company users to the talent feed.
    const dest = user
      ? (accountType === "unknown" ? null : getDefaultRouteFor(accountType))
      : null;

    if (isPWA) {
      navigate(dest ?? "/auth", { replace: true });
      return;
    }

    if (dest) {
      navigate(dest, { replace: true });
    }
  }, [isGlobalLoading, isPWA, user, accountType, navigate]);

  if (isGlobalLoading || user || (isPWA && !user)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center animate-in fade-in duration-500">
        <img src={logoIcon} alt="GroUp" className="w-16 h-16 mb-8 animate-pulse" />
        <div className="flex gap-1.5">
          {[0, 150, 300].map((d) => (
            <div
              key={d}
              className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "GroUp Academy",
    description: "AI-powered career acceleration and recruitment ecosystem.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main>
        {/* Hero Architecture */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="container mx-auto px-6 text-center space-y-8 relative z-10">
            <div
              className="inline-flex items-center justify-center rounded-full px-4 py-1.5 border border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em] animate-in slide-in-from-top-4 duration-700 w-fit mx-auto"
            >
              <Sparkles className="w-3 h-3 mr-2 fill-primary" /> Future-Proof Your Career
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] max-w-4xl mx-auto">
              Master the <span className="text-primary">New Rules</span> of the Job Market.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Recruitment is changing. GroUp Academy gives you the AI tools to assess, prepare, and get hired by global
              brands.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button
                size="lg"
                onClick={() => navigate("/start")}
                className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> +250 Welcome Credits
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Statistics Banner */}
        <section className="container mx-auto px-6 -mt-8 mb-16 max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Professionals", value: stats.talents, icon: Users, color: "text-blue-500" },
              { label: "Hiring Partners", value: stats.companies, icon: Building2, color: "text-secondary" },
              { label: "Active Listings", value: stats.jobs, icon: Briefcase, color: "text-emerald-500" },
              { label: "Specialist Coaches", value: stats.agents, icon: Bot, color: "text-primary" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-card/45 backdrop-blur-md border border-border/40 hover:border-primary/20 hover:bg-card/60 transition-all duration-300 rounded-2xl p-6 flex items-center justify-between group shadow-sm hover:shadow-md"
              >
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                    {stats.loading ? "..." : stat.value.toLocaleString()}+
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-muted/40 group-hover:scale-110 transition-transform ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bimodal Value Props */}
        <section className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Seeker Vertical */}
            <Card className="rounded-[40px] border-border/40 bg-card/50 overflow-hidden group hover:shadow-2xl transition-all">
              <div className="p-8 md:p-12 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight uppercase">Professionals</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Accelerate Your Trajectory
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: Target, text: "Readiness Audit" },
                    { icon: Mic, text: "Mock Interviews" },
                    { icon: DollarSign, text: "Salary Indexing" },
                    { icon: Bot, text: "AI Coaching" },
                  ].map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-transparent group-hover:border-primary/10 transition-all"
                    >
                      <f.icon className="w-4 h-4 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-tight">{f.text}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => navigate("/start")}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-foreground text-background hover:bg-foreground/90 transition-all"
                >
                  Launch Profile
                </Button>
              </div>
            </Card>

            {/* Corporate Vertical */}
            <Card className="rounded-[40px] border-border/40 bg-muted/20 overflow-hidden group hover:shadow-2xl transition-all">
              <div className="p-8 md:p-12 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight uppercase">Employers</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Identify Elite Talent
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: Globe, text: "Global Sourcing" },
                    { icon: Zap, text: "Instant Vetting" },
                    { icon: Search, text: "Smart Filters" },
                    { icon: BarChart3, text: "Success Intel" },
                  ].map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-transparent group-hover:border-secondary/10 transition-all"
                    >
                      <f.icon className="w-4 h-4 text-secondary" />
                      <span className="text-[11px] font-bold uppercase tracking-tight">{f.text}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => navigate("/gro10x")}
                  variant="secondary"
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-secondary/10"
                >
                  Partner with Us
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Insight Engine (Blog) */}
        <section className="container mx-auto px-6 py-24 border-t border-border/40">
          <header className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black tracking-tighter uppercase">Industry Intel</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">
              Latest from the Career Lab
            </p>
          </header>

          {blogPosts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {blogPosts.map((post) => (
                <div
                  key={post.id}
                  className="group cursor-pointer space-y-4"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <div className="aspect-[16/10] rounded-[24px] overflow-hidden border border-border/40 bg-muted relative">
                    {post.featured_image && (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-2 px-2">
                    <h3 className="font-black text-lg tracking-tight leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                      {post.excerpt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-xl mx-auto text-center py-12 p-8 rounded-[32px] border-2 border-dashed border-border/40 bg-muted/10">
              <Zap className="w-10 h-10 text-primary mx-auto mb-6 opacity-20" />
              <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
                Lab results pending... Subscribe for updates.
              </p>
            </div>
          )}
        </section>
      </main>
    </PublicLayout>
  );
};

export default Index;
