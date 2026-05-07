// Talent → Outreach Console tab.
// Renders the real operator console (contact queue + AI composer + bulk import + send).
// The agent chat for Talent Outreach is reachable separately via /dashboard/chat?agent=talent-outreach.
import OutreachConsole from "@/pages/admin/OutreachConsole";

export function TalentOutreachConsoleTab() {
  return <OutreachConsole />;
}
