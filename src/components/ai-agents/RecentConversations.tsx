import { MessageCircle, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { AgentSession } from '@/hooks/useAgentChat';

interface RecentConversationsProps {
  sessions: AgentSession[];
  onSelectSession: (sessionId: string) => void;
  getAgentName: (agentKey: string) => string;
  getAgentIcon: (agentKey: string) => React.ReactNode;
}

export function RecentConversations({ 
  sessions, 
  onSelectSession, 
  getAgentName,
  getAgentIcon
}: RecentConversationsProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No conversations yet</p>
          <p className="text-sm mt-1">Start chatting with an AI agent to get career help</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.slice(0, 5).map((session) => {
        const lastMessage = session.messages[session.messages.length - 1];
        const isActive = session.is_active && new Date(session.session_expires_at) > new Date();
        
        return (
          <Card 
            key={session.id}
            className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/30"
            onClick={() => onSelectSession(session.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getAgentIcon(session.agent_key)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {getAgentName(session.agent_key)}
                    </span>
                    {isActive && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  {lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage.role === 'user' ? 'You: ' : ''}
                      {lastMessage.content.slice(0, 60)}
                      {lastMessage.content.length > 60 ? '...' : ''}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}</span>
                    <span className="mx-1">•</span>
                    <span>{session.messages.length} messages</span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
