/**
 * ============================================================================
 * ⚠️  DEPRECATED — DO NOT ADD NEW AGENTS HERE  ⚠️
 * ============================================================================
 *
 * This hardcoded registry is being migrated to the `ai_agents` table
 * (agent_type = 'admin'). New agents MUST be seeded into the database;
 * the Agentic Dashboard sidebar now reads from `useAdminAgents` (DB-backed).
 *
 * Batch 1 (Executive Council — already seeded to DB):
 *   - nia-analyst       (was: business-analyst)
 *   - report-builder
 *   - aisha-analyst     (was: talent-aisha)
 *   - agent-manager
 *
 * This file is retained ONLY as a fallback meta-map (functionName, icon,
 * accent, suggestions) for legacy keys still consumed by `useAdminChatThread`
 * and `DashboardChat`. It will be deleted once all 32 agents are migrated
 * and `personality_traits.functionName` + `sample_conversations` carry the
 * full meta payload from the DB.
 *
 * ============================================================================
 */
import {
  Sparkles,
  Users,
  UserCog,
  Send,
  Building2,
  Briefcase,
  Mail,
  Bot,
  Landmark,
  Handshake,
  BarChart3,
  School,
  Coins,
  type LucideIcon,
} from "lucide-react";

export interface AdminAgent {
  key: string;            // stable id, also used as agent_key in DB
  functionName: string;   // edge function to invoke
  name: string;
  tagline: string;
  icon: LucideIcon;
  accent: string;         // tailwind color class for avatar bg
  suggestions: string[];
}

export const ADMIN_AGENTS: AdminAgent[] = [
  {
    key: "business-analyst",
    functionName: "admin-analyst",
    name: "Nia",
    tagline: "Business Analyst · platform metrics & revenue",
    icon: Sparkles,
    accent: "bg-primary/15 text-primary",
    suggestions: [
      "How many transactions happened today?",
      "Revenue this month vs last month",
      "Top 10 countries by talents this quarter",
      "Top services by revenue, lifetime",
    ],
  },
  {
    key: "report-builder",
    functionName: "admin-report-builder",
    name: "Report Builder",
    tagline: "Reports · charts · weekly digests",
    icon: BarChart3,
    accent: "bg-teal-500/15 text-teal-500",
    suggestions: [
      "Build a weekly revenue & signups report",
      "Generate a Q-on-Q growth digest",
      "Make a one-pager summary for the leadership meeting",
    ],
  },
  {
    key: "talent-aisha",
    functionName: "admin-aisha-analyst",
    name: "Aisha",
    tagline: "Talent Success · pool insights & matching",
    icon: Users,
    accent: "bg-pink-500/15 text-pink-500",
    suggestions: [
      "Show me new talent signups this week",
      "Which talents are top matches for software engineering roles?",
      "Talent pool breakdown by country",
    ],
  },
  {
    key: "talent-ai-general",
    functionName: "admin-ai-general-analyst",
    name: "AI General (Talent)",
    tagline: "Cross-platform concierge for the talent side",
    icon: Bot,
    accent: "bg-cyan-500/15 text-cyan-500",
    suggestions: [
      "Summarize career-services activity this week",
      "Where is talent engagement strongest?",
    ],
  },
  {
    key: "talent-outreach",
    functionName: "admin-talent-outreach",
    name: "Talent Outreach Exec",
    tagline: "Drafts personal outreach to candidates",
    icon: Send,
    accent: "bg-emerald-500/15 text-emerald-500",
    suggestions: [
      "Draft a re-engagement message for inactive talents",
      "Outreach for high-potential candidates from Bangladesh",
    ],
  },
  {
    key: "companies-riya",
    functionName: "admin-riya-analyst",
    name: "Riya",
    tagline: "Companies Analyst · employer pipeline",
    icon: Building2,
    accent: "bg-blue-500/15 text-blue-500",
    suggestions: [
      "Top hiring companies this month",
      "Industry breakdown of registered companies",
      "Companies with most active job posts",
    ],
  },
  {
    key: "companies-ai-general",
    functionName: "admin-company-ai-general-analyst",
    name: "AI General (Companies)",
    tagline: "Concierge for the companies stakeholder",
    icon: Bot,
    accent: "bg-violet-500/15 text-violet-500",
    suggestions: [
      "How many company contacts joined Gro10x this week?",
      "Summarize B2B engagement",
    ],
  },
  {
    key: "companies-outreach",
    functionName: "admin-company-outreach",
    name: "Company Outreach Exec",
    tagline: "Drafts B2B outreach (mailto-only)",
    icon: Mail,
    accent: "bg-orange-500/15 text-orange-500",
    suggestions: [
      "Draft outreach to top 5 hiring companies in Dhaka",
      "Onboarding email for HR contacts in fintech",
    ],
  },
  {
    key: "agent-manager",
    functionName: "admin-agent-manager",
    name: "Agent Manager",
    tagline: "Agent OS health, runs & credits",
    icon: UserCog,
    accent: "bg-indigo-500/15 text-indigo-500",
    suggestions: [
      "Which agents drove the most credits this week?",
      "Show recent agent runs and failures",
      "Tools registry overview",
    ],
  },
  {
    key: "ir-fpa",
    functionName: "admin-ir-fpa-analyst",
    name: "FP&A Agent",
    tagline: "Fundraising · MRR/ARR · runway",
    icon: Landmark,
    accent: "bg-amber-500/15 text-amber-500",
    suggestions: [
      "What is our current MRR and runway?",
      "Service mix breakdown for the pitch deck",
      "Suggest a fundraising narrative for seed round",
    ],
  },
  {
    key: "ir-relationship-exec",
    functionName: "admin-ir-relationship-exec",
    name: "Relationship Exec",
    tagline: "Investor & VIP outreach (mailto)",
    icon: Handshake,
    accent: "bg-rose-500/15 text-rose-500",
    suggestions: [
      "Draft a monthly update email to investors",
      "Outreach to a strategic advisor about a warm intro",
      "Follow-up note for a recent VC meeting",
    ],
  },
  {
    key: "inst-outreach",
    functionName: "admin-inst-outreach",
    name: "Institutions Outreach Exec",
    tagline: "B2B drafts to universities & partner orgs (mailto)",
    icon: School,
    accent: "bg-sky-500/15 text-sky-500",
    suggestions: [
      "Draft outreach to top engineering universities in Bangladesh",
      "Partnership pitch for a training partner in fintech",
      "Re-engage a dormant university partner",
    ],
  },
  {
    key: "inst-analyst",
    functionName: "admin-inst-analyst",
    name: "Organizations Analyst",
    tagline: "Read-only analytics on institutions, clubs, reps & events",
    icon: Handshake,
    accent: "bg-fuchsia-500/15 text-fuchsia-500",
    suggestions: [
      "How many institutions are active this quarter?",
      "Top 5 institutions by representatives onboarded",
      "Upcoming events and competitions this month",
    ],
  },
  // ── Group 7 — Team & Workforce ─────────────────────────────────────
  {
    key: "hr-chro",
    functionName: "admin-hr-chro",
    name: "CHRO",
    tagline: "Org strategy, headcount planning, attrition insights",
    icon: UserCog,
    accent: "bg-indigo-500/15 text-indigo-500",
    suggestions: [
      "What's our current headcount by vertical?",
      "Suggest a hiring plan for next quarter",
      "Where are we most under-staffed?",
    ],
  },
  {
    key: "hr-onboarding",
    functionName: "admin-hr-onboarding",
    name: "HR Admin / Onboarding",
    tagline: "Onboarding checklists, document collection, day-1 prep",
    icon: UserCog,
    accent: "bg-violet-500/15 text-violet-500",
    suggestions: [
      "Generate an onboarding checklist for a new sales hire",
      "Who has pending onboarding tasks this week?",
    ],
  },
  {
    key: "hr-recruiter",
    functionName: "admin-hr-recruiter",
    name: "Recruiter",
    tagline: "Internal hiring drafts and candidate outreach (mailto)",
    icon: Send,
    accent: "bg-emerald-500/15 text-emerald-500",
    suggestions: [
      "Draft a recruiter reach-out for a senior backend engineer",
      "Write a short JD for a country manager role",
    ],
  },
  // ── Group 8 — GTM ──────────────────────────────────────────────────
  {
    key: "gtm-country",
    functionName: "admin-gtm-country",
    name: "Country Agent",
    tagline: "Per-country GTM analyst & outreach drafts",
    icon: Sparkles,
    accent: "bg-cyan-500/15 text-cyan-500",
    suggestions: [
      "How is Bangladesh performing this month?",
      "Draft a partner outreach email for the GCC cluster",
      "Top 5 cities by talent supply",
    ],
  },
  // ── Group 9 — UGC & Content drafting agents ────────────────────────
  {
    key: "ugc-video",
    functionName: "admin-ugc-video",
    name: "Free Video Agent",
    tagline: "Drafts titles, descriptions & captions for free videos",
    icon: Sparkles,
    accent: "bg-rose-500/15 text-rose-500",
    suggestions: [
      "Suggest 5 free-video topics for product managers",
      "Write a YouTube-style description for a Python tutorial",
    ],
  },
  {
    key: "ugc-blog",
    functionName: "admin-ugc-blog",
    name: "Blog Post Agent",
    tagline: "Drafts blog post outlines and full long-form content",
    icon: Sparkles,
    accent: "bg-amber-500/15 text-amber-500",
    suggestions: [
      "Outline a blog about acing data analyst interviews",
      "Write a 600-word post on remote work tips",
    ],
  },
  {
    key: "ugc-feed",
    functionName: "admin-ugc-feed",
    name: "Feed Post Agent",
    tagline: "Short social-style posts for the in-app feed",
    icon: Sparkles,
    accent: "bg-pink-500/15 text-pink-500",
    suggestions: [
      "Draft 3 feed posts about new courses launched",
      "Write a celebratory feed post for hiring milestones",
    ],
  },
  {
    key: "ugc-events",
    functionName: "admin-ugc-events",
    name: "Competition & Event Agent",
    tagline: "Drafts competition copy, prize structures & event briefs",
    icon: Sparkles,
    accent: "bg-orange-500/15 text-orange-500",
    suggestions: [
      "Plan a 7-day data viz competition",
      "Draft an event brief for a fintech meetup",
    ],
  },
  {
    key: "ugc-outreach",
    functionName: "admin-ugc-outreach",
    name: "UGC Outreach Agent",
    tagline: "Reach out to creators and content partners (mailto)",
    icon: Mail,
    accent: "bg-teal-500/15 text-teal-500",
    suggestions: [
      "Outreach to Bangla tech YouTubers for collabs",
      "Re-engage dormant content partners",
    ],
  },
  // ── Group 10 — Jobs ────────────────────────────────────────────────
  {
    key: "jobs-outreach",
    functionName: "admin-jobs-outreach",
    name: "Jobs Outreach Agent",
    tagline: "Drafts B2B emails to hiring managers & employers (mailto)",
    icon: Briefcase,
    accent: "bg-blue-500/15 text-blue-500",
    suggestions: [
      "Draft outreach to HR heads of fintech companies in Dhaka",
      "Re-engage employers who posted jobs 60+ days ago",
    ],
  },
  // ── Group 11 — Learn ───────────────────────────────────────────────
  {
    key: "learn-dean",
    functionName: "admin-learn-dean",
    name: "Academies & Schools Dean",
    tagline: "Instructor onboarding, school readiness & dean analytics",
    icon: School,
    accent: "bg-emerald-500/15 text-emerald-500",
    suggestions: [
      "Which schools are ready to launch this quarter?",
      "Suggest deans to invite for the FinTech academy",
    ],
  },
  // ── Group 12 — Gig Economy ─────────────────────────────────────────
  {
    key: "gig-ops",
    functionName: "admin-gig-ops",
    name: "Gig Ops Manager",
    tagline: "Approvals, pricing, payout & worker health",
    icon: Briefcase,
    accent: "bg-cyan-500/15 text-cyan-500",
    suggestions: [
      "Show pending submissions older than 48 hours",
      "Suggest pricing tiers for content gigs",
    ],
  },
  {
    key: "gig-category",
    functionName: "admin-gig-design",
    name: "Gig Category Agent",
    tagline: "Briefs and pricing across creative / dev / data / content gigs",
    icon: Sparkles,
    accent: "bg-fuchsia-500/15 text-fuchsia-500",
    suggestions: [
      "Draft a gig brief for a brand-identity project",
      "Suggest deliverables for a 5-page Figma redesign",
    ],
  },
  // ── Group 13 — Career Abroad ───────────────────────────────────────
  {
    key: "abroad-counselor",
    functionName: "admin-abroad-counselor",
    name: "Abroad Counselor",
    tagline: "Study-plans, university shortlisting, scholarships",
    icon: Sparkles,
    accent: "bg-amber-500/15 text-amber-500",
    suggestions: [
      "Shortlist universities for a CS undergrad with 7.5 IELTS",
      "Top scholarships for Bangladeshi students in Germany",
    ],
  },
  {
    key: "abroad-ielts",
    functionName: "admin-abroad-ielts",
    name: "IELTS Coach",
    tagline: "Module strategy and band-target plans",
    icon: BarChart3,
    accent: "bg-pink-500/15 text-pink-500",
    suggestions: [
      "Plan an 8-week IELTS prep schedule for band 7",
      "Tips to improve writing task 2 quickly",
    ],
  },
  {
    key: "abroad-outreach",
    functionName: "admin-abroad-outreach",
    name: "Abroad Outreach Exec",
    tagline: "Drafts university & partner outreach (mailto)",
    icon: Mail,
    accent: "bg-rose-500/15 text-rose-500",
    suggestions: [
      "Draft a partnership pitch for a UK pathway provider",
      "Re-engage dormant university partners",
    ],
  },
  // ── Group 14 — Marketing & Outreach ────────────────────────────────
  {
    key: "mkt-strategist",
    functionName: "admin-mkt-strategist",
    name: "Marketing Strategist",
    tagline: "Plans cross-channel campaigns and community pushes",
    icon: Sparkles,
    accent: "bg-orange-500/15 text-orange-500",
    suggestions: [
      "Plan a 30-day campaign for the new data analyst track",
      "Suggest a community-group push for the Dhaka cluster",
    ],
  },
  // ── Group 15 — Finance & Monetization ──────────────────────────────
  {
    key: "fin-controller",
    functionName: "admin-fin-controller",
    name: "Finance Controller",
    tagline: "MRR/ARR, transactions, gross margin & payout health (read-only)",
    icon: BarChart3,
    accent: "bg-indigo-500/15 text-indigo-500",
    suggestions: [
      "What's our MRR this month vs last?",
      "Top 5 services by gross margin",
    ],
  },
  {
    key: "fin-credits-ops",
    functionName: "admin-fin-credits-ops",
    name: "Credits Ops",
    tagline: "Credit issuance, refunds and reconciliation drafts",
    icon: Coins,
    accent: "bg-teal-500/15 text-teal-500",
    suggestions: [
      "Draft a refund note for an overcharged learner",
      "Reconcile this week's bKash settlements",
    ],
  },
];

export const ADMIN_AGENTS_BY_KEY: Record<string, AdminAgent> = Object.fromEntries(
  ADMIN_AGENTS.map((a) => [a.key, a]),
);
