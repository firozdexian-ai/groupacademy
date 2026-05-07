import { MessagingChannelsTab } from "@/components/dashboard/messaging/MessagingChannelsTab";

export function CommunityMessagingChannelTab() {
  return (
    <div className="p-2">
      <MessagingChannelsTab
        agentKey="community-engine"
        defaultLabel="Community Engine — BD"
        defaultRegion="Bangladesh"
        title="Community WhatsApp Line"
        description="Default home for profession×country community groups and course cohorts. Connect a fresh number via Unipile hosted-auth."
      />
    </div>
  );
}

export default CommunityMessagingChannelTab;
