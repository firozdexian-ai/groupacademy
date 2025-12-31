import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Briefcase, 
  FileText, 
  Mic, 
  DollarSign,
  BookOpen,
  Lightbulb,
  Building2,
  MessageCircle,
  Coins
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CREDIT_CONFIG } from '@/lib/creditPricing';

const AI_AGENTS = [
  {
    id: 'career-consultant',
    name: 'Career Consultant',
    description: 'Get personalized career advice, job search strategies, and guidance on your career path',
    icon: Briefcase,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    expertise: ['Career Planning', 'Job Search', 'Career Change'],
    available: false
  },
  {
    id: 'cv-coach',
    name: 'CV Coach',
    description: 'Improve your CV with expert feedback, formatting tips, and content optimization',
    icon: FileText,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    expertise: ['CV Review', 'ATS Optimization', 'Cover Letters'],
    available: false
  },
  {
    id: 'interview-coach',
    name: 'Interview Coach',
    description: 'Practice interview questions and get tips for acing your next interview',
    icon: Mic,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    expertise: ['Mock Practice', 'Common Questions', 'Confidence'],
    available: false
  },
  {
    id: 'salary-negotiator',
    name: 'Salary Negotiator',
    description: 'Learn negotiation tactics and get scripts for salary discussions',
    icon: DollarSign,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    expertise: ['Negotiation', 'Market Rates', 'Benefits'],
    available: false
  },
  {
    id: 'ielts-tutor',
    name: 'IELTS Tutor',
    description: 'Practice English and prepare for your IELTS exam with AI guidance',
    icon: BookOpen,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    expertise: ['Speaking', 'Writing', 'Test Strategies'],
    available: false
  },
  {
    id: 'skill-advisor',
    name: 'Skill Advisor',
    description: 'Get recommendations for skills to learn based on your career goals',
    icon: Lightbulb,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    expertise: ['Skill Gaps', 'Learning Paths', 'Industry Trends'],
    available: false
  }
];

export default function AIAgents() {
  const navigate = useNavigate();
  const costPerSession = CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Agents</h1>
        <p className="text-muted-foreground">Chat with AI experts for career guidance</p>
      </div>

      {/* Cost Info */}
      <Card className="mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-full">
              <Coins className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="font-medium">Each chat session costs {costPerSession} credits</p>
              <p className="text-sm text-muted-foreground">
                Get unlimited messages within a session. Sessions last 30 minutes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card className="mb-6 border-warning/50 bg-warning/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-warning" />
            <div>
              <p className="font-medium text-warning">AI Agents Coming Soon!</p>
              <p className="text-sm text-muted-foreground">
                We're building intelligent AI agents to help you with every aspect of your career.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {AI_AGENTS.map((agent) => (
          <Card 
            key={agent.id}
            className="opacity-75"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${agent.bgColor}`}>
                  <agent.icon className={`h-6 w-6 ${agent.color}`} />
                </div>
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1">{agent.name}</CardTitle>
              <CardDescription className="mb-3">{agent.description}</CardDescription>
              
              <div className="flex flex-wrap gap-1.5">
                {agent.expertise.map(skill => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Conversations - Placeholder */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Conversations</h2>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start chatting with an AI agent to get career help</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
