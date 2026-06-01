/**
 * GroUp Academy: Study Abroad & Mobility Hub (StudyAbroadView)
 * CTO Reference: Primary surface for university shortlisting and agentic guidance.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
import { useNavigate } from "react-router-dom";
import { Globe, Sparkles, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/errorTracking";
import { useCredits } from "@/domains/finance/hooks/useCredits";

export function StudyAbroadView() {
  const navigate = useNavigate();
  const { balance } = useCredits();

  const handleAdvisorClick = () => {
    trackEvent("abroad_advisor_clicked");
    navigate("/app/agents/abroad-counselor");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      {/* Credit & Advisor Header */}
      <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Planning your journey?</p>
              <p className="text-xs text-muted-foreground">
                You have {balance} credits available for roadmap generation.
              </p>
            </div>
          </div>
          <Button size="sm" className="rounded-xl font-bold shadow-md" onClick={handleAdvisorClick}>
            <Sparkles className="h-4 w-4 mr-2" /> Talk to Advisor
          </Button>
        </CardContent>
      </Card>

      {/* Program Catalog Placeholder */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold">Program Catalog</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Our global academic catalog is being indexed. Check back shortly for real-time program listings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
