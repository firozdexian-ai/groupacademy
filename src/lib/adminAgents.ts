/**
 * Registry of conversational admin agents surfaced inside the unified
 * `/dashboard/chat` (Agentic Dashboard) WhatsApp-style messenger.
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
];

export const ADMIN_AGENTS_BY_KEY: Record<string, AdminAgent> = Object.fromEntries(
  ADMIN_AGENTS.map((a) => [a.key, a]),
);
