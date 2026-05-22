import * as React from "react";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Zap, ShieldCheck, ChevronLeft, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "@/domains/agents/components/chat/AgentAvatar";
import { AgentMessage } from "@/domains/agents/hooks/useAgentChat";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";

/**
 * GroUp Academy: Neural Chat Interface (V5.6.1)
 * Refactored for domain-driven architecture.
 * Implements Digital Workforce anomaly reporting to 'admin-support-assistant'.
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
  onEndSession,
  perResponseCost,
}: AgentChatDialogProps) {
  const [input, setInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Digital Workforce Anomaly Reporter
  const reportAnomaly = async (error: string, context: string) => {
    console.error(`[Digital Workforce] Anomaly: ${context}`, error);
    try {
      await adminSupportAssistant({
        type: "TECHNICAL_ANOMALY",
        severity: "HIGH",
        error,
        context: `Agent: ${agent.id} | ${context}`,
      });
    } catch (e) {
      // Fire-and-forget — telemetry failures must not block the chat UI.
      console.warn("[Digital Workforce] anomaly report dropped", e);
    }
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput || isStreaming || isSyncing) return;

    try {
      setIsSyncing(true);
      setInput("");
      await onSendMessage(cleanInput);
    } catch (err: any) {
      setInput(cleanInput);
      reportAnomaly(err.message, "Chat Submission Failure");
      // UI feedback for the talent
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-[32px] border-2 border-border/40 overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-500 max-h-[85vh] text-left select-none">
      <header className="p-4 sm:p-6 border-b border-border/10 bg-card/30 flex items-center gap-4 flex-shrink-0 z-10 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={isStreaming || isSyncing}>
          <ChevronLeft className="h-5 w-5" />
        </Button>

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
          <h2 className="text-lg font-black uppercase italic tracking-tighter truncate">{agent.name}</h2>
          <div className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
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

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-muted/5 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-50">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-center">
              End-to-End Encrypted Node. <br /> Target locked. State your query.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const msgKey = `msg-${idx}-${msg.role}`;
            return (
              <div key={msgKey} className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-[24px] px-5 py-4 text-sm leading-relaxed shadow-sm break-words",
                    isUser
                      ? "bg-primary text-primary-foreground font-medium rounded-br-sm"
                      : "bg-card border-2 border-border/20 italic rounded-bl-sm",
                  )}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content || "…"}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 sm:p-6 bg-card/50 backdrop-blur-md border-t border-border/10">
        <form onSubmit={handleSend} className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Transmit query..."
            disabled={isStreaming || isSyncing}
            className="flex-1 h-14 rounded-2xl bg-background/80 border-2"
          />
          <Button type="submit" disabled={!input.trim() || isStreaming || isSyncing} className="h-14 w-14 rounded-2xl">
            {isStreaming || isSyncing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
