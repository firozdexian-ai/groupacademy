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
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Store, Loader2, User2, Building2, Terminal, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

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
        .select(
          "id, name, agent_key, description, system_prompt, category, audience, agent_level, connection_fee, message_credit_cost, allowed_tools, owner_kind, owner_id, marketplace_status, created_at",
        )
        .eq("marketplace_status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("ai_agents")
        .select(
          "id, name, agent_key, description, system_prompt, category, audience, agent_level, connection_fee, message_credit_cost, allowed_tools, owner_kind, owner_id, marketplace_status, created_at",
        )
        .in("marketplace_status", ["approved", "rejected"])
        .order("updated_at", { ascending: false })
        .limit(10),
    ]);
    setPending((p.data || []) as PendingAgent[]);
    setRecent((r.data || []) as PendingAgent[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(agent: PendingAgent, status: "approved" | "rejected") {
    setBusyId(agent.id);
    const updates: Record<string, unknown> = { marketplace_status: status };
    if (status === "approved") updates.visibility = "marketplace";

    try {
      const { error } = await supabase.from("ai_agents").update(updates).eq("id", agent.id);
      if (error) throw error;

      // CTO FIX: Dispatch notification to the agent creator to close the loop
      if (agent.owner_id && agent.owner_kind === "talent") {
        await supabase.from("notifications").insert({
          talent_id: agent.owner_id,
          title: status === "approved" ? "Agent Approved! 🚀" : "Agent Review Update",
          message:
            status === "approved"
              ? `Your AI Agent "${agent.name}" has been approved and is now live on the marketplace!`
              : `Your AI Agent "${agent.name}" requires attention. Review admin notes.`,
          type: "system",
          link: "/app/studio", // Directs them back to the builder
        });
      }

      toast({ title: status === "approved" ? "Listed in marketplace" : "Artifact Rejected" });
      load();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-8 animate-pulse">
        <Skeleton className="h-32 w-full rounded-[40px] bg-muted/40" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-[40px] bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-8">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Store className="h-8 w-8" />
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Marketplace Review</h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic flex items-center gap-2">
            <Activity className="h-3 w-3" /> {pending.length} Pending Submission{pending.length !== 1 && "s"}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Review Queue */}
        <div className="xl:col-span-2 space-y-6">
          {pending.length === 0 ? (
            <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-muted/5">
              <CardContent className="p-16 flex flex-col items-center justify-center text-center space-y-4">
                <ShieldCheck className="h-12 w-12 text-muted-foreground/30" />
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest italic text-muted-foreground/60">
                    Queue Clear
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">All submitted agents have been validated.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {pending.map((a) => (
                <Card
                  key={a.id}
                  className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg overflow-hidden group transition-all hover:border-primary/30"
                >
                  <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                  <CardHeader className="p-8 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 min-w-0">
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3 flex-wrap leading-none">
                          {a.name}
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono border-border/50 text-muted-foreground"
                          >
                            {a.agent_key}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm font-medium text-foreground/80 leading-relaxed max-w-2xl">
                          {a.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 shrink-0">
                        <Badge
                          variant="secondary"
                          className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-muted"
                        >
                          {a.owner_kind === "company" ? (
                            <Building2 className="h-3 w-3" />
                          ) : (
                            <User2 className="h-3 w-3" />
                          )}
                          {a.owner_kind}
                        </Badge>
                        <Badge className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border-none">
                          L{a.agent_level}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black uppercase tracking-widest border-border/40"
                        >
                          {a.audience}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 pt-0 space-y-6">
                    <div className="rounded-2xl bg-background/50 border border-border/10 p-5 space-y-2 shadow-inner">
                      <div className="flex items-center gap-2 text-muted-foreground mb-3">
                        <Terminal className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">System Prompt Artifact</span>
                      </div>
                      <div className="text-xs whitespace-pre-wrap max-h-64 overflow-auto font-mono text-foreground/80 leading-relaxed">
                        {a.system_prompt}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-2xl border border-border/5">
                      <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                          Logic Endpoints Required
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(a.allowed_tools || []).map((t) => (
                            <Badge
                              key={t}
                              variant="outline"
                              className="text-[9px] font-mono bg-background shadow-sm border-border/40"
                            >
                              {t}
                            </Badge>
                          ))}
                          {(!a.allowed_tools || a.allowed_tools.length === 0) && (
                            <span className="text-xs italic text-muted-foreground opacity-60">
                              No endpoints requested
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                          Monetization Vectors
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">
                            CONN: {a.connection_fee} CR
                          </Badge>
                          <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">
                            MSG: {a.message_credit_cost} CR
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-black uppercase tracking-widest border-border/40"
                          >
                            CAT: {a.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/10">
                      <Textarea
                        rows={2}
                        className="rounded-2xl border-2 bg-background/50 font-medium italic text-sm p-4 resize-none focus:border-primary/40 transition-colors"
                        placeholder="Internal review notes (dispatched to creator on rejection)..."
                        value={notes[a.id] || ""}
                        onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                      />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={() => decide(a, "approved")}
                          disabled={busyId === a.id}
                          className="flex-1 h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                        >
                          {busyId === a.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Authorize Listing
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => decide(a, "rejected")}
                          disabled={busyId === a.id}
                          className="sm:w-48 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject Node
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Decisions Sidebar */}
        <div className="xl:col-span-1">
          <Card className="rounded-[40px] border-2 border-border/40 shadow-xl overflow-hidden bg-card/30 backdrop-blur-xl sticky top-6">
            <div className="h-1.5 w-full bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/40" />
            <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
                <Store className="h-4 w-4" /> Recent Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recent.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/40 italic">
                  No recent activity
                </div>
              ) : (
                <div className="divide-y divide-border/10">
                  {recent.map((a) => (
                    <div
                      key={a.id}
                      className="p-5 flex items-center justify-between gap-4 hover:bg-primary/[0.02] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-sm uppercase tracking-tight italic truncate">{a.name}</div>
                        <div className="text-[9px] font-mono text-muted-foreground/60 truncate mt-0.5">
                          {a.agent_key}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 border-2 font-black text-[8px] uppercase tracking-widest px-2 py-0.5",
                          a.marketplace_status === "approved"
                            ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
                            : "border-destructive/30 text-destructive bg-destructive/5",
                        )}
                      >
                        {a.marketplace_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AgentMarketplaceReview;
