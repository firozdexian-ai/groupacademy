import * as React from "react";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, CheckCircle2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "@/domains/agents/components/chat/AgentAvatar";
import { AgentMessage } from "@/domains/agents/hooks/useAgentChat";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";
import { trackError } from "@/lib/errorTracking";

/**
 * Group Academy — Career Guidance System: Agent Chat Dialog Terminal
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/guidance (Student Chat Interface Viewport)
 * Operations Mode: Automated Efficiency student assistant backed by system anomaly forwarding.
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

  // Digital Workforce Anomaly Reporter with Global Hook Forwarding
  const reportAnomaly = async (error: string, context: string) => {
    trackError("guidance-chat-dialog-anomaly", { error, context, agentId: agent.id });
    try {
      await adminSupportAssistant({
        type: "TECHNICAL_ANOMALY",
        severity: "HIGH",
        error,
        context: `Agent: ${agent.id} | ${context}`,
      });
    } catch (e: any) {
      console.warn("[Telemetry Fail] Anomaly report dropped:", e.message);
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
      await reportAnomaly(err.message, "Chat Message Submission Failure");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-3xl border border-border/60 overflow-hidden shadow-xl relative animate-in fade-in zoom-in-95 duration-300 max-h-[85vh] text-left select-none">
      {/* Dialogue Stream Control Header */}
      <header className="p-4 sm:p-5 border-b border-border/40 bg-card/50 flex items-center gap-4 flex-shrink-0 z-10 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Return to list"
          onClick={onBack}
          disabled={isStreaming || isSyncing}
          className="rounded-xl h-10 w-10 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <AgentAvatar
          name={agent.name}
          avatarUrl={agent.avatarUrl}
          icon={agent.icon}
          bgColor="rgba(99, 102, 241, 0.05)"
          iconColor={agent.color}
          isOnline={true}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground tracking-tight truncate">{agent.name}</h2>
          <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Connected
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 font-mono">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cost per message</span>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 mt-1">
            {perResponseCost} credits
          </span>
        </div>
      </header>

      {/* Message Ledger Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-muted/5 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 py-12 opacity-60">
            <div className="h-12 w-12 rounded-full bg-muted border border-border/60 flex items-center justify-center text-muted-foreground">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium text-muted-foreground text-center leading-relaxed">
              Chat session active. <br /> Type your message below to start chatting.
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
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words",
                    isUser
                      ? "bg-primary text-primary-foreground font-medium rounded-br-none"
                      : "bg-card border border-border/40 text-foreground rounded-bl-none",
                  )}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 leading-relaxed">
                      <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Form Composer Console */}
      <div className="p-4 sm:p-5 bg-card/50 backdrop-blur-md border-t border-border/40">
        <form onSubmit={handleSend} className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={isStreaming || isSyncing}
            className="flex-1 h-12 rounded-xl bg-background border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming || isSyncing}
            className="h-12 w-12 rounded-xl p-0 flex items-center justify-center shrink-0 shadow-sm"
          >
            {isStreaming || isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default AgentChatDialog;
