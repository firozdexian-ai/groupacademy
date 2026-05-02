/**
 * Aisha Console — chat with the onboarding gatekeeper agent. Tools are
 * resolved server-side via the admin-aisha-analyst edge function.
 */
import { Sparkles } from "lucide-react";
import { AdminAnalystShell } from "./AdminAnalystShell";

const SUGGESTIONS = [
  "How many talents onboarded today?",
  "How many people started the chat but didn't finish signup this week?",
  "Where are people dropping off in the onboarding flow?",
  "Show me the last 10 leads who never completed signup",
];

export function AishaConsoleTab() {
  return (
    <AdminAnalystShell
      title="Aisha Console"
      eyebrow="Talent onboarding · drop-off insights"
      icon={Sparkles}
      functionName="admin-aisha-analyst"
      suggestions={SUGGESTIONS}
      placeholder="Ask Aisha about onboarding…"
    />
  );
}
