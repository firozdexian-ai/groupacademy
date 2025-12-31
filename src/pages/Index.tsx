import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Briefcase, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

// Import brand assets
import heroIllustration from "@/assets/hero-illustration.png";
import wavePattern from "@/assets/wave-pattern.png";
import iconScorecard from "@/assets/icons/icon-scorecard.png";
import iconMockInterview from "@/assets/icons/icon-mock-interview.png";
import iconSalary from "@/assets/icons/icon-salary.png";
import iconPortfolio from "@/assets/icons/icon-portfolio.png";
import iconAiAssistant from "@/assets/icons/icon-ai-assistant.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Redirect logged-in users to app
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/app/feed', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const services = [
    {
      icon: iconScorecard,
      title: "Career Readiness Scorecard",
      description: "AI-powered assessment to discover your strengths and gaps",
      path: "/career-assessment",
      badge: "FREE",
      badgeColor: "bg-accent text-accent-foreground",
    },
    {
      icon: iconMockInterview,
      title: "AI Mock Interview",
      description: "Practice with job-specific questions and get instant feedback",
      path: "/mock-interview",
      badge: "First FREE",
      badgeColor: "bg-primary text-primary-foreground",
    },
    {
      icon: iconSalary,
      title: "AI Salary Analysis",
      description: "Know your market value and get negotiation tips",
      path: "/salary-analysis",
      badge: "First FREE",
      badgeColor: "bg-secondary text-secondary-foreground",
    },
    {
      icon: iconPortfolio,
      title: "Digital Portfolio",
      description: "Professional portfolio crafted by career experts",
      path: "/portfolio-request",
      badge: "FREE*",
      badgeColor: "bg-success text-white",
    },
    {
      icon: iconAiAssistant,
      title: "AI Career Consultant",
      description: "24/7 personalized career guidance for your profession",
      path: "/career-services",
      badge: "Coming Soon",
      badgeColor: "bg-muted text-muted-foreground",
    },
    {
      icon: null, // Will use Briefcase icon
      title: "Job Board",
      description: "Curated job openings from partner companies",
      path: "/jobs",
      badge: "HIRING",
      badgeColor: "bg-warning text-warning-foreground",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6 animate-fade-in">
              <Badge variant="outline" className="gap-2 px-4 py-1.5">
                AI-Powered Career Acceleration
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight">
                <span className="text-gradient">Decode</span> Your{" "}
                <br className="hidden md:block" />
                Career Potential
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                From self-assessment to landing your dream job — GroUp Academy's AI-powered 
                tools guide you at every step of your career journey.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate("/career-assessment")} className="text-lg gap-2">
                  Get Your Free Analysis
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/career-services")}>
                  Explore Services
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <p className="text-2xl font-bold text-primary">5</p>
                  <p className="text-sm text-muted-foreground">AI Services</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary">5 min</p>
                  <p className="text-sm text-muted-foreground">To Start</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">Free</p>
                  <p className="text-sm text-muted-foreground">First Assessment</p>
                </div>
              </div>
            </div>

            {/* Right: Hero Illustration */}
            <div className="hidden md:flex justify-center animate-slide-up">
              <img 
                src={heroIllustration} 
                alt="Career guidance illustration" 
                className="w-full max-w-lg h-auto"
              />
            </div>
          </div>
        </div>

        {/* Wave Pattern Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <img 
            src={wavePattern} 
            alt="" 
            className="w-full h-full object-cover opacity-50"
          />
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            How We Accelerate Your Career
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered career services help you prepare, practice, and land your dream job
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20"
              onClick={() => navigate(service.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="icon-container group-hover:scale-110 transition-transform">
                    {service.icon ? (
                      <img 
                        src={service.icon} 
                        alt={service.title} 
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <Briefcase className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <Badge className={service.badgeColor}>
                    {service.badge}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          *FREE for first 1,000 users, then BDT 2,000
        </p>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50">
        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-heading font-bold mb-6">
                Your Complete Career Journey
              </h2>
              <div className="space-y-4">
                {[
                  "Free AI-powered career assessment",
                  "Practice interviews with instant feedback",
                  "Know your market salary value",
                  "Professional digital portfolio",
                  "Curated job opportunities",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button 
                size="lg" 
                className="mt-8"
                onClick={() => navigate("/career-services")}
              >
                View All Services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <div className="hidden md:block">
              <Card className="bg-gradient-primary text-white border-0 p-8">
                <h3 className="text-2xl font-bold mb-4">Start Free Today</h3>
                <p className="text-white/90 mb-6">
                  Take your Career Readiness Scorecard and discover your path to success.
                </p>
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => navigate("/career-assessment")}
                  className="w-full"
                >
                  Start Assessment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20 overflow-hidden">
          <CardContent className="py-12 px-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge className="mb-4 bg-warning/20 text-warning-foreground">
                  Hiring Now
                </Badge>
                <h2 className="text-3xl font-heading font-bold mb-4">
                  Find Your Dream Job
                </h2>
                <p className="text-muted-foreground mb-6">
                  Browse curated job openings from our partner companies. Prepare with our 
                  career services first — candidates who complete Mock Interview and 
                  Portfolio have higher success rates.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={() => navigate("/jobs")}>
                    Browse Jobs
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/courses")}>
                    View Courses
                  </Button>
                </div>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="w-40 h-40 bg-gradient-primary rounded-full flex items-center justify-center shadow-xl">
                  <Briefcase className="w-20 h-20 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-6 py-16">
        <Card className="bg-gradient-primary text-white border-0 shadow-2xl">
          <CardContent className="py-12 px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Ready to Decode Your Career Potential?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have accelerated their careers with GroUp Academy
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => navigate("/career-assessment")} className="text-lg">
                Start Free Assessment
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg bg-white/10 border-white/30 hover:bg-white/20">
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Index;