import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { updateChannelAutoReply } from "@/domains/messaging/repo/messagingRepo";
import { unipileConnect } from "@/domains/messaging/api/messagingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Phone, MessageCircle, Trash2, Network, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messaging_channels", filter: `agent_key=eq.${agentKey}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [agentKey]);

  const [accountId, setAccountId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const connectWhatsApp = async () => {
    if (!label.trim()) return toast.error("Label is required");
    setCreating(true);
    try {
      const data = await unipileConnect({
        action: "start_hosted_auth",
        agent_key: agentKey,
        label,
        region,
        provider: "whatsapp",
      });
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
      const data = await unipileConnect({
        action: "verify_and_save",
        agent_key: agentKey,
        account_id: accountId.trim(),
      });
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
    const { error } = await updateChannelAutoReply(id, val);
    if (error) toast.error(error.message);
  };

  const removeChannel = async () => {
    if (!confirm("Disconnect this channel? The Unipile account will be removed.")) return;
    try {
      const data = await unipileConnect({ action: "delete", agent_key: agentKey });
      if (data?.error) toast.error(data.error);
      else toast.success("Channel removed");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const [reconciling, setReconciling] = useState(false);
  const reconcile = async () => {
    setReconciling(true);
    try {
      const data = await unipileConnect({ action: "reconcile", agent_key: agentKey });
      if (data?.ok) toast.success(`Reconciled${data.phone ? ` · ${data.phone}` : ""}`);
      else toast.error(data?.error || "Reconcile failed");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {(title || description) && (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-primary">
              <Network className="h-8 w-8" />
              {title && <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{title}</h2>}
            </div>
            {description && (
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
                {description}
              </p>
            )}
          </div>
        </header>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-blue-500" />
          <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
            <CardTitle className="text-lg font-black italic tracking-tight flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Connect a new channel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-12 rounded-xl border-2" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Region</Label>
                <Input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-12 rounded-xl border-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={connectWhatsApp}
                disabled={creating}
                className="w-full sm:w-auto h-12 rounded-xl px-6 font-bold uppercase tracking-wider text-[10px]"
              >
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Phone className="h-4 w-4 mr-2" />}
                Connect WhatsApp
              </Button>
              <p className="text-xs text-muted-foreground">
                Opens Unipile hosted QR. Scan from the WhatsApp app you want this agent to use.
              </p>
            </div>

            <div className="border-t border-border/20 pt-6 space-y-3 mt-auto">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic flex items-center gap-2">
                <QrCode className="h-3 w-3" /> Already scanned? Paste account ID
              </Label>
              <p className="text-xs text-muted-foreground">
                If the redirect didn't fire, copy the{" "}
                <code className="bg-muted/50 px-1 py-0.5 rounded text-primary">account_id</code> from your Unipile
                dashboard and paste it here to finish linking.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Unipile account_id (UUID)"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="h-12 rounded-xl border-2 font-mono text-xs"
                />
                <Button
                  onClick={verifyAndSave}
                  disabled={verifying || !accountId.trim()}
                  variant="secondary"
                  className="h-12 rounded-xl px-6 font-bold uppercase tracking-wider text-[10px]"
                >
                  {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Verify
                </Button>
              </div>
              {hasStarted && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-blue-500 font-medium">
                    QR opened — complete the scan, then verify above if status doesn't flip automatically.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
          <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
            <CardTitle className="text-lg font-black italic tracking-tight flex items-center gap-2">
              <Network className="h-5 w-5 text-emerald-500" /> Connected channels
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
              </div>
            ) : channels.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed border-border/40 rounded-2xl bg-muted/5">
                <Phone className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">No channels yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-border/40 rounded-2xl p-4 bg-background hover:border-primary/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                          c.provider === "whatsapp"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-blue-500/10 text-blue-500",
                        )}
                      >
                        {c.provider === "whatsapp" ? (
                          <Phone className="h-5 w-5" />
                        ) : (
                          <MessageCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold truncate text-sm">{c.label}</div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">
                          {c.phone_e164 || c.unipile_account_id || "Awaiting connection"} · {c.region}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <Badge
                        variant="outline"
                        className={cn(
                          "uppercase text-[9px] font-black tracking-widest border-2 px-2 py-0.5",
                          c.status === "connected"
                            ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
                            : "border-orange-500/30 text-orange-500 bg-orange-500/5",
                        )}
                      >
                        {c.status}
                      </Badge>

                      {c.status !== "connected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={reconcile}
                          disabled={reconciling}
                          className="h-8 rounded-lg text-xs"
                        >
                          {reconciling ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                          Reconcile
                        </Button>
                      )}

                      <div
                        className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50"
                        title="Toggle AI Auto-Reply"
                      >
                        <Switch checked={c.auto_reply_enabled} onCheckedChange={(v) => toggleAutoReply(c.id, v)} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          AI
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChannel()}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      >
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
    </div>
  );
}
