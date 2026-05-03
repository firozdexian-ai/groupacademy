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
          const unread =
            !!t &&
            !isActive &&
            new Date(t.last_message_at).getTime() >
              new Date(t.last_read_at).getTime() + 1000;
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
              <div className="relative flex-shrink-0">
                <div
                  className={cn(
                    "h-11 w-11 rounded-full flex items-center justify-center",
                    agent.accent,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {unread && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm truncate",
                      unread ? "font-bold" : "font-semibold",
                    )}
                  >
                    {agent.name}
                  </span>
                  {t && (
                    <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
                      {formatDistanceToNowStrict(new Date(t.last_message_at), {
                        addSuffix: false,
                      })}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs truncate",
                    unread ? "text-foreground" : "text-muted-foreground",
                  )}
                >
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
