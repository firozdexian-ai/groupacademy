/**
 * AgentRedirectStub — replaces deprecated *ConsoleTab.tsx components.
 * Redirects to the unified /dashboard/chat?agent=<key> messenger.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgentRedirectStub({ agentKey }: { agentKey: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      navigate(`/dashboard/chat?agent=${agentKey}`, { replace: true });
    }, 600);
    return () => clearTimeout(t);
  }, [agentKey, navigate]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
        <MessageCircle className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Moved to Agentic Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          All conversational agents now live in one persistent messenger.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Redirecting…
      </div>
      <Button
        variant="outline"
        onClick={() => navigate(`/dashboard/chat?agent=${agentKey}`, { replace: true })}
      >
        Open chat now
      </Button>
    </div>
  );
}
