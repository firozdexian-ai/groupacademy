import { useNavigate } from "react-router-dom";
import { GRO10X_MUTED, PRO_GOALS } from "../lib/tokens";
import { GRO10X_AGENTS } from "../lib/agents";
import { useGro10xThreads } from "../hooks/useGro10xThreads";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

export default function Gro10xAgentMarketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { threads, pinAgent, companyId } = useGro10xThreads();
  const pinnedKeys = new Set(threads.map((t) => t.agent_key));
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const handlePin = async (key: string) => {
    if (!user) {
      navigate("/gro10x/auth");
      return;
    }
    if (!companyId) {
      toast.error("Set up your company workspace first");
      navigate("/gro10x/auth");
      return;
    }
    setBusy(key);
    try {
      const t = await pinAgent(key);
      if (t) {
        toast.success(`Pinned to your inbox`);
        navigate(`/gro10x/c/${key}`);
      } else {
        toast.error("Could not pin agent");
      }
    } finally {
      setBusy(null);
    }
  };

  const visible = filter
    ? GRO10X_AGENTS.filter((a) => a.goals.includes(filter))
    : GRO10X_AGENTS;

  return (
    <div className="max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <h1 className="text-xl font-semibold tracking-tight">Agent Network</h1>
        <p className={`text-xs ${GRO10X_MUTED}`}>Pin agents to your inbox — chat to get things done</p>
      </header>

      <p className={`px-4 pt-4 pb-2 text-[11px] uppercase tracking-wider ${GRO10X_MUTED}`}>
        By goal
      </p>
      <div className="px-4 flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs border ${
            filter === null
              ? "bg-[#33E1E4] text-[#06121A] border-[#33E1E4]"
              : "bg-white/5 border-white/10 text-slate-200"
          }`}
        >
          All
        </button>
        {PRO_GOALS.map((g) => (
          <button
            key={g.key}
            onClick={() => setFilter(g.key)}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              filter === g.key
                ? "bg-[#33E1E4] text-[#06121A] border-[#33E1E4]"
                : "bg-white/5 border-white/10 text-slate-200"
            }`}
          >
            {g.emoji} {g.label}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-white/5">
        {visible.map((a) => {
          const isPinned = pinnedKeys.has(a.key);
          return (
            <li key={a.key}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-11 w-11 rounded-full bg-[#0F172A] border border-white/10 grid place-items-center text-xl">
                  {a.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-slate-400 truncate">{a.desc}</p>
                </div>
                {isPinned ? (
                  <button
                    onClick={() => navigate(`/gro10x/c/${a.key}`)}
                    className="text-[#33E1E4] text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
                  >
                    Open
                  </button>
                ) : (
                  <button
                    disabled={busy === a.key}
                    onClick={() => handlePin(a.key)}
                    className="text-[#06121A] text-xs px-3 py-1.5 rounded-full bg-[#33E1E4] font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {busy === a.key ? "Pinning…" : "+ Pin"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
