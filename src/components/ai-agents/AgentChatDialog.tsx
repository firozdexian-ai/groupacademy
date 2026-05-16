import { useEffect, useRef, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Zap, ShieldCheck, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "@/components/ai-agents/AgentAvatar";
import { AgentMessage } from "@/hooks/useAgentChat";

/**
 * GroUp Academy: Neural Chat Interface Window (V5.6.0)
 * CTO Reference: Authoritative conversation terminal handling real-time asynchronous streaming blocks.
 * Architecture: Optimized via unique key serialization tracking to eliminate stream render thrashing.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface AgentChatDialogProps {
  agent: {
    id: string;
    name: string;
    color?: string;
    icon?: any;
    avatarUrl?: string | null;
  };
  messages: AgentMessage[];
  isStreaming: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onBack: () => void;
  onEndSession: () => Promise<void>;
  perResponseCost: number;
}

export function AgentChatDialog({
  agent,
  messages = [],
  isStreaming,
  onSendMessage,
  onBack,
  perResponseCost,
}: AgentChatDialogProps) {
  const [input, setInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message context frame seamlessly without text truncation drops
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  // --- HANDLER: ATOMIC_QUERY_SUBMISSION_PIPELINE ---
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput || isStreaming || isSyncing) return;

    try {
      setIsSyncing(true);
      setInput(""); // Defensively clear the field locally to prevent double submission

      // HUD: TRANSMITTING_CHAT_PAYLOAD_CONSTRAINTS_UPSTREAM
      await onSendMessage(cleanInput);
    } catch (err) {
      // Restore input values if upstream edge function handshake fails unexpectedly
      setInput(cleanInput);
      console.error("[Digital Workforce] FAULT: Upstream chat submission handshake dropped.", err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-[32px] border-2 border-border/40 overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-500 max-h-[85vh] text-left select-none">
      {/* HUD: CONSOLE_HEADER_SECTOR */}
      <header className="p-4 sm:p-6 border-b border-border/10 bg-card/30 flex items-center gap-4 flex-shrink-0 z-10 backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={isStreaming || isSyncing}
          className="h-10 w-10 shrink-0 rounded-xl hover:bg-primary/10 transition-all disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* COMPONENT: Unified platform avatar system hook */}
        <AgentAvatar
          name={agent.name}
          avatarUrl={agent.avatarUrl}
          icon={agent.icon}
          bgColor="rgba(99, 102, 241, 0.1)"
          iconColor={agent.color}
          isOnline={true}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black uppercase italic tracking-tighter truncate leading-tight">{agent.name}</h2>
          <div className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1 mt-0.5">
            <Zap className="h-3 w-3 animate-pulse" /> Neural Sync Active
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 font-mono">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Yield Cost</span>
          <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 mt-0.5">
            {perResponseCost} TKN
          </span>
        </div>
      </header>

      {/* HUD: CORE_MESSAGE_THREAD_MATRIX */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth bg-muted/5 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-50 animate-in fade-in duration-1000">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-center max-w-[250px] leading-relaxed">
              End-to-End Encrypted Node. <br /> Target locked. State your query.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === "user";

            // Fix: Construct reference stable identification keys preventing token array re-render thrashing
            const msgId = (msg as any).id;
            const msgStableKey = msgId ? String(msgId) : `thread-node-${idx}-${msg.role}`;

            return (
              <div
                key={msgStableKey}
                className={cn(
                  "flex w-full animate-in fade-in duration-200",
                  isUser ? "justify-end animate-slide-in-from-bottom-2" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-[24px] px-5 py-4 text-sm leading-relaxed shadow-sm break-words",
                    isUser
                      ? "bg-primary text-primary-foreground font-medium rounded-br-sm shadow-primary/10"
                      : "bg-card border-2 border-border/20 text-foreground font-medium italic rounded-bl-sm",
                  )}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*]:my-1 leading-relaxed text-foreground/90 font-serif">
                      <ReactMarkdown>{msg.content || "…"}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* IN-FLIGHT LOADING CHUNK PLACEHOLDER ROW */}
        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start animate-in fade-in duration-100">
            <div className="bg-card border-2 border-border/20 rounded-[24px] rounded-bl-sm px-5 py-4 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* COMMAND: INPUT INGRESS MATRIX CONTROL LAYER */}
      <div className="p-4 sm:p-6 bg-card/50 backdrop-blur-md border-t border-border/10 flex-shrink-0 relative z-10">
        <form onSubmit={handleSend} className="flex gap-3 relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isStreaming || isSyncing ? "Awaiting engine generation loop..." : "Transmit query..."}
            disabled={isStreaming || isSyncing}
            className="flex-1 h-14 rounded-2xl bg-background/80 border-2 italic font-medium px-5 focus-visible:ring-primary/20 shadow-inner disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming || isSyncing}
            className="h-14 w-14 rounded-2xl shrink-0 shadow-md active:scale-[0.98] transition-all disabled:cursor-not-allowed"
          >
            {isStreaming || isSyncing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 ml-0.5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
