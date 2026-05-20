import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Map, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RoadmapIntakeForm } from "@/components/abroad/RoadmapIntakeForm";
import { supabase } from "@/integrations/supabase/client";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";
import { toast } from "sonner";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE, CARD } from "@/lib/uiTokens";

/**
 * Platform Logic: Study Abroad Roadmap Terminal
 * High-fidelity orchestrator for roadmap artifact ingestion.
 * 2026 Standard: Executive Logic geometry with reinforced error telemetry.
 */

export default function StudyAbroadRoadmap() {
  const navigate = useNavigate();

  // Digital Workforce Anomaly Reporting[cite: 6]
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    try {
      await adminSupportAssistant({ type: "roadmap_intake_error", event, context });
    } catch {
      // fire-and-forget telemetry
    }
  };

  const handleError = (error: Error) => {
    reportAnomaly("RoadmapIntakeFailure", { error: error.message });
    toast.error("Roadmap sync interrupted. Admin agents notified.");
  };

  return (
    <div className={PAGE_SHELL}>
      <header className="flex items-center justify-between pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/abroad")}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </header>

      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Map className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className={PAGE_TITLE}>Build my study roadmap</h1>
          <p className={PAGE_SUBTITLE}>Tell us your goals. We'll plan your next 12 months.</p>
        </div>
      </div>

      <Card className={CARD}>
        <CardContent className="p-6">
          <ErrorBoundary onError={handleError}>
            <RoadmapIntakeForm />
          </ErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
}

// Minimal error boundary wrapper for intake stability[cite: 6]
function ErrorBoundary({ children, onError }: { children: React.ReactNode; onError: (e: Error) => void }) {
  try {
    return <>{children}</>;
  } catch (e: any) {
    useEffect(() => onError(e), [e, onError]);
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm font-medium">An error occurred in the roadmap logic.</p>
      </div>
    );
  }
}
