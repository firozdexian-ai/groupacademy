import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Building2 } from "lucide-react";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { useGro10xThreads } from "../hooks/useGro10xThreads";
import { AGENT_BY_KEY } from "../lib/agents";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Gro10xInbox() {
  const { user } = useAuth();
  const { threads, loading, companyId } = useGro10xThreads();
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!q.trim()) return threads;
    const needle = q.toLowerCase();
    return threads.filter((t) => {
      const meta = AGENT_BY_KEY[t.agent_key];
      return (
        t.agent_key.includes(needle) ||
        meta?.name.toLowerCase().includes(needle) ||
        (t.last_message ?? "").toLowerCase().includes(needle)
      );
    });
  }, [threads, q]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-sm text-slate-400 mb-4">Sign in to see your agent inbox.</p>
        <button
          onClick={() => navigate("/gro10x/auth")}
          className="rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-sm font-semibold"
        >
          Get started
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Gro10x</h1>
            <p className={`text-xs ${GRO10X_MUTED}`}>Your professional inbox</p>
          </div>
          <Link
            to="/gro10x/agents"
            className="rounded-full bg-[#33E1E4] text-[#06121A] p-2 hover:opacity-90"
            aria-label="Add agent"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder="Search agents or chats"
              className="flex-1 bg-transparent text-sm placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </header>

      {loading && (
        <div className="px-4 py-8 text-center text-sm text-slate-400">Loading your inbox…</div>
      )}

      {!loading && !companyId && (
        <div className="px-4 py-10 text-center">
          <Building2 className="h-10 w-10 mx-auto text-slate-500 mb-3" />
          <p className="text-sm text-slate-400">
            You're not connected to a company workspace yet.
          </p>
          <button
            onClick={() => navigate("/gro10x/auth")}
            className="mt-4 rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-sm font-semibold"
          >
            Set up your workspace
          </button>
        </div>
      )}

      {!loading && companyId && filtered.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-slate-400">
          No agents pinned yet.{" "}
          <Link to="/gro10x/agents" className="text-[#33E1E4] hover:underline">
            Browse agents →
          </Link>
        </div>
      )}

      {!loading && companyId && filtered.length > 0 && (
        <>
          <p className={`px-4 pt-3 pb-2 text-[11px] uppercase tracking-wider ${GRO10X_MUTED}`}>
            Pinned for you
          </p>
          <ul className="divide-y divide-white/5">
            {filtered.map((t) => {
              const meta = AGENT_BY_KEY[t.agent_key] ?? {
                name: t.agent_key,
                desc: "AI agent",
                emoji: "🤖",
              };
              return (
                <li key={t.id}>
                  <Link
                    to={`/gro10x/c/${t.agent_key}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div
                      className={`h-12 w-12 rounded-full ${GRO10X_PANEL} grid place-items-center text-2xl border border-white/10 relative`}
                    >
                      {meta.emoji}
                      {t.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-[#33E1E4] text-[#06121A] text-[10px] font-bold grid place-items-center">
                          {t.unread_count > 9 ? "9+" : t.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-medium truncate">{meta.name}</p>
                        <span className="text-[10px] text-slate-500">
                          {formatTime(t.last_message_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 truncate">
                        {t.last_message || meta.desc}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {companyId && (
        <div className="px-4 py-6">
          <Link
            to="/gro10x/agents"
            className="block text-center text-sm text-[#33E1E4] hover:underline"
          >
            Browse all agents →
          </Link>
        </div>
      )}
    </div>
  );
}
