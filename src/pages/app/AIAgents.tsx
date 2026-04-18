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
  History as HistoryIcon, // FIX: Renamed to avoid browser 'History' conflict
  Loader2,
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
import { supabase } from "@/integrations/supabase/client";
import { AI_AGENTS, getAgentById } from "@/lib/constants/agents";
import { SectionHeader } from "@/components/ui/section-header";

// FIX: Added missing DBAgent interface
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

// FIX: Added missing CAREER_TOOLS constant
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory>("all");

  const { recentSessions = [], isLoadingSessions } = useAgentChat();
  const { balance } = useCredits();

  const { data: dbAgents = [], isLoading: isLoadingAgents } = useQuery({
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
    staleTime: 1000 * 60 * 10,
  });

  const agents = useMemo(() => {
    const baseList = dbAgents.length > 0 ? dbAgents : AI_AGENTS;
    return baseList.map((agent: any) => {
      const isDb = "agent_key" in agent;
      const key = isDb ? agent.agent_key : agent.id;
      const staticMeta = getAgentById(key);

      return {
        id: isDb ? agent.id : agent.id,
        agent_key: key,
        name: agent.name,
        description: agent.description,
        icon: staticMeta?.icon,
        bgColor: isDb ? agent.bg_color || "bg-primary/5" : agent.bgColor || "bg-primary/5",
        color: isDb ? agent.color || "#7c3aed" : agent.iconColor || "#7c3aed", // FIX: Mapping color explicitly
        expertise: isDb ? agent.expertise_areas || [] : agent.expertise || [],
        creditCost: isDb ? (agent.credit_cost ?? 10) : 10,
        category: (isDb ? agent.category || "career" : "career") as AgentCategory,
        avatarUrl: isDb ? agent.avatar_url : null,
        isCompanyAgent: isDb ? agent.agent_type === "company" : false,
      };
    });
  }, [dbAgents]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        !searchQuery ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.expertise.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "company" ? agent.isCompanyAgent : agent.category === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [agents, searchQuery, selectedCategory]);

  const conversationStacks = useMemo(() => {
    const active = recentSessions
      .filter((s) => s.is_active)
      .map((s) => ({
        ...s,
        agent: agents.find((a) => a.agent_key === s.agent_key),
        lastMsg: s.messages?.[s.messages.length - 1]?.content.slice(0, 60),
      }));

    const historical = recentSessions
      .filter((s) => !s.is_active)
      .slice(0, 8)
      .map((s) => ({
        ...s,
        agent: agents.find((a) => a.agent_key === s.agent_key),
        lastMsg: s.messages?.[s.messages.length - 1]?.content.slice(0, 60),
      }));

    return { active, historical };
  }, [recentSessions, agents]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Expert Network</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              AI-Powered Career Intelligence
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="network" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl mb-6">
          <TabsTrigger value="network" className="rounded-lg font-bold text-xs gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Explorer
          </TabsTrigger>
          <TabsTrigger value="chats" className="rounded-lg font-bold text-xs gap-2 relative">
            <MessageCircle className="h-3.5 w-3.5" /> Inbox
            {conversationStacks.active.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-[9px] text-white rounded-full flex items-center justify-center ring-2 ring-background">
                {conversationStacks.active.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-8 mt-0">
          <AgentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showCompanyTab={agents.some((a) => a.isCompanyAgent)}
          />

          <section className="space-y-4">
            <SectionHeader
              icon={Bot}
              title={searchQuery ? "Search Results" : "Available Specialists"}
              count={filteredAgents.length}
              size="sm"
            />

            {isLoadingAgents ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-3xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredAgents.map((agent) => (
                  <AgentCard
                    key={agent.agent_key}
                    id={agent.id}
                    name={agent.name}
                    description={agent.description}
                    icon={agent.icon}
                    color={agent.color} // FIX: Color mapped
                    bgColor={agent.bgColor} // FIX: BgColor mapped
                    expertise={agent.expertise}
                    creditCost={agent.creditCost}
                    avatarUrl={agent.avatarUrl}
                    hasActiveSession={recentSessions.some((s) => s.agent_key === agent.agent_key && s.is_active)}
                    onClick={() => navigate(`/app/agents/${agent.agent_key}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {!searchQuery && selectedCategory === "all" && (
            <section className="space-y-4 pt-4">
              <SectionHeader icon={ClipboardList} title="Professional Suite" size="sm" />
              <div className="grid grid-cols-2 gap-4">
                {CAREER_TOOLS.map((tool) => (
                  <Card
                    key={tool.label}
                    className="group cursor-pointer hover:border-primary/40 transition-all rounded-3xl p-4"
                    onClick={() => navigate(tool.path)}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <tool.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-xs tracking-tight">{tool.label}</h3>
                      <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-full">
                        <Coins className="h-3 w-3 text-amber-500" />
                        <span className="text-[10px] font-black tracking-widest">{tool.creditCost}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="chats" className="mt-0">
          <div className="space-y-6">
            {conversationStacks.active.length > 0 && (
              <section className="space-y-4">
                <SectionHeader icon={MessageCircle} title="Active Sessions" size="sm" />
                <div className="space-y-3">
                  {conversationStacks.active.map((conv) => (
                    <AgentListItem
                      key={conv.id}
                      id={conv.id}
                      name={conv.agent?.name || "Expert"}
                      description={conv.lastMsg || ""}
                      isActive
                      onClick={() => navigate(`/app/agents/${conv.agent_key}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <SectionHeader icon={HistoryIcon} title="Recent Activity" size="sm" />
              {conversationStacks.historical.length > 0 ? (
                <div className="space-y-3">
                  {conversationStacks.historical.map((chat) => (
                    <AgentListItem
                      key={chat.id}
                      id={chat.id}
                      name={chat.agent?.name || "Expert"}
                      description={chat.lastMsg || ""}
                      onClick={() => navigate(`/app/agents/${chat.agent_key}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 border-dashed border-2 rounded-3xl text-center text-muted-foreground text-xs font-bold">
                  No previous sessions.
                </div>
              )}
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
