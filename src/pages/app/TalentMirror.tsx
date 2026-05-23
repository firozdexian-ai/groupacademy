import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalentMirrorPanel } from "@/domains/learning/components/talent/TalentMirrorPanel";
import { SkillCredentialsPanel } from "@/domains/learning/components/talent/SkillCredentialsPanel";
import { toast } from "sonner";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE } from "@/lib/uiTokens";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";

/**
 * Talent Mirror: cross-course mastery and credentials view.
 */

export default function TalentMirror() {
  const navigate = useNavigate();

  const handleError = (error: Error) => {
    console.error("[TalentMirror]", error);
    adminSupportAssistant({ type: "talent_mirror_error", event: "render_error", context: { error: error.message } });
    toast.error("We hit a snag. Our team has been notified.");
  };

  return (
    <div className={PAGE_SHELL}>
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40 px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-0.5">
          <h1 className={PAGE_TITLE}>Talent Mirror</h1>
          <p className={PAGE_SUBTITLE}>Your skills and progress across all courses.</p>
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
    </div>
  );
}

function ErrorBoundary({ children, onError }: { children: React.ReactNode; onError: (e: Error) => void }) {
  try {
    return <>{children}</>;
  } catch (e: any) {
    onError(e);
    return (
      <div className="p-12 text-center border-2 border-dashed rounded-[32px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive/40 mx-auto" />
        <p className="text-sm font-black uppercase tracking-widest">Something went wrong</p>
      </div>
    );
  }
}
