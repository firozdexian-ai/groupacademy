/**
 * Company AI General Console — analytics + in-app messaging for registered
 * company-side users.
 */
import { Bot } from "lucide-react";
import { AdminAnalystShell } from "../talent/AdminAnalystShell";

const SUGGESTIONS = [
  "How many registered company users do we have?",
  "List the 25 most recent registered company contacts",
  "Send an in-app message to all registered company users about new features",
  "Who are the active company users this week?",
];

export function CompanyAIGeneralTab() {
  return (
    <AdminAnalystShell
      title="Company AI General"
      eyebrow="Engage registered company users · in-app messaging"
      icon={Bot}
      functionName="admin-company-ai-general-analyst"
      suggestions={SUGGESTIONS}
      placeholder="Ask anything about registered company users…"
    />
  );
}
