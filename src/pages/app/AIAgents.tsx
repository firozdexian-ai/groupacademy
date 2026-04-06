import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Coins,
  Sparkles,
  MessageCircle,
  Users,
  Bot,
  ClipboardList,
  Mic,
  DollarSign,
  Palette,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { AgentCard } from "@/components/ai-agents/AgentCard";
import { AgentListItem } from "@/components/ai-agents/AgentListItem";
import { AgentFilters, AgentCategory } from "@/components/ai-agents/AgentFilters";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useCredits } from "@/hooks/useCredits";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AI_AGENTS, getAgentById } from "@/lib/constants/agents";
import { SectionHeader } from "@/components/ui/section-header";

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

const CAREER_TOOLS = [
  {
    icon: ClipboardList,
    label: "Career Scorecard",
    description: "AI-powered career readiness assessment",
    path: "/app/services/assessment",
    creditCost: 50,
  },
  {
    icon: Mic,
    label: "Mock Interview",
    description: "Practice with AI interview coach",
    path: "/app/services/mock-interview",
    creditCost: 50,
  },
  {
    icon: DollarSign,
    label: "Salary Analysis",
    description: "Market-rate salary insights",
    path: "/app/services/salary-analysis",
    creditCost: 50,
  },
  {
    icon: Palette,
    label: "Portfolio Builder",
    description: "Professional portfolio creation",
    path: "/app/services/portfolio",
    creditCost: 500,
  },
];

export default function AIAgents() {
  const navigate = useNavigate();
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [selectedAgentKey, setSelectedAgentKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory>("all");

  const { recentSessions, startOrResumeSession, isLoadingSessions } = useAgentChat();
  const { balance } = useCredits();

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
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = agent.name.toLowerCase().includes(query);
        const matchesDesc = agent.description.toLowerCase().includes(query);
        const matchesExpertise = agent.expertise.some((e) =>
          e.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesDesc && !matchesExpertise) return false;
      }
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
      .filter((s) => s.is_active)
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

  const recentChats = useMemo(() => {
    return recentSessions
      .filter((s) => !s.is_active)
      .slice(0, 10)
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

  const handleAgentClick = (agentKey: string) => {
    // Per-response model: go directly to chat, no credit gate upfront
    navigate(`/app/agents/${agentKey}`);
  };

  const handleConfirmCredit = async () => {
    if (!selectedAgentKey) return;
    navigate(`/app/agents/${selectedAgentKey}`);
    setShowCreditGate(false);
  };

  const selectedAgent = selectedAgentKey ? agents.find((a) => a.agent_key === selectedAgentKey) : null;
  const hasCompanyAgents = agents.some((a) => a.isCompanyAgent);
  const isLoading = isLoadingAgents || isLoadingSessions;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
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
      <div className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent rounded-2xl p-4">
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

      {/* Two-Tab Layout */}
      <Tabs defaultValue="network" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="network" className="flex-1 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Agent Network
          </TabsTrigger>
          <TabsTrigger value="chats" className="flex-1 gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            Chats
            {(activeConversations.length + recentChats.length) > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                {activeConversations.length + recentChats.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ====== AGENT NETWORK TAB ====== */}
        <TabsContent value="network" className="space-y-4">
          {/* Filters */}
          <AgentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showCompanyTab={hasCompanyAgents}
          />

          {/* All Agents Grid */}
          <section>
            <SectionHeader
              icon={Sparkles}
              title={searchQuery || selectedCategory !== "all" ? "Results" : "All Agents"}
              count={filteredAgents.length}
              size="sm"
            />

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 space-y-3">
                    <Skeleton className="h-14 w-14 rounded-full mx-auto" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                    <Skeleton className="h-3 w-32 mx-auto" />
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
              <div className="grid grid-cols-2 gap-3">
                {filteredAgents.map((agent) => {
                  const activeSession = recentSessions.find(s => s.agent_key === agent.agent_key && s.is_active);
                  return (
                    <AgentCard
                      key={agent.id}
                      id={agent.id}
                      name={agent.name}
                      description={agent.description}
                      icon={agent.icon}
                      color={agent.iconColor}
                      bgColor={agent.bgColor}
                      expertise={agent.expertise}
                      creditCost={agent.creditCost}
                      avatarUrl={agent.avatarUrl}
                      hasActiveSession={!!activeSession}
                      onClick={() => handleAgentClick(agent.agent_key)}
                      onResume={activeSession ? () => navigate(`/app/agents/${agent.agent_key}`) : undefined}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Career Tools Section */}
          {!searchQuery && selectedCategory === "all" && (
            <section>
              <SectionHeader
                icon={ClipboardList}
                title="Career Tools"
                size="sm"
              />
              <div className="grid grid-cols-2 gap-3">
                {CAREER_TOOLS.map((tool) => (
                  <Card
                    key={tool.label}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
                    onClick={() => navigate(tool.path)}
                  >
                    <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center transition-transform group-hover:scale-105">
                        <tool.icon className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <h3 className="font-semibold text-xs leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {tool.label}
                      </h3>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Coins className="h-2.5 w-2.5" />
                          {tool.creditCost} pts
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          Tool
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        {/* ====== CHATS TAB ====== */}
        <TabsContent value="chats" className="space-y-4">
          {/* Active Conversations */}
          {activeConversations.length > 0 && (
            <section>
              <SectionHeader
                icon={MessageCircle}
                title="Active Sessions"
                size="sm"
              />
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

          {/* Recent Chats */}
          {recentChats.length > 0 ? (
            <section>
              <SectionHeader
                icon={MessageCircle}
                title="Recent Chats"
                size="sm"
              />
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
          ) : activeConversations.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-sm mb-1">No conversations yet</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Start chatting with an agent from the Network tab
                </p>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
