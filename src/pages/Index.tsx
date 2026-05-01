import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { getDefaultRouteFor } from "@/lib/postAuthRoute";
import { usePWADetect } from "@/hooks/usePWADetect";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import logoIcon from "@/assets/logo-icon.png";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import {
  ArrowRight,
  Target,
  Mic,
  DollarSign,
  Briefcase,
  FolderOpen,
  Bot,
  Building2,
  Users,
  BarChart3,
  Search,
  Moon,
  Sun,
  Sparkles,
  ShieldCheck,
  Globe,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { theme, setTheme } = useTheme();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  const isGlobalLoading = isAuthLoading || isPWALoading || (!!user && isAccountTypeLoading);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);
      if (data) setBlogPosts(data as BlogPost[]);
    };
    fetchBlogPosts();
  }, []);

  // CTO Routing Guard: Prevents landing page "flash" for authenticated/PWA users
  useEffect(() => {
    if (isGlobalLoading) return;

    const dest = user ? getDefaultRouteFor(accountType) : null;

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
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <img
            src={theme === "dark" ? logoLight : logoDark}
            alt="GroUp Academy"
            className="h-8 w-auto hover:opacity-80 transition-opacity cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 border-primary/20 hover:bg-primary/5"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Architecture */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="container mx-auto px-6 text-center space-y-8 relative z-10">
            <Badge
              variant="outline"
              className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em] animate-in slide-in-from-top-4 duration-700"
            >
              <Sparkles className="w-3 h-3 mr-2 fill-primary" /> Future-Proof Your Career
            </Badge>

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
                onClick={() => navigate("/auth?tab=signup")}
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
                  onClick={() => navigate("/auth?tab=signup")}
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
                  onClick={() => navigate("/org")}
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

      <footer className="border-t border-border/40 bg-card py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-4 text-center md:text-left">
              <img src={logoIcon} alt="GroUp" className="w-10 h-10 mx-auto md:mx-0 grayscale opacity-50" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                © 2026 GroUp Academy. Patent Pending.
              </p>
            </div>
            <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {["courses", "career-services", "for-companies", "blog", "auth"].map((path) => (
                <button
                  key={path}
                  onClick={() => navigate(`/${path}`)}
                  className="hover:text-primary transition-colors"
                >
                  {path.replace("-", " ")}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
