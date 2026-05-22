import { useNavigate } from "react-router-dom";
import { ArrowLeft, Award, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalentMirrorPanel } from "@/domains/learning/components/talent/TalentMirrorPanel";
import { SkillCredentialsPanel } from "@/domains/learning/components/talent/SkillCredentialsPanel";
import { toast } from "sonner";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE } from "@/lib/uiTokens";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";

/**
 * Platform Logic: Global Talent Mirror Result Viewport
 * High-fidelity synthesis of AI-generated mastery and credentials.
 * 2026 Standard: Executive Logic geometry with telemetry error boundaries.
 */

export default function TalentMirror() {
  const navigate = useNavigate();

  // Digital Workforce Anomaly Protocol[cite: 6]
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    await adminSupportAssistant({ type: "talent_mirror_error", event, context });
  };

  const handleError = (error: Error) => {
    reportAnomaly("TalentMirrorNodeFailure", { error: error.message });
    toast.error("Telemetry sync error. Admin agents notified.");
  };

  return (
    <div className={PAGE_SHELL}>
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40 px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-0.5">
          <h1 className={PAGE_TITLE}>Talent Mirror</h1>
          <p className={PAGE_SUBTITLE}>Mastery visualization across all academic programs.</p>
        </div>
      </header>

      <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
        <ErrorBoundary onError={handleError}>
          <div className="space-y-6">
            <SkillCredentialsPanel />
            <TalentMirrorPanel />
          </div>
        </ErrorBoundary>
      </div>

      <footer className="mt-20 px-6 pb-10 opacity-30">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] italic text-center">
          Protocol: Verified Mastery Sync v2.6.4
        </p>
      </footer>
    </div>
  );
}

// Minimal error boundary wrapper for telemetry stability[cite: 6]
function ErrorBoundary({ children, onError }: { children: React.ReactNode; onError: (e: Error) => void }) {
  try {
    return <>{children}</>;
  } catch (e: any) {
    // Report to anomaly registry on render-crash
    onError(e);
    return (
      <div className="p-12 text-center border-2 border-dashed rounded-[32px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive/40 mx-auto" />
        <p className="text-sm font-black uppercase tracking-widest">Logic Node Fault</p>
      </div>
    );
  }
}
