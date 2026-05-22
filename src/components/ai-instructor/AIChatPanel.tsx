import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, Loader2, Sparkles, RefreshCw, Zap, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { getAccessToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useTutorMasteryContext } from "@/domains/learning";

/**
 * GroUp Academy: Neural Instructor Interface (V5.6.0)
 * CTO Reference: High-performance canvas capturing context-aware pedagogical chat arrays.
 * Architecture: Reference-stable unique message tracking hooks eliminating streaming text thrashing.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

interface Message {
  id: string;
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
  const lastPromptRef = useRef<string>("");

  const { data: masteryCtx } = useTutorMasteryContext({
    moduleId: moduleId || (contextType === "module" ? contextId : undefined),
    contentId: contentId || (contextType === "course" ? contextId : undefined),
  });

  // --- PHASE: STARTER_PROMPTS_COMPILATION ---
  const starterPrompts = useMemo(() => {
    if (starterChips && starterChips.length > 0) return starterChips;
    const out: { label: string; prompt: string }[] = [];
    if (!masteryCtx) return out;

    const weakest = masteryCtx.weak_topics?.[0];
    if (weakest?.tag) {
      out.push({
        label: `Help me with: ${weakest.tag}`,
        prompt: `Help me improve at "${weakest.tag}". Explain it simply and give me one practice question.`,
      });
    }

    const dueCount = Number(masteryCtx.due_for_review_count || 0);
    if (dueCount > 0) {
      out.push({
        label: `Quick review: ${dueCount} items`,
        prompt: `I have ${dueCount} items due for review. Quiz me on the most important one first.`,
      });
    }
    return out;
  }, [masteryCtx, starterChips]);

  // Seed baseline system welcome greetings cleanly on first mount window
  useEffect(() => {
    if (seedAssistantMessage && messages.length === 0) {
      setMessages([{ id: `seed-msg-assistant`, role: "assistant", content: seedAssistantMessage }]);
    }
  }, [seedAssistantMessage, messages.length]);

  // Core Viewport Auto-Scroll Sync Pipeline
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Clean layout controller abort tokens upon unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // --- ACTION: TRANSACTION_ISOLATED_STREAMING_SYNC ---
  const executeStreamingSync = async (userMessages: Message[]): Promise<ReadableStream<Uint8Array>> => {
    abortControllerRef.current = new AbortController();
    const generationTimeoutValue = Number(TIMEOUTS?.AI_GENERATION || 30000);

    const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), generationTimeoutValue);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("AUTH_SYNC_REQUIRED");

      // HUD: EXECUTING_AI_INSTRUCTOR_STREAM_HANDSHAKE
      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
        },
        body: JSON.stringify({
          messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
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

      if (response.status === 429) throw new Error("RATE_LIMIT_THROTTLE: Server busy. Try again in 60s.");
      if (response.status === 402) throw new Error("FISCAL_QUOTA_EXCEEDED: Token limit reached. Contact Faculty.");
      if (!response.ok || !response.body) throw new Error("NEURAL_LINK_FAULT: Connection dropped endpoint side.");

      return response.body;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") throw new Error("SYNC_TIMEOUT: Latency baseline breached.");
      throw error;
    }
  };

  // --- ACTION: MESSAGE_INGRESS_CONTROLLER ---
  const handleMessageIngress = async (e?: React.FormEvent, overridePromptText?: string) => {
    e?.preventDefault();

    const targetQueryString = (overridePromptText ?? input).trim();
    if (!targetQueryString || isLoading) return;

    // Cache query text parameter securely inside a tracking ref boundary to survive retry cycles
    lastPromptRef.current = targetQueryString;

    const userMsgId = `msg-user-${Date.now()}`;
    const assistantMsgId = `msg-assistant-${Date.now()}`;

    const newUserPayload: Message = { id: userMsgId, role: "user", content: targetQueryString };
    const extendedTrajectory = [...messages, newUserPayload];

    setMessages(extendedTrajectory);
    setInput("");
    setIsLoading(true);
    setLastError(null);
    if (onMessageSent) onMessageSent();

    let assistantTextAccumulator = "";

    try {
      const streamBodyChannel = await executeStreamingSync(extendedTrajectory);
      const streamReader = streamBodyChannel.getReader();
      const textDecoder = new TextDecoder();
      let streamChunkLineBuffer = "";

      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

      // HUD: EXECUTING_REACTIVE_CHUNK_ITERATION_LOOP
      while (true) {
        const { done, value } = await streamReader.read();
        if (done) break;

        streamChunkLineBuffer += textDecoder.decode(value, { stream: true });
        const individualPayloadLines = streamChunkLineBuffer.split("\n");
        streamChunkLineBuffer = individualPayloadLines.pop() || "";

        for (const line of individualPayloadLines) {
          const sanitizedChunkLine = line.trim();
          if (!sanitizedChunkLine || !sanitizedChunkLine.startsWith("data: ")) continue;

          const rawJsonPayload = sanitizedChunkLine.slice(6).trim();
          if (rawJsonPayload === "[DONE]") break;

          try {
            const parsedTokenPayload = JSON.parse(rawJsonPayload);
            const explicitDeltaToken = parsedTokenPayload.choices?.[0]?.delta?.content;

            if (explicitDeltaToken) {
              assistantTextAccumulator += explicitDeltaToken;
              setMessages((prev) => {
                const listCopy = [...prev];
                const targetMsgIdx = listCopy.findIndex((m) => m.id === assistantMsgId);
                if (targetMsgIdx !== -1) {
                  listCopy[targetMsgIdx] = { ...listCopy[targetMsgIdx], content: assistantTextAccumulator };
                }
                return listCopy;
              });
            }
          } catch {
            // Fragment boundary encapsulation catch rules block structural stream breaks
          }
        }
      }
    } catch (error: any) {
      setLastError(error.message || "Uplink connection fault.");
      toast.error(error.message || "Uplink connection fault.");

      // Error Recovery: Clear in-flight assistant shells safely while preserving full conversation threads
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetryExecution = () => {
    if (!lastPromptRef.current) return;
    void handleMessageIngress(undefined, lastPromptRef.current);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card rounded-[32px] border-2 border-border/40 shadow-2xl overflow-hidden select-none text-left",
        className,
      )}
    >
      {/* HUD: BAR_HEADER_SYNC */}
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
          <div>
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

      {/* VIEWPORT: MESSAGE_TRAJECTORY_THREAD_LIST */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in fade-in zoom-in-95 duration-700">
            <div className="h-20 w-20 rounded-[28px] bg-primary/5 border-2 border-primary/10 flex items-center justify-center mb-6">
              <Bot className="h-10 w-10 text-primary/40" />
            </div>
            <p className="text-xs font-black uppercase italic tracking-[0.2em] text-muted-foreground/40 mb-2">
              Awaiting_Query
            </p>
            <p className="text-[10px] font-medium text-muted-foreground/30 italic max-w-[200px] leading-relaxed">
              {placeholder}
            </p>

            {/* PIPELINE_CONTEXT_HINT: PSYCHOMETRIC INDICATORS NOTICE */}
            {!hintDismissed &&
            masteryCtx &&
            (masteryCtx.weak_topics?.length > 0 || masteryCtx.credentials?.length > 0) ? (
              <div className="mt-6 max-w-[280px] flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-left">
                <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-foreground/80 italic leading-snug">
                  Tutor knows your progress — weak topics, credentials, and items due for review.
                </p>
                <button
                  type="button"
                  onClick={() => setHintDismissed(true)}
                  className="text-muted-foreground/40 hover:text-foreground outline-none shrink-0 ml-auto"
                  aria-label="Dismiss"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : null}

            {/* CHIPS SECTOR: CONTEXTUAL SUGGESTION PILLS */}
            {starterPrompts.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-[300px]">
                {starterPrompts.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => void handleMessageIngress(undefined, chip.prompt)}
                    className="rounded-full border-2 border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-semibold text-primary hover:bg-primary/10 transition active:scale-[0.98]"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, idx) => {
              const isAssistant = message.role === "assistant";

              // Architecture Fix: Enforce stable key tracking to avoid document node thrashing loops
              const rowStableKey = message.id ? String(message.id) : `node-msg-${idx}-${message.role}`;

              return (
                <div
                  key={rowStableKey}
                  className={cn(
                    "flex gap-4 animate-in fade-in duration-200",
                    isAssistant ? "justify-start" : "justify-end animate-slide-in-from-bottom-2",
                  )}
                >
                  {isAssistant && (
                    <Avatar className="h-9 w-9 shrink-0 border-2 border-primary/10">
                      <AvatarFallback className="bg-primary/5 text-primary">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "rounded-[22px] px-5 py-3.5 max-w-[85%] text-left shadow-sm break-words",
                      isAssistant
                        ? "bg-muted/40 backdrop-blur-sm border-2 border-border/5 text-foreground"
                        : "bg-primary text-white font-medium",
                    )}
                  >
                    <p className="text-sm italic leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {!isAssistant && (
                    <Avatar className="h-9 w-9 shrink-0 border-2 border-primary/20">
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-black italic">
                        U
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}

            {/* IN-FLIGHT RESPONSE SYNC SKELETON PLACEHOLDER */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-4 justify-start animate-pulse">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
                <div className="bg-muted/20 rounded-[22px] px-6 py-3 border-2 border-dashed border-primary/20">
                  <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest italic font-mono">
                    Decrypting_Response...
                  </span>
                </div>
              </div>
            )}

            {/* ERROR RECOVERY CONTROL MODULE */}
            {lastError && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  onClick={handleRetryExecution}
                  className="h-9 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2 text-rose-500 border-rose-500/20 hover:bg-rose-500/5 transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> REINITIALIZE_LAST_NODE
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* HUD: INPUT_COMMAND_COMPOSER */}
      <form onSubmit={(e) => void handleMessageIngress(e)} className="p-6 border-t-2 border-border/10 bg-muted/5">
        <div className="relative flex items-end gap-3 bg-background/50 border-2 border-border/40 p-2 rounded-[24px] focus-within:border-primary/40 transition-all shadow-inner">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleMessageIngress();
              }
            }}
            placeholder={isLoading ? "Awaiting engine pipeline serialization..." : "Initialize command..."}
            className="min-h-[48px] max-h-[160px] resize-none border-0 focus-visible:ring-0 bg-transparent italic font-medium py-3 px-4 disabled:opacity-40"
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-2xl shrink-0 shadow-lg shadow-primary/20 active:scale-90 transition-all disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 mt-4 text-center font-mono">
          Neural_Streaming_v4.2 // Encrypted_Uplink
        </p>
      </form>
    </div>
  );
}
