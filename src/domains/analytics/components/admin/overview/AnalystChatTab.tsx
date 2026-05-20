/**
 * Analyst Chat Tab — Consolidated Redirect
 * CTO Version: May 2026
 * Fixes: P5, P6 (Consolidated into Unified Agentic OS)
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageSquare } from "lucide-react";

export function AnalystChatTab() {
  const navigate = useNavigate();

  useEffect(() => {
    /**
     * P6: Redirect to the unified Agentic Dashboard.
     * Pre-seeding the query with agent=business-analyst (Nia).
     * This ensures the user benefits from persistent thread history
     * and standardized tools available in the main chat interface.
     */
    const timer = setTimeout(() => {
      navigate("/dashboard/chat?agent=business-analyst", { replace: true });
    }, 800);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-700">
      <div className="relative">
        <div className="h-24 w-24 rounded-[32px] bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
          <MessageSquare className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <div className="absolute -bottom-2 -right-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-black uppercase tracking-tighter italic text-primary">Initializing Nia</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
          Redirecting to Agentic OS Messenger...
        </p>
      </div>

      <div className="max-w-md w-full bg-muted/10 border-2 border-border/40 p-6 rounded-[32px] backdrop-blur-sm">
        <p className="text-xs text-muted-foreground leading-relaxed text-center">
          We have unified all 27 admin agents into a single secure terminal. Your session with the{" "}
          <strong>Business Analyst</strong> is being transferred to maintain thread persistence.
        </p>
      </div>
    </div>
  );
}
