import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, Globe, LucideIcon, Zap, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Skeleton } from "@/components/ui/skeleton";
import { iconMap } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

interface QuickAgent {
  agent_key: string;
  name: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  avatar_url: string | null;
  isShortcut?: boolean;
}

const ABROAD_SHORTCUT: QuickAgent = {
  agent_key: "__abroad",
  name: "Abroad",
  icon: "Globe",
  color: null,
  bg_color: null,
  avatar_url: null,
  isShortcut: true,
};

export function QuickActionsGrid() {
  const navigate = useNavigate();
  const { talent } = useTalent();

  const {
    data: actions = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["quick-actions", talent?.id],
    queryFn: async () => {
      let personalAgentKeys: string[] = [];

      if (talent?.id) {
        const { data: sessions } = await supabase
          .from("agent_chat_sessions")
          .select("agent_key")
          .eq("talent_id", talent.id)
          .order("updated_at", { ascending: false })
          .limit(50);

        if (sessions) {
          const counts = sessions.reduce(
            (acc, s) => {
              acc[s.agent_key] = (acc[s.agent_key] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          personalAgentKeys = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([key]) => key);
        }
      }

      const { data: allAgents, error } = await supabase
        .from("ai_agents")
        .select("agent_key, name, icon, color, bg_color, avatar_url, total_conversations")
        .eq("is_active", true)
        .order("total_conversations", { ascending: false })
        .limit(15);

      if (error) throw error;

      const agentMap = new Map(allAgents?.map((a) => [a.agent_key, a]));
      const result: QuickAgent[] = [];
      const seen = new Set<string>();

      const addToResult = (keys: string[]) => {
        for (const key of keys) {
          const agent = agentMap.get(key);
          if (agent && !seen.has(key) && result.length < 7) {
            result.push(agent);
            seen.add(key);
          }
        }
      };

      addToResult(personalAgentKeys);
      addToResult(allAgents?.map((a) => a.agent_key) || []);

      result.push(ABROAD_SHORTCUT);
      return result;
    },
    staleTime: 1000 * 60 * 10,
    // CTO Fix: Prevent the query from crashing the whole page if Supabase is down
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/40 shadow-sm">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-2 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // CTO Fix: If there is an error, show a small warning instead of crashing
  if (queryError) {
    return (
      <div className="p-4 border border-dashed rounded-2xl text-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
        Quick actions temporarily unavailable
      </div>
    );
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/40 shadow-sm">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Zap className="h-3.5 w-3.5 text-primary fill-current" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Launch</h3>
      </div>

      <div className="grid grid-cols-4 gap-x-2 gap-y-5">
        {actions.map((item) => {
          if (!item) return null;

          const isAbroad = item.agent_key === "__abroad";

          // CTO Fix: Hardened Icon Resolution
          // Logic: If isAbroad, use Globe. Otherwise, check iconMap. If not in iconMap, fallback to Bot.
          const ResolvedIcon = isAbroad
            ? Globe
            : item.icon && iconMap[item.icon]
              ? (iconMap[item.icon] as LucideIcon)
              : Bot;

          return (
            <button
              key={item.agent_key}
              onClick={() => navigate(isAbroad ? "/app/abroad" : `/app/agents/${item.agent_key}`)}
              className="group flex flex-col items-center gap-2 outline-none"
            >
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  "group-hover:scale-110 group-active:scale-90 group-hover:shadow-lg",
                  isAbroad ? "bg-primary text-white shadow-primary/20" : "bg-muted/40",
                )}
                style={!isAbroad ? { backgroundColor: item.bg_color || undefined } : {}}
              >
                {item.avatar_url ? (
                  <img
                    src={item.avatar_url}
                    alt=""
                    className="h-full w-full rounded-2xl object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ResolvedIcon
                    className={cn("h-5 w-5", isAbroad ? "animate-pulse-slow" : "")}
                    style={{ color: !isAbroad && item.color ? item.color : "inherit" }}
                  />
                )}
              </div>
              <span className="text-[10px] font-bold text-center text-muted-foreground group-hover:text-foreground transition-colors leading-tight line-clamp-1 px-1">
                {(item.name || "Agent").split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
