import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Phone, MessageCircle, Trash2 } from "lucide-react";

interface Channel {
  id: string;
  agent_key: string;
  provider: "whatsapp" | "telegram";
  label: string;
  region: string | null;
  language: string | null;
  status: string;
  phone_e164: string | null;
  auto_reply_enabled: boolean;
  unipile_account_id: string | null;
  metadata: any;
}

interface MessagingChannelsTabProps {
  agentKey: string;
  defaultLabel?: string;
  defaultRegion?: string;
  title?: string;
  description?: string;
}

export function MessagingChannelsTab({
  agentKey,
  defaultLabel = "Talent Executive — Bangladesh",
  defaultRegion = "Bangladesh",
  title,
  description,
}: MessagingChannelsTabProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState(defaultLabel);
  const [region, setRegion] = useState(defaultRegion);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("messaging_channels")
      .select("*")
      .eq("agent_key", agentKey)
      .order("created_at", { ascending: false });
    setChannels((data ?? []) as Channel[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("messaging_channels_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "messaging_channels", filter: `agent_key=eq.${agentKey}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [agentKey]);

  const [accountId, setAccountId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const connectWhatsApp = async () => {
    if (!label.trim()) return toast.error("Label is required");
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("unipile-connect", {
        body: { action: "start_hosted_auth", agent_key: agentKey, label, region, provider: "whatsapp" },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank", "noopener");
        setHasStarted(true);
        toast.success("Scan the QR in the new tab to link WhatsApp");
      } else {
        toast.error(data?.error || "Failed to start link");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const verifyAndSave = async () => {
    if (!accountId.trim()) return toast.error("Paste the Unipile account_id first");
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("unipile-connect", {
        body: { action: "verify_and_save", agent_key: agentKey, account_id: accountId.trim() },
      });
      if (error) throw error;
      if (data?.ok) {
        toast.success(`Connected${data.phone ? ` · ${data.phone}` : ""}`);
        setAccountId("");
        setHasStarted(false);
      } else {
        toast.error(data?.error || "Verification failed");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setVerifying(false);
    }
  };

  const toggleAutoReply = async (id: string, val: boolean) => {
    const { error } = await supabase.from("messaging_channels").update({ auto_reply_enabled: val }).eq("id", id);
    if (error) toast.error(error.message);
  };

  const removeChannel = async () => {
    if (!confirm("Disconnect this channel? The Unipile account will be removed.")) return;
    const { data, error } = await supabase.functions.invoke("unipile-connect", {
      body: { action: "delete", agent_key: agentKey },
    });
    if (error || data?.error) toast.error(error?.message || data?.error);
    else toast.success("Channel removed");
  };

  const [reconciling, setReconciling] = useState(false);
  const reconcile = async () => {
    setReconciling(true);
    try {
      const { data, error } = await supabase.functions.invoke("unipile-connect", {
        body: { action: "reconcile", agent_key: agentKey },
      });
      if (error) throw error;
      if (data?.ok) toast.success(`Reconciled${data.phone ? ` · ${data.phone}` : ""}`);
      else toast.error(data?.error || "Reconcile failed");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div className="space-y-1">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connect a new channel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div>
              <Label>Region</Label>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={connectWhatsApp} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Connect WhatsApp
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Opens Unipile hosted QR. Scan from the WhatsApp app you want this agent to use.
          </p>

          <div className="border-t pt-3 space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Already scanned? Paste account ID
            </Label>
            <p className="text-xs text-muted-foreground">
              If the redirect didn't fire, copy the <code>account_id</code> from your Unipile dashboard and paste it here to finish linking.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Unipile account_id (UUID)"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
              <Button onClick={verifyAndSave} disabled={verifying} variant="secondary">
                {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Verify & save
              </Button>
            </div>
            {hasStarted && (
              <p className="text-xs text-muted-foreground">QR opened — complete the scan, then verify above if status doesn't flip automatically.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected channels</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : channels.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No channels yet.</p>
          ) : (
            <div className="space-y-2">
              {channels.map((c) => (
                <div key={c.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.provider === "whatsapp" ? <Phone className="h-4 w-4 text-success shrink-0" /> : <MessageCircle className="h-4 w-4 shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.label}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.phone_e164 || c.unipile_account_id || "Awaiting connection"} · {c.region}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={c.status === "connected" ? "default" : "secondary"}>{c.status}</Badge>
                    {c.status !== "connected" && (
                      <Button size="sm" variant="outline" onClick={reconcile} disabled={reconciling}>
                        {reconciling ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                        Reconcile
                      </Button>
                    )}
                    <div className="flex items-center gap-1">
                      <Switch checked={c.auto_reply_enabled} onCheckedChange={(v) => toggleAutoReply(c.id, v)} />
                      <span className="text-xs">AI</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeChannel()}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
