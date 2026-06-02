import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, RefreshCw, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAgents } from "./hooks/useAdminAgents";
import { ADMIN_AGENTS_BY_KEY } from "@/lib/adminAgents";
import { useAgentRuntimeThread, type ChatMsg } from "./hooks/useAgentRuntimeThread";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";
import { trackError } from "@/lib/errorTracking";

interface ChatThreadProps {
  agentKey: string;
  onAfterSend?: () => void;
}

/**
 * Group Academy — ChatThread UI Component
 * Version: Phase 10j.5 Hardened
 * Purpose: Unified messenger interface for AI agent interactions.
 */
export function ChatThread({ agentKey, onAfterSend }: ChatThreadProps) {
  const { data: agents = [] } = useAdminAgents();
  const agent = agents.find((a: any) => a.key === agentKey) ?? ADMIN_AGENTS_BY_KEY[agentKey];

  const { messages, loading, sending, send, clear, regenerate } = useAgentRuntimeThread(agentKey);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    setInput("");
  }, [agentKey]);

  if (!agent) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic">
        Unable to initialize agent interface.
      </div>
    );
  }

  const Icon = agent.icon;

  const submit = async (text: string) => {
    if (!text.trim() || sending) return;
    setInput("");
    try {
      await send(text);
      onAfterSend?.();
    } catch (err: any) {
      trackError("chat-thread-submit-failure", { agentKey, error: err.message });
      toast({
        title: "Communication error",
        description: "Failed to connect to the agent runtime.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Thread Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 bg-card/50">
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shadow-sm", agent.accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-foreground tracking-tight">{agent.name}</div>
          <div className="text-xs text-muted-foreground truncate">{agent.tagline}</div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clear}
            className="text-muted-foreground hover:text-rose-600"
            title="Reset Conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/5">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <InlineSpinner size="sm" /> Syncing thread history...
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="space-y-4 max-w-lg mx-auto py-10">
            <p className="text-xs font-bold text-muted-foreground/60 text-center uppercase tracking-widest">
              Available conversation starters
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agent.suggestions.map((s: string) => (
                <Button
                  key={s}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 rounded-2xl border-border/60 hover:border-primary/50 transition-all text-xs"
                  onClick={() => submit(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m: ChatMsg, i: number) => {
          const isLastAssistant = m.role === "assistant" && i === messages.length - 1 && !sending;
          return (
            <div key={m.id ?? i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-card border border-border/40 rounded-bl-none",
                )}
              >
                {m.content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1.5">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              {m.role === "assistant" && m.content && (
                <div className="flex gap-1 mt-1.5 ml-1 opacity-50 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.content);
                      toast({ title: "Copied to clipboard" });
                    }}
                    className="p-1 rounded hover:bg-muted"
                    title="Copy response"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {isLastAssistant && (
                    <button
                      onClick={() => regenerate()}
                      className="p-1 rounded hover:bg-muted"
                      title="Regenerate response"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sending && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium animate-pulse">
            <InlineSpinner size="sm" /> {agent.name} is drafting...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer Input Area */}
      <div className="border-t border-border/40 p-4 bg-background">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder={`Message ${agent.name}...`}
            className="rounded-2xl resize-none min-h-[48px] max-h-32 border-border/40 focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button
            onClick={() => submit(input)}
            disabled={sending || !input.trim()}
            className="h-12 w-12 rounded-2xl p-0 flex items-center justify-center shadow-sm"
          >
            {sending ? <InlineSpinner size="sm" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
