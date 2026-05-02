/**
 * Riya Console — chat with the B2B onboarding agent's data (companies + signups).
 */
import { Sparkles } from "lucide-react";
import { AdminAnalystShell } from "../talent/AdminAnalystShell";

const SUGGESTIONS = [
  "How many companies signed up this week?",
  "Where are companies dropping off in Riya's onboarding?",
  "Show me the last 10 abandoned Riya sessions",
  "Total completed B2B signups in the last 30 days",
];

export function RiyaConsoleTab() {
  return (
    <AdminAnalystShell
      title="Riya Console"
      eyebrow="B2B onboarding · company signup insights"
      icon={Sparkles}
      functionName="admin-riya-analyst"
      suggestions={SUGGESTIONS}
      placeholder="Ask Riya about company signups…"
    />
  );
}
