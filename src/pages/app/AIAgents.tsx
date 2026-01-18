import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coins,
  Sparkles,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { RecentConversations } from "@/components/ai-agents/RecentConversations";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useCredits } from "@/hooks/useCredits";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { toast } from "sonner";
import { AI_AGENTS, getAgentById } from "@/lib/constants/agents";

export default function AIAgents() {
  const navigate = useNavigate();
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const { recentSessions, startNewSession } = useAgentChat();
  const { balance, deductCredits } = useCredits();

  const costPerSession = CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost;

  // Check if agent has active session
  const getActiveSession = (agentKey: string) => {
    return recentSessions.find(
      (s) => s.agent_key === agentKey && s.is_active && new Date(s.session_expires_at) > new Date()
    );
  };

  const handleAgentClick = (agentId: string) => {
    const activeSession = getActiveSession(agentId);

    if (activeSession) {
      // Resume existing session
      navigate(`/app/agents/${agentId}`);
    } else {
      // Show credit gate for new session
      setSelectedAgentId(agentId);
      setShowCreditGate(true);
    }
  };

  const handleConfirmCredit = async () => {
    if (!selectedAgentId) return;

    const agent = getAgentById(selectedAgentId);

    // Deduct credits
    const success = await deductCredits(
      "AI_AGENT_CHAT",
      undefined,
      `AI Agent: ${agent?.name || "Chat"} session`
    );

    if (success) {
      // Start session
      const session = await startNewSession(selectedAgentId);
      if (session) {
        setShowCreditGate(false);
        navigate(`/app/agents/${selectedAgentId}`);
        toast.success("Session started! You have 30 minutes.");
      } else {
        toast.error("Failed to start session. Please try again.");
      }
    } else {
      setShowCreditGate(false); // Close on failure so they can try to buy credits
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    const session = recentSessions.find((s) => s.id === sessionId);
    if (session) {
      navigate(`/app/agents/${session.agent_key}`);
    }
  };

  const getAgentName = (agentKey: string) => {
    const agent = getAgentById(agentKey);
    return agent?.name || agentKey;
  };

  const getAgentIcon = (agentKey: string) => {
    const agent = getAgentById(agentKey);
    if (!agent) return null;
    const Icon = agent.icon;
    return (
      <div className={`p-1.5 rounded-lg ${agent.bgColor}`}>
        <Icon className={`h-4 w-4 ${agent.iconColor}`} />
      </div>
    );
  };

  const selectedAgent = selectedAgentId ? getAgentById(selectedAgentId) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Credit Gate Modal */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        onConfirm={handleConfirmCredit}
        onBuyCredits={() => setShowCreditGate(false)}
        serviceName={selectedAgent ? `${selectedAgent.name} Chat` : "AI Agent Chat"}
        cost={costPerSession}
        currentBalance={balance}
        isLoading={false}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-background rounded-xl shadow-sm">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">AI Career Experts</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg mb-4">
          Chat with specialized AI agents to refine your resume, practice
          interviews, and negotiate your salary.
        </p>

        <div className="inline-flex items-center gap-2 text-xs font-medium bg-background/50 border border-primary/20 px-3 py-1.5 rounded-full text-primary">
          <Coins className="h-3.5 w-3.5" />
          {costPerSession} credits / 30 min session
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {AI_AGENTS.map((agent, index) => {
          const Icon = agent.icon;
          const activeSession = getActiveSession(agent.id);

          return (
            <Card
              key={agent.id}
              onClick={() => handleAgentClick(agent.id)}
              className={`
                cursor-pointer transition-all duration-300 border-0 shadow-sm
                hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden
                ${activeSession ? "ring-2 ring-green-500/20 bg-green-50/10" : "hover:bg-accent/5"}
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {activeSession && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold z-10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Active
                </div>
              )}

              <CardContent className="p-5 flex flex-col items-center text-center h-full">
                <div
                  className={`w-14 h-14 rounded-2xl ${agent.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`h-7 w-7 ${agent.iconColor}`} />
                </div>

                <h3 className="font-bold text-sm mb-1">{agent.name}</h3>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {agent.description}
                </p>

                <div className="mt-auto w-full pt-3 border-t border-border/50 flex justify-center">
                  <span className="text-[10px] font-medium text-primary flex items-center gap-1 group-hover:underline">
                    {activeSession ? "Resume Chat" : "Start Session"}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Conversations Section */}
      {recentSessions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              Recent Chats
            </h2>
          </div>
          <RecentConversations
            sessions={recentSessions}
            onSelectSession={handleSelectSession}
            getAgentName={getAgentName}
            getAgentIcon={getAgentIcon}
          />
        </section>
      )}
    </div>
  );
}
