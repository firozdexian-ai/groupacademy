import { useEffect, useState } from "react";
import { updateAiAgent, insertNotification, listAgentsByMarketplaceStatus } from "@/domains/agents/repo/agentsRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError } from "@/lib/errorTracking";
import { CheckCircle2, XCircle, Store, Loader2, User2, Building2, Terminal, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Group Academy — Career Guidance System: Marketplace Approval Review Dashboard Component
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/command-center?tab=marketplace (Moderator Control Area)
 * Operations Mode: Human-in-the-loop validation canvas approving developer or partner assets.
 */

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
    try {
      const [p, r] = await Promise.all([
        listAgentsByMarketplaceStatus("pending", { orderBy: "created_at", ascending: true }),
        listAgentsByMarketplaceStatus(["approved", "rejected"], {
          orderBy: "created_at",
          ascending: false,
          limit: 10,
        }),
      ]);
      setPending(p as PendingAgent[]);
      setRecent(r as PendingAgent[]);
    } catch (err: any) {
      trackError("agent-marketplace-review-fetch-failure", { error: err.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    if (active) {
      load();
    }
    return () => {
      active = false;
    };
  }, []);

  async function decide(agent: PendingAgent, status: "approved" | "rejected") {
    setBusyId(agent.id);
    const updates: Record<string, unknown> = { marketplace_status: status };
    if (status === "approved") updates.visibility = "marketplace";

    try {
      await updateAiAgent(agent.id, updates);

      if (agent.owner_id && agent.owner_kind === "talent") {
        await insertNotification({
          talent_id: agent.owner_id,
          title: status === "approved" ? "Application Approved" : "Submission Update Required",
          message:
            status === "approved"
              ? `Your assistant profile "${agent.name}" has been approved and is live on the marketplace dashboard.`
              : `Your assistant profile "${agent.name}" requires adjustments. Please review operator moderation notes.`,
          type: "system",
          link: "/app/studio",
        });
      }

      toast({ title: status === "approved" ? "Profile published to public marketplace" : "Listing request rejected" });
      await load();
    } catch (e: any) {
      trackError("agent-marketplace-review-action-failure", { error: e.message, agentId: agent.id, status });
      toast({ title: "Verification update failed", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6 animate-pulse text-left">
        <Skeleton className="h-24 w-full rounded-2xl bg-muted/30" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl bg-muted/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6 text-left">
      {/* Executive Overview Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/40 p-6 rounded-2xl border border-border/40 backdrop-blur-sm shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 text-primary">
            <Store className="h-6 w-6" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">Marketplace Approval Queue</h1>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Activity className="h-3 w-3 text-muted-foreground/60" /> {pending.length} pending assistant submission
            {pending.length !== 1 && "s"} awaiting evaluation.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Primary Audit Manifest Queue */}
        <div className="xl:col-span-2 space-y-4">
          {pending.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-border bg-muted/5">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/40">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    Approval Queue Clear
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                    All submitted conversational assistant configurations have been evaluated and reconciled.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pending.map((a) => (
                <Card
                  key={a.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:border-primary/30"
                >
                  <div className="h-1 w-full bg-primary" />
                  <CardHeader className="p-5 pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2.5 flex-wrap leading-none">
                          {a.name}
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono border-border bg-background text-muted-foreground rounded px-1.5 py-0"
                          >
                            {a.agent_key}
                          </Badge>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground/90 font-medium leading-relaxed max-w-2xl pt-1">
                          {a.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 shrink-0 sm:self-center">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1.5 bg-muted text-muted-foreground px-2 py-0.5 rounded"
                        >
                          {a.owner_kind === "company" ? (
                            <Building2 className="h-3 w-3" />
                          ) : (
                            <User2 className="h-3 w-3" />
                          )}
                          {a.owner_kind}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold tracking-wide bg-primary/10 text-primary border-none px-2.5 py-0.5 rounded-full"
                        >
                          Level {a.agent_level}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold tracking-wide border-border text-muted-foreground px-2 rounded"
                        >
                          {a.audience}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4">
                    <div className="rounded-xl bg-muted p-4 space-y-1.5 border border-border/40">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Terminal className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Base System Prompt</span>
                      </div>
                      <div className="text-xs whitespace-pre-wrap max-h-48 overflow-y-auto font-mono text-foreground/80 leading-relaxed">
                        {a.system_prompt}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 block">
                          Authorized Tools & Connectors
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(a.allowed_tools || []).map((t) => (
                            <Badge
                              key={t}
                              variant="outline"
                              className="text-[10px] font-mono bg-background border-border text-muted-foreground rounded px-1.5"
                            >
                              {t}
                            </Badge>
                          ))}
                          {(!a.allowed_tools || a.allowed_tools.length === 0) && (
                            <span className="text-xs italic text-muted-foreground/50 font-medium">
                              No explicit tool integrations requested
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 block">
                          Pricing Structure Settings
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold bg-background text-foreground border border-border rounded"
                          >
                            Access: {a.connection_fee} Credits
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold bg-background text-foreground border border-border rounded"
                          >
                            Messaging: {a.message_credit_cost} Credits
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold border-border bg-background text-muted-foreground rounded"
                          >
                            Category: {a.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border/40">
                      <Textarea
                        rows={2}
                        className="rounded-xl border border-border bg-background text-sm font-medium p-3 resize-none focus-visible:ring-1 focus-visible:ring-primary leading-normal"
                        placeholder="Internal moderation review notes (appended to system communication logs on rejection trigger)..."
                        value={notes[a.id] || ""}
                        onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => decide(a, "approved")}
                          disabled={busyId === a.id}
                          className="flex-1 h-10 rounded-xl font-semibold text-xs tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                        >
                          {busyId === a.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Authorize Marketplace Listing
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => decide(a, "rejected")}
                          disabled={busyId === a.id}
                          className="sm:w-44 h-10 rounded-xl font-semibold text-xs tracking-wide text-rose-600 border-border hover:bg-rose-500/10 hover:border-rose-300 transition-all gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject Submission
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Historic Context Tracker Sidebar */}
        <div className="xl:col-span-1">
          <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card sticky top-6">
            <div className="h-1 w-full bg-muted" />
            <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
                <Store className="h-4 w-4" /> Recent Actions Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-background/50">
              {recent.length === 0 ? (
                <div className="p-6 text-center text-xs font-semibold text-muted-foreground/40 italic">
                  No evaluation actions recorded.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {recent.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-primary/[0.01] transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="font-bold text-sm text-foreground truncate">{a.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground/70 truncate">{a.agent_key}</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 border-none rounded-full",
                          a.marketplace_status === "approved"
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-rose-500/10 text-rose-700",
                        )}
                      >
                        {a.marketplace_status === "approved" ? "Approved" : "Rejected"}
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
