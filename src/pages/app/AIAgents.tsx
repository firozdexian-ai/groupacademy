import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  FileText, 
  Mic, 
  DollarSign,
  BookOpen,
  Lightbulb,
  Coins,
  Sparkles,
  ArrowRight,
  Clock,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CREDIT_CONFIG } from '@/lib/creditPricing';
import { RecentConversations } from '@/components/ai-agents/RecentConversations';
import { useAgentChat } from '@/hooks/useAgentChat';
import { useCredits } from '@/hooks/useCredits';
import { CreditGateModal } from '@/components/credits/CreditGateModal';
import { toast } from 'sonner';

const AI_AGENTS = [
  {
    id: 'career-consultant',
    name: 'Career Consultant',
    shortName: 'Career',
    description: 'Plan your professional journey',
    icon: Briefcase,
    gradient: 'from-blue-500 to-indigo-600',
    expertise: ['Career Planning', 'Job Search', 'Career Change']
  },
  {
    id: 'cv-coach',
    name: 'CV Coach',
    shortName: 'CV Coach',
    description: 'Optimize your resume',
    icon: FileText,
    gradient: 'from-emerald-500 to-teal-600',
    expertise: ['CV Review', 'ATS Optimization', 'Cover Letters']
  },
  {
    id: 'interview-coach',
    name: 'Interview Coach',
    shortName: 'Interview',
    description: 'Ace your interviews',
    icon: Mic,
    gradient: 'from-purple-500 to-violet-600',
    expertise: ['Mock Practice', 'STAR Method', 'Confidence']
  },
  {
    id: 'salary-negotiator',
    name: 'Salary Negotiator',
    shortName: 'Salary',
    description: 'Negotiate better offers',
    icon: DollarSign,
    gradient: 'from-amber-500 to-orange-600',
    expertise: ['Negotiation', 'Market Rates', 'Benefits']
  },
  {
    id: 'ielts-tutor',
    name: 'IELTS Tutor',
    shortName: 'IELTS',
    description: 'Master English tests',
    icon: BookOpen,
    gradient: 'from-rose-500 to-red-600',
    expertise: ['Speaking', 'Writing', 'Test Strategies']
  },
  {
    id: 'skill-advisor',
    name: 'Skill Advisor',
    shortName: 'Skills',
    description: 'Learn in-demand skills',
    icon: Lightbulb,
    gradient: 'from-cyan-500 to-blue-600',
    expertise: ['Skill Gaps', 'Learning Paths', 'Industry Trends']
  }
];

export default function AIAgents() {
  const navigate = useNavigate();
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  
  const { recentSessions, loadSession, startNewSession } = useAgentChat();
  const { balance, deductCredits } = useCredits();
  
  const costPerSession = CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost;

  // Check if agent has active session
  const getActiveSession = (agentKey: string) => {
    return recentSessions.find(
      s => s.agent_key === agentKey && 
      s.is_active && 
      new Date(s.session_expires_at) > new Date()
    );
  };

  const handleAgentClick = (agentId: string) => {
    const activeSession = getActiveSession(agentId);
    
    if (activeSession) {
      // Resume existing session
      navigate(`/app/agents/${agentId}`);
    } else {
      // Show credit gate for new session
      setSelectedAgent(agentId);
      setShowCreditGate(true);
    }
  };

  const handleConfirmCredit = async () => {
    if (!selectedAgent) return;

    const success = await deductCredits('AI_AGENT_CHAT', `AI Agent: ${selectedAgent}`);
    if (success) {
      const session = await startNewSession(selectedAgent);
      if (session) {
        setShowCreditGate(false);
        navigate(`/app/agents/${selectedAgent}`);
        toast.success('Session started! You have 30 minutes.');
      } else {
        toast.error('Failed to start session');
      }
    }
    setShowCreditGate(false);
  };

  const handleSelectSession = async (sessionId: string) => {
    const session = recentSessions.find(s => s.id === sessionId);
    if (session) {
      navigate(`/app/agents/${session.agent_key}`);
    }
  };

  const getAgentName = (agentKey: string) => {
    const agent = AI_AGENTS.find(a => a.id === agentKey);
    return agent?.name || agentKey;
  };

  const getAgentIcon = (agentKey: string) => {
    const agent = AI_AGENTS.find(a => a.id === agentKey);
    if (!agent) return null;
    const Icon = agent.icon;
    return (
      <div className={`p-2 rounded-lg bg-gradient-to-br ${agent.gradient}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
    );
  };

  const selectedAgentData = selectedAgent ? AI_AGENTS.find(a => a.id === selectedAgent) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Credit Gate Modal */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        onConfirm={handleConfirmCredit}
        onBuyCredits={() => setShowCreditGate(false)}
        serviceName={selectedAgentData ? `${selectedAgentData.name} Chat` : 'AI Agent Chat'}
        cost={costPerSession}
        currentBalance={balance}
        isLoading={false}
      />

      {/* Hero Section */}
      <div className="relative mb-6 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-6 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAxOGMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">AI-Powered</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">AI Career Experts</h1>
          <p className="text-white/80 text-sm">Chat with specialized AI agents for personalized career guidance</p>
        </div>
      </div>

      {/* Cost Info Card */}
      <Card className="mb-6 border-2 border-warning/30 bg-gradient-to-r from-warning/5 to-warning/10">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/20 rounded-xl">
              <Coins className="h-6 w-6 text-warning" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{costPerSession}</span>
                <span className="text-muted-foreground">credits per session</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>30 min unlimited messages</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Grid - bKash Style 2x2 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {AI_AGENTS.map((agent, index) => {
          const Icon = agent.icon;
          const hasActive = !!getActiveSession(agent.id);
          
          return (
            <Card
              key={agent.id}
              onClick={() => handleAgentClick(agent.id)}
              className={`
                relative overflow-hidden cursor-pointer
                transition-all duration-200
                active:scale-95 hover:shadow-lg
                border-2 hover:border-primary/30
                animate-bounce-in
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Active Session Badge */}
              {hasActive && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5">
                    <span className="animate-pulse mr-1">●</span> Active
                  </Badge>
                </div>
              )}
              
              <CardContent className="p-4 flex flex-col items-center text-center">
                {/* Large Icon with Gradient Background */}
                <div className={`
                  w-16 h-16 rounded-2xl bg-gradient-to-br ${agent.gradient}
                  flex items-center justify-center mb-3
                  shadow-lg
                  transition-transform duration-200
                  group-hover:scale-105
                `}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                
                {/* Agent Name */}
                <h3 className="font-bold text-base mb-1">{agent.shortName}</h3>
                
                {/* Short Description */}
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {agent.description}
                </p>
                
                {/* Action Indicator */}
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  {hasActive ? (
                    <>
                      <MessageCircle className="h-3 w-3" />
                      <span>Continue</span>
                    </>
                  ) : (
                    <>
                      <span>Start Chat</span>
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Conversations Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Recent Chats</h2>
          {recentSessions.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recentSessions.length} sessions
            </Badge>
          )}
        </div>
        <RecentConversations
          sessions={recentSessions}
          onSelectSession={handleSelectSession}
          getAgentName={getAgentName}
          getAgentIcon={getAgentIcon}
        />
      </section>
    </div>
  );
}
