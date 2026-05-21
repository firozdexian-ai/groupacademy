import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  listMessagingChannelsByKeys,
  listCompanyGroupConversations,
  deleteMessagingConversation,
} from "@/domains/messaging/repo/messagingRepo";
import { toast } from "sonner";

// UI Primitive Matrix Registries
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Plus, Trash2 } from "lucide-react";
import { messagingGroupManager } from "@/domains/messaging/api/messagingApi";

interface Channel {
  id: string;
  agent_key: string;
  status: string;
  phone_e164: string | null;
}

interface GroupConv {
  id: string;
  channel_id: string;
  external_chat_id: string | null;
  peer_display_name: string | null;
  group_kind: string | null;
  metadata: any;
}

interface Props {
  companyId: string;
  companyName?: string;
}

const COMMUNITY_KEY = "community-engine";
const EMPLOYER_KEY = "employer-outreach";

/**
 * GroUp Academy: Automated Messaging Group Manager (V5.6.0)
 * CTO Reference: Control console provisioning WhatsApp multi-agent operational workspaces.
 * Architecture: Reference-stable queries with atomic transactional mutation listeners.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function CompanyWhatsAppGroupCard({ companyId, companyName }: Props) {
  const qc = useQueryClient();
  const [whiteGlove, setWhiteGlove] = useState(false);

  const selectedKey = whiteGlove ? EMPLOYER_KEY : COMMUNITY_KEY;
  const channelsQueryKey = useMemo(() => ["messaging-channels"], []);
  const conversationsQueryKey = useMemo(() => ["messaging-conversations", companyId], [companyId]);

  // --- SENSOR: CHANNELS_REGISTRY_QUERY ---
  const channelsQuery = useQuery<Channel[], Error>({
    queryKey: channelsQueryKey,
    staleTime: 60 * 1000, // 1-minute visual tracking consistency baseline
    queryFn: async (): Promise<Channel[]> => {
      const data = await listMessagingChannelsByKeys([COMMUNITY_KEY, EMPLOYER_KEY]);
      return data as Channel[];
    },
  });

  // --- SENSOR: CONVERSATIONS_REGISTRY_QUERY ---
  const conversationsQuery = useQuery<GroupConv[], Error>({
    queryKey: conversationsQueryKey,
    enabled: !!companyId,
    staleTime: 15 * 1000, // Throttled tracking for active pipeline monitoring
    queryFn: async (): Promise<GroupConv[]> => {
      const data = await listCompanyGroupConversations(companyId);
      return data as GroupConv[];
    },
  });

  const channels = channelsQuery.data || [];
  const groups = conversationsQuery.data || [];

  const selectedChannel = useMemo(() => {
    return channels.find((c) => c.agent_key === selectedKey);
  }, [channels, selectedKey]);

  // --- ACTION: PROVISION_WHATSAPP_GROUP_MUTATION ---
  const createMutation = useMutation({
    mutationKey: ["create-whatsapp-group", companyId],
    mutationFn: async (): Promise<void> => {
      if (!selectedChannel) throw new Error(`No ${selectedKey} routing line channel available.`);
      if (selectedChannel.status !== "connected")
        throw new Error(`${selectedKey} line status is currently ${selectedChannel.status}.`);

      // HUD: INVOKING_GROUP_MANAGER_EDGE_ENGINE
      const data: any = await messagingGroupManager({
        action: "create_group",
        company_id: companyId,
        group_kind: "client_account",
        agent_key: selectedKey,
        name: `${companyName || "Client"} · GroUp`,
      });
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success("WhatsApp communication group successfully initialized.");
      void qc.invalidateQueries({ queryKey: conversationsQueryKey });
    },
    onError: (err: Error) => {
      console.error("[Digital Workforce] ANOMALY: WhatsApp group initialization transaction failed.", {
        companyId,
        selectedKey,
        message: err.message,
      });
      toast.error(err.message || "Failed to commit automated workspace creation.");
    },
  });

  // --- ACTION: EVICT_CONVERSATION_RECORD_MUTATION ---
  const removeMutation = useMutation({
    mutationKey: ["remove-whatsapp-group"],
    mutationFn: async (id: string): Promise<void> => {
      // HUD: COMMITTING_RECORD_DELETION_TRANSACTION
      await deleteMessagingConversation(id);
    },
    onSuccess: () => {
      toast.success("Workspace target references evicted from system arrays.");
      void qc.invalidateQueries({ queryKey: conversationsQueryKey });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to adjust local workspace database lines.");
    },
  });

  const handleRemoveClick = (id: string) => {
    if (!window.confirm("Remove this group from GroUp records?")) return;
    removeMutation.mutate(id);
  };

  const isLoading = channelsQuery.isLoading || conversationsQuery.isLoading;
  const isCreating = createMutation.isPending;

  return (
    <Card className="select-none text-left rounded-[24px] border-2">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base flex items-center gap-2 font-bold tracking-tight">
          <Users className="h-4 w-4 text-primary" /> WhatsApp Client Group
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* INTERFACE SECTOR: WHITE GLOVE ROUTING FLAPS */}
        <div className="flex items-center justify-between rounded-xl border p-3 bg-muted/10">
          <div className="space-y-0.5">
            <Label className="text-xs font-bold uppercase tracking-wider">White-glove (route via Employer line)</Label>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Default: <code className="bg-muted px-1 rounded">community-engine</code>. Toggle for premium clients to
              use <code className="bg-muted px-1 rounded">employer-outreach</code>.
            </p>
          </div>
          <Switch checked={whiteGlove} disabled={isCreating} onCheckedChange={setWhiteGlove} />
        </div>

        {/* INTERFACE SECTOR: ACTIVE CHANNEL STATUS BAR */}
        <div className="text-xs flex items-center gap-2 font-medium">
          <span className="text-muted-foreground font-semibold">Will use:</span>
          <Badge variant="secondary" className="font-mono tracking-tight">
            {selectedKey}
          </Badge>
          {channelsQuery.isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : selectedChannel ? (
            <Badge variant={selectedChannel.status === "connected" ? "default" : "outline"} className="capitalize">
              {selectedChannel.status}
              {selectedChannel.phone_e164 ? ` · ${selectedChannel.phone_e164}` : ""}
            </Badge>
          ) : (
            <Badge variant="destructive">not configured</Badge>
          )}
        </div>

        {/* MUTATION EXECUTION TOGGLE BUTTON ELEMENT */}
        <Button
          size="sm"
          type="button"
          onClick={() => createMutation.mutate()}
          disabled={isCreating || !selectedChannel || selectedChannel.status !== "connected"}
          className="w-full h-10 font-bold transition-all"
        >
          {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          {isCreating ? "Configuring Agent Workspace Swarm..." : "Create WhatsApp Group"}
        </Button>

        {/* DATA CONTAINER MAPPING DISPLAY VIEWPANEL */}
        <div className="space-y-2 pt-2 border-t">
          {isLoading ? (
            <div className="py-6 text-center">
              <Loader2 className="h-5 w-5 animate-spin inline text-primary" />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center italic">
              No groups mapped yet for this organization.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between border-2 rounded-xl p-3 text-sm bg-card/50 transition-colors hover:bg-muted/5"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-foreground truncate">
                      {group.peer_display_name || "Untitled Workspace Group"}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground truncate pt-0.5">
                      {group.group_kind || "client_account"} · {group.external_chat_id || "pending_deployment"}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={removeMutation.isPending}
                    className="shrink-0 h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleRemoveClick(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CompanyWhatsAppGroupCard;
