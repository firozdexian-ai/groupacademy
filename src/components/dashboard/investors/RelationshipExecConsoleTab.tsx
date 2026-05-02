import { AdminAnalystShell } from "../talent/AdminAnalystShell";
import { Handshake } from "lucide-react";

export default function RelationshipExecConsoleTab() {
  return (
    <AdminAnalystShell
      title="Relationship Exec"
      eyebrow="Outreach • Follow-ups • Interaction Log"
      icon={Handshake}
      functionName="admin-ir-relationship-exec"
      placeholder="Draft an intro email, plan follow-ups, log a call…"
      suggestions={[
        "Draft a warm intro email to a seed-stage EdTech VC",
        "Who in our pipeline needs a follow-up this week?",
        "Log a 30-min call I had with an angel today (positive)",
        "Suggest 3 influencers to invite as advisors",
      ]}
    />
  );
}
