/**
 * Curated B2B agent catalog for Gro10x. Mirrors the agent_key values seeded
 * into ai_agents. After Phase B3, this points to the **armed personas**
 * (company_recruiter, company_talent_scout, company_billing, company_ops,
 * company_growth) so the UI surfaces agents that actually have tools wired up.
 *
 * Note: "concierge" stays as the Atlas router until it gets routing tools.
 */
export interface Gro10xAgent {
  key: string;
  name: string;
  desc: string;
  emoji: string;
  goals: string[];
}

export const GRO10X_AGENTS: Gro10xAgent[] = [
  { key: "concierge",            name: "Atlas",            desc: "Your Gro10x concierge — routes you to the right agent", emoji: "🧭", goals: ["explore"] },
  { key: "company_recruiter",    name: "Recruiter Riya",   desc: "Post jobs, screen applicants, move the Kanban",         emoji: "👥", goals: ["hire"] },
  { key: "company_talent_scout", name: "Talent Scout Maya",desc: "Search candidates, reveal contacts, build shortlists",  emoji: "🔍", goals: ["hire"] },
  { key: "company_ops",          name: "Ops Omar",         desc: "Company profile, teammates, gig bids & contracts",      emoji: "⚙️", goals: ["ops"] },
  { key: "company_billing",      name: "Billing Bilal",    desc: "Credits, invoices, top-ups",                            emoji: "💳", goals: ["ops"] },
  { key: "company_growth",       name: "Growth Aiden",     desc: "Draft & publish on the company feed, track signal",     emoji: "📈", goals: ["sell_b2b"] },
];

export const AGENT_BY_KEY: Record<string, Gro10xAgent> = Object.fromEntries(
  GRO10X_AGENTS.map((a) => [a.key, a])
);

/** Safe lookup with a sensible fallback so unknown keys never break the UI. */
export function getAgentMeta(key: string): Gro10xAgent {
  return (
    AGENT_BY_KEY[key] ?? {
      key,
      name: key,
      desc: "AI agent",
      emoji: "🤖",
      goals: [],
    }
  );
}
