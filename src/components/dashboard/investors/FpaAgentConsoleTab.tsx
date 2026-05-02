import { AdminAnalystShell } from "../talent/AdminAnalystShell";
import { Sparkles } from "lucide-react";

export default function FpaAgentConsoleTab() {
  return (
    <AdminAnalystShell
      title="Fundraising FP&A Agent"
      eyebrow="Strategy • Narrative • Investor Matching"
      icon={Sparkles}
      functionName="admin-ir-fpa-analyst"
      placeholder="Ask about runway, narrative, target investors…"
      suggestions={[
        "What's our current MRR vs target and implied runway?",
        "Suggest the right type of investors for our next round",
        "Draft 5 pitch talking points based on our actual traction",
        "Where is our investor pipeline leaking?",
      ]}
    />
  );
}
