import { Sparkles } from "lucide-react";
import { AdminAnalystShell } from "@/components/dashboard/talent/AdminAnalystShell";

export function AgentManagerConsoleTab() {
  return (
    <AdminAnalystShell
      title="Agent Manager"
      eyebrow="AI Agent Operating System"
      icon={Sparkles}
      functionName="admin-agent-manager"
      suggestions={[
        "How many agents do we have by type?",
        "Total agent sessions in the last 7 days",
        "List all external connectors in the registry",
        "Which B2C agents have the most conversations?",
        "How many credits did agents earn in the last 30 days?",
      ]}
      placeholder="Ask anything about the Agent OS…"
    />
  );
}
