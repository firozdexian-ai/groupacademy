import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Mic, 
  DollarSign, 
  Palette,
  Sparkles,
  Coins
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CREDIT_CONFIG } from '@/lib/creditPricing';

const CAREER_SERVICES = [
  {
    id: 'CAREER_ASSESSMENT',
    title: 'Career Readiness Scorecard',
    description: 'Discover your strengths and areas for improvement with AI-powered analysis',
    icon: ClipboardCheck,
    href: '/career-assessment',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    firstFree: true
  },
  {
    id: 'MOCK_INTERVIEW',
    title: 'AI Mock Interview',
    description: 'Practice with realistic interview questions and get instant AI feedback',
    icon: Mic,
    href: '/mock-interview',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    firstFree: true
  },
  {
    id: 'SALARY_ANALYSIS',
    title: 'AI Salary Analysis',
    description: 'Get market salary insights and negotiation strategies for your role',
    icon: DollarSign,
    href: '/salary-analysis',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    firstFree: true
  },
  {
    id: 'PORTFOLIO',
    title: 'Digital Portfolio',
    description: 'Get a professionally designed portfolio website to showcase your work',
    icon: Palette,
    href: '/portfolio-request',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    firstFree: true
  }
];

export default function ServicesHub() {
  const navigate = useNavigate();

  const getServiceCost = (serviceId: string) => {
    const config = CREDIT_CONFIG.SERVICES[serviceId as keyof typeof CREDIT_CONFIG.SERVICES];
    if (!config) return null;
    
    if ('first' in config) {
      return { first: config.first, subsequent: config.subsequent };
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Career Services</h1>
        <p className="text-muted-foreground">AI-powered tools to accelerate your career</p>
      </div>

      {/* Credits reminder */}
      <Card className="mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-full">
                <Coins className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">Your first use of each service is FREE!</p>
                <p className="text-sm text-muted-foreground">
                  After that, services cost credits. You have <span className="font-semibold text-foreground">250 credits</span>.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/profile')}>
              Buy Credits
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {CAREER_SERVICES.map((service) => {
          const cost = getServiceCost(service.id);
          
          return (
            <Card 
              key={service.id}
              className="cursor-pointer hover:shadow-md transition-all group"
              onClick={() => navigate(service.href)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${service.bgColor} group-hover:scale-110 transition-transform`}>
                    <service.icon className={`h-6 w-6 ${service.color}`} />
                  </div>
                  {service.firstFree && (
                    <Badge className="bg-accent text-accent-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      First FREE
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-1">{service.title}</CardTitle>
                <CardDescription className="mb-3">{service.description}</CardDescription>
                
                {cost && (
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-warning" />
                    <span className="text-muted-foreground">
                      {cost.first === 0 ? 'Free first time' : `${cost.first} credits`}
                      {cost.subsequent > 0 && ` • ${cost.subsequent} credits after`}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
