import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Clock, MoreVertical, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AgentMessage } from "@/hooks/useAgentChat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown"; // Ensure this is installed: npm install react-markdown

interface AgentInfo {
  id?: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  avatarUrl?: string | null;
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

// Helper: Contextual suggestions based on agent ID
const getSuggestions = (agentId?: string) => {
  switch (agentId) {
    case "cv-coach":
      return [
        "Review my resume summary",
        "ATS optimization tips",
        "Action verbs for leadership",
        "Proofread this section",
      ];
    case "interview-coach":
      return ["Start mock interview", "Tell me about yourself", "STAR method example", "Questions to ask interviewers"];
    case "salary-negotiator":
      return ["Negotiation script", "Market rate for Senior Dev", "Counter-offer email", "Benefit negotiation"];
    case "ielts-tutor":
      return ["Speaking part 2 practice", "Writing task 1 tips", "Vocabulary for 'Environment'", "Grammar check"];
    default:
      return ["Help me get started", "Quick advice", "What can you do?", "Examples"];
  }
};

export function AgentChatDialog({
  agent,
  messages,
  isStreaming,
  timeRemaining,
  isSessionExpired,
  onSendMessage,
  onBack,
  onEndSession,
}: AgentChatDialogProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isStreaming]); // Added isStreaming to scroll during generation

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming && !isSessionExpired) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 0) return "0:00"; // Prevent negative time
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const suggestions = getSuggestions(agent.id);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-background md:max-h-[700px] md:rounded-lg md:border md:shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-muted/40 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background">
            {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.name} />}
            <AvatarFallback className={cn("text-white font-bold", agent.color)}>{agent.icon}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex flex-col justify-center">
            <h2 className="font-semibold text-sm truncate leading-none mb-1">{agent.name}</h2>
            <div className="flex items-center gap-2 text-xs">
              {isSessionExpired ? (
                <span className="text-destructive font-medium flex items-center gap-1">Session Expired</span>
              ) : timeRemaining !== null ? (
                <span
                  className={cn(
                    "flex items-center gap-1 font-medium tabular-nums",
                    timeRemaining < 300 ? "text-amber-600 animate-pulse" : "text-muted-foreground",
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {formatTime(timeRemaining)} remaining
                </span>
              ) : (
                <span className="text-muted-foreground">Connecting...</span>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEndSession} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              End Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-6 pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                <span className="text-4xl">👋</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Hello! I'm your {agent.name}</h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
                I'm here to help you achieve your career goals. Pick a topic below to get started.
              </p>

              <div className="flex overflow-x-auto gap-2 max-w-md pb-2 scrollbar-hide md:flex-wrap md:justify-center md:overflow-visible md:pb-0">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => onSendMessage(suggestion)}
                    disabled={isStreaming || isSessionExpired}
                    className="px-4 py-2 text-xs font-medium rounded-full border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shrink-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const msgId = `msg-${index}`;

            return (
              <div key={index} className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}>
                {!isUser && (
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5 ring-1 ring-border">
                    {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.name} />}
                    <AvatarFallback className={cn("text-white text-xs", agent.color)}>{agent.icon}</AvatarFallback>
                  </Avatar>
                )}

                <div className={cn("relative max-w-[85%] sm:max-w-[75%]", isUser ? "items-end" : "items-start")}>
                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm shadow-sm",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted/80 text-foreground rounded-bl-sm border",
                    )}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                    ) : (
                      <div className="markdown-content prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-background/50 prose-pre:border prose-pre:rounded-lg">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Copy Button (AI Messages Only) */}
                  {!isUser && (
                    <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(message.content, msgId)}
                        title="Copy response"
                      >
                        {copiedId === msgId ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
                      You
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 shrink-0 mt-0.5 ring-1 ring-border">
                {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.name} />}
                <AvatarFallback className={cn("text-white text-xs", agent.color)}>{agent.icon}</AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 border shadow-sm">
                <div className="flex gap-1 h-5 items-center">
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                  <span
                    className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 md:p-4 border-t bg-background relative">
        {isSessionExpired ? (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center">
            <Badge variant="destructive" className="mb-2 px-3 py-1">
              Session Expired
            </Badge>
            <p className="text-sm text-muted-foreground mb-4">Your 30-minute session has ended.</p>
            <Button onClick={onBack} size="sm">
              Start New Session
            </Button>
          </div>
        ) : null}

        <div className="flex gap-2 items-end">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isStreaming ? "AI is typing..." : "Type your message..."}
            disabled={isStreaming || isSessionExpired}
            className="flex-1 min-h-[44px] max-h-32 py-3"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl"
            disabled={!input.trim() || isStreaming || isSessionExpired}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <div className="hidden md:block text-[10px] text-muted-foreground text-center mt-2 opacity-50">
          AI can make mistakes. Check important info.
        </div>
      </form>
    </div>
  );
}
