import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Coins, Loader2, PlusCircle, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";

interface MyAgent {
  id: string;
  name: string;
  agent_key: string;
  description: string | null;
  marketplace_status: string | null;
  visibility: string | null;
  is_active: boolean;
  total_conversations: number | null;
}

interface Earning {
  id: string;
  agent_id: string;
  gross_credits: number;
  builder_share: number;
  platform_share: number;
  created_at: string;
}

interface PayoutRequest {
  id: string;
  amount_credits: number;
  payout_method: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

interface Summary {
  lifetime_earned: number;
  paid_out: number;
  pending_payout: number;
  available: number;
}

export default function MyAgents() {
  const { talent } = useTalent();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<MyAgent[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [summary, setSummary] = useState<Summary>({
    lifetime_earned: 0, paid_out: 0, pending_payout: 0, available: 0,
  });

  useEffect(() => {
    if (talent?.id) void load();
  }, [talent?.id]);

  async function load() {
    if (!talent?.id) return;
    setLoading(true);
    const [agentsRes, earningsRes, payoutsRes, summaryRes] = await Promise.all([
      supabase.from("ai_agents")
        .select("id,name,agent_key,description,marketplace_status,visibility,is_active,total_conversations")
        .eq("owner_kind", "talent").eq("owner_id", talent.id).order("created_at", { ascending: false }),
      supabase.from("agent_marketplace_earnings")
        .select("id,agent_id,gross_credits,builder_share,platform_share,created_at")
        .eq("builder_kind", "talent").eq("builder_id", talent.id)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("agent_payout_requests")
        .select("*").eq("talent_id", talent.id).order("created_at", { ascending: false }),
      supabase.rpc("talent_marketplace_summary"),
    ]);
    setAgents((agentsRes.data as MyAgent[]) ?? []);
    setEarnings((earningsRes.data as Earning[]) ?? []);
    setPayouts((payoutsRes.data as PayoutRequest[]) ?? []);
    if (summaryRes.data && typeof summaryRes.data === "object" && !("error" in summaryRes.data)) {
      setSummary(summaryRes.data as unknown as Summary);
    }
    setLoading(false);
  }

  return (
    <div className="container max-w-5xl py-6 space-y-5 pb-24">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />My Agents
          </h1>
          <p className="text-sm text-muted-foreground">
            Build, publish and earn from your AI agents on the marketplace.
          </p>
        </div>
      </header>

      {/* Earnings summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile icon={<TrendingUp className="h-4 w-4" />} label="Lifetime earned" value={summary.lifetime_earned} />
        <SummaryTile icon={<Coins className="h-4 w-4" />} label="Available" value={summary.available} accent="text-emerald-500" />
        <SummaryTile icon={<Wallet className="h-4 w-4" />} label="Pending payout" value={summary.pending_payout} />
        <SummaryTile icon={<Wallet className="h-4 w-4" />} label="Paid out" value={summary.paid_out} />
      </div>

      <div className="flex flex-wrap gap-2">
        <PayoutDialog available={summary.available} onCreated={load} />
        <Button variant="outline" asChild>
          <Link to="/app/agents">
            <Sparkles className="h-4 w-4 mr-2" />Browse marketplace
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <Tabs defaultValue="agents">
          <TabsList>
            <TabsTrigger value="agents">My agents ({agents.length})</TabsTrigger>
            <TabsTrigger value="earnings">Recent earnings</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-3">
            {agents.length === 0 ? (
              <EmptyAgents />
            ) : (
              agents.map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{a.name}</h3>
                        <StatusPill status={a.marketplace_status} />
                        {!a.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {a.total_conversations ?? 0} conversations
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="earnings" className="space-y-2">
            {earnings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No earnings yet.</p>
            ) : (
              earnings.map((e) => {
                const agent = agents.find((a) => a.id === e.agent_id);
                return (
                  <Card key={e.id}>
                    <CardContent className="p-3 flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium">{agent?.name ?? "Agent"}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-500 font-semibold">
                          +{Number(e.builder_share).toFixed(1)} cr
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          gross {Number(e.gross_credits).toFixed(1)} · platform {Number(e.platform_share).toFixed(1)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="payouts" className="space-y-2">
            {payouts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No payout requests yet.</p>
            ) : (
              payouts.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{Number(p.amount_credits).toFixed(1)} credits</span>
                      <PayoutStatusBadge status={p.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.payout_method.replace("_", " ")} · {new Date(p.created_at).toLocaleDateString()}
                    </div>
                    {p.admin_notes && <p className="text-xs italic">{p.admin_notes}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function SummaryTile({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className={`text-xl font-bold mt-1 ${accent ?? ""}`}>{Number(value).toFixed(1)}</div>
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: "Live", cls: "bg-emerald-500/15 text-emerald-600" },
    pending: { label: "Pending review", cls: "bg-amber-500/15 text-amber-600" },
    rejected: { label: "Rejected", cls: "bg-red-500/15 text-red-600" },
    draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[status ?? "draft"] ?? map.draft;
  return <Badge className={s.cls} variant="outline">{s.label}</Badge>;
}

function PayoutStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-600",
    approved: "bg-blue-500/15 text-blue-600",
    pending: "bg-amber-500/15 text-amber-600",
    rejected: "bg-red-500/15 text-red-600",
  };
  return <Badge variant="outline" className={variants[status] ?? ""}>{status}</Badge>;
}

function EmptyAgents() {
  return (
    <Card>
      <CardContent className="p-8 text-center space-y-3">
        <Bot className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          You haven't published any agents yet. Talk to admins to get builder access.
        </p>
      </CardContent>
    </Card>
  );
}

function PayoutDialog({ available, onCreated }: { available: number; onCreated: () => void }) {
  const { talent } = useTalent();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!talent?.id) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > available) return toast.error(`You can request up to ${available.toFixed(1)} credits`);
    setBusy(true);
    const { error } = await supabase.from("agent_payout_requests").insert({
      talent_id: talent.id,
      amount_credits: amt,
      payout_method: method,
      payout_details: { note: details },
      status: "pending",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Payout request submitted");
    setOpen(false);
    setAmount(""); setDetails("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={available <= 0}>
          <PlusCircle className="h-4 w-4 mr-2" />Request payout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Request payout</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Amount (credits)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Max ${available.toFixed(1)}`} />
          </div>
          <div>
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile money</SelectItem>
                <SelectItem value="wallet">Digital wallet</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payout details</Label>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Account number, wallet ID, or instructions" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
