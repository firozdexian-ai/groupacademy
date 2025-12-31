import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  ArrowRight,
  FileCheck,
  DollarSign,
  Briefcase,
  GraduationCap,
  Target
} from "lucide-react";

// Brand icons
import iconMockInterview from "@/assets/icons/icon-mock-interview.png";
import iconSalary from "@/assets/icons/icon-salary.png";
import iconPortfolio from "@/assets/icons/icon-portfolio.png";
import iconScorecard from "@/assets/icons/icon-scorecard.png";

type ServiceType = "assessment" | "mock_interview" | "salary_analysis" | "portfolio";

interface ServiceRecommendation {
  id: ServiceType;
  title: string;
  description: string;
  icon: string;
  path: string;
  highlight?: string;
}

const ALL_SERVICES: ServiceRecommendation[] = [
  {
    id: "assessment",
    title: "Career Readiness Scorecard",
    description: "Discover your strengths and areas for improvement",
    icon: iconScorecard,
    path: "/career-assessment",
    highlight: "Know Your Level"
  },
  {
    id: "mock_interview",
    title: "AI Mock Interview",
    description: "Practice with AI-generated questions for your target role",
    icon: iconMockInterview,
    path: "/mock-interview/setup",
    highlight: "Practice Makes Perfect"
  },
  {
    id: "salary_analysis",
    title: "Salary Analysis",
    description: "Get market insights and negotiation tips for your role",
    icon: iconSalary,
    path: "/salary-analysis/setup",
    highlight: "Know Your Worth"
  },
  {
    id: "portfolio",
    title: "Digital Portfolio",
    description: "Build a professional online presence",
    icon: iconPortfolio,
    path: "/portfolio-request",
    highlight: "Stand Out"
  }
];

interface ServiceRecommendationsProps {
  currentService: ServiceType;
  className?: string;
}

export function ServiceRecommendations({ 
  currentService,
  className = ""
}: ServiceRecommendationsProps) {
  const navigate = useNavigate();

  // Get recommended services based on current service
  const getRecommendations = (): ServiceRecommendation[] => {
    switch (currentService) {
      case "assessment":
        // After assessment: recommend mock interview and courses
        return ALL_SERVICES.filter(s => 
          s.id === "mock_interview" || s.id === "portfolio"
        );
      case "mock_interview":
        // After mock interview: recommend salary analysis and jobs
        return ALL_SERVICES.filter(s => 
          s.id === "salary_analysis" || s.id === "portfolio"
        );
      case "salary_analysis":
        // After salary analysis: recommend jobs and portfolio
        return ALL_SERVICES.filter(s => 
          s.id === "mock_interview" || s.id === "portfolio"
        );
      case "portfolio":
        // After portfolio: recommend assessment and mock interview
        return ALL_SERVICES.filter(s => 
          s.id === "assessment" || s.id === "mock_interview"
        );
      default:
        return ALL_SERVICES.filter(s => s.id !== currentService).slice(0, 2);
    }
  };

  const recommendations = getRecommendations();

  if (recommendations.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Continue Your Career Journey</CardTitle>
        </div>
        <CardDescription>
          Based on your results, we recommend these next steps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {recommendations.map((service) => (
            <button
              key={service.id}
              onClick={() => navigate(service.path)}
              className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left group"
            >
              <img 
                src={service.icon} 
                alt={service.title}
                className="w-10 h-10 rounded-lg object-contain"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{service.title}</h4>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {service.description}
                </p>
                {service.highlight && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {service.highlight}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/jobs")}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Browse Job Opportunities
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
