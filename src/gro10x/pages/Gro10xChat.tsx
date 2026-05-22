import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";
import { useGro10xThreads } from "../hooks/useGro10xThreads";
import { useAgentRuntime, type AgentRuntimeContext } from "@/domains/agents/hooks/useAgentRuntime";
import { getAgentMeta } from "../lib/agents";
import { GRO10X_PANEL } from "../lib/tokens";

/**
 * Gro10x Chat — wires the Gro10x agent_key to the unified agent-runtime
 * with subject={kind:"company", id:companyId}. Bumps gro10x_agent_threads
 * after each exchange so the inbox stays sorted.
 *
 * Phase B3: derives page context (job_id, application_id, gig_id, bid_id,
 * talent_id) from URL params + query string and forwards it to the runtime
 * so the AI knows what the employer is looking at.
 */
export default function Gro10xChat() {
  const { agentKey = "concierge" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { companyId, bumpThread, markRead, pinAgent } = useGro10xThreads();
  const meta = getAgentMeta(agentKey);

  const subject = companyId ? ({ kind: "company", id: companyId } as const) : undefined;
  const contextProvider = useCallback((): AgentRuntimeContext => {
    const ctx: AgentRuntimeContext = { route: location.pathname + location.search };
    const keys = ["job_id", "jobId", "application_id", "applicationId", "gig_id", "gigId", "bid_id", "bidId", "talent_id", "talentId"];
    for (const k of keys) {
      const v = searchParams.get(k);
      if (v) {
        const norm = k.replace(/Id$/, "_id");
        ctx[norm] = v;
      }
    }
    return ctx;
  }, [location.pathname, location.search, searchParams]);
  const runtime = useAgentRuntime(subject as any, contextProvider);
  const { messages, isStreaming, sendMessage, startOrResumeSession } = runtime;

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!companyId || startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      // Ensure inbox row exists (pin) so the chat shows up after first send
      await pinAgent(agentKey);
      await startOrResumeSession(agentKey);
      await markRead(agentKey);
    })();
  }, [companyId, agentKey, startOrResumeSession, markRead, pinAgent]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isStreaming]);

  // Bump the inbox preview only when the assistant has finished replying.
  useEffect(() => {
    if (isStreaming) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || !last.content) return;
    void bumpThread(agentKey, last.content.slice(0, 200));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage(text);
  };

  if (!user) {
    return (
      <div className="max-w-md md:max-w-5xl mx-auto p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">Sign in to chat with this agent.</p>
        <button
          onClick={() => navigate("/gro10x/auth")}
          className="rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-sm font-semibold"
        >
          Get started
        </button>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="max-w-md md:max-w-5xl mx-auto p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">Set up your company workspace to chat.</p>
        <button
          onClick={() => navigate("/gro10x/auth")}
          className="rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-sm font-semibold"
        >
          Set up workspace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md md:max-w-5xl mx-auto min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-3 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/gro10x/inbox")}
          className="rounded-full p-2 hover:bg-white/5"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="h-9 w-9 rounded-full bg-[#0F172A] grid place-items-center border border-white/10 text-lg">
          {meta.emoji}
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{meta.name}</p>
          <p className="text-[11px] text-slate-400 truncate">{meta.desc}</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {messages.length === 0 && !isStreaming && (
          <div className={`rounded-2xl rounded-tl-sm ${GRO10X_PANEL} border border-white/5 p-3 max-w-[85%] text-sm`}>
            Hi — I'm <strong>{meta.name}</strong>. {meta.desc}. What would you like to do?
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto rounded-2xl rounded-tr-sm bg-[#33E1E4] text-[#06121A] p-3 max-w-[85%] text-sm whitespace-pre-wrap"
                : `rounded-2xl rounded-tl-sm ${GRO10X_PANEL} border border-white/5 p-3 max-w-[85%] text-sm prose prose-invert prose-sm max-w-none`
            }
          >
            {m.role === "assistant" ? (
              <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
            ) : (
              m.content
            )}
          </div>
        ))}
      </div>

      <footer className="sticky bottom-0 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 bg-[#0B1220]/95 backdrop-blur-md">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 border border-white/10">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            type="text"
            placeholder={`Message ${meta.name}…`}
            className="flex-1 bg-transparent text-sm placeholder:text-slate-500 focus:outline-none py-2"
            disabled={isStreaming}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isStreaming}
            className="rounded-full bg-[#33E1E4] text-[#06121A] p-2 disabled:opacity-40 hover:opacity-90"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
