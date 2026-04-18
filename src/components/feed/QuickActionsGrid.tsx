import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, Globe, LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Skeleton } from "@/components/ui/skeleton";
import { iconMap } from "@/lib/iconMap";

interface QuickAgent {
  agent_key: string;
  name: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  avatar_url: string | null;
}

// Fixed shortcut to the Career Abroad hub — always shown so the vertical is reachable from the feed.
const ABROAD_SHORTCUT = {
  key: "__abroad",
  name: "Abroad",
  path: "/app/abroad",
};

export function QuickActionsGrid() {
  const navigate = useNavigate();
  const { talent } = useTalent();

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["quick-agents", talent?.id],
    queryFn: async () => {
      // Try to get user's most-used agents first
      let personalAgentKeys: string[] = [];
      if (talent?.id) {
        const { data: sessions } = await supabase
          .from("agent_chat_sessions")
          .select("agent_key")
          .eq("talent_id", talent.id)
          .order("updated_at", { ascending: false })
          .limit(100);

        if (sessions && sessions.length > 0) {
          // Count by agent_key, deduplicate
          const countMap = new Map<string, number>();
          for (const s of sessions) {
            countMap.set(s.agent_key, (countMap.get(s.agent_key) || 0) + 1);
          }
          personalAgentKeys = Array.from(countMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([key]) => key);
        }
      }

      // Get all active agents sorted by popularity
      const { data: allAgents, error } = await supabase
        .from("ai_agents")
        .select("agent_key, name, icon, color, bg_color, avatar_url, total_conversations")
        .eq("is_active", true)
        .order("total_conversations", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!allAgents) return [];

      const agentMap = new Map(allAgents.map((a) => [a.agent_key, a]));

      // Build final list: personal first, then popular
      const result: QuickAgent[] = [];
      const used = new Set<string>();

      for (const key of personalAgentKeys) {
        const agent = agentMap.get(key);
        if (agent && result.length < 8) {
          result.push(agent);
          used.add(key);
        }
      }

      // Fill remaining with popular agents
      for (const agent of allAgents) {
        if (!used.has(agent.agent_key) && result.length < 8) {
          result.push(agent);
          used.add(agent.agent_key);
        }
      }

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-3 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (agents.length === 0) return null;

  return (
    <div className="bg-card rounded-xl p-3 shadow-sm">
      <div className="grid grid-cols-4 gap-2">
        {agents.map((agent) => {
          const IconComponent = agent.icon ? (iconMap[agent.icon] as LucideIcon) : Bot;
          return (
            <button
              key={agent.agent_key}
              onClick={() => navigate(`/app/agents/${agent.agent_key}`)}
              className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: agent.bg_color || "hsl(var(--primary) / 0.1)" }}
              >
                {agent.avatar_url ? (
                  <img src={agent.avatar_url} alt={agent.name} className="h-10 w-10 rounded-full object-cover" />
                ) : IconComponent ? (
                  <IconComponent className="h-4 w-4" style={{ color: agent.color || "hsl(var(--primary))" }} />
                ) : (
                  <Bot className="h-4 w-4 text-primary" />
                )}
              </div>
              <span className="text-[10px] text-center text-muted-foreground leading-tight line-clamp-1">
                {agent.name.split(" ").slice(0, 2).join(" ")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
