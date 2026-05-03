import { SimpleAdminRegistry } from "@/components/dashboard/common/SimpleAdminRegistry";

export const ChannelsTab = () => (
  <SimpleAdminRegistry
    table="mkt_channels"
    title="Marketing Channels"
    description="WhatsApp, email lists, social handles, paid sources."
    fields={[
      { key: "name", label: "Channel name", required: true },
      { key: "type", label: "Type (whatsapp / email / social / paid)" },
      { key: "notes", label: "Notes", type: "textarea" },
    ]}
  />
);

export const CommunityTab = () => (
  <SimpleAdminRegistry
    table="mkt_community_groups"
    title="Community Groups"
    description="WhatsApp/Telegram/FB community groups under our reach."
    fields={[
      { key: "name", label: "Group name", required: true },
      { key: "platform", label: "Platform" },
      { key: "member_count", label: "Member count", type: "number" },
      { key: "link", label: "Invite link" },
    ]}
  />
);
