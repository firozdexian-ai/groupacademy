import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import logoIcon from "@/assets/logo-icon.png";
import {
  Target, Mic, DollarSign, FolderOpen, Bot, ArrowRight,
  Sun, Moon, CheckCircle, Sparkles,
} from "lucide-react";

const SERVICES = [
  {
    slug: "assessment",
    icon: Target,
    title: "Career Readiness Scorecard",
    description: "Get an AI-powered assessment of your career readiness across technical skills, communication, industry knowledge, and more. Receive a detailed PDF scorecard.",
    benefits: ["Benchmark against industry standards", "Identify skill gaps", "AI-powered analysis", "Downloadable PDF report"],
    credits: 50,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    slug: "mock-interview",
    icon: Mic,
    title: "AI Mock Interview",
    description: "Practice with realistic AI-generated interview questions tailored to your profession and experience level. Get detailed feedback on your responses.",
    benefits: ["Profession-specific questions", "Real-time AI feedback", "Answer scoring", "Improvement recommendations"],
    credits: 75,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    slug: "salary-analysis",
    icon: DollarSign,
    title: "Salary Analysis",
    description: "Know your worth with comprehensive salary benchmarking for your role, experience, and market. Make informed negotiation decisions.",
    benefits: ["Market rate comparison", "Experience-adjusted ranges", "Industry benchmarks", "Negotiation tips"],
    credits: 50,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    slug: "portfolio",
    icon: FolderOpen,
    title: "Digital Portfolio Builder",
    description: "Create a professional digital portfolio that showcases your skills, projects, and achievements. Share a beautiful link with recruiters.",
    benefits: ["Custom design", "Shareable URL", "Project showcase", "Professional branding"],
    credits: 100,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    slug: "ai-agents",
    icon: Bot,
    title: "AI Career Agents",
    description: "Chat with specialized AI agents for personalized career guidance, resume reviews, interview prep, and industry insights.",
    benefits: ["24/7 availability", "Specialized expertise", "Personalized advice", "Multiple agent types"],
    credits: 10,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

export default function PublicServices() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    document.title = "Career Services - GroUp Academy | AI-Powered Career Tools";
  }, []);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "GroUp Academy Career Services",
    description: "AI-powered career acceleration tools including assessments, mock interviews, salary analysis, and portfolio building.",
    itemListElement: SERVICES.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.description,
        provider: { "@type": "Organization", name: "GroUp Academy" },
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src={theme === "dark" ? logoLight : logoDark}
            alt="GroUp Academy"
            className="h-10 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-hero py-16 md:py-20 text-center">
        <div className="container mx-auto px-6">
          <Badge variant="outline" className="gap-2 px-4 py-1.5 mb-6">
            <Sparkles className="w-3 h-3" /> 6 AI-Powered Services
          </Badge>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            Career <span className="text-gradient">Services</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            From self-assessment to landing your dream job — our AI tools help you at every step of your career journey.
          </p>
          <Button size="lg" onClick={() => navigate("/auth?tab=signup")}>
            Get Started Free — 250 Credits <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-6 py-12 md:py-20">
        <div className="grid gap-8 max-w-4xl mx-auto">
          {SERVICES.map((service) => (
            <Card key={service.slug} className="overflow-hidden border-2 hover:border-primary/30 transition-all">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 ${service.bgColor} rounded-xl flex items-center justify-center`}>
                        <service.icon className={`w-6 h-6 ${service.color}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-heading font-bold">{service.title}</h2>
                        <Badge variant="secondary" className="text-xs">{service.credits} credits</Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <ul className="grid grid-cols-2 gap-2">
                      {service.benefits.map((b, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex md:flex-col items-center justify-center gap-3 md:min-w-[140px]">
                    <Button className="w-full" onClick={() => navigate(`/auth?tab=signup&returnTo=/app/services/${service.slug}`)}>
                      Try Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="GroUp" className="w-8 h-8" />
            <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} GroUp Academy</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Home</button>
            <button onClick={() => navigate("/blog")} className="hover:text-foreground transition-colors">Blog</button>
            <button onClick={() => navigate("/auth")} className="hover:text-foreground transition-colors">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
