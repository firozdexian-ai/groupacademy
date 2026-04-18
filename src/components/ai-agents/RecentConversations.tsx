import { useState } from "react";
import { MessageCircle, Clock, ChevronRight, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, isValid } from "date-fns";
import { AgentSession } from "@/hooks/useAgentChat";
import { cn } from "@/lib/utils";

interface RecentConversationsProps {
  sessions: AgentSession[];
  onSelectSession: (sessionId: string) => void;
  getAgentName: (agentKey: string) => string;
  getAgentIcon: (agentKey: string) => React.ReactNode;
}

export function RecentConversations({
  sessions = [],
  onSelectSession,
  getAgentName,
  getAgentIcon,
}: RecentConversationsProps) {
  if (sessions.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="p-10 text-center flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center mb-4 shadow-sm">
            <MessageCircle className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="font-bold text-sm tracking-tight">No conversations found</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-[180px] leading-relaxed">
            Your recent strategic sessions with AI agents will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1 mb-2">
        <History className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Recent Sessions</h3>
      </div>

      {sessions.slice(0, 5).map((session) => {
        // CTO FIX: Defensive check for empty message arrays
        const messages = session.messages || [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

        // CTO FIX: Robust Date Validation
        const sessionExpiry = session.session_expires_at ? new Date(session.session_expires_at) : null;
        const createdAt = session.created_at ? new Date(session.created_at) : new Date();

        const isActive = session.is_active && sessionExpiry && sessionExpiry > new Date();

        return (
          <Card
            key={session.id}
            className="group cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/40 bg-card/50 backdrop-blur-sm rounded-2xl border-border/50"
            onClick={() => onSelectSession(session.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 transition-transform group-hover:scale-110">
                  {getAgentIcon(session.agent_key)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">
                      {getAgentName(session.agent_key)}
                    </span>
                    {isActive && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black uppercase tracking-widest px-2 h-4">
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="h-4 flex items-center">
                    {lastMessage ? (
                      <p className="text-xs text-muted-foreground truncate font-medium">
                        <span className="text-primary/60 font-bold">
                          {lastMessage.role === "user" ? "You: " : "AI: "}
                        </span>
                        {lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-[10px] italic text-muted-foreground/50">
                        Waiting for session to initialize...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {isValid(createdAt) ? formatDistanceToNow(createdAt, { addSuffix: true }) : "Just now"}
                      </span>
                    </div>
                    <span className="opacity-30">•</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded-sm">{messages.length} MSG</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center pl-2">
                  <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
