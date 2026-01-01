import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Briefcase, FileText, Mic, DollarSign, BookOpen, Lightbulb 
} from 'lucide-react';
import { CREDIT_CONFIG } from '@/lib/creditPricing';
import { AgentChatDialog } from '@/components/ai-agents/AgentChatDialog';
import { useAgentChat } from '@/hooks/useAgentChat';
import { useCredits } from '@/hooks/useCredits';
import { CreditGateModal } from '@/components/credits/CreditGateModal';
import { toast } from 'sonner';

const AGENTS: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  'career-consultant': { 
    name: 'Career Consultant', 
    icon: <Briefcase className="h-4 w-4" />, 
    color: 'bg-primary' 
  },
  'cv-coach': { 
    name: 'CV Coach', 
    icon: <FileText className="h-4 w-4" />, 
    color: 'bg-green-500' 
  },
  'interview-coach': { 
    name: 'Interview Coach', 
    icon: <Mic className="h-4 w-4" />, 
    color: 'bg-purple-500' 
  },
  'salary-negotiator': { 
    name: 'Salary Negotiator', 
    icon: <DollarSign className="h-4 w-4" />, 
    color: 'bg-amber-500' 
  },
  'ielts-tutor': { 
    name: 'IELTS Tutor', 
    icon: <BookOpen className="h-4 w-4" />, 
    color: 'bg-red-500' 
  },
  'skill-advisor': { 
    name: 'Skill Advisor', 
    icon: <Lightbulb className="h-4 w-4" />, 
    color: 'bg-cyan-500' 
  }
};

export default function AgentChat() {
  const { agentKey } = useParams<{ agentKey: string }>();
  const navigate = useNavigate();
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const {
    session,
    messages,
    isStreaming,
    sendMessage,
    startNewSession,
    loadSession,
    endSession,
    recentSessions,
    isSessionExpired,
    timeRemaining,
    isLoadingSessions
  } = useAgentChat();

  const { balance, deductCredits } = useCredits();

  const agent = agentKey ? AGENTS[agentKey] : null;
  const serviceCost = CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost;

  // Check for existing active session or show credit gate
  useEffect(() => {
    if (!agentKey || !agent) {
      navigate('/app/agents');
      return;
    }

    // Wait for sessions to actually load before making decisions
    if (isLoadingSessions) {
      return;
    }

    const initializeSession = async () => {
      // Check if there's an active session for this agent
      const activeSession = recentSessions.find(
        s => s.agent_key === agentKey && 
        s.is_active && 
        new Date(s.session_expires_at) > new Date()
      );

      if (activeSession) {
        // Resume existing session - no credit charge
        await loadSession(activeSession.id);
        setIsInitializing(false);
      } else {
        // Need to start new session - show credit gate
        setShowCreditGate(true);
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [agentKey, recentSessions, agent, navigate, loadSession, isLoadingSessions]);

  const handleConfirmCredit = async () => {
    if (!agentKey) return;

    const success = await deductCredits('AI_AGENT_CHAT', undefined, `AI Agent: ${agent?.name} session`);
    if (success) {
      const newSession = await startNewSession(agentKey);
      if (newSession) {
        setShowCreditGate(false);
        toast.success('Session started! You have 30 minutes.');
      } else {
        toast.error('Failed to start session');
      }
    }
  };

  const handleBack = () => {
    navigate('/app/agents');
  };

  const handleEndSession = async () => {
    await endSession();
    toast.success('Session ended');
    navigate('/app/agents');
  };

  if (!agent || !agentKey) {
    return null;
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={handleBack}
        onConfirm={handleConfirmCredit}
        onBuyCredits={handleBack}
        serviceName={`${agent.name} Chat`}
        cost={serviceCost}
        currentBalance={balance}
        isLoading={false}
      />

      {session && (
        <AgentChatDialog
          agent={agent}
          messages={messages}
          isStreaming={isStreaming}
          timeRemaining={timeRemaining}
          isSessionExpired={isSessionExpired}
          onSendMessage={sendMessage}
          onBack={handleBack}
          onEndSession={handleEndSession}
        />
      )}
    </div>
  );
}
