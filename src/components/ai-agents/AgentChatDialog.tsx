import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Trash2,
  Copy,
  Check,
  Coins,
  MessageSquare,
  Bot,
  Zap,
  ShieldCheck,
} from "lucide-react";
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

/**
 * GroUp Academy: Neural Dialogue Hub (AgentChatDialog)
 * CTO Reference: Authoritative interaction node for real-time agent synchronization.
 */

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

const getExecutiveSuggestions = (agentId?: string) => {
  const common = ["Explain your primary function", "Provide a quick efficiency tip", "Commence node sync"];
  switch (agentId) {
    case "cv-coach":
      return ["Audit my summary artifact", "ATS optimization protocol", "Active verb injection", ...common];
    case "interview-coach":
      return ["Initialize mock simulation", "STAR response blueprint", "Predict high-yield questions", ...common];
    case "salary-negotiator":
      return ["Draft negotiation script", "Audit market trajectory", "Review offer documentation", ...common];
    default:
      return common;
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // PROTOCOL: Neural Auto-Scroll Synchronization
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: isStreaming ? "auto" : "smooth",
      });
    }
  }, [messages, isStreaming]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const executeCopyProtocol = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestions = getExecutiveSuggestions(agent.id);

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative border-x-2 border-border/10">
      {/* HUD: INTERFACE_HEADER */}
      <header className="flex items-center justify-between p-4 border-b bg-card/30 backdrop-blur-2xl shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-xl hover:bg-muted/10 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-11 w-11 border-2 border-primary/20 shadow-lg transition-transform hover:scale-105">
                {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.name} className="object-cover" />}
                <AvatarFallback className={cn("text-white font-black italic", agent.color)}>
                  {agent.icon || <Bot className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-background ring-1 ring-emerald-500/20" />
            </div>

            <div className="min-w-0">
              <h2 className="font-black text-sm uppercase italic tracking-tighter truncate leading-none mb-1">
                {agent.name}
              </h2>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">
                <Coins className="h-3 w-3 fill-current" />
                <span>{perResponseCost}_CR_PER_MSG</span>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
              <MoreVertical className="h-5 w-5 text-muted-foreground/60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl border-2 shadow-2xl p-2 min-w-[180px]">
            <DropdownMenuItem
              onClick={onEndSession}
              className="text-rose-500 font-black uppercase italic text-[10px] tracking-widest focus:text-rose-600 focus:bg-rose-500/5 rounded-xl cursor-pointer py-3"
            >
              <Trash2 className="h-4 w-4 mr-3" /> Purge_Neural_Registry
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* VIEWPORT: NEURAL_DIALOGUE */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 w-full bg-gradient-to-b from-muted/5 to-transparent">
        <div className="max-w-4xl mx-auto p-6 space-y-8 pb-32">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in zoom-in-95 duration-1000">
              <div className="h-24 w-24 rounded-[40px] bg-primary/5 flex items-center justify-center mb-8 shadow-inner relative overflow-hidden">
                <Zap className="h-10 w-10 text-primary opacity-20 absolute rotate-12 -top-2 -left-2" />
                <span className="text-5xl drop-shadow-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter mb-3">
                Sync_Initialized: {agent.name}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 mb-12 max-w-[280px] italic leading-relaxed">
                Neural pathway established. Select a directive node to commence optimization.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    onClick={() => onSendMessage(suggestion)}
                    disabled={isStreaming}
                    className="w-full justify-start h-auto py-5 px-6 text-[10px] font-black uppercase italic tracking-widest rounded-3xl bg-background/50 border-2 border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all text-left shadow-lg active:scale-95 group"
                  >
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <span className="flex-1 truncate">{suggestion}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const msgId = `msg-${index}`;

            return (
              <div
                key={index}
                className={cn(
                  "flex gap-4 group animate-in slide-in-from-bottom-3 duration-500",
                  isUser ? "flex-row-reverse" : "flex-row",
                )}
              >
                {!isUser && (
                  <Avatar className="h-10 w-10 mt-1 shrink-0 border-2 border-border/20 shadow-md">
                    {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.name} />}
                    <AvatarFallback className={cn("text-white text-[10px] font-black italic", agent.color)}>
                      {agent.icon}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={cn("flex flex-col gap-2 max-w-[85%]", isUser ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-[28px] px-6 py-4 text-sm leading-relaxed shadow-xl transition-all border-2",
                      isUser
                        ? "bg-primary border-primary text-white rounded-tr-none font-bold italic tracking-tight"
                        : "bg-card/50 backdrop-blur-sm text-foreground rounded-tl-none border-border/40",
                    )}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none 
                        prose-p:leading-relaxed prose-p:font-medium
                        prose-pre:bg-muted/50 prose-pre:border-2 prose-pre:rounded-2xl
                        prose-code:text-primary prose-code:font-black
                        prose-strong:font-black prose-strong:uppercase prose-strong:italic prose-strong:text-primary"
                      >
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {!isUser && (
                    <div className="flex items-center gap-4 px-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/30 hover:text-primary opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                        onClick={() => executeCopyProtocol(message.content, msgId)}
                      >
                        {copiedId === msgId ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <ShieldCheck className="h-3 w-3 text-primary/40" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">
                          Verified_Artifact
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isStreaming && (
            <div className="flex gap-4 justify-start items-center animate-pulse">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className={cn("text-white text-[10px] font-black", agent.color)}>AI</AvatarFallback>
              </Avatar>
              <div className="bg-card/40 border-2 border-border/20 rounded-[24px] rounded-tl-none px-6 py-4 shadow-inner">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s] shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* FOOTER: COMMAND_INGRESS */}
      <footer className="absolute bottom-0 left-0 right-0 border-t-2 border-border/10 bg-card/40 backdrop-blur-3xl p-6 z-40">
        <form onSubmit={handleCommandSubmit} className="flex gap-4 items-center max-w-5xl mx-auto">
          <div className="relative flex-1 group">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Sync command for ${agent.name.toUpperCase()}...`}
              disabled={isStreaming}
              className="h-16 bg-background/50 border-2 border-border/40 rounded-[24px] focus-visible:ring-primary/20 shadow-2xl px-8 font-bold italic transition-all group-hover:border-primary/20"
              autoComplete="off"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-20">
              <span className="text-[10px] font-black uppercase tracking-widest">CMD_NODE</span>
            </div>
          </div>
          <Button
            type="submit"
            size="icon"
            className="h-16 w-16 shrink-0 rounded-[24px] shadow-[0_15px_30px_rgba(var(--primary),0.3)] bg-primary hover:scale-[1.05] active:scale-95 transition-all duration-300"
            disabled={!input.trim() || isStreaming}
          >
            <Send className="h-6 w-6 text-white" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
