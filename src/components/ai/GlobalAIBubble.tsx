import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, X, Send, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  getContentIdBySlug,
  getAiInstructorName,
} from "@/domains/learning/repo/learningRepo";
import { getTalentCareerCoachInstructorId } from "@/domains/talent/repo/talentRepo";
import { useTalent } from "@/hooks/useTalent";
import { handleAIError } from "@/lib/aiErrorHandler";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Context-Aware Global Assistant Bubble (V5.6.0)
 * CTO Reference: Authoritative floating chat widget streaming context-locked LLM responses.
 * Architecture: Resource-safe event stream iteration protecting edge computing budgets.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CoachMetadata {
  agentKey: string;
  agentName: string;
}

const slugIdCache = new Map<string, string>();
const UUID_REGEX_PATTERN = "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})";

async function resolveCourseIdFromSlug(slug: string): Promise<string | null> {
  if (slugIdCache.has(slug)) return slugIdCache.get(slug)!;
  const id = await getContentIdBySlug(slug);
  if (id) slugIdCache.set(slug, id);
  return id;
}

async function deriveContext(pathname: string): Promise<Record<string, string>> {
  const ctx: Record<string, string> = {};

  const job = pathname.match(new RegExp(`/app/jobs/${UUID_REGEX_PATTERN}`, "i"));
  if (job) ctx.job_id = job[1];

  const mkt = pathname.match(new RegExp(`/app/marketplace/${UUID_REGEX_PATTERN}`, "i"));
  if (mkt) {
    ctx.gig_id = mkt[1];
    ctx.gig_kind = "marketplace";
  }

  const gig = pathname.match(new RegExp(`/app/gigs/(?:marketplace/)?${UUID_REGEX_PATTERN}`, "i"));
  if (gig && !ctx.gig_id) {
    ctx.gig_id = gig[1];
    ctx.gig_kind = pathname.includes("/marketplace/") ? "marketplace" : "quick";
  }

  const courseSlug = pathname.match(/\/app\/learning\/courses\/([^/?#]+)/i);
  if (courseSlug) {
    const id = await resolveCourseIdFromSlug(courseSlug[1]);
    if (id) ctx.course_id = id;
  }

  const courseId = pathname.match(new RegExp(`/courses?/${UUID_REGEX_PATTERN}`, "i"));
  if (courseId && !ctx.course_id) ctx.course_id = courseId[1];

  return ctx;
}

export function GlobalAIBubble() {
  const { talent } = useTalent();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const onInstructorRoute = location.pathname.startsWith("/app/instructor");

  // --- SENSOR: COACH_METADATA_QUERY_NODE ---
  const { data: coachData } = useQuery<CoachMetadata, Error>({
    queryKey: ["coach-agent-metadata", talent?.id],
    enabled: !!talent?.id && !onInstructorRoute,
    staleTime: 10 * 60 * 1000, // 10-minute profile config residency ceiling
    queryFn: async (): Promise<CoachMetadata> => {
      const { data: profileRow, error: profileError } = await supabase
        .from("talents")
        .select("career_coach_instructor_id")
        .eq("id", talent!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      const coachId = (profileRow as any)?.career_coach_instructor_id;

      if (coachId) {
        const { data: instructorRow, error: instructorError } = await supabase
          .from("ai_instructors")
          .select("name")
          .eq("id", coachId)
          .maybeSingle();

        if (instructorError) throw instructorError;
        if (instructorRow?.name) {
          return { agentKey: `instructor:${coachId}`, agentName: String(instructorRow.name) };
        }
      }

      return { agentKey: "ai-general", agentName: "AI Assistant" };
    },
  });

  // Computed configuration parameters separating router-level states cleanly
  const { agentKey, agentName } = useMemo((): CoachMetadata => {
    if (onInstructorRoute) {
      return { agentKey: "instructor_manager", agentName: "Maestro" };
    }
    return coachData || { agentKey: "ai-general", agentName: "AI Assistant" };
  }, [onInstructorRoute, coachData]);

  // Handle auto-scroll shifts safely
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  // Securely intercept and sever network stream references upon panel unmounts
  useEffect(() => {
    return () => {
      if (activeReaderRef.current) {
        void activeReaderRef.current.cancel();
        activeReaderRef.current = null;
      }
    };
  }, []);

  // --- ACTION: ATOMIC_STREAM_SEND_CALLBACK ---
  const send = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || streaming) return;

    const userMessageId = `msg_user_${Date.now()}`;
    const assistantMessageId = `msg_ai_${Date.now()}`;

    const updatedMessages: Msg[] = [...messages, { id: userMessageId, role: "user", content: trimmedInput }];

    setMessages(updatedMessages);
    setInput("");
    setStreaming(true);

    try {
      const { data: sessionRes, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionRes.session?.access_token) {
        throw new Error("AUTHENTICATION_REQUIRED: Ingress token missing.");
      }

      const contextualPayload = await deriveContext(location.pathname);

      // HUD: COMMITTING_STREAM_CHAT_FETCH_HANDSHAKE
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionRes.session.access_token}`,
        },
        body: JSON.stringify({
          agentKey,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          context: contextualPayload,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const { message } = handleAIError(errData, res.status);
        toast.error(message);
        setMessages(messages);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("STREAM_INITIALIZATION_FAILED: Reader channel missing.");
      activeReaderRef.current = reader;

      const decoder = new TextDecoder();
      let accumulatedTextBuffer = "";
      const invalidationKeys = new Set<string>();

      setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

      // HUD: EXECUTING_REACTIVE_CHUNK_ITERATION_LOOP
      while (activeReaderRef.current) {
        const { done, value } = await activeReaderRef.current.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const textLines = chunkText.split("\n");

        for (const line of textLines) {
          if (!line.startsWith("data: ")) continue;
          const payloadString = line.slice(6).trim();
          if (payloadString === "[DONE]") break;

          try {
            const parsedChunk = JSON.parse(payloadString);

            // Core Operational Rule: Process background database invalidations seamlessly
            if (parsedChunk?.type === "invalidations" && Array.isArray(parsedChunk.keys)) {
              for (const key of parsedChunk.keys) invalidationKeys.add(String(key));
              continue;
            }

            const tokenFragment = parsedChunk.choices?.[0]?.delta?.content;
            if (tokenFragment) {
              accumulatedTextBuffer += tokenFragment;
              setMessages((prev) => {
                const copy = [...prev];
                const targetIdx = copy.findIndex((m) => m.id === assistantMessageId);
                if (targetIdx !== -1) {
                  copy[targetIdx] = { ...copy[targetIdx], content: accumulatedTextBuffer };
                }
                return copy;
              });
            }
          } catch {
            // Safe fallback logic catches processing text fragments
          }
        }
      }

      activeReaderRef.current = null;

      // HUD: COORD_PROGRAMMATIC_CACHE_INVALIDATIONS
      if (invalidationKeys.size > 0) {
        for (const key of invalidationKeys) {
          void queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
    } catch (err: any) {
      // Digital Workforce Anomaly Trigger: Essential for monitoring streaming agent dropouts
      console.error("[Digital Workforce] ANOMALY: GlobalAIBubble real-time chat pipeline drop.", {
        agentKey,
        message: err.message,
        timestamp: new Date().toISOString(),
      });
      toast.error(err?.message || "Chat interface connection dropped.");
      setMessages(messages);
    }
    {
      setStreaming(false);
    }
  }, [input, messages, streaming, agentKey, location.pathname, queryClient]);

  if (!talent?.id) return null;

  return createPortal(
    <>
      {/* FAB TRIGGER */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AI Assistant"
          className="fixed z-[60] right-4 rounded-full h-14 w-14 bg-gradient-to-br from-primary to-blue-600 shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          style={{ bottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
        >
          <Sparkles className="h-6 w-6 text-white animate-pulse" />
        </button>
      )}

      {/* CORE ASSISTANT CONSOLE INTERFACE PANEL */}
      {open && (
        <div
          className="fixed z-[60] right-2 left-2 md:left-auto md:right-4 md:w-[380px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden select-none text-left animate-in fade-in duration-300"
          style={{
            bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
            top: "80px",
            maxHeight: "calc(100dvh - 160px)",
          }}
        >
          {/* HEADER SECTOR */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{agentName}</div>
                <div className="text-[10px] font-mono opacity-80 tracking-wide uppercase">
                  AI-powered • context-aware
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* CHAT THREAD VIEW */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/20 scroll-smooth">
            {messages.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-12 italic font-medium">
                <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary/60 animate-pulse" />
                Hi! I'm here to help. Ask me anything about jobs, gigs, courses, or your career.
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full animate-in fade-in duration-200",
                    isUser ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm font-medium leading-relaxed shadow-sm",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border border-border rounded-bl-sm text-foreground",
                    )}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*]:my-1 break-words italic">
                        <ReactMarkdown>{msg.content || "…"}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {streaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start animate-in fade-in duration-100">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* COMPOSER EDITOR INPUT BOX */}
          <div className="p-2 border-t border-border bg-card">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                disabled={streaming}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                placeholder="Ask anything…"
                className="resize-none min-h-[40px] max-h-[120px] text-sm rounded-xl focus-visible:ring-1 border-2 disabled:opacity-50"
              />
              <Button
                size="icon"
                type="button"
                onClick={() => void send()}
                disabled={streaming || !input.trim()}
                className="rounded-xl flex-shrink-0 h-10 w-10 shadow-md"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
