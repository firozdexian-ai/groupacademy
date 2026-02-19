import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { AgentChatDialog } from "@/components/ai-agents/AgentChatDialog";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useCredits } from "@/hooks/useCredits";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { toast } from "sonner";
import { getAgentById } from "@/lib/constants/agents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AgentChat() {
  const { agentKey } = useParams<{ agentKey: string }>();
  const navigate = useNavigate();

  // UI State
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Custom Hooks
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
    isLoadingSessions,
  } = useAgentChat();

  const { balance, deductCredits } = useCredits();

  // Retrieve Agent Data from static constants
  const staticAgent = agentKey ? getAgentById(agentKey) : null;
  const serviceCost = CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost;

  // Fetch DB agent for avatar_url
  const { data: dbAgent } = useQuery({
    queryKey: ["ai-agent-detail", agentKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_agents")
        .select("avatar_url, name, bg_color, color")
        .eq("agent_key", agentKey!)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!agentKey,
    staleTime: 10 * 60 * 1000,
  });

  const agent = staticAgent;

  // 1. Session Initialization Logic
  useEffect(() => {
    if (!agentKey || !agent) {
      navigate("/app/agents");
      return;
    }

    // Wait for sessions to load to prevent false negatives
    if (isLoadingSessions) return;

    const initializeSession = async () => {
      // Check for active, unexpired session for THIS agent
      const activeSession = recentSessions.find(
        (s) => s.agent_key === agentKey && s.is_active && new Date(s.session_expires_at) > new Date(),
      );

      if (activeSession) {
        // Resume existing session (Free)
        await loadSession(activeSession.id);
        setIsInitializing(false);
      } else {
        // No active session -> Gate it
        setShowCreditGate(true);
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [agentKey, recentSessions, isLoadingSessions, agent, navigate, loadSession]);

  // 2. Handle Starting a New Session (Paid)
  const handleConfirmCredit = async () => {
    if (!agentKey) return;

    // Use our global credit hook
    const success = await deductCredits("AI_AGENT_CHAT", undefined, `AI Agent: ${agent?.name || "Chat"} session`);

    if (success) {
      const newSession = await startNewSession(agentKey);
      if (newSession) {
        setShowCreditGate(false);
        toast.success("Session started! You have 30 minutes.");
      } else {
        toast.error("Failed to start session. Please try again.");
      }
    } else {
      // Allow user to buy more credits
      setShowCreditGate(false);
    }
  };

  const handleBuyCredits = () => {
    setShowCreditGate(false); // Close gate
    setShowPurchaseSheet(true); // Open purchase sheet
  };

  const handleBack = () => {
    navigate("/app/agents");
  };

  const handleEndSession = async () => {
    await endSession();
    toast.success("Session ended");
    navigate("/app/agents");
  };

  if (!agent || !agentKey) return null;

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 3. Helper to render the icon component
  const AgentIcon = agent.icon;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] flex flex-col pb-16 md:pb-0">
      {/* Credit Gate (The Door) */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={handleBack}
        onConfirm={handleConfirmCredit}
        onBuyCredits={handleBuyCredits}
        serviceName={`${agent.name} Chat`}
        cost={serviceCost}
        currentBalance={balance}
        isLoading={false}
      />

      {/* Credit Purchase (The Wallet) */}
      <CreditPurchaseSheet
        isOpen={showPurchaseSheet}
        onClose={() => {
          setShowPurchaseSheet(false);
          // Re-open gate if they didn't start a session yet
          if (!session) setShowCreditGate(true);
        }}
        currentBalance={balance}
      />

      {/* Chat Interface (The Room) */}
      {session && (
        <AgentChatDialog
          agent={{
            name: agent.name,
            color: agent.bgColor,
            icon: <AgentIcon className={`h-4 w-4 ${agent.iconColor}`} />,
            avatarUrl: dbAgent?.avatar_url,
          }}
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
