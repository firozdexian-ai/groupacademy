import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import type { AdminThreadSummary } from "../hooks/useAgentRuntimeThread";
import { useAdminAgents } from "../hooks/useAdminAgents";

/**
 * Group Academy — Agent Rail Navigation Component
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Purpose: Administrative sidebar providing persistent, real-time access to Agent OS threads.
 */

interface AgentRailProps {
  activeKey: string | null;
  threads: AdminThreadSummary[];
  onSelect: (key: string) => void;
}

export function AgentRail({ activeKey, threads, onSelect }: AgentRailProps) {
  const { data: agents = [], isLoading } = useAdminAgents();

  // Create lookup map for efficient thread association
  const threadByKey = new Map(threads.map((t) => [t.agent_key, t]));

  return (
    <div className="flex flex-col h-full border-r border-border/40 bg-card">
      <div className="px-4 py-4 border-b border-border/40 bg-muted/10">
        <h2 className="text-sm font-bold text-foreground tracking-tight">System Agents</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isLoading ? "Synchronizing registry..." : `${agents.length} operational agents active`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {agents.map((agent) => {
          const t = threadByKey.get(agent.key);
          const isActive = activeKey === agent.key;

          // Determine notification state based on last message vs read timestamp
          const unread =
            !!t && !isActive && new Date(t.last_message_at).getTime() > new Date(t.last_read_at).getTime() + 1000;

          const Icon = agent.icon;

          return (
            <button
              key={agent.key}
              onClick={() => onSelect(agent.key)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 border-b border-border/20 text-left transition-all",
                "hover:bg-muted/40",
                isActive ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent",
              )}
            >
              <div className="relative flex-shrink-0">
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shadow-sm", agent.accent)}>
                  <Icon className="h-5 w-5" />
                </div>
                {unread && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm truncate",
                      unread ? "font-bold text-foreground" : "font-semibold text-foreground",
                    )}
                  >
                    {agent.name}
                  </span>
                  {t && (
                    <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">
                      {formatDistanceToNowStrict(new Date(t.last_message_at), {
                        addSuffix: false,
                      })}
                    </span>
                  )}
                </div>
                <p className={cn("text-xs truncate mt-0.5", unread ? "text-foreground/90" : "text-muted-foreground")}>
                  {t?.title || agent.tagline}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
