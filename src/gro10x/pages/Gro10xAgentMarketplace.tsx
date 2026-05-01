import { Link } from "react-router-dom";
import { GRO10X_MUTED, PRO_GOALS } from "../lib/tokens";

const ALL_AGENTS = [
  { key: "concierge",       name: "Concierge",        desc: "Routes you to the right agent",         emoji: "🧭" },
  { key: "recruiter",       name: "Recruiter",        desc: "Job drafts, postings, screening",       emoji: "👥" },
  { key: "sourcer",         name: "Sourcer",          desc: "Find candidates from talent network",   emoji: "🔍" },
  { key: "outreach",        name: "Outreach Writer",  desc: "Personalized candidate / lead emails",  emoji: "✉️" },
  { key: "growth",          name: "Growth Agent",     desc: "Post on company feed, draft campaigns", emoji: "📈" },
  { key: "lead_hunter",     name: "Lead Hunter",      desc: "Find B2B prospects matching ICP",       emoji: "🎯" },
  { key: "crm",             name: "CRM Agent",        desc: "Track conversations, follow-ups",       emoji: "🗂" },
  { key: "gig_finder",      name: "Gig Finder",       desc: "Source freelancers fast",               emoji: "🛠" },
  { key: "briefing",        name: "Briefing Agent",   desc: "Turn ideas into clear gig briefs",      emoji: "📋" },
  { key: "billing",         name: "Billing Agent",    desc: "Credits, invoices, top-ups",            emoji: "💳" },
  { key: "ops",             name: "Ops Agent",        desc: "Update company page, hours, logo",      emoji: "⚙️" },
  { key: "calendar",        name: "Calendar Agent",   desc: "Schedule calls, syncs",                 emoji: "📅" },
];

export default function Gro10xAgentMarketplace() {
  return (
    <div className="max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <h1 className="text-xl font-semibold tracking-tight">Agent Marketplace</h1>
        <p className={`text-xs ${GRO10X_MUTED}`}>Pin agents to your inbox — chat to get things done</p>
      </header>

      <p className={`px-4 pt-4 pb-2 text-[11px] uppercase tracking-wider ${GRO10X_MUTED}`}>
        By goal
      </p>
      <div className="px-4 flex flex-wrap gap-2 mb-3">
        {PRO_GOALS.map((g) => (
          <span
            key={g.key}
            className="px-3 py-1.5 rounded-full bg-white/5 text-xs border border-white/10"
          >
            {g.emoji} {g.label}
          </span>
        ))}
      </div>

      <ul className="divide-y divide-white/5">
        {ALL_AGENTS.map((a) => (
          <li key={a.key}>
            <Link
              to={`/gro10x/c/${a.key}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5"
            >
              <div className="h-11 w-11 rounded-full bg-[#0F172A] border border-white/10 grid place-items-center text-xl">
                {a.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-slate-400 truncate">{a.desc}</p>
              </div>
              <span className="text-[#33E1E4] text-xs">Open →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
