import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Gro10x Chat shell — v1 placeholder. Next iteration: mount the existing
 * useAgentRuntime with subject={kind:"company", id:companyId} and the
 * agentKey from the route param, plus an action-confirm bar for actions
 * like "Post draft to feed" or "Publish job".
 */
export default function Gro10xChat() {
  const { agentKey = "concierge" } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-3 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 hover:bg-white/5"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="h-9 w-9 rounded-full bg-[#0F172A] grid place-items-center border border-white/10">
          🤖
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate capitalize">{agentKey.replace(/_/g, " ")}</p>
          <p className="text-[11px] text-slate-400">AI agent · always online</p>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 space-y-3">
        <div className="rounded-2xl rounded-tl-sm bg-[#0F172A] border border-white/5 p-3 max-w-[85%] text-sm">
          Hi! I'm your <span className="capitalize">{agentKey.replace(/_/g, " ")}</span> agent. Tell me what
          you need and I'll get it done. (Live chat is wiring up — connect your company workspace to start.)
        </div>
      </div>

      <footer className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] px-3 pb-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-3">
          <input
            type="text"
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm placeholder:text-slate-500 focus:outline-none"
            disabled
          />
          <span className="text-[11px] text-slate-500">soon</span>
        </div>
      </footer>
    </div>
  );
}
