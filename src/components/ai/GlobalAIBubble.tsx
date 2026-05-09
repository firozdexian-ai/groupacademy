import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, X, Send, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { handleAIError } from "@/lib/aiErrorHandler";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

/**
 * GlobalAIBubble — floating FAB available on every /app page.
 * Defaults to the talent's assigned Career Coach (instructor:<id>),
 * fallback to ai-general. Passes page context (job_id/gig_id/course_id)
 * derived from the current route so tools execute against the right entity.
 */

interface Msg { role: "user" | "assistant"; content: string }

// Slug → UUID cache so we don't hit the DB on every keystroke
const slugIdCache = new Map<string, string>();

async function resolveCourseIdFromSlug(slug: string): Promise<string | null> {
  if (slugIdCache.has(slug)) return slugIdCache.get(slug)!;
  const { data } = await supabase.from("content").select("id").eq("slug", slug).maybeSingle();
  const id = (data as any)?.id ?? null;
  if (id) slugIdCache.set(slug, id);
  return id;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

async function deriveContext(pathname: string): Promise<Record<string, string>> {
  const ctx: Record<string, string> = {};
  // /app/jobs/:id and PublicJobDetail
  const job = pathname.match(new RegExp(`/app/jobs/(${UUID})`, "i"));
  if (job) ctx.job_id = job[1];
  // Marketplace gigs live at /app/marketplace/:id (canonical) and legacy /app/gigs/marketplace/:id
  const mkt = pathname.match(new RegExp(`/app/marketplace/(${UUID})`, "i"));
  if (mkt) { ctx.gig_id = mkt[1]; ctx.gig_kind = "marketplace"; }
  const gig = pathname.match(new RegExp(`/app/gigs/(?:marketplace/)?(${UUID})`, "i"));
  if (gig && !ctx.gig_id) {
    ctx.gig_id = gig[1];
    ctx.gig_kind = pathname.includes("/marketplace/") ? "marketplace" : "quick";
  }
  // Course routes use SLUGS: /app/learning/courses/:slug. Resolve to UUID.
  const courseSlug = pathname.match(/\/app\/learning\/courses\/([^/?#]+)/i);
  if (courseSlug) {
    const id = await resolveCourseIdFromSlug(courseSlug[1]);
    if (id) ctx.course_id = id;
  }
  // Direct UUID-style course routes (defensive)
  const courseId = pathname.match(new RegExp(`/courses?/(${UUID})`, "i"));
  if (courseId && !ctx.course_id) ctx.course_id = courseId[1];
  return ctx;
}

export function GlobalAIBubble() {
  const { talent } = useTalent();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [agentKey, setAgentKey] = useState<string>("ai-general");
  const [agentName, setAgentName] = useState<string>("AI Assistant");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Resolve agent — Maestro on /app/instructor/*, otherwise the talent's coach.
  useEffect(() => {
    const onInstructor = location.pathname.startsWith("/app/instructor");
    if (onInstructor) {
      setAgentKey("instructor_manager");
      setAgentName("Maestro");
      return;
    }
    if (!talent?.id) return;
    let cancelled = false;
    (async () => {
      const { data: t } = await supabase
        .from("talents")
        .select("career_coach_instructor_id")
        .eq("id", talent.id)
        .maybeSingle();
      const coachId = (t as any)?.career_coach_instructor_id;
      if (cancelled) return;
      if (coachId) {
        setAgentKey(`instructor:${coachId}`);
        const { data: ai } = await supabase
          .from("ai_instructors")
          .select("name")
          .eq("id", coachId)
          .maybeSingle();
        if (!cancelled && ai?.name) setAgentName(ai.name);
      } else {
        setAgentKey("ai-general");
        setAgentName("AI Assistant");
      }
    })();
    return () => { cancelled = true; };
  }, [talent?.id, location.pathname]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const ctx = await deriveContext(location.pathname);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          agentKey,
          messages: next.map(m => ({ role: m.role, content: m.content })),
          context: ctx,
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
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      const invalidationKeys = new Set<string>();
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            // Tool-driven invalidation hint frame
            if (parsed?.type === "invalidations" && Array.isArray(parsed.keys)) {
              for (const k of parsed.keys) invalidationKeys.add(String(k));
              continue;
            }
            const tok = parsed.choices?.[0]?.delta?.content;
            if (tok) {
              buffer += tok;
              setMessages(prev => {
                const u = [...prev];
                u[u.length - 1] = { role: "assistant", content: buffer };
                return u;
              });
            }
          } catch { /* fragment */ }
        }
      }

      // Refresh affected lists so the UI updates without a hard reload
      if (invalidationKeys.size > 0) {
        for (const k of invalidationKeys) {
          queryClient.invalidateQueries({ queryKey: [k] });
        }
      }
    } catch (e: any) {
      console.error("[GlobalAIBubble]", e);
      toast.error(e?.message || "Chat failed");
      setMessages(messages);
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming, agentKey, location.pathname, queryClient]);

  // Don't show if no talent (auth/onboarding)
  if (!talent?.id) return null;

  return createPortal(
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI Assistant"
          className="fixed z-[60] right-4 rounded-full h-14 w-14 bg-gradient-to-br from-primary to-blue-600 shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          style={{ bottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
        >
          <Sparkles className="h-6 w-6 text-white animate-pulse" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed z-[60] right-2 left-2 md:left-auto md:right-4 md:w-[380px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
            top: "80px",
            maxHeight: "calc(100dvh - 160px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{agentName}</div>
                <div className="text-[10px] opacity-80">AI-powered • context-aware</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/20">
            {messages.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8">
                <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary/60" />
                Hi! I'm here to help. Ask me anything about jobs, gigs, courses, or your career.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*]:my-1">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </div>
            ))}
            {streaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="p-2 border-t border-border bg-card">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask anything…"
                className="resize-none min-h-[40px] max-h-[120px] text-sm rounded-xl"
                disabled={streaming}
              />
              <Button
                size="icon"
                onClick={send}
                disabled={streaming || !input.trim()}
                className="rounded-xl flex-shrink-0"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
