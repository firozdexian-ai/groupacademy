import { MessagingChannelsTab } from "@/domains/messaging/components/admin/MessagingChannelsTab";

export function TalentMessagingChannelTab() {
  return (
    <div className="p-2">
      <MessagingChannelsTab
        agentKey="talent-outreach"
        defaultLabel="Talent Outreach — BD"
        defaultRegion="Bangladesh"
        title="Talent WhatsApp Line (01889825025)"
        description="Direct 1-on-1 with talents and candidates. Used by the Talent Outreach agent for inbound replies and white-glove follow-ups."
      />
    </div>
  );
}

export default TalentMessagingChannelTab;
