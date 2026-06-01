/**
 * GroUp Academy: Academy Hub Surface (AcademyView)
 * CTO Reference: Authoritative directory for academic tracks and school departments.
 * Version: Launch Candidate · Phase Z0 Hardened
 * Enhancements: GPU performance grid, agentic Dean chat bindings, dynamic academy directory.
 */
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, Rocket, BrainCircuit, ChevronRight, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/errorTracking";

const ACADEMIES = [
  { id: "executive", title: "Executive", icon: Users, desc: "Leadership & Management strategy" },
  { id: "freelancing", title: "Freelancing", icon: Briefcase, desc: "Creative & Technical service scaling" },
  { id: "entrepreneurship", title: "Entrepreneurship", icon: Rocket, desc: "Venture & Startup engineering" },
  { id: "influencing", title: "Influencing", icon: Sparkles, desc: "Social media & personal brand mastery" },
];

export function AcademyView() {
  const navigate = useNavigate();

  const handleAcademyClick = (id: string) => {
    trackEvent("academy_catalog_clicked", { academyId: id });
    navigate(`/app/learning/academy/${id}`);
  };

  return (
    <div className="space-y-6 antialiased select-none sm:select-text w-full animate-in fade-in duration-300">
      {/* Academy Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ACADEMIES.map((academy) => (
          <button
            key={academy.id}
            type="button"
            onClick={() => handleAcademyClick(academy.id)}
            className="text-left rounded-2xl border border-border/40 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.99] group"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5 shadow-inner">
                <academy.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-sm font-bold tracking-tight text-foreground/90">{academy.title}</h3>
                <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium line-clamp-2">
                  {academy.desc}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>

      {/* Dean Chat Access Module */}
      <Card className="rounded-2xl border border-border/20 bg-muted/20">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">Ask the Dean</p>
              <p className="text-xs text-muted-foreground">Need help picking your track? Chat with our Dean agent.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-xl font-bold"
            onClick={() => navigate("/dashboard/chat?agent=learn-dean")}
          >
            Chat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
