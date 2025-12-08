import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  MessageSquare, 
  FileText, 
  Briefcase, 
  ArrowRight, 
  CheckCircle,
  ChevronRight,
  Sparkles
} from "lucide-react";

const CareerServices = () => {
  const navigate = useNavigate();

  const journeySteps = [
    {
      step: 1,
      icon: Target,
      title: "Career Readiness Scorecard",
      subtitle: "Discover where you stand",
      description: "Take our AI-powered assessment to understand your strengths, identify gaps, and get personalized recommendations for your profession.",
      features: [
        "5-minute assessment",
        "AI-powered analysis",
        "Personalized recommendations",
        "Downloadable PDF report"
      ],
      cta: "Start Free Assessment",
      path: "/career-assessment",
      badge: "FREE",
      badgeColor: "bg-green-500",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      step: 2,
      icon: MessageSquare,
      title: "AI Mock Interview",
      subtitle: "Practice makes perfect",
      description: "Prepare for real interviews with AI-generated questions tailored to your target job. Get detailed feedback on each answer and improve your performance.",
      features: [
        "Job-specific questions",
        "Real-time feedback",
        "Selection score",
        "Interview tips"
      ],
      cta: "Practice Interview",
      path: "/mock-interview",
      badge: "First FREE",
      badgeColor: "bg-blue-500",
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      step: 3,
      icon: FileText,
      title: "Digital Portfolio",
      subtitle: "Showcase your achievements",
      description: "Get a professionally designed digital portfolio that highlights your skills, experience, and accomplishments. Stand out from other candidates.",
      features: [
        "Professional design",
        "Easy to share",
        "CMS admin panel",
        "Expert review"
      ],
      cta: "Request Portfolio",
      path: "/portfolio-request",
      badge: "BDT 100",
      badgeColor: "bg-primary",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      step: 4,
      icon: Briefcase,
      title: "Job Openings",
      subtitle: "Land your dream job",
      description: "Browse curated job opportunities from our partner companies. Apply with confidence after preparing with our career services.",
      features: [
        "Curated listings",
        "Partner companies",
        "Direct applications",
        "Regular updates"
      ],
      cta: "Browse Jobs",
      path: "/jobs",
      badge: "HIRING",
      badgeColor: "bg-orange-500",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 via-secondary/5 to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.1),transparent_50%)]" />
          
          <div className="container mx-auto px-6 relative">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="outline" className="mb-4 gap-2">
                <Sparkles className="w-3 h-3" />
                AI-Powered Career Acceleration
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Your Complete Career Journey
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                From self-assessment to landing your dream job — we've got you covered at every step. 
                Follow our proven 4-step process to accelerate your career.
              </p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">4</p>
                  <p className="text-sm text-muted-foreground">Career Services</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">5 min</p>
                  <p className="text-sm text-muted-foreground">To Start</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">AI</p>
                  <p className="text-sm text-muted-foreground">Powered</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Journey Steps */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              {journeySteps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === journeySteps.length - 1;
                
                return (
                  <div key={step.step} className="relative">
                    {/* Connector Line */}
                    {!isLast && (
                      <div className="absolute left-8 top-24 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-primary/10 hidden md:block" />
                    )}
                    
                    <Card className="mb-8 overflow-hidden hover:shadow-lg transition-shadow">
                      <div className={`h-1 bg-gradient-to-r ${step.gradient}`} />
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Step Number & Icon */}
                          <div className="flex md:flex-col items-center gap-4 md:gap-2">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}>
                              <Icon className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Step {step.step}</span>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold">{step.title}</h3>
                              <Badge className={`${step.badgeColor} text-white`}>
                                {step.badge}
                              </Badge>
                            </div>
                            <p className="text-sm text-primary font-medium mb-2">{step.subtitle}</p>
                            <p className="text-muted-foreground mb-4">{step.description}</p>
                            
                            {/* Features */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {step.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                            
                            <Button onClick={() => navigate(step.path)}>
                              {step.cta}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                          
                          {/* Arrow to next step */}
                          {!isLast && (
                            <div className="hidden md:flex items-center">
                              <ChevronRight className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
          <div className="container mx-auto px-6">
            <Card className="max-w-3xl mx-auto bg-gradient-primary text-white border-0 shadow-2xl">
              <CardContent className="py-10 px-8 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Start Your Career Transformation Today
                </h2>
                <p className="text-white/90 mb-6 max-w-xl mx-auto">
                  Begin with our free Career Readiness Scorecard and discover your path to career success.
                </p>
                <Button 
                  size="lg" 
                  variant="secondary" 
                  onClick={() => navigate("/career-assessment")}
                  className="text-lg"
                >
                  Take Free Assessment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CareerServices;
