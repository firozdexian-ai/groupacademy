import {
  Briefcase,
  FileText,
  Mic,
  DollarSign,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Heart,
  Sparkles,
  LucideIcon,
} from "lucide-react";

export interface AIAgent {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  expertise: string[];
  context: string;
}

export const AI_AGENTS: AIAgent[] = [
  {
    id: "ai-general",
    name: "AI General",
    shortName: "General",
    description: "Your ultimate platform guide",
    icon: Sparkles,
    bgColor: "bg-gradient-to-r from-blue-500/10 to-purple-500/10",
    iconColor: "text-blue-600",
    expertise: ["Platform Guide", "Feature Discovery", "Agent Routing"],
    context: "You are AI General, the platform concierge. Guide users to features, agents, and content.",
  },
  {
    id: "career-consultant",
    name: "Career Consultant",
    shortName: "Career",
    description: "Plan your professional journey",
    icon: Briefcase,
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-600",
    expertise: ["Career Planning", "Job Search", "Career Change"],
    context: "You are an expert Career Consultant. Help the user plan their career path.",
  },
  {
    id: "cv-coach",
    name: "CV Coach",
    shortName: "CV Coach",
    description: "Optimize your resume",
    icon: FileText,
    bgColor: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    expertise: ["CV Review", "ATS Optimization", "Cover Letters"],
    context: "You are an expert CV Coach. Review resumes and suggest improvements for ATS.",
  },
  {
    id: "interview-coach",
    name: "Interview Coach",
    shortName: "Interview",
    description: "Ace your interviews",
    icon: Mic,
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-600",
    expertise: ["Mock Practice", "STAR Method", "Confidence"],
    context: "You are an expert Interview Coach. Conduct mock interviews and provide feedback.",
  },
  {
    id: "salary-negotiator",
    name: "Salary Negotiator",
    shortName: "Salary",
    description: "Negotiate better offers",
    icon: DollarSign,
    bgColor: "bg-amber-500/10",
    iconColor: "text-amber-600",
    expertise: ["Negotiation", "Market Rates", "Benefits"],
    context: "You are an expert Salary Negotiator. Help users maximize their compensation.",
  },
  {
    id: "ielts-tutor",
    name: "IELTS Tutor",
    shortName: "IELTS",
    description: "Master English tests",
    icon: BookOpen,
    bgColor: "bg-rose-500/10",
    iconColor: "text-rose-600",
    expertise: ["Speaking", "Writing", "Test Strategies"],
    context: "You are an expert IELTS Tutor. Help users prepare for the IELTS exam.",
  },
  {
    id: "skill-advisor",
    name: "Skill Advisor",
    shortName: "Skills",
    description: "Learn in-demand skills",
    icon: Lightbulb,
    bgColor: "bg-teal-500/10",
    iconColor: "text-teal-600",
    expertise: ["Skill Gaps", "Learning Paths", "Industry Trends"],
    context: "You are an expert Skill Advisor. Recommend learning paths and skills.",
  },
  {
    id: "study-abroad-advisor",
    name: "Study Abroad Advisor",
    shortName: "Abroad",
    description: "Plan your international education",
    icon: GraduationCap,
    bgColor: "bg-cyan-500/10",
    iconColor: "text-cyan-600",
    expertise: ["University Selection", "Visa Guidance", "Scholarships", "Country Comparison"],
    context: "You are an expert Study Abroad Advisor. Help users choose universities, navigate visa processes, and find scholarships for international education.",
  },
  {
    id: "mental-wellness-coach",
    name: "Mental Wellness Coach",
    shortName: "Wellness",
    description: "Manage stress and find balance",
    icon: Heart,
    bgColor: "bg-pink-500/10",
    iconColor: "text-pink-600",
    expertise: ["Stress Management", "Mindfulness", "Work-Life Balance", "Burnout Prevention"],
    context: "You are a Mental Wellness Coach. Help users manage work stress and find balance.",
  },
];

export type AgentId = typeof AI_AGENTS[number]["id"];

export const getAgentById = (id: string): AIAgent | undefined => {
  return AI_AGENTS.find((agent) => agent.id === id);
};
