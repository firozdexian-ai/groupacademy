import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ADMIN_AGENTS_BY_KEY } from "@/lib/adminAgents";

/**
 * Tiny placeholder tab for sidebar entries that point at conversational agents.
 * Renders a CTA that deep-links into the Agentic Dashboard with the right agent
 * pre-selected, so the dashboard sidebar surfaces the agent without duplicating
 * the chat UI inline.
 */
export function ChatAgentShortcut({ agentKey }: { agentKey: string }) {
  const navigate = useNavigate();
  const agent = ADMIN_AGENTS_BY_KEY[agentKey];
  if (!agent) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Agent <code>{agentKey}</code> is not registered yet.
      </Card>
    );
  }
  return (
    <Card className="p-6 max-w-xl space-y-3">
      <h2 className="text-xl font-semibold">{agent.name}</h2>
      <p className="text-sm text-muted-foreground">{agent.tagline}</p>
      <Button onClick={() => navigate(`/dashboard/chat?agent=${agent.key}`)}>
        <MessageCircle className="h-4 w-4 mr-2" />
        Open in Agentic Dashboard
      </Button>
    </Card>
  );
}

export default ChatAgentShortcut;
