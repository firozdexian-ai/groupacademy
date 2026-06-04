import { useEffect, Component, ReactNode, ErrorInfo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Map, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RoadmapIntakeForm } from "@/domains/abroad";
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

  // Internal error logger aligned with Digital Workforce architecture
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[abroad] ${event}`, context);
    try {
      await adminSupportAssistant({
        type: "roadmap_intake_error",
        event,
        context,
      });
    } catch {
      // Fire-and-forget telemetry fallback
    }
  };

  const handleIntakeError = (error: Error) => {
    reportAnomaly("RoadmapIntakeFailure", { error: error.message });
    toast.error("Something went wrong. Please try again.");
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
          <ReactErrorBoundary onError={handleIntakeError}>
            <RoadmapIntakeForm />
          </ReactErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onError: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Standardized React Component Error Boundary Container
 * Captures lifecycle render faults down the virtual DOM tree, tracking telemetry context natively.
 */
class ReactErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
    this.props.onError(error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm font-medium">Something went wrong. Please refresh and try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
