import { useEffect, useMemo, useState } from "react";
import {
  getTriggersBundle,
  listRecentAgentOutreach,
  insertAgentTrigger,
  toggleAgentTrigger,
  deleteAgentTrigger,
  updateHeadlessPoolBalance,
  updateHeadlessPoolMonthlyCap,
} from "@/domains/agents/repo/agentsRepo";
import { agentEventDispatcher } from "@/domains/agents/api/agentsApi";
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
    const [{ agents: agentRows, triggers: triggerRows, pool: poolRow }, outreachRows] = await Promise.all([
      getTriggersBundle(),
      listRecentAgentOutreach(20),
    ]);
    setAgents((agentRows || []) as Agent[]);
    setTriggers((triggerRows || []) as Trigger[]);
    setPool((poolRow as Pool) || null);
    setOutreach((outreachRows || []) as OutreachRow[]);
    setCapAmount(poolRow ? String((poolRow as Pool).monthly_cap) : "");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveTrigger() {
    if (!draft.agent_id || !draft.event_kind || !draft.template) {
      toast({
        title: "Required fields missing",
        description: "Please select an agent, event type, and supply a valid instruction template.",
        variant: "destructive",
      });
      return;
    }
    try {
      await insertAgentTrigger({
        agent_id: draft.agent_id,
        event_kind: draft.event_kind,
        recipient_strategy: draft.recipient_strategy || "subject",
        template: draft.template,
        is_active: draft.is_active ?? true,
        channel: draft.channel && draft.channel !== "auto" ? draft.channel : null,
        cooldown_minutes: Number(draft.cooldown_minutes ?? 1440),
      });
    } catch (error: any) {
      toast({
        title: "Failed to create trigger",
        description: error.message || "An unexpected error occurred while saving.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Automation trigger saved successfully" });
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
    try {
      await toggleAgentTrigger(t.id, !t.is_active);
    } catch (error: any) {
      return toast({
        title: "Status change failed",
        description: error.message || "Could not toggle the active state.",
        variant: "destructive",
      });
    }
    load();
  }

  async function deleteTrigger(id: string) {
    if (!confirm("Are you sure you want to completely remove this automation trigger?")) return;
    try {
      await deleteAgentTrigger(id);
    } catch (error: any) {
      return toast({
        title: "Deletion failed",
        description: error.message || "Could not purge the trigger profile.",
        variant: "destructive",
      });
    }
    load();
  }

  async function topUp() {
    const amt = Number(topUpAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const newBalance = (pool?.balance || 0) + amt;
    try {
      await updateHeadlessPoolBalance(newBalance);
    } catch (error: any) {
      return toast({
        title: "Transaction failed",
        description: error.message || "Could not top up the credits.",
        variant: "destructive",
      });
    }
    toast({ title: `Successfully added ${amt} credits to the shared pool.` });
    load();
  }

  async function updateCap() {
    const cap = Number(capAmount);
    if (!Number.isFinite(cap) || cap < 0) return;
    try {
      await updateHeadlessPoolMonthlyCap(cap);
    } catch (error: any) {
      return toast({
        title: "Limits update failed",
        description: error.message || "Could not change monthly cap configuration.",
        variant: "destructive",
      });
    }
    toast({ title: "Monthly spend limits updated successfully." });
    load();
  }

  async function runDispatcher() {
    setRunning(true);
    try {
      const data = await agentEventDispatcher({});
      toast({
        title: "Triggers updated",
        description: `Successfully evaluated ${data?.events ?? 0} events and sent ${data?.dispatched ?? 0} messages.`,
      });
      load();
    } catch (e: any) {
      toast({
        title: "Execution failed",
        description: e.message || "Something went wrong while executing the background dispatcher.",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4 md:p-6">
        <Skeleton className="h-24 w-full rounded-xl bg-muted/40" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl bg-muted/40" />
          <Skeleton className="h-[400px] w-full rounded-xl bg-muted/40" />
        </div>
      </div>
    );
  }

  const spentPct = pool ? Math.min(100, Math.round((pool.spent_this_month / Math.max(1, pool.monthly_cap)) * 100)) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-4 md:p-6">
      {/* Background Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10 p-6 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <Zap className="h-5 w-5 text-amber-500 fill-amber-500/10" />
            <h1 className="text-2xl font-bold tracking-tight">Automation Trigger Center</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Map specific workspace events to active agents, set communication channels, and manage shared credits.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            onClick={runDispatcher}
            disabled={running}
            variant="outline"
            className="rounded-lg h-10 px-4 text-xs font-semibold gap-1.5 bg-background shadow-sm"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
            Run Dispatcher
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg h-10 px-4 text-xs font-semibold gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Add Trigger Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-xl border bg-background p-0 overflow-hidden shadow-xl">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary rounded-t-xl" />
              <div className="p-6 sm:p-8">
                <DialogHeader className="mb-6">
                  <div className="flex items-center gap-3">
                    <Network className="h-5 w-5 text-primary" />
                    <div className="space-y-0.5 text-left">
                      <DialogTitle className="text-lg font-bold tracking-tight">Create Automation Trigger</DialogTitle>
                      <p className="text-xs text-muted-foreground">
                        Set up an AI agent to respond to system events.
                      </p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Select AI Agent</Label>
                      <Select value={draft.agent_id} onValueChange={(v) => setDraft({ ...draft, agent_id: v })}>
                        <SelectTrigger className="h-10 rounded-lg text-xs font-medium bg-muted/20">
                          <SelectValue placeholder="Select an agent..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border">
                          {agents.map((a) => (
                            <SelectItem key={a.id} value={a.id} className="text-xs font-medium">
                              {a.name} <span className="text-[10px] text-muted-foreground ml-1">({a.agent_key})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Event Trigger</Label>
                      <Select value={draft.event_kind} onValueChange={(v) => setDraft({ ...draft, event_kind: v })}>
                        <SelectTrigger className="h-10 rounded-lg text-xs font-medium bg-muted/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border">
                          {EVENT_KINDS.map((e) => (
                            <SelectItem key={e} value={e} className="text-xs font-mono">
                              {e}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-1">
                      <Label className="text-xs font-semibold text-foreground">Recipient</Label>
                      <Select
                        value={draft.recipient_strategy}
                        onValueChange={(v) => setDraft({ ...draft, recipient_strategy: v })}
                      >
                        <SelectTrigger className="h-10 rounded-lg text-xs font-medium bg-muted/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border">
                          {RECIPIENT_STRATEGIES.map((r) => (
                            <SelectItem key={r.value} value={r.value} className="text-xs font-medium">
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                      <Label className="text-xs font-semibold text-foreground">Channel</Label>
                      <Select value={draft.channel || "auto"} onValueChange={(v) => setDraft({ ...draft, channel: v })}>
                        <SelectTrigger className="h-10 rounded-lg text-xs font-medium bg-muted/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border">
                          {CHANNELS.map((c) => (
                            <SelectItem key={c.value} value={c.value} className="text-xs font-medium">
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                      <Label className="text-xs font-semibold text-foreground">Cooldown (Minutes)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={String(draft.cooldown_minutes ?? 1440)}
                        onChange={(e) => setDraft({ ...draft, cooldown_minutes: Number(e.target.value) })}
                        className="h-10 rounded-lg text-xs font-medium bg-muted/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center mb-0.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Message Template / Prompt
                      </Label>
                      <Badge variant="secondary" className="text-[10px] font-medium rounded px-1">
                        Dynamic values active
                      </Badge>
                    </div>
                    <Textarea
                      rows={4}
                      value={draft.template || ""}
                      onChange={(e) => setDraft({ ...draft, template: e.target.value })}
                      placeholder="E.g., Welcome new users and suggest starting a career assessment."
                      className="rounded-lg text-xs p-3 font-medium bg-muted/10 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <DialogFooter className="mt-6 pt-4 border-t gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="h-10 px-4 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveTrigger}
                    className="h-10 px-5 rounded-lg text-xs font-semibold gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="h-4 w-4" /> Save Trigger
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          {/* Shared Credit Pools */}
          <Card className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card/40 backdrop-blur-xl flex flex-col">
            <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-xl" />
            <CardHeader className="p-4 sm:p-5 border-b border-border/40 bg-muted/5">
              <CardTitle className="text-xs font-semibold tracking-wider uppercase flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-3.5 w-3.5 text-amber-500" /> Shared Credits Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    Available Credits
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-amber-600">
                    {pool?.balance?.toLocaleString() ?? "0"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    Used (This Month)
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-destructive">
                    {pool?.spent_this_month?.toLocaleString() ?? "0"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    Monthly Limit
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-primary">
                    {pool?.monthly_cap?.toLocaleString() ?? "0"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-muted-foreground">Monthly Limit Usage</span>
                  <span className={cn("font-semibold", spentPct > 90 ? "text-destructive" : "text-amber-600")}>
                    {spentPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden border border-white/5">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      spentPct > 90 ? "bg-destructive" : "bg-gradient-to-r from-amber-500 to-orange-500",
                    )}
                    style={{ width: `${spentPct}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                    <Input
                      className="h-9 pl-9 rounded-lg font-bold text-xs"
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={topUp} className="h-9 px-3 rounded-lg text-[11px] font-semibold">
                    Top Up
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    className="h-9 rounded-lg font-bold text-xs"
                    type="number"
                    value={capAmount}
                    onChange={(e) => setCapAmount(e.target.value)}
                    placeholder="New Limit"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={updateCap}
                    className="h-9 px-3 rounded-lg text-[11px] font-semibold bg-background"
                  >
                    Set Cap
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Triggers Matrix */}
          <Card className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card/40 backdrop-blur-xl flex flex-col">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-t-xl" />
            <CardHeader className="p-4 sm:p-5 border-b border-border/40 bg-muted/5">
              <CardTitle className="text-xs font-semibold tracking-wider uppercase flex items-center gap-2 text-muted-foreground">
                <Cpu className="h-3.5 w-3.5 text-emerald-600" /> Active Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {triggers.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No active triggers set up yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {triggers.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-xl border border-border/60 bg-background/50 p-4 hover:border-primary/30 transition-all group"
                    >
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-primary/5 text-primary border border-primary/10 font-mono text-[10px] rounded px-1.5">
                            {t.event_kind}
                          </Badge>
                          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {agentMap[t.agent_id]?.name || "Unassigned Agent"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-medium bg-muted rounded px-1.5 uppercase tracking-wide"
                          >
                            To: {t.recipient_strategy}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium border-border/60 rounded px-1.5 uppercase tracking-wide"
                          >
                            Channel: {t.channel || "default"}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-medium border-border/60 rounded px-1.5">
                            Delay: {t.cooldown_minutes ?? 1440}m
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground border-l-2 border-primary/20 pl-2.5 py-0.5 font-medium leading-relaxed">
                          "{t.template}"
                        </div>
                        {t.last_fired_at && (
                          <div className="text-[10px] font-mono text-muted-foreground/50">
                            Last Sent: {new Date(t.last_fired_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 sm:pt-0.5">
                        <Switch
                          checked={t.is_active}
                          onCheckedChange={() => toggleTrigger(t)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove trigger"
                          onClick={() => deleteTrigger(t.id)}
                          className="h-8 w-8 rounded-lg text-destructive/70 hover:bg-destructive/5 hover:text-destructive transition-colors"
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

        {/* Live Logs Feed */}
        <Card className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card/40 backdrop-blur-xl flex flex-col h-full">
          <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-xl" />
          <CardHeader className="p-4 sm:p-5 border-b border-border/40 bg-muted/5">
            <CardTitle className="text-xs font-semibold tracking-wider uppercase flex items-center gap-2 text-muted-foreground">
              <Network className="h-3.5 w-3.5 text-primary" /> Live Outreach Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[720px] no-scrollbar bg-background/5">
            {running ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
                <span className="text-xs font-medium">Syncing logs...</span>
              </div>
            ) : outreach.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No outreach logs found.
              </div>
            ) : (
              <div className="divide-y border-t border-border/20">
                {outreach.map((o) => (
                  <div key={o.id} className="p-4 hover:bg-muted/20 transition-colors group">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium uppercase px-1.5 py-0.5 border-none rounded",
                            o.status === "sent" || o.status === "delivered"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {o.status}
                        </Badge>
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {agentMap[o.agent_id]?.name || `ID: ${o.agent_id.slice(0, 6)}`}
                        </span>
                      </div>
                      <div className="text-right shrink-0 text-[11px] font-medium text-muted-foreground/60">
                        <div>
                          {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-amber-600 flex items-center justify-end gap-0.5 mt-0.5 font-bold">
                          <Zap className="h-2.5 w-2.5 fill-current" /> {o.credits_charged}c
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="mb-2 text-[10px] rounded border-border/60 text-muted-foreground bg-muted/20 px-1"
                    >
                      Route: {o.channel} → {o.recipient_kind}
                    </Badge>

                    <div className="text-xs text-foreground/80 font-medium leading-relaxed pl-2 border-l border-border/60">
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
