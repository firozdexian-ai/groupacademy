import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map } from "lucide-react";
import { RoadmapIntakeForm } from "@/components/abroad/RoadmapIntakeForm";

/**
 * Study Abroad Roadmap — structured intake form.
 * Accepts ?country=XX to prefill the destination from a country agent's CTA.
 */

export default function StudyAbroadRoadmap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillCountry = searchParams.get("country") || undefined;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-32 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/abroad")}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <header className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Map className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Build my study roadmap</h1>
          <p className="text-sm text-muted-foreground">
            Tell us a bit about your goals and we'll plan the next 12 months for you.
          </p>
        </div>
      </header>

      <div className="bg-card rounded-2xl border p-4 sm:p-6">
        <RoadmapIntakeForm prefillCountry={prefillCountry} />
      </div>
    </div>
  );
}
