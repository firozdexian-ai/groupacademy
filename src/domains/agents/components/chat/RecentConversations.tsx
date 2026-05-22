import { useMemo } from "react";
import { MessageCircle, ChevronRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, isValid } from "date-fns";
import { AgentSession } from "@/domains/agents/hooks/useAgentChat";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "@/domains/agents/components/chat/AgentAvatar";

/**
 * GroUp Academy: Neural Session Ledger (V5.6.0)
 * CTO Reference: High-performance session tracker aggregating active chat workflows.
 * Architecture: Memoized parsing loops coupled with regex global formatting layout protections.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

interface RecentConversationsProps {
  sessions: AgentSession[];
  onSelectSession: (sessionId: string) => void;
  getAgentName: (agentKey: string) => string;
  getAgentIcon?: (agentKey: string) => React.ReactNode;
  getAgentAvatar?: (agentKey: string) => string | null;
  isCompanyAgent?: (agentKey: string) => boolean;
  isCreatorAgent?: (agentKey: string) => boolean;
}

export function RecentConversations({
  sessions = [],
  onSelectSession,
  getAgentName,
  getAgentAvatar,
  isCompanyAgent,
  isCreatorAgent,
}: RecentConversationsProps) {
  // Guard the component view completely against empty session arrays
  if (sessions.length === 0) {
    return (
      <Card className="border-2 border-dashed border-border/40 bg-muted/5 rounded-[32px] overflow-hidden select-none animate-in fade-in duration-300">
        <CardContent className="p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-2 border border-border/10">
            <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
              Registry_Empty
            </p>
            <p className="text-xs font-medium text-muted-foreground/40 italic">
              Initialize a neural dialogue to commence sync
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- PHASE: SESSION_ARRAY_NORMALIZATION_MATRIX ---
  // Memoize data normalization transforms entirely to protect parent rendering streams
  const normalizedSessions = useMemo(() => {
    const currentUnixTimestamp = Date.now();

    return sessions.slice(0, 5).map((session) => {
      const messagesArray = session.messages || [];
      const lastMessage = messagesArray[messagesArray.length - 1] || null;

      const rawAgentName = String(getAgentName(session.agent_key) || "AGENT_ENTITY_NODE");

      // Architecture Fix: Enforce unified string sanitization across all blank spaces globally
      const standardizedAgentTitle = rawAgentName.trim().replace(/\s+/g, "_");

      // Compute precise validation flags safely without runtime allocations inside loop elements
      const expirationTimestamp = session.session_expires_at ? new Date(session.session_expires_at).getTime() : 0;
      const isActive = Boolean(session.is_active && expirationTimestamp > currentUnixTimestamp);

      // Defensively parse historical logs strings to ensure structural consistency
      const timeAgoLabel = (() => {
        const creationDate = new Date(session.created_at);
        if (!isValid(creationDate)) return "RECENT";
        try {
          return `${formatDistanceToNow(creationDate, { addSuffix: false })}_AGO`;
        } catch {
          return "ACTIVE_NODE";
        }
      })();

      return {
        ...session,
        lastMessage,
        isActive,
        standardizedAgentTitle,
        timeAgoLabel,
        agentName: rawAgentName,
      };
    });
  }, [sessions, getAgentName]);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700 select-none text-left">
      {normalizedSessions.map((session) => {
        return (
          <Card
            key={session.id}
            
            className={cn(
              "group cursor-pointer transition-all duration-500 rounded-[24px] border-2 overflow-hidden outline-none focus:border-primary/40 focus:bg-card/40",
              "bg-card/30 backdrop-blur-xl border-border/40 hover:border-primary/40 hover:shadow-2xl hover:-translate-y-0.5",
              session.isActive && "border-emerald-500/20 bg-emerald-500/[0.02]",
            )}
            onClick={() => onSelectSession(session.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                {/* COMPONENT: EQUALIZED_IDENTITY_INGRESS_HOOK */}
                <div className="relative shrink-0">
                  <AgentAvatar
                    name={session.agentName}
                    avatarUrl={getAgentAvatar?.(session.agent_key)}
                    isOnline={session.isActive}
                    isCompanyAgent={isCompanyAgent?.(session.agent_key)}
                    isCreatorAgent={isCreatorAgent?.(session.agent_key)}
                    size="lg"
                    className="transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* MATRIX_CELL: LABELS_SUMMARY */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-black text-sm uppercase italic tracking-tighter group-hover:text-primary transition-colors truncate">
                        {session.standardizedAgentTitle}
                      </span>
                      {session.isActive && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black uppercase tracking-widest px-2 h-4 shrink-0 animate-pulse"
                        >
                          SYNC_LIVE
                        </Badge>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground/40 tabular-nums uppercase whitespace-nowrap italic shrink-0 font-mono">
                      {session.timeAgoLabel}
                    </span>
                  </div>

                  {/* HUD: CHAT_PREVIEW_SECTOR */}
                  <div className="flex items-center gap-2 min-h-[14px]">
                    {session.lastMessage ? (
                      <p className="text-[11px] font-medium text-muted-foreground/70 truncate italic leading-none flex-1 break-all pr-1">
                        {session.lastMessage.role === "user" ? (
                          <span className="text-primary/60 font-black not-italic mr-1 text-[9px]">YOU:</span>
                        ) : null}
                        {session.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/30 truncate italic leading-none">
                        Dialogue channel established.
                      </p>
                    )}
                  </div>

                  {/* CELL_METRICS: ACCUMULATED_INTERACTION_VELOCITIES */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] italic font-mono">
                      <ShieldCheck className="h-2.5 w-2.5 text-muted-foreground/40" />
                      <span>{session.messages?.length || 0}_INTERACTIONS</span>
                    </div>
                  </div>
                </div>

                {/* INTERACTION_ARROW_DECK */}
                <div className="flex items-center h-full pl-2 shrink-0">
                  <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500 ease-out" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
