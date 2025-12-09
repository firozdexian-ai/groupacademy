import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, FileText, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Jobs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 via-secondary/5 to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
          <div className="container mx-auto px-6 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="icon-container-lg mx-auto mb-6">
                <Briefcase className="w-11 h-11 text-white" />
              </div>
              <Badge className="mb-4 gap-2 border-primary/30 text-primary" variant="outline">
                <Sparkles className="w-3 h-3" />
                Powered by Dexian HRX
              </Badge>
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                Job Openings
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Explore career opportunities from our partner companies. Apply directly and kickstart your professional journey.
              </p>
            </div>

            {/* Quick Tips */}
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
              <Card className="bg-card/50 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Build Your Portfolio</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create a professional digital portfolio to stand out
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 mt-1 text-xs"
                      onClick={() => navigate("/portfolio-request")}
                    >
                      Get Started <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Practice Interviews</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prepare with AI-powered mock interviews
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 mt-1 text-xs"
                      onClick={() => navigate("/mock-interview")}
                    >
                      Try Now <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Know Your Readiness</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Take the Career Readiness Scorecard assessment
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 mt-1 text-xs"
                      onClick={() => navigate("/career-assessment")}
                    >
                      Assess Now <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Embedded Job Board */}
        <section className="py-8">
          <div className="container mx-auto px-6">
            <div className="bg-card rounded-xl border overflow-hidden shadow-lg">
              <iframe
                src="https://dexianhrx.lovable.app/careers/dexian"
                width="100%"
                height="800"
                style={{ border: 'none', display: 'block' }}
                title="Job Openings - Dexian HRX"
                loading="lazy"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Job listings powered by{" "}
              <a 
                href="https://dexianhrx.lovable.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Dexian HRX
              </a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Jobs;
