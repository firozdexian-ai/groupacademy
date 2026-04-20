import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import logoIcon from "@/assets/logo-icon.png";
import {
  ArrowRight,
  Sun,
  Moon,
  BookOpen,
  Clock,
  Users,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  Zap,
  TrendingUp,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PublicCourses() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    document.title = "Academy Catalog - GroUp | Expert-Led Career Tracks";
  }, []);

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select(
          "id, title, slug, description, cover_image_url, thumbnail_url, content_type, duration_hours, current_enrollment, instructor_name, modules_count",
        )
        .eq("is_published", true)
        .eq("is_private", false)
        .in("content_type", ["recorded_course", "batch_class", "free_video"])
        .order("current_enrollment", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tracks = [] } = useQuery({
    queryKey: ["public-tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profession_categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("display_order")
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "GroUp Academy Catalog",
    description: "Professional career tracks and AI-powered learning modules.",
    itemListElement: courses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: c.title,
        description: c.description,
        provider: { "@type": "Organization", name: "GroUp Academy" },
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Glassmorphism Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <img
            src={theme === "dark" ? logoLight : logoDark}
            alt="GroUp Academy"
            className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
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
              className="rounded-xl font-black uppercase text-[10px] tracking-widest px-6 border-primary/20"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Architecture */}
        <section className="relative pt-20 pb-24 overflow-hidden border-b border-border/40 bg-muted/20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)] pointer-events-none" />
          <div className="container mx-auto px-6 text-center space-y-8 relative z-10 animate-in fade-in duration-700">
            <Badge
              variant="outline"
              className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em]"
            >
              <GraduationCap className="w-3 h-3 mr-2" /> Verified Career Tracks
            </Badge>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] max-w-4xl mx-auto">
              Upgrade Your <span className="text-primary">Logic.</span> <br />
              Accelerate Your Career.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Professional curriculum across 7 tech academies. From AI engineering to modern business management. Start
              with 250 welcome credits.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/auth?tab=signup&returnTo=/app/learning")}
                className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
              >
                Claim Welcome Credits <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-border/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Instant Access
              </div>
            </div>
          </div>
        </section>

        {/* Professional Domains */}
        {tracks.length > 0 && (
          <section className="container mx-auto px-6 py-16">
            <header className="flex flex-col items-center mb-12 space-y-2">
              <h2 className="text-2xl font-black tracking-tighter uppercase">Professional Domains</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">
                Select your industry vertical
              </p>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {tracks.map((track) => (
                <Card
                  key={track.id}
                  className="group cursor-pointer rounded-[24px] border-border/40 bg-card/50 hover:bg-primary/5 hover:border-primary/20 transition-all text-center"
                  onClick={() => navigate(`/auth?tab=signup&returnTo=/app/learning/tracks/${track.slug}`)}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 bg-background shadow-sm rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-black text-[10px] uppercase tracking-widest leading-tight">{track.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Curriculum Grid */}
        <section className="container mx-auto px-6 py-16 border-t border-border/40">
          <header className="flex flex-col items-center mb-16 space-y-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase">Elite Curriculum</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">
              Trending Learning Artifacts
            </p>
          </header>

          {coursesLoading ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 rounded-[32px]" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className="rounded-[32px] border-border/40 bg-card overflow-hidden group cursor-pointer hover:shadow-2xl hover:border-primary/20 transition-all duration-500 flex flex-col"
                  onClick={() => navigate(`/courses/${course.slug}`)}
                >
                  <div className="aspect-video overflow-hidden relative">
                    {course.cover_image_url || course.thumbnail_url ? (
                      <img
                        src={course.cover_image_url || course.thumbnail_url || ""}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Zap className="h-10 w-10 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none text-[9px] font-black uppercase px-3 py-1">
                        {course.content_type?.replace("_", " ") || "Artifact"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-8 flex flex-col flex-1 space-y-4">
                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl font-black tracking-tight leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-4 border-t border-border/40">
                      <div className="flex items-center gap-4">
                        {course.modules_count && (
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" /> {course.modules_count} Nodes
                          </span>
                        )}
                        {course.duration_hours && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {course.duration_hours}H
                          </span>
                        )}
                      </div>
                      {course.current_enrollment > 0 && (
                        <span className="flex items-center gap-1.5 text-primary">
                          <Users className="w-3.5 h-3.5" /> {course.current_enrollment}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <Button
              variant="ghost"
              onClick={() => navigate("/auth?tab=signup&returnTo=/app/learning/courses")}
              className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border border-border/40 hover:bg-primary/5 text-primary"
            >
              Explore Full Catalog <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Strategic CTA */}
        <section className="bg-card border-y border-border/40 py-24">
          <div className="container mx-auto px-6 text-center space-y-8">
            <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter uppercase">Launch Your Trajectory</h2>
              <p className="text-muted-foreground font-medium max-w-xl mx-auto">
                Join 50,000+ professionals building their future on the GroUp Nexus.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate("/auth?tab=signup")}
              className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              Initialize Free Onboarding
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-background py-12 border-t border-border/40">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={logoIcon} className="h-6 w-6 grayscale opacity-40" alt="Logo" />
            <span>© 2026 GroUp Academy</span>
          </div>
          <nav className="flex gap-8">
            {["home", "services", "blog"].map((link) => (
              <button
                key={link}
                onClick={() => navigate(link === "home" ? "/" : `/${link}`)}
                className="hover:text-primary transition-colors"
              >
                {link}
              </button>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
