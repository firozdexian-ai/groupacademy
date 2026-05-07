import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Users, Plus, Trash2 } from "lucide-react";

interface Channel { id: string; agent_key: string; status: string; phone_e164: string | null; }
interface GroupConv {
  id: string;
  channel_id: string;
  external_chat_id: string | null;
  peer_display_name: string | null;
  group_kind: string | null;
  metadata: any;
}

interface Props { companyId: string; companyName?: string; }

export function CompanyWhatsAppGroupCard({ companyId, companyName }: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groups, setGroups] = useState<GroupConv[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [whiteGlove, setWhiteGlove] = useState(false);

  const COMMUNITY_KEY = "community-engine";
  const EMPLOYER_KEY = "employer-outreach";
  const selectedKey = whiteGlove ? EMPLOYER_KEY : COMMUNITY_KEY;
  const selectedChannel = channels.find((c) => c.agent_key === selectedKey);

  const load = async () => {
    setLoading(true);
    const [{ data: chs }, { data: gs }] = await Promise.all([
      supabase
        .from("messaging_channels")
        .select("id, agent_key, status, phone_e164")
        .in("agent_key", [COMMUNITY_KEY, EMPLOYER_KEY]),
      supabase
        .from("messaging_conversations")
        .select("id, channel_id, external_chat_id, peer_display_name, group_kind, metadata")
        .eq("company_id", companyId)
        .eq("is_group", true)
        .order("last_message_at", { ascending: false, nullsFirst: false }),
    ]);
    setChannels((chs ?? []) as Channel[]);
    setGroups((gs ?? []) as GroupConv[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [companyId]);

  const create = async () => {
    if (!selectedChannel) return toast.error(`No ${selectedKey} channel available`);
    if (selectedChannel.status !== "connected") return toast.error(`${selectedKey} line is ${selectedChannel.status} — connect it first`);
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("messaging-group-manager", {
        body: {
          action: "create_group",
          company_id: companyId,
          group_kind: "client_account",
          agent_key: selectedKey,
          name: `${companyName || "Client"} · GroUp`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Group created");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this group from GroUp records?")) return;
    const { error } = await supabase.from("messaging_conversations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); load(); }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" /> WhatsApp Client Group
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="space-y-0.5">
            <Label className="text-xs font-medium">White-glove (route via Employer line)</Label>
            <p className="text-[11px] text-muted-foreground">
              Default: <code>community-engine</code>. Toggle for premium clients to use <code>employer-outreach</code>.
            </p>
          </div>
          <Switch checked={whiteGlove} onCheckedChange={setWhiteGlove} />
        </div>

        <div className="text-xs flex items-center gap-2">
          <span className="text-muted-foreground">Will use:</span>
          <Badge variant="secondary">{selectedKey}</Badge>
          {selectedChannel ? (
            <Badge variant={selectedChannel.status === "connected" ? "default" : "outline"}>
              {selectedChannel.status}
              {selectedChannel.phone_e164 ? ` · ${selectedChannel.phone_e164}` : ""}
            </Badge>
          ) : (
            <Badge variant="outline">not configured</Badge>
          )}
        </div>

        <Button
          size="sm"
          onClick={create}
          disabled={creating || !selectedChannel || selectedChannel.status !== "connected"}
        >
          {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Create WhatsApp Group
        </Button>

        <div className="space-y-2">
          {loading ? (
            <div className="py-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></div>
          ) : groups.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No groups yet for this company.</p>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between border rounded p-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">{g.peer_display_name || "Untitled group"}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {g.group_kind || "client_account"} · {g.external_chat_id || "pending"}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(g.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CompanyWhatsAppGroupCard;
