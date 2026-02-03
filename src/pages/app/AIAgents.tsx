import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Coins,
  Sparkles,
  MessageCircle,
  Users,
  Bot,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { AgentListItem } from "@/components/ai-agents/AgentListItem";
import { AgentFilters, AgentCategory } from "@/components/ai-agents/AgentFilters";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useCredits } from "@/hooks/useCredits";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AI_AGENTS, getAgentById } from "@/lib/constants/agents";

interface DBAgent {
  id: string;
  agent_key: string;
  name: string;
  description: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  expertise_areas: string[] | null;
  is_active: boolean;
  credit_cost: number | null;
  category: string | null;
  avatar_url: string | null;
  agent_type: string | null;
  company_id: string | null;
  is_featured: boolean | null;
}

export default function AIAgents() {
  const navigate = useNavigate();
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [selectedAgentKey, setSelectedAgentKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory>("all");

  const { recentSessions, startNewSession, isLoadingSessions } = useAgentChat();
  const { balance, deductCredits } = useCredits();

  // Fetch agents from database
  const { data: dbAgents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["ai-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as DBAgent[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Merge DB agents with static fallback
  const agents = useMemo(() => {
    if (!dbAgents?.length) {
      // Fallback to static agents if DB is empty
      return AI_AGENTS.map((a) => ({
        id: a.id,
        agent_key: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        bgColor: a.bgColor,
        iconColor: a.iconColor,
        expertise: a.expertise,
        creditCost: CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost,
        category: "career" as const,
        avatarUrl: null,
        isCompanyAgent: false,
      }));
    }

    return dbAgents.map((agent) => {
      // Try to get icon from static constants
      const staticAgent = getAgentById(agent.agent_key);
      return {
        id: agent.id,
        agent_key: agent.agent_key,
        name: agent.name,
        description: agent.description,
        icon: staticAgent?.icon,
        bgColor: agent.bg_color || staticAgent?.bgColor || "bg-primary/10",
        iconColor: agent.color || staticAgent?.iconColor || "text-primary",
        expertise: agent.expertise_areas || staticAgent?.expertise || [],
        creditCost: agent.credit_cost ?? CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost,
        category: (agent.category || "career") as AgentCategory,
        avatarUrl: agent.avatar_url,
        isCompanyAgent: agent.agent_type === "company",
      };
    });
  }, [dbAgents]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = agent.name.toLowerCase().includes(query);
        const matchesDesc = agent.description.toLowerCase().includes(query);
        const matchesExpertise = agent.expertise.some((e) =>
          e.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesDesc && !matchesExpertise) return false;
      }

      // Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "company") {
          return agent.isCompanyAgent;
        }
        return agent.category === selectedCategory;
      }

      return true;
    });
  }, [agents, searchQuery, selectedCategory]);

  // Get active sessions with agent details
  const activeConversations = useMemo(() => {
    return recentSessions
      .filter((s) => s.is_active && new Date(s.session_expires_at) > new Date())
      .map((session) => {
        const agent = agents.find((a) => a.agent_key === session.agent_key);
        const lastMsg = session.messages?.[session.messages.length - 1];
        return {
          ...session,
          agent,
          lastMessage: lastMsg?.role === "assistant" ? lastMsg.content.slice(0, 80) : undefined,
        };
      });
  }, [recentSessions, agents]);

  // Recent (inactive) conversations
  const recentChats = useMemo(() => {
    return recentSessions
      .filter((s) => !s.is_active || new Date(s.session_expires_at) <= new Date())
      .slice(0, 5)
      .map((session) => {
        const agent = agents.find((a) => a.agent_key === session.agent_key);
        const lastMsg = session.messages?.[session.messages.length - 1];
        return {
          ...session,
          agent,
          lastMessage: lastMsg?.content?.slice(0, 80),
        };
      });
  }, [recentSessions, agents]);

  const getActiveSession = (agentKey: string) => {
    return recentSessions.find(
      (s) => s.agent_key === agentKey && s.is_active && new Date(s.session_expires_at) > new Date()
    );
  };

  const handleAgentClick = (agentKey: string) => {
    const activeSession = getActiveSession(agentKey);

    if (activeSession) {
      navigate(`/app/agents/${agentKey}`);
    } else {
      setSelectedAgentKey(agentKey);
      setShowCreditGate(true);
    }
  };

  const handleConfirmCredit = async () => {
    if (!selectedAgentKey) return;

    const agent = agents.find((a) => a.agent_key === selectedAgentKey);
    const creditCost = agent?.creditCost ?? CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost;

    const success = await deductCredits(
      "AI_AGENT_CHAT",
      undefined,
      `AI Agent: ${agent?.name || "Chat"} session`
    );

    if (success) {
      const session = await startNewSession(selectedAgentKey);
      if (session) {
        setShowCreditGate(false);
        navigate(`/app/agents/${selectedAgentKey}`);
        toast.success("Session started! You have 30 minutes.");
      } else {
        toast.error("Failed to start session. Please try again.");
      }
    } else {
      setShowCreditGate(false);
    }
  };

  const selectedAgent = selectedAgentKey ? agents.find((a) => a.agent_key === selectedAgentKey) : null;
  const hasCompanyAgents = agents.some((a) => a.isCompanyAgent);
  const isLoading = isLoadingAgents || isLoadingSessions;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Credit Gate Modal */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        onConfirm={handleConfirmCredit}
        onBuyCredits={() => setShowCreditGate(false)}
        serviceName={selectedAgent ? `${selectedAgent.name} Chat` : "AI Agent Chat"}
        cost={selectedAgent?.creditCost ?? CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost}
        currentBalance={balance}
        isLoading={false}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-background rounded-xl shadow-sm">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-bold">AI Agent Network</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Chat with specialized AI experts for career guidance, interview prep, and more.
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {agents.length} agents
          </span>
          <span className="flex items-center gap-1.5 font-medium text-primary">
            <Coins className="h-3.5 w-3.5" />
            From 10 credits
          </span>
        </div>
      </div>

      {/* Filters */}
      <AgentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showCompanyTab={hasCompanyAgents}
      />

      {/* Active Conversations */}
      {activeConversations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <h2 className="text-sm font-semibold">Active Sessions</h2>
          </div>
          <Card className="border-green-200/50 dark:border-green-800/30 bg-green-50/30 dark:bg-green-950/10">
            <CardContent className="p-2 divide-y divide-border/50">
              {activeConversations.map((conv) => (
                  <AgentListItem
                    key={conv.id}
                    id={conv.id}
                    name={conv.agent?.name || conv.agent_key}
                    description={conv.agent?.description || ""}
                    icon={conv.agent?.icon}
                    bgColor={conv.agent?.bgColor}
                  iconColor={conv.agent?.iconColor}
                  avatarUrl={conv.agent?.avatarUrl}
                  creditCost={conv.agent?.creditCost}
                  isActive={true}
                  lastMessage={conv.lastMessage}
                  lastMessageTime={conv.session_started_at}
                  onClick={() => navigate(`/app/agents/${conv.agent_key}`)}
                />
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* All Agents */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            {searchQuery || selectedCategory !== "all" ? "Results" : "All Agents"}
          </h2>
          <span className="text-xs text-muted-foreground">({filteredAgents.length})</span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? `No agents found for "${searchQuery}"` : "No agents available"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-2 divide-y divide-border/50">
              {filteredAgents.map((agent) => {
                const activeSession = getActiveSession(agent.agent_key);
                return (
                  <AgentListItem
                    key={agent.id}
                    id={agent.id}
                    name={agent.name}
                    description={agent.description}
                    icon={agent.icon}
                    bgColor={agent.bgColor}
                    iconColor={agent.iconColor}
                    avatarUrl={agent.avatarUrl}
                    creditCost={agent.creditCost}
                    category={agent.category}
                    isActive={!!activeSession}
                    isCompanyAgent={agent.isCompanyAgent}
                    expertise={agent.expertise}
                    onClick={() => handleAgentClick(agent.agent_key)}
                  />
                );
              })}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Recent Chats */}
      {recentChats.length > 0 && !searchQuery && selectedCategory === "all" && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recent Chats</h2>
          </div>
          <Card className="bg-muted/30">
            <CardContent className="p-2 divide-y divide-border/50">
              {recentChats.map((chat) => (
                <AgentListItem
                  key={chat.id}
                  id={chat.id}
                  name={chat.agent?.name || chat.agent_key}
                  description={chat.agent?.description || ""}
                  icon={chat.agent?.icon}
                  bgColor={chat.agent?.bgColor}
                  iconColor={chat.agent?.iconColor}
                  avatarUrl={chat.agent?.avatarUrl}
                  lastMessage={chat.lastMessage}
                  lastMessageTime={chat.session_started_at}
                  onClick={() => navigate(`/app/agents/${chat.agent_key}`)}
                />
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
