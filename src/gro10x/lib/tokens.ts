/**
 * Gro10x design tokens — kept minimal and self-contained so the shell
 * looks distinct from GroUp Academy without forking the entire theme.
 * Uses HSL semantic vars matching the rest of the app where useful.
 */
export const GRO10X_BG = "bg-[#0B1220]";
export const GRO10X_PANEL = "bg-[#0F172A]";
export const GRO10X_BORDER = "border-white/5";
export const GRO10X_TEXT = "text-slate-100";
export const GRO10X_MUTED = "text-slate-400";
export const GRO10X_ACCENT = "text-[#33E1E4]";
export const GRO10X_ACCENT_BG = "bg-[#33E1E4]";
export const GRO10X_ACCENT_RING = "ring-[#33E1E4]";

export const PRO_GOALS = [
  { key: "hire",      label: "Hire people",                emoji: "👥" },
  { key: "freelance", label: "Find freelancers / gigs",    emoji: "🛠" },
  { key: "sell_b2b",  label: "Sell to companies",          emoji: "📈" },
  { key: "train",     label: "Train my team",              emoji: "🎓" },
  { key: "ops",       label: "Run ops, billing, admin",    emoji: "⚙️" },
  { key: "explore",   label: "Just exploring",             emoji: "🧭" },
] as const;

export type ProGoalKey = typeof PRO_GOALS[number]["key"];

/** Maps a goal to the agents that should be pre-pinned in the inbox. */
export const GOAL_TO_AGENTS: Record<ProGoalKey, string[]> = {
  hire:      ["recruiter", "sourcer", "outreach"],
  freelance: ["gig_finder", "briefing", "escrow"],
  sell_b2b:  ["lead_hunter", "outreach_writer", "crm"],
  train:     ["curriculum", "cohort_manager", "progress_tracker"],
  ops:       ["billing", "ops", "calendar"],
  explore:   ["concierge"],
};

export const DEFAULT_PINNED_AGENTS = ["concierge", "recruiter"];
