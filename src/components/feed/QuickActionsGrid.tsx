import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Skeleton } from "@/components/ui/skeleton";
import { iconMap } from "@/lib/iconMap";
import { QuickActionsSheet } from "./QuickActionsSheet";

interface QuickAgent {
  agent_key: string;
  name: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  avatar_url: string | null;
}

const VISIBLE_LIMIT = 5;

export function QuickActionsGrid() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["quick-actions-top5", talent?.id],
    queryFn: async () => {
      let personalKeys: string[] = [];
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
          personalKeys = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([k]) => k);
        }
      }

      const { data: allAgents } = await supabase
        .from("ai_agents")
        .select("agent_key, name, icon, color, bg_color, avatar_url, total_conversations")
        .eq("is_active", true)
        .order("total_conversations", { ascending: false })
        .limit(15);

      const agentMap = new Map(allAgents?.map((a) => [a.agent_key, a as QuickAgent]));
      const result: QuickAgent[] = [];
      const seen = new Set<string>();
      const add = (keys: string[]) => {
        for (const k of keys) {
          const ag = agentMap.get(k);
          if (ag && !seen.has(k) && result.length < VISIBLE_LIMIT) {
            result.push(ag);
            seen.add(k);
          }
        }
      };
      add(personalKeys);
      add(allAgents?.map((a) => a.agent_key) || []);
      return result;
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-2 px-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-2 w-9" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="px-1">
        <div className="grid grid-cols-5 gap-2">
          {actions.map((item) => {
            const ResolvedIcon = item.icon && iconMap[item.icon] ? (iconMap[item.icon] as LucideIcon) : Bot;
            return (
              <button
                key={item.agent_key}
                aria-label={item.name}
                onClick={() => navigate(`/app/agents/${item.agent_key}`)}
                className="flex flex-col items-center gap-1.5 min-w-0 active:scale-95 transition-transform outline-none"
              >
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center border border-border/40 bg-muted/40 overflow-hidden"
                  style={item.bg_color ? { backgroundColor: item.bg_color } : {}}
                >
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ResolvedIcon className="h-5 w-5" style={{ color: item.color || undefined }} />
                  )}
                </div>
                <span className="text-[10px] font-medium text-center text-muted-foreground truncate leading-tight w-full px-0.5">
                  {item.name?.split(" ")[0] || "Agent"}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end mt-1.5">
          <button
            onClick={() => setSheetOpen(true)}
            className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
          >
            View all agents →
          </button>
        </div>
      </div>

      <QuickActionsSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
