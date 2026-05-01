import { Link } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";

/**
 * Gro10x Inbox — WhatsApp-style list of agent contacts.
 * v1: static curated list. Next iteration: pull pinned agents from
 * `company_agents` and unread counts from `agent_threads`.
 */

const PINNED = [
  { key: "concierge",  name: "Concierge",       sub: "Tap me — I'll route your request to the right agent.", emoji: "🧭" },
  { key: "recruiter",  name: "Recruiter Agent", sub: "Draft a job, source candidates, post in 60 seconds.",  emoji: "👥" },
  { key: "growth",     name: "Growth Agent",    sub: "Compose outreach, post on the company feed.",          emoji: "📈" },
  { key: "billing",    name: "Billing Agent",   sub: "Top up credits, view invoices, manage seats.",         emoji: "💳" },
  { key: "ops",        name: "Ops Agent",       sub: "Update company hours, logo, page details.",            emoji: "⚙️" },
];

export default function Gro10xInbox() {
  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
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
              type="text"
              placeholder="Search agents or chats"
              className="flex-1 bg-transparent text-sm placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* Pinned section label */}
      <p className={`px-4 pt-3 pb-2 text-[11px] uppercase tracking-wider ${GRO10X_MUTED}`}>
        Pinned for you
      </p>

      {/* Agent rows */}
      <ul className="divide-y divide-white/5">
        {PINNED.map((a) => (
          <li key={a.key}>
            <Link
              to={`/gro10x/c/${a.key}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div
                className={`h-12 w-12 rounded-full ${GRO10X_PANEL} grid place-items-center text-2xl border border-white/10`}
                aria-hidden
              >
                {a.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium truncate">{a.name}</p>
                  <span className="text-[10px] text-slate-500">now</span>
                </div>
                <p className="text-sm text-slate-400 truncate">{a.sub}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="px-4 py-6">
        <Link
          to="/gro10x/agents"
          className="block text-center text-sm text-[#33E1E4] hover:underline"
        >
          Browse all agents →
        </Link>
      </div>
    </div>
  );
}
