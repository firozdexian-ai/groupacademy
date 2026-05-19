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
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Zap, Wallet, Trash2, PlayCircle, Loader2, Network, Cpu, Coins, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const EVENT_KINDS = [
  "talent.signup",
  "talent.profile_completed",
  "talent.market_ready",
  "talent.coach_assigned",
  "talent.profile_stale",
  "assessment.completed",
  "course.completed",
  "job.applied",
  "pitch.sent",
  "gig.match_high_score",
  "credits.low_balance",
  "company.signup",
  "cron",
];

const CHANNELS = [
  { value: "auto", label: "Auto (Agent Default)" },
  { value: "in_app", label: "In-App Notification" },
  { value: "whatsapp", label: "WhatsApp (Unipile)" },
  { value: "telegram", label: "Telegram" },
  { value: "email", label: "Email" },
];

const RECIPIENT_STRATEGIES = [
  { value: "subject", label: "Event Subject (Talent/Company)" },
  { value: "admin", label: "All Admins" },
  { value: "company", label: "Company (From Filter)" },
  { value: "custom", label: "Custom (Filter Object)" },
];

interface Agent {
  id: string;
  name: string;
  agent_key: string;
}
interface Trigger {
  id: string;
  agent_id: string;
  event_kind: string;
  recipient_strategy: string;
  template: string;
  is_active: boolean;
  last_fired_at: string | null;
  channel: string | null;
  cooldown_minutes: number;
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
    channel: "auto",
    cooldown_minutes: 1440,
  });

  const agentMap = useMemo(() => Object.fromEntries(agents.map((a) => [a.id, a])), [agents]);

  async function load() {
    setLoading(true);
    const [a, t, p, o] = await Promise.all([
      supabase.from("ai_agents").select("id, name, agent_key").eq("is_active", true).order("name"),
      supabase.from("agent_triggers").select("*").order("created_at", { ascending: false }),
      supabase.from("headless_pool").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("agent_outreach")
        .select("id, agent_id, recipient_kind, channel, status, body, credits_charged, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setAgents((a.data || []) as Agent[]);
    setTriggers((t.data || []) as Trigger[]);
    setPool((p.data as Pool) || null);
    setOutreach((o.data || []) as OutreachRow[]);
    setCapAmount(p.data ? String((p.data as Pool).monthly_cap) : "");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveTrigger() {
    if (!draft.agent_id || !draft.event_kind || !draft.template) {
      toast({
        title: "Logic Fault",
        description: "Select an agent, event, and supply a template.",
        variant: "destructive",
      });
      return;
    }
    const { error } = await supabase.from("agent_triggers").insert({
      agent_id: draft.agent_id,
      event_kind: draft.event_kind,
      recipient_strategy: draft.recipient_strategy || "subject",
      template: draft.template,
      is_active: draft.is_active ?? true,
      channel: draft.channel && draft.channel !== "auto" ? draft.channel : null,
      cooldown_minutes: Number(draft.cooldown_minutes ?? 1440),
    });
    if (error) {
      toast({ title: "Protocol Rejection", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Trigger Node Synchronized" });
    setDialogOpen(false);
    setDraft({
      agent_id: "",
      event_kind: "talent.signup",
      recipient_strategy: "subject",
      template: "",
      is_active: true,
      channel: "auto",
      cooldown_minutes: 1440,
    });
    load();
  }

  async function toggleTrigger(t: Trigger) {
    const { error } = await supabase.from("agent_triggers").update({ is_active: !t.is_active }).eq("id", t.id);
    if (error) return toast({ title: "Protocol Rejection", description: error.message, variant: "destructive" });
    load();
  }

  async function deleteTrigger(id: string) {
    if (!confirm("Purge this trigger node?")) return;
    const { error } = await supabase.from("agent_triggers").delete().eq("id", id);
    if (error) return toast({ title: "Purge Failed", description: error.message, variant: "destructive" });
    load();
  }

  async function topUp() {
    const amt = Number(topUpAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const newBalance = (pool?.balance || 0) + amt;
    const { error } = await supabase.from("headless_pool").update({ balance: newBalance }).eq("id", 1);
    if (error) return toast({ title: "Transaction Rejection", description: error.message, variant: "destructive" });
    toast({ title: `Allocated ${amt} CR to Headless Pool` });
    load();
  }

  async function updateCap() {
    const cap = Number(capAmount);
    if (!Number.isFinite(cap) || cap < 0) return;
    const { error } = await supabase.from("headless_pool").update({ monthly_cap: cap }).eq("id", 1);
    if (error) return toast({ title: "Transaction Rejection", description: error.message, variant: "destructive" });
    toast({ title: "Burn Cap Synchronized" });
    load();
  }

  async function runDispatcher() {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-event-dispatcher", { body: {} });
      if (error) throw error;
      toast({
        title: "Swarm Dispatched",
        description: `Processed ${data?.events ?? 0} events, dispatched ${data?.dispatched ?? 0}.`,
      });
      load();
    } catch (e: any) {
      toast({ title: "Dispatch Failed", description: e.message || String(e), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4 md:p-6">
        <Skeleton className="h-32 w-full rounded-[40px] bg-muted/40" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-[40px] bg-muted/40" />
          <Skeleton className="h-[400px] w-full rounded-[40px] bg-muted/40" />
        </div>
      </div>
    );
  }

  const spentPct = pool ? Math.min(100, Math.round((pool.spent_this_month / Math.max(1, pool.monthly_cap)) * 100)) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Zap className="h-8 w-8 text-amber-500 fill-amber-500/20" />
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Swarm Control Room</h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Event Triggers · Headless Dispatch · Pool Economics
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={runDispatcher}
            disabled={running}
            className="rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Execute Dispatch
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> New Trigger
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
              <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
              <div className="p-10">
                <DialogHeader className="mb-8">
                  <div className="flex items-center gap-4">
                    <Network className="h-8 w-8 text-primary" />
                    <div className="space-y-1 text-left">
                      <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                        Initialize Trigger Node
                      </DialogTitle>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                        Map platform events to autonomous agent protocols
                      </p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Agent Protocol
                      </Label>
                      <Select value={draft.agent_id} onValueChange={(v) => setDraft({ ...draft, agent_id: v })}>
                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold text-xs bg-muted/20">
                          <SelectValue placeholder="Select logic node..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                          {agents.map((a) => (
                            <SelectItem key={a.id} value={a.id} className="font-bold">
                              {a.name} <span className="text-[9px] text-muted-foreground ml-2">({a.agent_key})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Platform Event
                      </Label>
                      <Select value={draft.event_kind} onValueChange={(v) => setDraft({ ...draft, event_kind: v })}>
                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold text-xs bg-muted/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                          {EVENT_KINDS.map((e) => (
                            <SelectItem key={e} value={e} className="font-bold">
                              {e}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 md:col-span-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Strategy
                      </Label>
                      <Select
                        value={draft.recipient_strategy}
                        onValueChange={(v) => setDraft({ ...draft, recipient_strategy: v })}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold text-xs bg-muted/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                          {RECIPIENT_STRATEGIES.map((r) => (
                            <SelectItem key={r.value} value={r.value} className="font-bold">
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Channel Route
                      </Label>
                      <Select value={draft.channel || "auto"} onValueChange={(v) => setDraft({ ...draft, channel: v })}>
                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold text-xs bg-muted/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                          {CHANNELS.map((c) => (
                            <SelectItem key={c.value} value={c.value} className="font-bold">
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Cooldown (Min)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={String(draft.cooldown_minutes ?? 1440)}
                        onChange={(e) => setDraft({ ...draft, cooldown_minutes: Number(e.target.value) })}
                        className="h-12 rounded-xl border-2 font-black text-center bg-muted/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
                        Execution Template
                      </Label>
                      <Badge variant="secondary" className="text-[8px] uppercase tracking-widest">
                        Natural Rewrite Active
                      </Badge>
                    </div>
                    <Textarea
                      rows={4}
                      value={draft.template || ""}
                      onChange={(e) => setDraft({ ...draft, template: e.target.value })}
                      placeholder="E.g. Welcome the new talent, point them to the career assessment as a first step."
                      className="rounded-2xl border-2 bg-muted/10 font-medium italic text-sm p-4 resize-none"
                    />
                  </div>
                </div>

                <DialogFooter className="mt-10 pt-8 border-t border-border/10">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-2"
                  >
                    Abort
                  </Button>
                  <Button
                    onClick={saveTrigger}
                    className="h-12 px-10 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/20 gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" /> Inject Trigger
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          {/* Headless Pool */}
          <Card className="rounded-[40px] border-2 border-border/40 shadow-xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
            <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
                <Wallet className="h-4 w-4 text-amber-500" /> Headless Pool Economics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
                    Available CR
                  </div>
                  <div className="text-3xl font-black italic tracking-tighter text-amber-500">
                    {pool?.balance?.toLocaleString() ?? "0"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
                    Burned (MTD)
                  </div>
                  <div className="text-3xl font-black italic tracking-tighter text-destructive/80">
                    {pool?.spent_this_month?.toLocaleString() ?? "0"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
                    Hard Cap
                  </div>
                  <div className="text-3xl font-black italic tracking-tighter text-primary">
                    {pool?.monthly_cap?.toLocaleString() ?? "0"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Burn Rate vs Cap
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-black italic",
                      spentPct > 90 ? "text-destructive" : "text-amber-500",
                    )}
                  >
                    {spentPct}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden shadow-inner border border-border/20">
                  <div
                    className={cn(
                      "h-full transition-all duration-1000",
                      spentPct > 90 ? "bg-destructive" : "bg-gradient-to-r from-amber-400 to-orange-500",
                    )}
                    style={{ width: `${spentPct}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/10">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                    <Input
                      className="h-10 pl-9 rounded-xl border-2 font-black text-sm"
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={topUp}
                    className="h-10 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest"
                  >
                    Top Up
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    className="h-10 rounded-xl border-2 font-black text-sm"
                    type="number"
                    value={capAmount}
                    onChange={(e) => setCapAmount(e.target.value)}
                    placeholder="New Cap"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={updateCap}
                    className="h-10 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest border-2"
                  >
                    Set Cap
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Triggers */}
          <Card className="rounded-[40px] border-2 border-border/40 shadow-xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
                <Cpu className="h-4 w-4 text-emerald-500" /> Active Logic Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {triggers.length === 0 ? (
                <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic">
                  No trigger nodes detected.
                </div>
              ) : (
                <div className="space-y-4">
                  {triggers.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-[24px] border-2 border-border/20 bg-background/50 p-5 hover:border-primary/20 transition-all group"
                    >
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px] uppercase tracking-widest">
                            {t.event_kind}
                          </Badge>
                          <span className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors truncate">
                            {agentMap[t.agent_id]?.name || "(AGENT OFFLINE)"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[8px] font-black uppercase tracking-widest bg-muted/50 border-border/40"
                          >
                            {t.recipient_strategy}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[8px] font-black uppercase tracking-widest border-border/40"
                          >
                            {t.channel || "AUTO_ROUTE"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[8px] font-black uppercase tracking-widest border-border/40"
                          >
                            CD: {t.cooldown_minutes ?? 1440}m
                          </Badge>
                        </div>
                        <div className="text-xs font-medium text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-1">
                          "{t.template}"
                        </div>
                        {t.last_fired_at && (
                          <div className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                            Last Dispatched: {new Date(t.last_fired_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Switch
                          checked={t.is_active}
                          onCheckedChange={() => toggleTrigger(t)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTrigger(t.id)}
                          className="h-8 w-8 rounded-lg text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
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

        {/* Recent Outreach Feed */}
        <Card className="rounded-[40px] border-2 border-border/40 shadow-xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col h-full">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
          <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
              <Network className="h-4 w-4 text-primary" /> Swarm Dispatch Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[800px]">
            {running ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground/50 bg-muted/5">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <span className="font-black uppercase tracking-widest text-[10px]">Syncing Dispatches...</span>
              </div>
            ) : outreach.length === 0 ? (
              <div className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic">
                No recent outreach logged.
              </div>
            ) : (
              <div className="divide-y-2 divide-border/5">
                {outreach.map((o) => (
                  <div key={o.id} className="p-6 hover:bg-primary/[0.02] transition-colors group">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border-none",
                            o.status === "sent" || o.status === "delivered"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {o.status}
                        </Badge>
                        <span className="font-black text-sm uppercase tracking-tight italic truncate group-hover:text-primary transition-colors">
                          {agentMap[o.agent_id]?.name || o.agent_id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                          {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-[9px] font-bold text-amber-500 flex items-center justify-end gap-1">
                          <Zap className="h-2.5 w-2.5 fill-current" /> {o.credits_charged}c
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="mb-3 text-[8px] font-black uppercase tracking-widest border-border/40"
                    >
                      {o.channel} → {o.recipient_kind}
                    </Badge>

                    <div className="text-xs font-medium text-foreground/80 leading-relaxed italic border-l-2 border-border/20 pl-3">
                      {o.body}
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

export default AgentTriggers;
