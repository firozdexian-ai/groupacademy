// Phase 7 — Admin: Marketplace approval queue.
// Talent/company-built agents submit themselves for marketplace listing
// (marketplace_status='pending'). Admins review and approve/reject here.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Store, Loader2, User2, Building2 } from "lucide-react";

interface PendingAgent {
  id: string;
  name: string;
  agent_key: string;
  description: string;
  system_prompt: string;
  category: string;
  audience: string;
  agent_level: number;
  connection_fee: number;
  message_credit_cost: number;
  allowed_tools: string[];
  owner_kind: string;
  owner_id: string | null;
  marketplace_status: string;
  created_at: string;
}

export function AgentMarketplaceReview() {
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingAgent[]>([]);
  const [recent, setRecent] = useState<PendingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const [p, r] = await Promise.all([
      supabase
        .from("ai_agents")
        .select("id, name, agent_key, description, system_prompt, category, audience, agent_level, connection_fee, message_credit_cost, allowed_tools, owner_kind, owner_id, marketplace_status, created_at")
        .eq("marketplace_status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("ai_agents")
        .select("id, name, agent_key, description, system_prompt, category, audience, agent_level, connection_fee, message_credit_cost, allowed_tools, owner_kind, owner_id, marketplace_status, created_at")
        .in("marketplace_status", ["approved", "rejected"])
        .order("updated_at", { ascending: false })
        .limit(10),
    ]);
    setPending((p.data || []) as PendingAgent[]);
    setRecent((r.data || []) as PendingAgent[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function decide(agent: PendingAgent, status: "approved" | "rejected") {
    setBusyId(agent.id);
    const updates: Record<string, unknown> = { marketplace_status: status };
    if (status === "approved") updates.visibility = "marketplace";
    const { error } = await supabase.from("ai_agents").update(updates).eq("id", agent.id);
    setBusyId(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "approved" ? "Listed in marketplace" : "Rejected" });
    load();
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading queue…</div>;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" /> Marketplace Review
        </h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} agent{pending.length === 1 ? "" : "s"} awaiting review.
        </p>
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No pending submissions. Talent and company-built agents that request marketplace listing appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      {a.name}
                      <Badge variant="outline" className="text-[10px]">{a.agent_key}</Badge>
                      <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                        {a.owner_kind === "company" ? <Building2 className="h-3 w-3" /> : <User2 className="h-3 w-3" />}
                        {a.owner_kind}
                      </Badge>
                      <Badge className="text-[10px]">L{a.agent_level}</Badge>
                      <Badge variant="outline" className="text-[10px]">{a.audience}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md bg-muted/40 p-3 text-xs whitespace-pre-wrap max-h-40 overflow-auto font-mono">
                  {a.system_prompt}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(a.allowed_tools || []).map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Connection fee: <strong>{a.connection_fee}c</strong> · per-message: <strong>{a.message_credit_cost}c</strong> · category: <strong>{a.category}</strong>
                </div>
                <Textarea
                  rows={2}
                  placeholder="Internal review notes (optional, for record-keeping)…"
                  value={notes[a.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => decide(a, "approved")} disabled={busyId === a.id}>
                    {busyId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span className="ml-1">Approve & list</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decide(a, "rejected")} disabled={busyId === a.id}>
                    <XCircle className="h-4 w-4" />
                    <span className="ml-1">Reject</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent decisions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recent.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 text-sm border-b pb-2 last:border-0">
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{a.agent_key}</span>
                </div>
                <Badge variant={a.marketplace_status === "approved" ? "default" : "destructive"}>
                  {a.marketplace_status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AgentMarketplaceReview;
