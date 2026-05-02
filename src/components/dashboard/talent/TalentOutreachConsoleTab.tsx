/**
 * Talent Outreach Agent — invite uploaded-but-unregistered talents to claim
 * their profile. Routed through admin-talent-outreach edge function.
 */
import { Send } from "lucide-react";
import { AdminAnalystShell } from "./AdminAnalystShell";

const SUGGESTIONS = [
  "How many uploaded talents haven't signed up yet?",
  "Show 10 unregistered talents with an email address",
  "Draft an invite email for 50 unregistered talents and send it",
  "What's our outreach response rate so far?",
];

export function TalentOutreachConsoleTab() {
  return (
    <AdminAnalystShell
      title="Talent Outreach Agent"
      eyebrow="Uploaded talents · claim-profile invites"
      icon={Send}
      functionName="admin-talent-outreach"
      suggestions={SUGGESTIONS}
      placeholder="Ask me to find or invite uploaded talents…"
    />
  );
}
