import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
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
  Sparkles
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { isPWA, isLoading: isPWALoading } = usePWADetect();
  const { theme, setTheme } = useTheme();
  const [pwaChecked, setPwaChecked] = useState(false);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // Fetch recent blog posts for SEO section
  useEffect(() => {
    const fetchBlogPosts = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, featured_image, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (data) setBlogPosts(data);
    };
    fetchBlogPosts();
  }, []);

  // Handle PWA users - redirect them directly without showing marketing page
  useEffect(() => {
    if (isPWALoading) return;
    
    if (isPWA) {
      setPwaChecked(true);
      if (!isLoading) {
        if (user) {
          navigate('/app/feed', { replace: true });
        } else {
          navigate('/auth', { replace: true });
        }
      }
    } else {
      setPwaChecked(true);
    }
  }, [isPWA, isPWALoading, user, isLoading, navigate]);

  // Redirect authenticated web users to feed
  useEffect(() => {
    if (!isLoading && user && !isPWA && pwaChecked) {
      navigate('/app/feed', { replace: true });
    }
  }, [user, isLoading, navigate, isPWA, pwaChecked]);

  // Show branded loading screen for PWA users
  if (isPWALoading || (isPWA && (isLoading || !pwaChecked))) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <img 
          src={logoIcon} 
          alt="GroUp Academy" 
          className="w-20 h-20 mb-6 animate-pulse"
        />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-muted-foreground text-sm mt-4">Loading your career journey...</p>
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (user && !isPWA) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const seekerFeatures = [
    { icon: Target, label: "Career Readiness Scorecard" },
    { icon: Mic, label: "AI Mock Interview" },
    { icon: DollarSign, label: "Salary Analysis" },
    { icon: FolderOpen, label: "Digital Portfolio" },
    { icon: Briefcase, label: "Job Matching" },
    { icon: Bot, label: "AI Career Coach" },
  ];

  const orgFeatures = [
    { icon: Building2, label: "Post Job Openings" },
    { icon: Users, label: "Access Talent Pool" },
    { icon: Search, label: "Smart Candidate Search" },
    { icon: BarChart3, label: "Analytics Dashboard" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Simple Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <img 
              src={theme === "dark" ? logoLight : logoDark} 
              alt="GroUp Academy" 
              className="h-10 w-auto"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container mx-auto px-6 py-16 md:py-24 text-center">
          <Badge variant="outline" className="gap-2 px-4 py-1.5 mb-6">
            <Sparkles className="w-3 h-3" />
            AI-Powered Career Acceleration
          </Badge>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6">
            <span className="text-gradient">Decode</span> Your Career Potential
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            From self-assessment to landing your dream job — GroUp Academy's AI-powered 
            tools guide you at every step of your career journey.
          </p>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 md:gap-12 mb-12">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">5</p>
              <p className="text-sm text-muted-foreground">AI Tools</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-secondary">1000+</p>
              <p className="text-sm text-muted-foreground">Jobs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-accent">Free</p>
              <p className="text-sm text-muted-foreground">To Start</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two CTA Cards */}
      <section className="container mx-auto px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* Job Seekers Card */}
          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold">For Job Seekers</h2>
                  <p className="text-sm text-muted-foreground">Accelerate your career</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                Discover AI-powered tools designed to help you stand out in the job market:
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {seekerFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <feature.icon className="w-4 h-4 text-primary shrink-0" />
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>

              <Button 
                size="lg" 
                className="w-full group-hover:scale-[1.02] transition-transform"
                onClick={() => navigate("/auth?tab=signup")}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-3">
                250 bonus credits on signup
              </p>
            </CardContent>
          </Card>

          {/* Organizations Card */}
          <Card className="relative overflow-hidden border-2 hover:border-secondary/50 transition-all duration-300 group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary to-accent" />
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold">For Organizations</h2>
                  <p className="text-sm text-muted-foreground">Find the perfect talent</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                Connect with pre-assessed, job-ready candidates:
              </p>

              <div className="space-y-3 mb-8">
                {orgFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <feature.icon className="w-4 h-4 text-secondary shrink-0" />
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>

              <Badge variant="secondary" className="mb-4 w-full justify-center py-2">
                Coming Soon
              </Badge>

              <Button 
                size="lg" 
                variant="secondary"
                className="w-full group-hover:scale-[1.02] transition-transform"
                onClick={() => navigate("/org")}
              >
                Join Waitlist
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-3">
                Early access for founding partners
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Blog Section for SEO */}
      {blogPosts.length > 0 && (
        <section className="container mx-auto px-6 py-12 border-t">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-heading font-bold mb-2">From Our Blog</h2>
            <p className="text-muted-foreground">Career insights and industry updates</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {blogPosts.map((post) => (
              <Card 
                key={post.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
                {post.featured_image && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={post.featured_image} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => navigate("/blog")}>
              View All Articles
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* Simple Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="GroUp" className="w-8 h-8" />
              <span className="text-sm text-muted-foreground">
                © 2024 GroUp Academy. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <button onClick={() => navigate("/blog")} className="hover:text-foreground transition-colors">
                Blog
              </button>
              <button onClick={() => navigate("/org")} className="hover:text-foreground transition-colors">
                For Organizations
              </button>
              <button onClick={() => navigate("/auth")} className="hover:text-foreground transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
