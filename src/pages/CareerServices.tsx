import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { 
  ArrowRight, 
  CheckCircle,
  Sparkles,
  Briefcase,
  Circle
} from "lucide-react";

// Import brand service icons
import iconScorecard from "@/assets/icons/icon-scorecard.png";
import iconMockInterview from "@/assets/icons/icon-mock-interview.png";
import iconSalary from "@/assets/icons/icon-salary.png";
import iconPortfolio from "@/assets/icons/icon-portfolio.png";

interface ServiceProgress {
  assessment: boolean;
  mockInterview: boolean;
  salaryAnalysis: boolean;
  portfolio: boolean;
  jobsViewed: boolean;
}

const CareerServices = () => {
  const navigate = useNavigate();
  const { talent, user } = useTalent();
  const [progress, setProgress] = useState<ServiceProgress>({
    assessment: false,
    mockInterview: false,
    salaryAnalysis: false,
    portfolio: false,
    jobsViewed: false,
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  // Load user's service progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.email && !talent?.email) {
        setIsLoadingProgress(false);
        return;
      }

      const email = talent?.email || user?.email;
      
      try {
        // Check services used from talent profile first
        if (talent?.servicesUsed) {
          const services = talent.servicesUsed as string[];
          setProgress({
            assessment: services.includes('career_assessment'),
            mockInterview: services.includes('mock_interview'),
            salaryAnalysis: services.includes('salary_analysis'),
            portfolio: services.includes('portfolio'),
            jobsViewed: services.includes('job_application'),
          });
          setIsLoadingProgress(false);
          return;
        }

        // Fallback: Check individual tables
        const [assessmentResult, interviewResult, salaryResult, portfolioResult] = await Promise.all([
          supabase
            .from('career_assessments')
            .select('id')
            .eq('email', email)
            .limit(1),
          supabase
            .from('mock_interviews')
            .select('id')
            .eq('email', email)
            .limit(1),
          supabase
            .from('salary_analyses')
            .select('id')
            .eq('email', email)
            .limit(1),
          supabase
            .from('portfolio_requests')
            .select('id')
            .eq('email', email)
            .limit(1),
        ]);

        setProgress({
          assessment: (assessmentResult.data?.length || 0) > 0,
          mockInterview: (interviewResult.data?.length || 0) > 0,
          salaryAnalysis: (salaryResult.data?.length || 0) > 0,
          portfolio: (portfolioResult.data?.length || 0) > 0,
          jobsViewed: false, // Can't easily track this
        });
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadProgress();
  }, [user, talent]);

  const completedCount = Object.values(progress).filter(Boolean).length;

  const journeySteps = [
    {
      step: 1,
      icon: iconScorecard,
      title: "Career Readiness Scorecard",
      subtitle: "Discover where you stand",
      description: "Take our AI-powered assessment to understand your strengths, identify gaps, and get personalized recommendations for your profession.",
      features: [
        "5-minute assessment",
        "AI-powered analysis",
        "Personalized recommendations",
        "Downloadable PDF report"
      ],
      cta: progress.assessment ? "View Results" : "Start Free Assessment",
      path: "/career-assessment",
      badge: "FREE",
      badgeClass: "bg-success text-white",
      completed: progress.assessment,
      serviceKey: 'assessment'
    },
    {
      step: 2,
      icon: iconMockInterview,
      title: "AI Mock Interview",
      subtitle: "Practice makes perfect",
      description: "Prepare for real interviews with AI-generated questions tailored to your target job. Get detailed feedback on each answer and improve your performance.",
      features: [
        "Job-specific questions",
        "Real-time feedback",
        "Selection score",
        "Interview tips"
      ],
      cta: progress.mockInterview ? "Practice Again" : "Practice Interview",
      path: "/mock-interview",
      badge: "First FREE",
      badgeClass: "bg-secondary text-secondary-foreground",
      completed: progress.mockInterview,
      serviceKey: 'mockInterview'
    },
    {
      step: 3,
      icon: iconSalary,
      title: "AI Salary Analysis",
      subtitle: "Know your market value",
      description: "Upload your CV and target job description to get AI-powered salary insights, skills gap analysis, and negotiation tips for the Bangladesh market.",
      features: [
        "Market salary range",
        "Skills gap analysis",
        "Negotiation tips",
        "Action plan"
      ],
      cta: progress.salaryAnalysis ? "Analyze Again" : "Analyze Salary",
      path: "/salary-analysis",
      badge: "First FREE",
      badgeClass: "bg-secondary text-secondary-foreground",
      completed: progress.salaryAnalysis,
      serviceKey: 'salaryAnalysis'
    },
    {
      step: 4,
      icon: iconPortfolio,
      title: "Digital Portfolio",
      subtitle: "Showcase your achievements",
      description: "Get a professionally designed digital portfolio that highlights your skills, experience, and accomplishments. Stand out from other candidates.",
      features: [
        "Professional design",
        "Easy to share",
        "CMS admin panel",
        "Expert review"
      ],
      cta: progress.portfolio ? "Check Status" : "Request Portfolio",
      path: progress.portfolio ? "/portfolio-status" : "/portfolio-request",
      badge: "BDT 100",
      badgeClass: "bg-primary text-primary-foreground",
      completed: progress.portfolio,
      serviceKey: 'portfolio'
    },
    {
      step: 5,
      icon: null, // Will use Lucide icon
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
      badgeClass: "bg-orange-500 text-white",
      completed: progress.jobsViewed,
      serviceKey: 'jobsViewed'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 via-secondary/5 to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--secondary)/0.1),transparent_50%)]" />
          
          <div className="container mx-auto px-6 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="icon-container-lg mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <Badge className="mb-4 gap-2 border-primary/30 text-primary" variant="outline">
                <Sparkles className="w-3 h-3" />
                AI-Powered Career Acceleration
              </Badge>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                Your Complete Career Journey
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                From self-assessment to landing your dream job — we've got you covered at every step. 
                Follow our proven 5-step process to accelerate your career.
              </p>
              
              {/* Quick Stats with Progress */}
              <div className="flex flex-wrap justify-center gap-8 text-center">
                <div className="bg-card rounded-2xl p-4 shadow-card min-w-[100px]">
                  <p className="text-3xl font-bold text-primary">5</p>
                  <p className="text-sm text-muted-foreground">Services</p>
                </div>
                {user && (
                  <div className="bg-card rounded-2xl p-4 shadow-card min-w-[100px]">
                    {isLoadingProgress ? (
                      <Skeleton className="h-9 w-12 mx-auto mb-1" />
                    ) : (
                      <p className="text-3xl font-bold text-success">{completedCount}/5</p>
                    )}
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                )}
                <div className="bg-card rounded-2xl p-4 shadow-card min-w-[100px]">
                  <p className="text-3xl font-bold text-secondary">5 min</p>
                  <p className="text-sm text-muted-foreground">To Start</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-card min-w-[100px]">
                  <p className="text-3xl font-bold text-success">AI</p>
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
                const isLast = index === journeySteps.length - 1;
                const isCompleted = step.completed;
                
                return (
                  <div key={step.step} className="relative">
                    {/* Connector Line */}
                    {!isLast && (
                      <div className={`absolute left-8 top-24 bottom-0 w-0.5 hidden md:block ${
                        isCompleted 
                          ? 'bg-gradient-to-b from-success/50 to-success/10' 
                          : 'bg-gradient-to-b from-primary/50 to-primary/10'
                      }`} />
                    )}
                    
                    <Card className={`mb-8 overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 ${
                      isCompleted ? 'ring-1 ring-success/30' : ''
                    }`}>
                      <div className={`h-1 ${isCompleted ? 'bg-success' : 'bg-gradient-primary'}`} />
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Step Number & Icon */}
                          <div className="flex md:flex-col items-center gap-4 md:gap-2">
                            <div className={`icon-container-lg ${isCompleted ? 'bg-success' : ''}`}>
                              {isCompleted ? (
                                <CheckCircle className="w-8 h-8 text-white" />
                              ) : step.icon ? (
                                <img src={step.icon} alt={step.title} className="w-11 h-11 object-contain" />
                              ) : (
                                <Briefcase className="w-8 h-8 text-white" />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-success" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-sm font-medium text-muted-foreground">Step {step.step}</span>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-xl font-heading font-bold">{step.title}</h3>
                              <Badge className={step.badgeClass}>
                                {step.badge}
                              </Badge>
                              {isCompleted && (
                                <Badge variant="outline" className="border-success text-success gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-primary font-medium mb-2">{step.subtitle}</p>
                            <p className="text-muted-foreground mb-4">{step.description}</p>
                            
                            {/* Features */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {step.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                            
                            <Button 
                              onClick={() => navigate(step.path)} 
                              className="group"
                              variant={isCompleted ? "outline" : "default"}
                            >
                              {step.cta}
                              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </div>
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
        <section className="py-16 bg-gradient-to-r from-primary/5 via-secondary/5 to-success/5">
          <div className="container mx-auto px-6">
            <Card className="max-w-3xl mx-auto bg-gradient-primary text-white border-0 shadow-glow overflow-hidden">
              <CardContent className="py-10 px-8 text-center relative">
                <div className="absolute inset-0 bg-[url('/wave-pattern.png')] opacity-10" />
                <div className="relative">
                  <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
                    {completedCount > 0 
                      ? "Continue Your Career Transformation" 
                      : "Start Your Career Transformation Today"}
                  </h2>
                  <p className="text-white/90 mb-6 max-w-xl mx-auto">
                    {completedCount > 0
                      ? `You've completed ${completedCount} of 5 steps. Keep going!`
                      : "Begin with our free Career Readiness Scorecard and discover your path to career success."}
                  </p>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    onClick={() => navigate(
                      !progress.assessment ? "/career-assessment" :
                      !progress.mockInterview ? "/mock-interview" :
                      !progress.salaryAnalysis ? "/salary-analysis" :
                      !progress.portfolio ? "/portfolio-request" :
                      "/jobs"
                    )}
                    className="text-lg group"
                  >
                    {completedCount === 0 ? "Take Free Assessment" : "Continue Journey"}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
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
