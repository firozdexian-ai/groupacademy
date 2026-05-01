// Phase 6 — Admin: Agent Triggers + Headless Pool control room.
// Manage which agents react to which platform events, and top up the pool
// that funds those headless conversations.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Zap, Wallet, Trash2, PlayCircle, Loader2 } from "lucide-react";

const EVENT_KINDS = [
  "talent.signup",
  "talent.profile_completed",
  "assessment.completed",
  "course.completed",
  "job.applied",
  "credits.low_balance",
  "company.signup",
  "cron",
];

const RECIPIENT_STRATEGIES = [
  { value: "subject", label: "Event subject (talent/company)" },
  { value: "admin", label: "All admins" },
  { value: "company", label: "Company (from filter)" },
  { value: "custom", label: "Custom (filter object)" },
];

interface Agent { id: string; name: string; agent_key: string; }
interface Trigger {
  id: string;
  agent_id: string;
  event_kind: string;
  recipient_strategy: string;
  template: string;
  is_active: boolean;
  last_fired_at: string | null;
}
interface Pool {
  balance: number;
  monthly_cap: number;
  spent_this_month: number;
  month_anchor: string;
}
interface OutreachRow {
  id: string;
  agent_id: string;
  recipient_kind: string;
  channel: string;
  status: string;
  body: string;
  credits_charged: number;
  created_at: string;
}

export function AgentTriggers() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [pool, setPool] = useState<Pool | null>(null);
  const [outreach, setOutreach] = useState<OutreachRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("1000");
  const [capAmount, setCapAmount] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [draft, setDraft] = useState<Partial<Trigger>>({
    agent_id: "",
    event_kind: "talent.signup",
    recipient_strategy: "subject",
    template: "",
    is_active: true,
  });

  const agentMap = useMemo(() => Object.fromEntries(agents.map(a => [a.id, a])), [agents]);

  async function load() {
    setLoading(true);
    const [a, t, p, o] = await Promise.all([
      supabase.from("ai_agents").select("id, name, agent_key").eq("is_active", true).order("name"),
      supabase.from("agent_triggers").select("*").order("created_at", { ascending: false }),
      supabase.from("headless_pool").select("*").eq("id", 1).maybeSingle(),
      supabase.from("agent_outreach").select("id, agent_id, recipient_kind, channel, status, body, credits_charged, created_at").order("created_at", { ascending: false }).limit(20),
    ]);
    setAgents((a.data || []) as Agent[]);
    setTriggers((t.data || []) as Trigger[]);
    setPool((p.data as Pool) || null);
    setOutreach((o.data || []) as OutreachRow[]);
    setCapAmount(p.data ? String((p.data as Pool).monthly_cap) : "");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveTrigger() {
    if (!draft.agent_id || !draft.event_kind || !draft.template) {
      toast({ title: "Missing fields", description: "Pick an agent, event, and write a template.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("agent_triggers").insert({
      agent_id: draft.agent_id,
      event_kind: draft.event_kind,
      recipient_strategy: draft.recipient_strategy || "subject",
      template: draft.template,
      is_active: draft.is_active ?? true,
    });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Trigger created" });
    setDialogOpen(false);
    setDraft({ agent_id: "", event_kind: "talent.signup", recipient_strategy: "subject", template: "", is_active: true });
    load();
  }

  async function toggleTrigger(t: Trigger) {
    const { error } = await supabase.from("agent_triggers").update({ is_active: !t.is_active }).eq("id", t.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    load();
  }

  async function deleteTrigger(id: string) {
    if (!confirm("Delete this trigger?")) return;
    const { error } = await supabase.from("agent_triggers").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    load();
  }

  async function topUp() {
    const amt = Number(topUpAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const newBalance = (pool?.balance || 0) + amt;
    const { error } = await supabase.from("headless_pool").update({ balance: newBalance }).eq("id", 1);
    if (error) return toast({ title: "Top up failed", description: error.message, variant: "destructive" });
    toast({ title: `Added ${amt} credits to pool` });
    load();
  }

  async function updateCap() {
    const cap = Number(capAmount);
    if (!Number.isFinite(cap) || cap < 0) return;
    const { error } = await supabase.from("headless_pool").update({ monthly_cap: cap }).eq("id", 1);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: "Monthly cap updated" });
    load();
  }

  async function runDispatcher() {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-event-dispatcher", { body: {} });
      if (error) throw error;
      toast({ title: "Dispatcher ran", description: `Processed ${data?.events ?? 0} events, dispatched ${data?.dispatched ?? 0}.` });
      load();
    } catch (e: any) {
      toast({ title: "Run failed", description: e.message || String(e), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading triggers…</div>;

  const spentPct = pool ? Math.min(100, Math.round((pool.spent_this_month / Math.max(1, pool.monthly_cap)) * 100)) : 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Zap className="h-6 w-6 text-primary" /> Channel Triggers</h1>
          <p className="text-sm text-muted-foreground">Wire platform events to headless agents. Funded by the platform pool.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runDispatcher} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            <span className="ml-2">Run now</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Trigger</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New trigger</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Agent</Label>
                  <Select value={draft.agent_id} onValueChange={(v) => setDraft({ ...draft, agent_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pick agent" /></SelectTrigger>
                    <SelectContent>
                      {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name} <span className="text-xs text-muted-foreground">({a.agent_key})</span></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Event</Label>
                  <Select value={draft.event_kind} onValueChange={(v) => setDraft({ ...draft, event_kind: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EVENT_KINDS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recipient strategy</Label>
                  <Select value={draft.recipient_strategy} onValueChange={(v) => setDraft({ ...draft, recipient_strategy: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{RECIPIENT_STRATEGIES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Template / intent</Label>
                  <Textarea
                    rows={4}
                    value={draft.template || ""}
                    onChange={(e) => setDraft({ ...draft, template: e.target.value })}
                    placeholder="E.g. Welcome the new talent, point them to the career assessment as a first step."
                  />
                  <p className="text-xs text-muted-foreground mt-1">The agent rewrites this naturally using the event payload.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveTrigger}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-4 w-4" /> Headless Pool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><div className="text-muted-foreground text-xs">Balance</div><div className="text-lg font-semibold">{pool?.balance?.toFixed(1) ?? "0.0"}</div></div>
            <div><div className="text-muted-foreground text-xs">Spent this month</div><div className="text-lg font-semibold">{pool?.spent_this_month?.toFixed(1) ?? "0.0"}</div></div>
            <div><div className="text-muted-foreground text-xs">Monthly cap</div><div className="text-lg font-semibold">{pool?.monthly_cap?.toFixed(0) ?? "0"}</div></div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${spentPct}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Input className="w-32" type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} />
            <Button size="sm" onClick={topUp}>Top up</Button>
            <div className="w-px bg-border mx-2" />
            <Input className="w-32" type="number" value={capAmount} onChange={(e) => setCapAmount(e.target.value)} placeholder="Cap" />
            <Button size="sm" variant="outline" onClick={updateCap}>Update cap</Button>
          </div>
        </CardContent>
      </Card>

      {/* Triggers */}
      <Card>
        <CardHeader><CardTitle className="text-base">Active triggers</CardTitle></CardHeader>
        <CardContent>
          {triggers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No triggers yet. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {triggers.map(t => (
                <div key={t.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{t.event_kind}</Badge>
                      <span className="font-medium text-sm truncate">{agentMap[t.agent_id]?.name || "(agent missing)"}</span>
                      <Badge variant="secondary" className="text-[10px]">{t.recipient_strategy}</Badge>
                      {t.last_fired_at && <span className="text-[10px] text-muted-foreground">last: {new Date(t.last_fired_at).toLocaleString()}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.template}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={t.is_active} onCheckedChange={() => toggleTrigger(t)} />
                    <Button variant="ghost" size="icon" onClick={() => deleteTrigger(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent outreach */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent outreach</CardTitle></CardHeader>
        <CardContent>
          {outreach.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outreach yet. Run the dispatcher or trigger a platform event.</p>
          ) : (
            <div className="space-y-2">
              {outreach.map(o => (
                <div key={o.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant={o.status === "sent" ? "default" : "destructive"}>{o.status}</Badge>
                      <span className="text-xs text-muted-foreground truncate">{agentMap[o.agent_id]?.name || o.agent_id}</span>
                      <Badge variant="outline" className="text-[10px]">{o.channel} → {o.recipient_kind}</Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleString()} · {o.credits_charged}c</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/80 line-clamp-3">{o.body}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentTriggers;
