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

function deriveContext(pathname: string): Record<string, string> {
  const ctx: Record<string, string> = {};
  // /app/jobs/:id  /app/jobs/123  PublicJobDetail too
  const job = pathname.match(/\/app\/jobs\/([0-9a-f-]{8,})/i);
  if (job) ctx.job_id = job[1];
  // /app/gigs/marketplace/:id or /app/gigs/:id
  const gig = pathname.match(/\/app\/gigs\/(?:marketplace\/)?([0-9a-f-]{8,})/i);
  if (gig) {
    ctx.gig_id = gig[1];
    ctx.gig_kind = pathname.includes("/marketplace/") ? "marketplace" : "quick";
  }
  // /app/learning/courses/:id  /app/courses/:id
  const course = pathname.match(/\/(?:learning\/)?courses?\/([0-9a-f-]{8,})/i);
  if (course) ctx.course_id = course[1];
  return ctx;
}

export function GlobalAIBubble() {
  const { talent } = useTalent();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [agentKey, setAgentKey] = useState<string>("ai-general");
  const [agentName, setAgentName] = useState<string>("AI Assistant");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Resolve coach
  useEffect(() => {
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
      }
    })();
    return () => { cancelled = true; };
  }, [talent?.id]);

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

      const ctx = deriveContext(location.pathname);
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
    } catch (e: any) {
      console.error("[GlobalAIBubble]", e);
      toast.error(e?.message || "Chat failed");
      setMessages(messages);
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming, agentKey, location.pathname]);

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
