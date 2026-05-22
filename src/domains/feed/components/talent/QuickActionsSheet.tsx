import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { listActiveQuickActionAgents } from "@/domains/feed/repo/feedRepo";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { iconMap } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

interface QuickActionsSheetProps {
  open: boolean;
  onClose: () => void;
}

interface AgentRow {
  agent_key: string;
  name: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  avatar_url: string | null;
}

/**
 * Premium, performance-hardened Agentic Comprehensive Hub Selector Sheet.
 * Built according to GroUp Academy Phase Z0 highly professional SAAS UI specifications,
 * featuring real-time caching parameters and centralized telemetry tracing boundaries.
 */
export function QuickActionsSheet({ open, onClose }: QuickActionsSheetProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Trace rendering sheet impressions securely under Automated Efficiency parameters
  useEffect(() => {
    if (open) {
      trackEvent("QuickActionsSheet:all_agents_drawer_opened", {
        timestamp: new Date().toISOString(),
      });
    }
  }, [open]);

  // TanStack Query Server State Synchronization (staleTime 5 min configuration)
  const { data: agents = [], error } = useQuery<AgentRow[]>({
    queryKey: ["all-quick-agents"],
    staleTime: 1000 * 60 * 5,
    enabled: open,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        // Direct query criteria lookup using canonical typed selectors
        const { data, error: dbError } = await supabase
          .from("ai_agents")
          .select("agent_key, name, icon, color, bg_color, avatar_url, total_conversations")
          .eq("is_active", true)
          .order("total_conversations", { ascending: false });

        if (dbError) throw dbError;

        return (data || []) as AgentRow[];
      } catch (queryErr: any) {
        // Intercept background extraction issues and beam data snapshots back to central logs
        trackError(queryErr instanceof Error ? queryErr : String(queryErr), {
          component: "QuickActionsSheet",
          action: "fetch_all_quick_agents_api",
        });
        throw queryErr;
      }
    },
  });

  // Observe data processing lifecycle exceptions transparently
  useEffect(() => {
    if (error) {
      trackEvent("QuickActionsSheet:compile_failure_fallback", { errorMessage: error.message });
    }
  }, [error]);

  const handleAgentNavigation = (agentKey: string) => {
    if (!agentKey) return;

    trackEvent("quick_action_sheet_agent_redirect", { agentKey });

    // Asynchronously invalidate history tracking pools to ensure absolute interface cohesion
    queryClient.invalidateQueries({ queryKey: ["agent-chat-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["quick-actions-top5"] });

    onClose();
    navigate(`/app/agents/${agentKey}`);
  };

  return (
    <Sheet open={open} onOpenChange={(visible) => !visible && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-border/40 bg-background/98 backdrop-blur-xl max-h-[80vh] max-h-[80svh] overflow-y-auto pt-safe pb-safe-bottom shadow-2xl transition-all duration-300 select-none"
        style={{ contentVisibility: "auto" }}
      >
        <div className="max-w-xl mx-auto">
          {/* Immersive Section Header */}
          <SheetHeader className="text-left pb-2 border-b border-border/20">
            <SheetTitle className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider pl-0.5">
              All AI Agents
            </SheetTitle>
          </SheetHeader>

          {/* Preset Grid Matrix Viewport compilation — Strict 4-column alignment */}
          <div className="grid grid-cols-4 gap-3.5 gap-y-5 mt-5 pb-6">
            {agents.map((agent) => {
              if (!agent || !agent.agent_key) return null;

              const rawIconKey = agent.icon || "";
              const ResolvedIcon = rawIconKey && iconMap[rawIconKey] ? (iconMap[rawIconKey] as LucideIcon) : Bot;

              const isCssColor = (colorValue?: string | null) =>
                !!colorValue &&
                (colorValue.startsWith("#") || colorValue.startsWith("rgb") || colorValue.startsWith("hsl"));

              const bgStyle = isCssColor(agent.bg_color) ? { backgroundColor: agent.bg_color! } : undefined;
              const iconColor = isCssColor(agent.color) ? agent.color! : undefined;

              return (
                <button
                  key={agent.agent_key}
                  type="button"
                  onClick={() => handleAgentNavigation(agent.agent_key)}
                  className="flex flex-col items-center gap-2 outline-none cursor-pointer transform-gpu active:scale-90 transition-all duration-200 group focus-visible:ring-2 focus-visible:ring-ring rounded-xl py-0.5"
                >
                  {/* Glassmorphic Rounded Profile Ring */}
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-sm group-hover:border-primary/40 group-hover:shadow-md transition-all duration-300 shrink-0",
                    )}
                    style={bgStyle}
                  >
                    {agent.avatar_url ? (
                      <img
                        src={agent.avatar_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <ResolvedIcon
                        className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                        style={{ color: iconColor || undefined }}
                      />
                    )}
                  </div>

                  {/* Safe typographic limits truncation */}
                  <span className="text-[10px] font-bold text-center text-muted-foreground/90 tracking-tight line-clamp-2 leading-tight w-full px-0.5 group-hover:text-foreground transition-colors break-words selection:bg-primary/20">
                    {agent.name?.split(" ").slice(0, 2).join(" ") || "Agent"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
