import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  MessageCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { RecentConversations } from "@/components/ai-agents/RecentConversations";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useCredits } from "@/hooks/useCredits";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { toast } from "sonner";

const AI_AGENTS = [
  {
    id: "career-consultant",
    name: "Career Consultant",
    shortName: "Career",
    description: "Plan your professional journey",
    icon: Briefcase,
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-600",
    expertise: ["Career Planning", "Job Search", "Career Change"],
  },
  {
    id: "cv-coach",
    name: "CV Coach",
    shortName: "CV Coach",
    description: "Optimize your resume",
    icon: FileText,
    bgColor: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    expertise: ["CV Review", "ATS Optimization", "Cover Letters"],
  },
  {
    id: "interview-coach",
    name: "Interview Coach",
    shortName: "Interview",
    description: "Ace your interviews",
    icon: Mic,
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-600",
    expertise: ["Mock Practice", "STAR Method", "Confidence"],
  },
  {
    id: "salary-negotiator",
    name: "Salary Negotiator",
    shortName: "Salary",
    description: "Negotiate better offers",
    icon: DollarSign,
    bgColor: "bg-amber-500/10",
    iconColor: "text-amber-600",
    expertise: ["Negotiation", "Market Rates", "Benefits"],
  },
  {
    id: "ielts-tutor",
    name: "IELTS Tutor",
    shortName: "IELTS",
    description: "Master English tests",
    icon: BookOpen,
    bgColor: "bg-rose-500/10",
    iconColor: "text-rose-600",
    expertise: ["Speaking", "Writing", "Test Strategies"],
  },
  {
    id: "skill-advisor",
    name: "Skill Advisor",
    shortName: "Skills",
    description: "Learn in-demand skills",
    icon: Lightbulb,
    bgColor: "bg-cyan-500/10",
    iconColor: "text-cyan-600",
    expertise: ["Skill Gaps", "Learning Paths", "Industry Trends"],
  },
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
      (s) => s.agent_key === agentKey && s.is_active && new Date(s.session_expires_at) > new Date(),
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

    const success = await deductCredits("AI_AGENT_CHAT", undefined, `AI Agent: ${selectedAgent} session`);
    if (success) {
      const session = await startNewSession(selectedAgent);
      if (session) {
        setShowCreditGate(false);
        navigate(`/app/agents/${selectedAgent}`);
        toast.success("Session started! You have 30 minutes.");
      } else {
        toast.error("Failed to start session");
      }
    }
    setShowCreditGate(false);
  };

  const handleSelectSession = async (sessionId: string) => {
    const session = recentSessions.find((s) => s.id === sessionId);
    if (session) {
      navigate(`/app/agents/${session.agent_key}`);
    }
  };

  const getAgentName = (agentKey: string) => {
    const agent = AI_AGENTS.find((a) => a.id === agentKey);
    return agent?.name || agentKey;
  };

  const getAgentIcon = (agentKey: string) => {
    const agent = AI_AGENTS.find((a) => a.id === agentKey);
    if (!agent) return null;
    const Icon = agent.icon;
    return (
      <div className={`p-1.5 rounded-lg ${agent.bgColor}`}>
        <Icon className={`h-4 w-4 ${agent.iconColor}`} />
      </div>
    );
  };

  const selectedAgentData = selectedAgent ? AI_AGENTS.find((a) => a.id === selectedAgent) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Credit Gate Modal */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        onConfirm={handleConfirmCredit}
        onBuyCredits={() => setShowCreditGate(false)}
        serviceName={selectedAgentData ? `${selectedAgentData.name} Chat` : "AI Agent Chat"}
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
          Chat with specialized AI agents to refine your resume, practice interviews, and negotiate your salary.
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
                cursor-pointer transition-all duration-200 border-0 shadow-sm
                hover:shadow-md hover:-translate-y-1 group relative overflow-hidden
                ${activeSession ? "ring-2 ring-green-500/20 bg-green-50/30" : ""}
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
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{agent.description}</p>

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
