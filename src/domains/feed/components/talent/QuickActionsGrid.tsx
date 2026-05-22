import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, LayoutGrid, LucideIcon } from "lucide-react";
import {
  listTalentAgentChatSessionKeys,
  listTopActiveAgentsForQuickActions,
} from "@/domains/agents/repo/agentsRepo";
import { useTalent } from "@/hooks/useTalent";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { iconMap } from "@/lib/iconMap";
import { QuickActionsSheet } from "./QuickActionsSheet";
import { cn } from "@/lib/utils";

interface QuickAgent {
  agent_key: string;
  name: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  avatar_url: string | null;
}

const VISIBLE_LIMIT = 4;

/**
 * Quick Actions Grid — personalized shortcuts to the user's most-used AI agents.
 * Shows the top active agents plus a "More" tile that opens the full agent sheet.
 */
export function QuickActionsGrid() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { talent } = useTalent();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Track render impressions for personalization analytics
  useEffect(() => {
    if (talent?.id) {
      trackEvent("QuickActionsGrid:mounted", { talentId: talent.id });
    }
  }, [talent]);

  // TanStack Query Server State Synchronization (staleTime 10 min, retry false preserved)
  const {
    data: actions = [],
    isLoading,
    error,
  } = useQuery<QuickAgent[]>({
    queryKey: ["quick-actions-top5", talent?.id],
    staleTime: 1000 * 60 * 10,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      let personalKeys: string[] = [];

      try {
        if (talent?.id) {
          // Fetch historical user chat parameters to identify top personal affinity vectors
          const sessions = await listTalentAgentChatSessionKeys(talent.id, 50);

          if (sessions && sessions.length > 0) {
            const counts = sessions.reduce(
              (acc, s) => {
                if (s?.agent_key) {
                  acc[s.agent_key] = (acc[s.agent_key] || 0) + 1;
                }
                return acc;
              },
              {} as Record<string, number>,
            );

            personalKeys = Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .map(([key]) => key);
          }
        }

        // Aggregate core active ecosystem bots safely based on global traction metrics
        const allAgents = await listTopActiveAgentsForQuickActions(15);

        if (!allAgents || allAgents.length === 0) return [];

        const agentMap = new Map(allAgents.map((a) => [a.agent_key, a as QuickAgent]));
        const result: QuickAgent[] = [];
        const seen = new Set<string>();

        const appendAgentBatch = (keys: string[]) => {
          for (const k of keys) {
            if (!k) continue;
            const ag = agentMap.get(k);
            if (ag && !seen.has(k) && result.length < VISIBLE_LIMIT) {
              result.push(ag);
              seen.add(k);
            }
          }
        };

        appendAgentBatch(personalKeys);
        appendAgentBatch(allAgents.map((a) => a.agent_key) || []);

        return result;
      } catch (queryErr: any) {
        // Route background extraction exceptions securely back into central trackers
        trackError(queryErr instanceof Error ? queryErr : String(queryErr), {
          component: "QuickActionsGrid",
          action: "fetch_quick_actions_query_fn",
          talentId: talent?.id,
        });
        throw queryErr;
      }
    },
  });

  // Intercept data processing loop failures across query lifecycles
  useEffect(() => {
    if (error) {
      trackEvent("QuickActionsGrid:load_failure_fallback_rendered", { errorMessage: error.message });
    }
  }, [error]);

  const handleAgentClick = (agentKey: string) => {
    if (!agentKey) return;

    trackEvent("quick_action_agent_session_invoked", { agentKey, talentId: talent?.id });

    // Invalidate state keys asynchronously to force refresh patterns during session transitions
    queryClient.invalidateQueries({ queryKey: ["agent-chat-sessions", talent?.id] });

    navigate(`/app/agents/${agentKey}`);
  };

  const handleOpenSheetAction = () => {
    trackEvent("quick_actions_all_sheet_opened");
    setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-2 px-1 select-none w-full">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-2 w-full">
            <Skeleton className="h-11 w-11 rounded-xl shadow-sm border border-border/10 shrink-0" />
            <Skeleton className="h-2.5 w-8 rounded-sm opacity-40 shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="px-1 w-full touch-manipulation antialiased select-none">
        <div className="grid grid-cols-5 gap-2 w-full items-start">
          {actions.map((item) => {
            if (!item || !item.agent_key) return null;

            const iconKey = item.icon || "";
            const ResolvedIcon = (iconMap[iconKey] ||
              iconMap[iconKey.toLowerCase()] ||
              iconMap[iconKey.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()] ||
              Bot) as LucideIcon;

            const isCssColor = (colorValue?: string | null) =>
              !!colorValue &&
              (colorValue.startsWith("#") || colorValue.startsWith("rgb") || colorValue.startsWith("hsl"));

            const bgStyle = isCssColor(item.bg_color) ? { backgroundColor: item.bg_color! } : undefined;
            const iconColor = isCssColor(item.color) ? item.color! : undefined;

            return (
              <button
                key={item.agent_key}
                type="button"
                aria-label={`Launch ${item.name}`}
                onClick={() => handleAgentClick(item.agent_key)}
                className="flex flex-col items-center gap-1.5 min-w-0 w-full active:scale-90 transition-all duration-200 cursor-pointer outline-none group focus-visible:ring-2 focus-visible:ring-ring rounded-xl py-0.5"
              >
                {/* Immersive Glassmorphic Icon Wrapper Ring */}
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center border border-border/40 bg-card/60 backdrop-blur-md text-primary overflow-hidden shadow-sm group-hover:border-primary/40 group-hover:shadow-md transition-all duration-300 shrink-0"
                  style={bgStyle}
                >
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="eager"
                    />
                  ) : (
                    <ResolvedIcon
                      className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                      style={iconColor ? { color: iconColor } : undefined}
                    />
                  )}
                </div>

                {/* Safe layout typography configuration truncation */}
                <span className="text-[10px] font-bold text-center text-muted-foreground/90 tracking-tight truncate leading-none w-full px-0.5 group-hover:text-foreground transition-colors">
                  {item.name?.split(" ")[0] || "Agent"}
                </span>
              </button>
            );
          })}

          {/* 5th slot layout node — Open All Ecosystem Agents Sheet */}
          <button
            type="button"
            onClick={handleOpenSheetAction}
            aria-label="View all platform agents"
            className="flex flex-col items-center gap-1.5 min-w-0 w-full active:scale-90 transition-all duration-200 cursor-pointer outline-none group focus-visible:ring-2 focus-visible:ring-ring rounded-xl py-0.5"
          >
            <div className="h-11 w-11 rounded-xl flex items-center justify-center border border-dashed border-border/60 bg-muted/20 text-muted-foreground/80 group-hover:border-primary/40 group-hover:text-primary group-hover:bg-primary/5 shadow-sm transition-all duration-300 shrink-0">
              <LayoutGrid className="h-5 w-5 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold text-center text-muted-foreground/90 tracking-tight truncate leading-none w-full px-0.5 group-hover:text-foreground transition-colors">
              All
            </span>
          </button>
        </div>
      </div>

      <QuickActionsSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
