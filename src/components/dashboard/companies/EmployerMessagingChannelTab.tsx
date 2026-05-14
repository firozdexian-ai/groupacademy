import { MessagingChannelsTab } from "@/components/dashboard/messaging/MessagingChannelsTab";

export function EmployerMessagingChannelTab() {
  return (
    <div className="p-2">
      <MessagingChannelsTab
        agentKey="employer-outreach"
        defaultLabel="Employer Outreach — BD"
        defaultRegion="Bangladesh"
        title="Employer WhatsApp Line"
        description="Direct 1-on-1 with employers and B2B contacts. Auto-reply is OFF by default; enable per-channel for white-glove client-success groups."
      />
    </div>
  );
}

export default EmployerMessagingChannelTab;
