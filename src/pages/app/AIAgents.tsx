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
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    expertise: ['Career Planning', 'Job Search', 'Career Change']
  },
  {
    id: 'cv-coach',
    name: 'CV Coach',
    shortName: 'CV Coach',
    description: 'Optimize your resume',
    icon: FileText,
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
    expertise: ['CV Review', 'ATS Optimization', 'Cover Letters']
  },
  {
    id: 'interview-coach',
    name: 'Interview Coach',
    shortName: 'Interview',
    description: 'Ace your interviews',
    icon: Mic,
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-600',
    expertise: ['Mock Practice', 'STAR Method', 'Confidence']
  },
  {
    id: 'salary-negotiator',
    name: 'Salary Negotiator',
    shortName: 'Salary',
    description: 'Negotiate better offers',
    icon: DollarSign,
    bgColor: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    expertise: ['Negotiation', 'Market Rates', 'Benefits']
  },
  {
    id: 'ielts-tutor',
    name: 'IELTS Tutor',
    shortName: 'IELTS',
    description: 'Master English tests',
    icon: BookOpen,
    bgColor: 'bg-rose-500/10',
    iconColor: 'text-rose-600',
    expertise: ['Speaking', 'Writing', 'Test Strategies']
  },
  {
    id: 'skill-advisor',
    name: 'Skill Advisor',
    shortName: 'Skills',
    description: 'Learn in-demand skills',
    icon: Lightbulb,
    bgColor: 'bg-cyan-500/10',
    iconColor: 'text-cyan-600',
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

    const success = await deductCredits('AI_AGENT_CHAT', undefined, `AI Agent: ${selectedAgent} session`);
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
      <div className={`p-1.5 rounded-lg ${agent.bgColor}`}>
        <Icon className={`h-4 w-4 ${agent.iconColor}`} />
      </div>
    );
  };

  const selectedAgentData = selectedAgent ? AI_AGENTS.find(a => a.id === selectedAgent) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
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

      {/* Compact Hero Section */}
      <div className="relative mb-4 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-4 text-white overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-white/15 rounded-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI Career Experts</h1>
            <p className="text-white/80 text-xs">Chat with specialized AI agents</p>
          </div>
        </div>
      </div>

      {/* Compact Cost Info */}
      <div className="mb-4 flex items-center gap-3 p-3 rounded-lg border border-warning/30 bg-warning/5">
        <div className="p-1.5 bg-warning/15 rounded-lg">
          <Coins className="h-4 w-4 text-warning" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">{costPerSession} credits</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> 30 min session
          </span>
        </div>
      </div>

      {/* Agent Grid - bKash Style 3 Columns */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {AI_AGENTS.map((agent, index) => {
          const Icon = agent.icon;
          const hasActive = !!getActiveSession(agent.id);
          
          return (
            <div
              key={agent.id}
              onClick={() => handleAgentClick(agent.id)}
              className={`
                relative p-3 rounded-xl bg-card border
                cursor-pointer transition-all duration-150
                active:scale-95 hover:shadow-md hover:border-primary/30
                flex flex-col items-center text-center
                ${hasActive ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}
              `}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Active indicator dot */}
              {hasActive && (
                <div className="absolute top-1.5 right-1.5">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
              )}
              
              {/* Compact Icon - bKash Style */}
              <div className={`
                w-11 h-11 rounded-xl ${agent.bgColor}
                flex items-center justify-center mb-2
              `}>
                <Icon className={`h-5 w-5 ${agent.iconColor}`} />
              </div>
              
              {/* Agent Name Only */}
              <span className="font-medium text-xs leading-tight">{agent.shortName}</span>
            </div>
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
