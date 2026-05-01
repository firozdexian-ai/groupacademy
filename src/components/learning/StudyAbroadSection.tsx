import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, GraduationCap, BookOpen, Map, MessageCircle, FileText, Coins, ArrowRight } from "lucide-react";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";
import { CREDIT_CONFIG } from "@/lib/creditPricing";

const POPULAR_DESTINATIONS = COUNTRIES.filter((c) =>
  ["US", "UK", "CA", "AU", "DE", "SG", "JP", "SE", "NL"].includes(c.code),
);

/**
 * Study Abroad sub-view rendered inside Learning > Arena.
 * Replaces the standalone Career Abroad page.
 */
export function StudyAbroadSection() {
  const navigate = useNavigate();
  const roadmapCost = CREDIT_CONFIG.SERVICES.STUDY_ABROAD_ROADMAP?.cost || 100;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight">Study Abroad</h2>
          <p className="text-xs text-muted-foreground">Universities, IELTS, and a 12-month roadmap.</p>
        </div>
      </div>

      {/* Country specialists CTA */}
      <Card
        className="cursor-pointer hover:border-primary/40 transition-all rounded-2xl"
        onClick={() => navigate("/app/agents?category=abroad")}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Talk to a country specialist</p>
            <p className="text-[11px] text-muted-foreground">USA, UK, Canada, Australia, Germany, Malaysia and more</p>
          </div>
          <Badge variant="outline" className="text-[9px] shrink-0">AI</Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>

      {/* Two action cards: Universities + IELTS */}
      <div className="grid grid-cols-2 gap-2">
        <Card
          className="cursor-pointer hover:border-primary/40 transition-all rounded-2xl"
          onClick={() => navigate("/app/abroad/study")}
        >
          <CardContent className="p-3 space-y-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Universities</p>
              <p className="text-[11px] text-muted-foreground">Browse programs &amp; scholarships</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/40 transition-all rounded-2xl"
          onClick={() => navigate("/app/abroad/ielts")}
        >
          <CardContent className="p-3 space-y-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">IELTS Prep</p>
              <p className="text-[11px] text-muted-foreground">Practice &amp; mock tests</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browse by destination */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold px-1">Browse by destination</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {POPULAR_DESTINATIONS.map((country) => (
            <Card
              key={country.code}
              className="cursor-pointer hover:border-primary/40 transition-all rounded-xl"
              onClick={() => navigate(`/app/abroad/study?country=${country.code}`)}
            >
              <CardContent className="p-2 flex flex-col items-center gap-1">
                <span className="text-xl">{getCountryFlag(country.code)}</span>
                <span className="text-[10px] font-medium text-center line-clamp-1">{country.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Roadmap CTA */}
      <Card className="bg-primary/5 border-primary/30 rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Map className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold leading-tight">Build my 12-month roadmap</h3>
              <p className="text-xs text-muted-foreground">Personalised plan: shortlist, IELTS targets, budget, visa.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/app/agents/study-abroad-advisor")} className="h-9 text-xs">
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
              Chat advisor
            </Button>
            <Button size="sm" onClick={() => navigate("/app/abroad/roadmap")} className="h-9 text-xs">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Fill the form
            </Button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Coins className="h-3 w-3 text-amber-500" />
            <span>Roadmap uses {roadmapCost} credits</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
