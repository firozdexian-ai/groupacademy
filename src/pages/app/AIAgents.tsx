import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, Search, Sparkles, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/ai-agents/AgentCard";
import { AgentFilters, AgentCategory } from "@/components/ai-agents/AgentFilters";
import { supabase } from "@/integrations/supabase/client";
import { AI_AGENTS, getAgentById } from "@/lib/constants/agents";
import { cn } from "@/lib/utils";

/**
 * Phase 11H — Agent Marketplace (discovery only).
 * No inline chat. CTAs lead to /app/agents/:key/profile or /app/messages/:key.
 */
interface DBAgentStats {
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
  is_featured: boolean | null;
  total_users?: number | null;
  total_messages?: number | null;
  avg_rating?: number | null;
}

export default function AIAgents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory>("all");

  const { data: dbAgents = [], isLoading } = useQuery({
    queryKey: ["ai-agents-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents_with_stats")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("total_users", { ascending: false });
      if (error) throw error;
      return (data || []) as DBAgentStats[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const agents = useMemo(() => {
    const base = dbAgents.length ? dbAgents : (AI_AGENTS as any[]);
    return base.map((a: any) => {
      const isDb = "agent_key" in a;
      const key = isDb ? a.agent_key : a.id;
      const meta = getAgentById(key);
      return {
        id: isDb ? a.id : a.id,
        agent_key: key,
        name: a.name,
        description: a.description,
        icon: meta?.icon,
        bgColor: isDb ? a.bg_color || "#2A7DDE" : a.bgColor || "#2A7DDE",
        color: isDb ? a.color || "#2A7DDE" : a.iconColor || "#2A7DDE",
        expertise: isDb ? a.expertise_areas || [] : a.expertise || [],
        creditCost: isDb ? a.credit_cost ?? 1 : 1,
        category: (isDb ? a.category || "career" : "career") as AgentCategory,
        avatarUrl: isDb ? a.avatar_url : null,
        isCompanyAgent: isDb ? a.agent_type === "company" : false,
        isFeatured: isDb ? !!a.is_featured : false,
        users: Number(a.total_users) || 0,
        rating: Number(a.avg_rating) || 0,
      };
    });
  }, [dbAgents]);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchSearch =
        !searchQuery ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.expertise.some((e: string) => e.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat =
        selectedCategory === "all" ||
        (selectedCategory === "company" ? a.isCompanyAgent : a.category === selectedCategory);
      return matchSearch && matchCat;
    });
  }, [agents, searchQuery, selectedCategory]);

  const featured = useMemo(() => agents.filter((a) => a.isFeatured).slice(0, 8), [agents]);

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40 px-3 py-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Agent Marketplace</h1>
              <p className="text-[10px] text-muted-foreground">Discover AI experts to chat with</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => navigate("/app/messages")}
          >
            <MessageCircle className="h-3.5 w-3.5" /> Inbox
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 bg-muted/40 border-none"
          />
        </div>
      </header>

      <div className="px-3 py-3 space-y-4">
        <AgentFilters
          searchQuery=""
          onSearchChange={() => {}}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          showCompanyTab={agents.some((a) => a.isCompanyAgent)}
        />

        {/* Featured strip */}
        {!searchQuery && selectedCategory === "all" && featured.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Featured</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 pb-1">
              {featured.map((a) => (
                <div key={a.agent_key} className="w-[160px] shrink-0">
                  <AgentCard
                    {...a}
                    onViewProfile={() => navigate(`/app/agents/${a.agent_key}/profile`)}
                    onMessage={() => navigate(`/app/messages/${a.agent_key}`)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Grid */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {searchQuery ? "Results" : "All Agents"}
            </h2>
            <span className="text-[11px] text-muted-foreground">{filtered.length} agents</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {isLoading
              ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
              : filtered.map((a) => (
                  <AgentCard
                    key={a.agent_key}
                    {...a}
                    onViewProfile={() => navigate(`/app/agents/${a.agent_key}/profile`)}
                    onMessage={() => navigate(`/app/messages/${a.agent_key}`)}
                  />
                ))}
          </div>
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">No agents match your search.</div>
          )}
        </section>
      </div>
    </div>
  );
}
