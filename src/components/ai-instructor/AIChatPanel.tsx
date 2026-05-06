import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Sparkles, RefreshCw, Zap, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useTutorMasteryContext } from "@/hooks/useTutorMasteryContext";

/**
 * GroUp Academy: Neural Instructor Interface
 * CTO Reference: Authoritative node for real-time pedagogical streaming.
 */

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  professionLineId?: string;
  contextType?: "general" | "course" | "module";
  contextId?: string;
  moduleId?: string;
  contentId?: string;
  instructorName?: string;
  placeholder?: string;
  className?: string;
  onMessageSent?: () => void;
  mode?: "tutor" | "career_coach";
  seedAssistantMessage?: string;
  starterChips?: { label: string; prompt: string }[];
}

const CHAT_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-instructor-chat`;

export function AIChatPanel({
  professionLineId,
  contextType = "general",
  contextId,
  moduleId,
  contentId,
  instructorName = "Neural Instructor",
  placeholder = "Initialize query regarding trajectory or curriculum...",
  className = "",
  onMessageSent,
  mode = "tutor",
  seedAssistantMessage,
  starterChips,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { data: masteryCtx } = useTutorMasteryContext({
    moduleId: moduleId || (contextType === "module" ? contextId : undefined),
    contentId: contentId || (contextType === "course" ? contextId : undefined),
  });

  const starterPrompts = useMemo(() => {
    if (starterChips && starterChips.length > 0) return starterChips;
    const out: { label: string; prompt: string }[] = [];
    if (!masteryCtx) return out;
    const weakest = masteryCtx.weak_topics?.[0];
    if (weakest) {
      out.push({
        label: `Help me with: ${weakest.tag}`,
        prompt: `Help me improve at "${weakest.tag}". Explain it simply and give me one practice question.`,
      });
    }
    if ((masteryCtx.due_for_review_count || 0) > 0) {
      out.push({
        label: `Quick review: ${masteryCtx.due_for_review_count} items`,
        prompt: `I have ${masteryCtx.due_for_review_count} items due for review. Quiz me on the most important one first.`,
      });
    }
    return out;
  }, [masteryCtx, starterChips]);

  // Seed first assistant message (career coach intro etc.)
  useEffect(() => {
    if (seedAssistantMessage && messages.length === 0) {
      setMessages([{ role: "assistant", content: seedAssistantMessage }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedAssistantMessage]);

  // PROTOCOL: Viewport Auto-Sync
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const executeStreamingSync = async (userMessages: Message[]) => {
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), TIMEOUTS.AI_GENERATION);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("AUTH_SYNC_REQUIRED");

      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: userMessages,
          professionLineId,
          contextType,
          contextId,
          moduleId: moduleId || (contextType === "module" ? contextId : undefined),
          contentId: contentId || (contextType === "course" ? contextId : undefined),
          mode,
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) throw new Error("RATE_LIMIT_THROTTLE: Try again in 60s.");
      if (response.status === 402) throw new Error("FISCAL_QUOTA_EXCEEDED: Contact Faculty.");
      if (!response.ok || !response.body) throw new Error("NEURAL_LINK_FAULT");

      return response.body;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") throw new Error("SYNC_TIMEOUT: Latency too high.");
      throw error;
    }
  };

  const handleMessageIngress = async (e?: React.FormEvent, override?: string) => {
    e?.preventDefault();
    const text = (override ?? input).trim();
    if (!text || isLoading) return;

    const userPayload: Message = { role: "user", content: text };
    const trajectory = [...messages, userPayload];

    setMessages(trajectory);
    setInput("");
    setIsLoading(true);
    setLastError(null);
    onMessageSent?.();

    let assistantBuffer = "";

    try {
      const stream = await executeStreamingSync(trajectory);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let chunkBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunkBuffer += decoder.decode(value, { stream: true });
        const lines = chunkBuffer.split("\n");
        chunkBuffer = lines.pop() || "";

        for (const line of lines) {
          const sanitizedLine = line.trim();
          if (!sanitizedLine || !sanitizedLine.startsWith("data: ")) continue;

          const payload = sanitizedLine.slice(6).trim();
          if (payload === "[DONE]") break;

          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantBuffer += delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantBuffer };
                return updated;
              });
            }
          } catch (e) {
            /* Buffer fragment handling */
          }
        }
      }
    } catch (error: any) {
      setLastError(error.message);
      toast.error(error.message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card rounded-[32px] border-2 border-border/40 shadow-2xl overflow-hidden",
        className,
      )}
    >
      {/* HUD: HEADER_SYNC */}
      <div className="flex items-center justify-between p-5 border-b-2 border-border/10 bg-muted/5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-primary/20 p-1 bg-background">
              <AvatarFallback className="bg-primary/10 text-primary">
                <Bot className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-card animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black uppercase italic tracking-tighter leading-none">{instructorName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Zap className="h-3 w-3 text-primary fill-current" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                Neural_Link_Active
              </span>
            </div>
          </div>
        </div>
        <ShieldCheck className="h-5 w-5 text-primary/20" />
      </div>

      {/* VIEWPORT: MESSAGE_TRAJECTORY */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-in fade-in zoom-in-95 duration-700">
            <div className="h-20 w-20 rounded-[28px] bg-primary/5 border-2 border-primary/10 flex items-center justify-center mb-6">
              <Bot className="h-10 w-10 text-primary/40" />
            </div>
            <p className="text-xs font-black uppercase italic tracking-[0.2em] text-muted-foreground/40 mb-2">
              Awaiting_Query
            </p>
            <p className="text-[10px] font-medium text-muted-foreground/30 italic max-w-[200px] leading-relaxed">
              {placeholder}
            </p>

            {!hintDismissed && masteryCtx && (masteryCtx.weak_topics?.length || masteryCtx.credentials?.length) ? (
              <div className="mt-6 max-w-[280px] flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-left">
                <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-foreground/80 italic leading-snug">
                  Tutor knows your progress — weak topics, credentials, and items due for review.
                </p>
                <button
                  onClick={() => setHintDismissed(true)}
                  className="text-muted-foreground/40 hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : null}

            {starterPrompts.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-[300px]">
                {starterPrompts.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleMessageIngress(undefined, s.prompt)}
                    className="rounded-full border-2 border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-semibold text-primary hover:bg-primary/10 transition"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-4 animate-in slide-in-from-bottom-2",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-9 w-9 shrink-0 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/5 text-primary">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-[22px] px-5 py-3.5 max-w-[85%] text-left shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-white font-medium"
                      : "bg-muted/40 backdrop-blur-sm border-2 border-border/5",
                  )}
                >
                  <p className="text-sm italic leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-9 w-9 shrink-0 border-2 border-primary/20">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-black italic">
                      U
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-4 justify-start animate-pulse">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
                <div className="bg-muted/20 rounded-[22px] px-6 py-3 border-2 border-dashed border-primary/20">
                  <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest italic">
                    Decrypting_Response...
                  </span>
                </div>
              </div>
            )}

            {lastError && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMessageIngress()}
                  className="h-9 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2 text-rose-500 border-rose-500/20 hover:bg-rose-500/5"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> REINITIALIZE_LAST_NODE
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* HUD: INPUT_COMMAND */}
      <form onSubmit={handleMessageIngress} className="p-6 border-t-2 border-border/10 bg-muted/5">
        <div className="relative flex items-end gap-3 bg-background/50 border-2 border-border/40 p-2 rounded-[24px] focus-within:border-primary/40 transition-all shadow-inner">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleMessageIngress();
              }
            }}
            placeholder="Initialize command..."
            className="min-h-[48px] max-h-[160px] resize-none border-0 focus-visible:ring-0 bg-transparent italic font-medium py-3 px-4"
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-2xl shrink-0 shadow-lg shadow-primary/20 active:scale-90 transition-all"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 mt-4 text-center">
          Neural_Streaming_v4.2 // Encrypted_Uplink
        </p>
      </form>
    </div>
  );
}
