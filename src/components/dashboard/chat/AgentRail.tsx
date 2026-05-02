import { ADMIN_AGENTS } from "@/lib/adminAgents";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import type { ThreadSummary } from "@/hooks/useAdminChatThread";

interface AgentRailProps {
  activeKey: string | null;
  threads: ThreadSummary[];
  onSelect: (key: string) => void;
}

export function AgentRail({ activeKey, threads, onSelect }: AgentRailProps) {
  const threadByKey = new Map(threads.map((t) => [t.agent_key, t]));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/40">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Agents
        </h2>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          {ADMIN_AGENTS.length} conversational agents
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {ADMIN_AGENTS.map((agent) => {
          const t = threadByKey.get(agent.key);
          const isActive = activeKey === agent.key;
          const Icon = agent.icon;
          return (
            <button
              key={agent.key}
              onClick={() => onSelect(agent.key)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 border-b border-border/20 text-left transition-colors hover:bg-muted/40",
                isActive && "bg-muted/60",
              )}
            >
              <div
                className={cn(
                  "h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0",
                  agent.accent,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">{agent.name}</span>
                  {t && (
                    <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
                      {formatDistanceToNowStrict(new Date(t.last_message_at), {
                        addSuffix: false,
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
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
