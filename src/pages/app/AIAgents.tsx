import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  FileText, 
  Mic, 
  DollarSign,
  BookOpen,
  Lightbulb,
  Coins
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CREDIT_CONFIG } from '@/lib/creditPricing';
import { AgentCard } from '@/components/ai-agents/AgentCard';
import { RecentConversations } from '@/components/ai-agents/RecentConversations';
import { useAgentChat } from '@/hooks/useAgentChat';
import { useCredits } from '@/hooks/useCredits';
import { CreditGateModal } from '@/components/credits/CreditGateModal';
import { toast } from 'sonner';

const AI_AGENTS = [
  {
    id: 'career-consultant',
    name: 'Career Consultant',
    description: 'Get personalized career advice, explore new opportunities, and plan your professional journey with expert guidance.',
    icon: Briefcase,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    expertise: ['Career Planning', 'Job Search', 'Career Change']
  },
  {
    id: 'cv-coach',
    name: 'CV Coach',
    description: 'Get your resume reviewed, learn ATS optimization techniques, and craft compelling cover letters that stand out.',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    expertise: ['CV Review', 'ATS Optimization', 'Cover Letters']
  },
  {
    id: 'interview-coach',
    name: 'Interview Coach',
    description: 'Prepare for interviews with practice questions, feedback on your answers, and strategies to boost your confidence.',
    icon: Mic,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    expertise: ['Mock Practice', 'STAR Method', 'Confidence']
  },
  {
    id: 'salary-negotiator',
    name: 'Salary Negotiator',
    description: 'Master the art of salary negotiation with strategies, scripts, and market insights tailored to your industry.',
    icon: DollarSign,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    expertise: ['Negotiation', 'Market Rates', 'Benefits']
  },
  {
    id: 'ielts-tutor',
    name: 'IELTS Tutor',
    description: 'Practice English, get IELTS exam strategies, and improve your speaking and writing skills with personalized guidance.',
    icon: BookOpen,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    expertise: ['Speaking', 'Writing', 'Test Strategies']
  },
  {
    id: 'skill-advisor',
    name: 'Skill Advisor',
    description: 'Discover in-demand skills, get personalized learning paths, and stay ahead with industry trend insights.',
    icon: Lightbulb,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
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

  const handleResumeSession = (agentId: string) => {
    navigate(`/app/agents/${agentId}`);
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
      <div className={`p-2 rounded-lg ${agent.bgColor}`}>
        <Icon className={`h-4 w-4 ${agent.color}`} />
      </div>
    );
  };

  const selectedAgentData = selectedAgent ? AI_AGENTS.find(a => a.id === selectedAgent) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Agents</h1>
        <p className="text-muted-foreground">Chat with AI experts for career guidance</p>
      </div>

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

      {/* Agent Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {AI_AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            id={agent.id}
            name={agent.name}
            description={agent.description}
            icon={agent.icon}
            color={agent.color}
            bgColor={agent.bgColor}
            expertise={agent.expertise}
            hasActiveSession={!!getActiveSession(agent.id)}
            onClick={() => handleAgentClick(agent.id)}
            onResume={() => handleResumeSession(agent.id)}
          />
        ))}
      </div>

      {/* Recent Conversations */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Conversations</h2>
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
