import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentRedirectStub } from "@/components/dashboard/chat/AgentRedirectStub";
import { MessagingChannelsTab } from "@/components/dashboard/messaging/MessagingChannelsTab";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";
import { Link } from "react-router-dom";

export function TalentOutreachConsoleTab() {
  return (
    <Tabs defaultValue="chat" className="w-full">
      <div className="flex items-center justify-between mb-3">
        <TabsList>
          <TabsTrigger value="chat">Agent chat</TabsTrigger>
          <TabsTrigger value="channels">WhatsApp / Channels</TabsTrigger>
        </TabsList>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/messaging"><Inbox className="h-4 w-4 mr-2" />Open Inbox</Link>
        </Button>
      </div>
      <TabsContent value="chat">
        <AgentRedirectStub agentKey="talent-outreach" />
      </TabsContent>
      <TabsContent value="channels">
        <MessagingChannelsTab agentKey="talent-outreach" />
      </TabsContent>
    </Tabs>
  );
}
