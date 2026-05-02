/**
 * AI General Console — operator-side chat with the platform concierge.
 * Use it to query profile-completion stats and broadcast nudges.
 */
import { Bot } from "lucide-react";
import { AdminAnalystShell } from "./AdminAnalystShell";

const SUGGESTIONS = [
  "How many profiles are complete vs incomplete?",
  "Which talents haven't uploaded a CV yet?",
  "Nudge talents who signed up this week to complete their profile",
  "What are the most common questions people ask AI General?",
];

export function AIGeneralConsoleTab() {
  return (
    <AdminAnalystShell
      title="AI General Console"
      eyebrow="Platform concierge · outreach & engagement"
      icon={Bot}
      functionName="admin-ai-general-analyst"
      suggestions={SUGGESTIONS}
      placeholder="Ask AI General about platform engagement…"
    />
  );
}
