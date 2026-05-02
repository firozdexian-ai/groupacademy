/**
 * Company Outreach Agent — invite uploaded company contacts to claim their Gro10x profile.
 */
import { Send } from "lucide-react";
import { AdminAnalystShell } from "../talent/AdminAnalystShell";

const SUGGESTIONS = [
  "How many uploaded company contacts haven't signed up?",
  "Show 10 unregistered contacts with an email",
  "List CV-matched contacts I haven't contacted yet",
  "Draft and send an invite to 25 unregistered contacts",
];

export function CompanyOutreachConsoleTab() {
  return (
    <AdminAnalystShell
      title="Company Outreach Agent"
      eyebrow="Uploaded company contacts · claim-profile invites"
      icon={Send}
      functionName="admin-company-outreach"
      suggestions={SUGGESTIONS}
      placeholder="Ask me to find or invite company contacts…"
    />
  );
}
