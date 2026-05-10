import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Loader2, RefreshCw, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAgents } from "./hooks/useAdminAgents";
import { ADMIN_AGENTS_BY_KEY } from "@/lib/adminAgents";
import { useAgentRuntimeThread } from "./hooks/useAgentRuntimeThread";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatThreadProps {
  agentKey: string;
  onAfterSend?: () => void;
}

export function ChatThread({ agentKey, onAfterSend }: ChatThreadProps) {
  const { data: agents = [] } = useAdminAgents();
  const agent =
    agents.find((a) => a.key === agentKey) ?? ADMIN_AGENTS_BY_KEY[agentKey];
  const { messages, loading, sending, send, clear, regenerate } =
    useAgentRuntimeThread(agentKey);
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
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Unknown agent
      </div>
    );
  }

  const Icon = agent.icon;

  const submit = async (text: string) => {
    if (!text.trim()) return;
    setInput("");
    try {
      await send(text);
      onAfterSend?.();
    } catch (err: any) {
      toast({
        title: "Message failed",
        description: err?.message || "Could not reach the agent.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/40 bg-card/40 backdrop-blur">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            agent.accent,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{agent.name}</div>
          <div className="text-xs text-muted-foreground truncate">{agent.tagline}</div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clear}
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-background/30">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="space-y-3 max-w-xl mx-auto py-8">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 text-center">
              Start the conversation
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {agent.suggestions.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 rounded-2xl border-2 whitespace-normal"
                  onClick={() => submit(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isLastAssistant =
            m.role === "assistant" && i === messages.length - 1 && !sending;
          return (
            <div
              key={m.id ?? i}
              className={cn(
                "flex flex-col",
                m.role === "user" ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm space-y-2",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border/40 rounded-bl-md",
                )}
              >
                {m.content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1.5 [&>ul]:my-1.5 [&>ol]:my-1.5">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {m.role === "assistant" && m.content && (
                <div className="flex gap-1 mt-1 ml-1 opacity-60 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.content);
                      toast({ title: "Copied" });
                    }}
                    className="p-1 rounded hover:bg-muted"
                    title="Copy"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {isLastAssistant && (
                    <button
                      onClick={() => regenerate()}
                      className="p-1 rounded hover:bg-muted"
                      title="Regenerate"
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
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> {agent.name} is typing…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div className="border-t border-border/30 p-3 bg-card/40 backdrop-blur">
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
            placeholder={`Message ${agent.name}…`}
            className="rounded-2xl resize-none min-h-[48px] max-h-40 border-2"
          />
          <Button
            onClick={() => submit(input)}
            disabled={sending || !input.trim()}
            className="h-12 rounded-2xl px-5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
