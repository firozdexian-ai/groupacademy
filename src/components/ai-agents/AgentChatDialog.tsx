import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, MoreVertical, Trash2, Copy, Check, Coins, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import ReactMarkdown from "react-markdown";

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
  onSendMessage: (content: string) => void;
  onBack: () => void;
  onEndSession: () => void;
  perResponseCost?: number;
}

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
  onSendMessage,
  onBack,
  onEndSession,
  perResponseCost = 1,
}: AgentChatDialogProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // CTO FIX: Force scroll to bottom whenever messages or streaming status change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestions = getSuggestions(agent.id);

  return (
    /* CTO FIX: h-full and flex-col ensure the container fills the parent. 
      overflow-hidden prevents the "awkward" double-scroll behavior seen in your video.
    */
    <div className="flex flex-col h-full bg-background md:rounded-lg md:border md:shadow-sm overflow-hidden border-x">
      {/* Header - Fixed height */}
      <div className="flex items-center gap-3 p-3 border-b bg-background/95 backdrop-blur-sm shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="h-8 w-8 shrink-0">
            {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.name} />}
            <AvatarFallback className={cn("text-white text-xs font-bold", agent.color)}>{agent.icon}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm truncate">{agent.name}</h2>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Coins className="h-2.5 w-2.5" />
              {perResponseCost} credit{perResponseCost !== 1 ? "s" : ""}/response
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
              <MoreVertical className="h-4 w-4" />
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

      {/* Messages Area - Independent Scroll Zone */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 w-full bg-slate-50/30">
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <span className="text-3xl">👋</span>
              </div>
              <h3 className="text-md font-semibold mb-1">Hello! I'm your {agent.name}</h3>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                Pick a topic below to start your session.
              </p>

              {/* REFACTORED: Vertical stack for high-conversion suggestions */}
              <div className="flex flex-col gap-2 w-full max-w-[280px]">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    onClick={() => onSendMessage(suggestion)}
                    disabled={isStreaming}
                    className="w-full justify-start h-auto py-3 px-4 text-xs font-medium rounded-xl bg-white border-slate-200 hover:bg-slate-50 hover:border-primary/30 transition-all text-left"
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-3 text-muted-foreground" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const msgId = `msg-${index}`;

            return (
              <div key={index} className={cn("flex gap-2 group", isUser ? "justify-end" : "justify-start")}>
                {!isUser && (
                  <Avatar className="h-7 w-7 mt-1 shrink-0 border">
                    {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.name} />}
                    <AvatarFallback className={cn("text-white text-[10px]", agent.color)}>{agent.icon}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("relative max-w-[85%]", isUser ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-white text-foreground rounded-bl-none border",
                    )}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    ) : (
                      <div className="markdown-content prose prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {!isUser && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(message.content, msgId)}
                    >
                      {copiedId === msgId ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {isStreaming && (
            <div className="flex gap-2 justify-start">
              <div className="bg-white border rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                  <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area - Pinned to bottom of the flex container */}
      <div className="border-t bg-background p-3 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center max-w-2xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl shadow-md"
            disabled={!input.trim() || isStreaming}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
