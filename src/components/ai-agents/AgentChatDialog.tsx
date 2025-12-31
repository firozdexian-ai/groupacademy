import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Clock, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AgentMessage } from '@/hooks/useAgentChat';
import { cn } from '@/lib/utils';

interface AgentInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface AgentChatDialogProps {
  agent: AgentInfo;
  messages: AgentMessage[];
  isStreaming: boolean;
  timeRemaining: number | null;
  isSessionExpired: boolean;
  onSendMessage: (content: string) => void;
  onBack: () => void;
  onEndSession: () => void;
}

export function AgentChatDialog({
  agent,
  messages,
  isStreaming,
  timeRemaining,
  isSessionExpired,
  onSendMessage,
  onBack,
  onEndSession
}: AgentChatDialogProps) {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming && !isSessionExpired) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[700px] bg-background rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className={cn("text-white", agent.color)}>
              {agent.icon}
            </AvatarFallback>
          </Avatar>
          
          <div className="min-w-0">
            <h2 className="font-semibold truncate">{agent.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isSessionExpired ? (
                <span className="text-destructive">Session Expired</span>
              ) : timeRemaining !== null ? (
                <>
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(timeRemaining)} remaining</span>
                </>
              ) : (
                <span>Online</span>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEndSession} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              End Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>Start the conversation!</p>
              <p className="text-sm mt-1">Ask {agent.name} anything about their expertise.</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className={cn("text-white text-xs", agent.color)}>
                    {agent.icon}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 max-w-[80%] text-sm",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
              
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    You
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                <AvatarFallback className={cn("text-white text-xs", agent.color)}>
                  {agent.icon}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>•</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
        {isSessionExpired ? (
          <div className="text-center">
            <Badge variant="destructive" className="mb-2">Session Expired</Badge>
            <p className="text-sm text-muted-foreground">
              Please go back and start a new session to continue.
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isStreaming}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isStreaming}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
