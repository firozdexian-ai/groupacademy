import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Briefcase,
  ChevronRight,
  Globe,
  Map,
  Sparkles,
  MessageCircle,
  FileText,
  Coins,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";
import { CREDIT_CONFIG } from "@/lib/creditPricing";

/**
 * Study & Work Abroad — single landing for international study, IELTS, and overseas jobs.
 * Plain English, two paths to a roadmap (chat with a country expert OR fill the form).
 */

const POPULAR_DESTINATIONS = COUNTRIES.filter((c) =>
  ["US", "UK", "CA", "AU", "DE", "SG", "JP", "SE", "NL"].includes(c.code),
);

// Country agents available in the AI Agent OS (key matches ai_agents.agent_key)
const COUNTRY_AGENTS: { code: string; name: string; agentKey: string }[] = [
  { code: "US", name: "United States", agentKey: "study-abroad-usa" },
  { code: "UK", name: "United Kingdom", agentKey: "study-abroad-uk" },
  { code: "CA", name: "Canada", agentKey: "study-abroad-canada" },
  { code: "AU", name: "Australia", agentKey: "study-abroad-australia" },
  { code: "DE", name: "Germany", agentKey: "study-abroad-germany" },
  { code: "MY", name: "Malaysia", agentKey: "study-abroad-malaysia" },
];

const ABROAD_SECTIONS = [
  {
    title: "Study Abroad",
    description: "Browse universities & scholarships",
    icon: GraduationCap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    href: "/app/abroad/study",
  },
  {
    title: "IELTS Prep",
    description: "Practice & mock tests",
    icon: BookOpen,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    href: "/app/abroad/ielts",
  },
  {
    title: "Jobs Abroad",
    description: "Open roles overseas",
    icon: Briefcase,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    href: "/app/jobs?location=abroad",
  },
];

export default function CareerAbroad() {
  const navigate = useNavigate();
  const roadmapCost = CREDIT_CONFIG.SERVICES.STUDY_ABROAD_ROADMAP?.cost || 100;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Study & Work Abroad</h1>
            <p className="text-sm text-muted-foreground">
              Plan your international move — universities, IELTS, overseas jobs, and a 12-month roadmap.
            </p>
          </div>
        </div>
      </header>

      {/* Three quick paths */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ABROAD_SECTIONS.map((section) => (
          <Card
            key={section.title}
            className="group cursor-pointer hover:border-primary/40 transition-all"
            onClick={() => navigate(section.href)}
          >
            <CardContent className="p-4 space-y-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.bgColor}`}>
                <section.icon className={`h-5 w-5 ${section.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-base">{section.title}</h3>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-primary font-medium">
                <span>Open</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Country specialists (NEW — agent-led entry) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Talk to a country specialist
          </h2>
          <Badge variant="outline" className="text-[10px]">AI</Badge>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          Each specialist asks a few quick questions, then offers a personalised roadmap.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COUNTRY_AGENTS.map((agent) => (
            <Card
              key={agent.code}
              className="cursor-pointer hover:border-primary/40 transition-all"
              onClick={() => navigate(`/app/agents/${agent.agentKey}`)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <span className="text-2xl">{getCountryFlag(agent.code)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{agent.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MessageCircle className="h-2.5 w-2.5" /> Chat now
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Popular destinations (browse programs) */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Browse by destination</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {POPULAR_DESTINATIONS.map((country) => (
            <Card
              key={country.code}
              className="group cursor-pointer hover:border-primary/40 hover:scale-[1.03] active:scale-95 transition-all"
              onClick={() => navigate(`/app/abroad/study?country=${country.code}`)}
            >
              <CardContent className="p-3 flex flex-col items-center gap-1.5">
                <span className="text-2xl">{getCountryFlag(country.code)}</span>
                <span className="text-[11px] font-medium text-center line-clamp-1 group-hover:text-primary">
                  {country.name}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Roadmap CTA — both paths */}
      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
              <Map className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold leading-tight">Build my 12-month roadmap</h3>
              <p className="text-sm text-muted-foreground">
                A personalised plan: university shortlist, IELTS targets, budgeting, and visa timeline.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/app/agents/study-abroad-advisor")}
              className="h-11 justify-start"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with an advisor
            </Button>
            <Button
              onClick={() => navigate("/app/abroad/roadmap")}
              className="h-11 justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Fill the roadmap form
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            <span>Roadmap generation uses {roadmapCost} credits</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
