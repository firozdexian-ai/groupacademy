import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, Globe, LucideIcon, Zap, ShieldCheck, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Skeleton } from "@/components/ui/skeleton";
import { iconMap } from "@/lib/iconMap";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * GroUp Academy: Predictive Ingress Terminal (QuickActionsGrid)
 * CTO Reference: High-velocity launcher for frequent agents and global shortcuts.
 */

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
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="bg-card/30 backdrop-blur-md rounded-[32px] p-6 border-2 border-border/40 shadow-xl">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-2xl opacity-40" />
              <Skeleton className="h-3 w-12 opacity-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="p-8 border-2 border-dashed rounded-[32px] bg-muted/5 text-center flex flex-col items-center gap-2">
        <Activity className="h-5 w-5 text-muted-foreground/40 animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 italic">
          Ingress_Node_Offline
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card/30 backdrop-blur-md rounded-[32px] p-6 border-2 border-border/40 shadow-xl animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
            Quick_Launch_Node
          </h3>
        </div>
        <Badge
          variant="outline"
          className="h-5 px-2 rounded-md font-black text-[8px] uppercase italic opacity-40 border-primary/20"
        >
          Authorized
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-x-3 gap-y-6">
        {actions.map((item) => {
          if (!item) return null;
          const isAbroad = item.agent_key === "__abroad";
          const ResolvedIcon = isAbroad
            ? Globe
            : item.icon && iconMap[item.icon]
              ? (iconMap[item.icon] as LucideIcon)
              : Bot;

          return (
            <button
              key={item.agent_key}
              onClick={() => navigate(isAbroad ? "/app/abroad" : `/app/agents/${item.agent_key}`)}
              className="group flex flex-col items-center gap-2.5 outline-none transition-all"
            >
              <div
                className={cn(
                  "h-14 w-14 rounded-[20px] flex items-center justify-center transition-all duration-500 border-2",
                  "group-hover:scale-110 group-active:scale-95 group-hover:rotate-3",
                  isAbroad
                    ? "bg-primary border-primary text-white shadow-[0_10px_20px_rgba(var(--primary),0.3)]"
                    : "bg-muted/40 border-border/10 group-hover:border-primary/40 group-hover:bg-primary/5",
                )}
                style={!isAbroad ? { backgroundColor: item.bg_color || undefined } : {}}
              >
                {item.avatar_url ? (
                  <img
                    src={item.avatar_url}
                    alt=""
                    className="h-full w-full rounded-[18px] object-cover p-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ResolvedIcon
                    className={cn("h-6 w-6", isAbroad ? "animate-pulse" : "transition-transform group-hover:scale-110")}
                    style={{ color: !isAbroad && item.color ? item.color : "inherit" }}
                  />
                )}
              </div>
              <span className="text-[10px] font-black text-center text-muted-foreground/60 group-hover:text-primary transition-colors leading-tight line-clamp-1 px-1 uppercase italic tracking-tighter">
                {(item.name || "Agent").split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
