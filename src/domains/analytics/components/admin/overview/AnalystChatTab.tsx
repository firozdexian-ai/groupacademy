/**
 * Analyst Chat Tab — Consolidated Redirect
 * Centralizes entry points for the Business Analyst (Nia) under the unified Agentic OS Messenger.
 * Adheres to the 2024 Professional SaaS UI guidelines and records session telemetry events.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { InlineSpinner } from "@/components/common/InlineSpinner";
import { supabase } from "@/integrations/supabase/client";

export function AnalystChatTab() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const initializeTransfer = async () => {
      try {
        // Digital Workforce Telemetry: Log the administrative initialization sequence
        await supabase.from("platform_events").insert({
          event_kind: "agent_session_transfer",
          subject_kind: "agent",
          payload: {
            agent_key: "business-analyst",
            source_surface: "admin_overview_analyst_tab",
            severity: "info",
            timestamp: new Date().toISOString(),
          },
        });
      } catch (err) {
        // Non-blocking telemetry failure fallback
        console.warn("[Digital Workforce] Failed to log transfer event:", err);
      }

      if (active) {
        /**
         * Redirect to the unified Agentic Dashboard messenger interface.
         * Pre-seeding the route configuration matrix with agent=business-analyst (Nia).
         * Maintains persistent thread context matching platform spec frameworks.
         */
        navigate("/dashboard/chat?agent=business-analyst", { replace: true });
      }
    };

    const timer = setTimeout(() => {
      initializeTransfer();
    }, 600);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="h-16 w-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <MessageSquare className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
          <InlineSpinner size="md" />
        </div>
      </div>

      <div className="text-center space-y-1.5 max-w-sm">
        <h2 className="text-base font-semibold text-foreground">Connecting to Nia</h2>
        <p className="text-xs text-muted-foreground">Opening secure thread within Agentic OS Messenger...</p>
      </div>

      <div className="max-w-xs w-full bg-muted/40 border border-border p-4 rounded-xl text-center">
        <p className="text-xs text-muted-foreground leading-normal">
          We have consolidated our analytical endpoints into a single workspace panel. Your session with the{" "}
          <strong>Business Analyst</strong> is loading to protect history persistence.
        </p>
      </div>
    </div>
  );
}
