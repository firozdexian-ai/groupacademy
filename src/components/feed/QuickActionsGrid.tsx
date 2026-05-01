import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, MessageCircle, LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useMessageThreads } from "@/hooks/useMessageThreads";
import { Skeleton } from "@/components/ui/skeleton";
import { iconMap } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

/**
 * Quick Actions — compact 4-column launcher.
 * 7 dynamic agents (most-used first) + Messages shortcut.
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

const MESSAGES_SHORTCUT: QuickAgent = {
  agent_key: "__messages",
  name: "Messages",
  icon: "MessageCircle",
  color: null,
  bg_color: null,
  avatar_url: null,
  isShortcut: true,
};

export function QuickActionsGrid() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { totalUnread } = useMessageThreads();

  const { data: actions = [], isLoading } = useQuery({
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

      const { data: allAgents } = await supabase
        .from("ai_agents")
        .select("agent_key, name, icon, color, bg_color, avatar_url, total_conversations")
        .eq("is_active", true)
        .order("total_conversations", { ascending: false })
        .limit(15);

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
      result.push(MESSAGES_SHORTCUT);
      return result;
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-3 border border-border/40">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-2 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-3 border border-border/40 overflow-hidden">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-semibold text-foreground">Quick actions</h3>
      </div>

      <div className="grid grid-cols-4 gap-3 gap-y-4">
        {actions.map((item) => {
          if (!item) return null;
          const isMessages = item.agent_key === "__messages";
          const ResolvedIcon = isMessages
            ? MessageCircle
            : item.icon && iconMap[item.icon]
              ? (iconMap[item.icon] as LucideIcon)
              : Bot;

          return (
            <button
              key={item.agent_key}
              aria-label={item.name}
              onClick={() => navigate(isMessages ? "/app/messages" : `/app/agents/${item.agent_key}`)}
              className="group relative flex flex-col items-center gap-1.5 outline-none transition-all"
            >
              <div
                className={cn(
                  "relative h-12 w-12 rounded-xl flex items-center justify-center transition-all border",
                  "group-active:scale-95",
                  isMessages
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-muted/40 border-border/40 group-hover:border-primary/40",
                )}
                style={!isMessages && item.bg_color ? { backgroundColor: item.bg_color } : {}}
              >
                {item.avatar_url ? (
                  <img
                    src={item.avatar_url}
                    alt=""
                    className="h-full w-full rounded-xl object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ResolvedIcon
                    className="h-5 w-5"
                    style={{ color: !isMessages && item.color ? item.color : undefined }}
                  />
                )}
                {isMessages && totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-center text-muted-foreground group-hover:text-primary transition-colors line-clamp-1 px-0.5">
                {(item.name || "Agent").split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
