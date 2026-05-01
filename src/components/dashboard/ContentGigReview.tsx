import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ExternalLink, Star, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Gig {
  id: string;
  title: string;
  brief: string | null;
  resource_type: string;
  expected_format: string | null;
  credit_reward: number;
  status: string;
  submitted_url: string | null;
  submitted_at: string | null;
  claimed_by: string | null;
  school_id: string | null;
  module_id: string;
  review_notes: string | null;
  quality_score: number | null;
}

const STAGE_QUALITY_HINT = [
  { score: 1, label: "Below bar (0.6×)" },
  { score: 2, label: "Needs polish (0.8×)" },
  { score: 3, label: "Solid (1.0×)" },
  { score: 4, label: "Great (1.1×)" },
  { score: 5, label: "Exceptional (1.25×)" },
];

export function ContentGigReview() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    // Auto-release stale claims (>7 days) every time the board loads.
    await supabase.rpc("release_stale_content_gigs" as any, { p_days: 7 });
    const { data } = await supabase
      .from("content_gigs" as any)
      .select("*")
      .in("status", ["submitted", "claimed", "open"])
      .order("submitted_at", { ascending: false, nullsFirst: false });
    setGigs(((data as any) || []) as Gig[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (gig: Gig) => {
    setBusy(gig.id);
    const { data, error } = await supabase.rpc("approve_content_gig" as any, {
      p_gig_id: gig.id,
      p_admin_notes: notes[gig.id] || null,
      p_quality_score: scores[gig.id] || 3,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    const result = data as any;
    if (result?.success === false) return toast.error(result.error || "Approve failed");
    toast.success(`Approved · ${result?.credits_awarded || gig.credit_reward} credits paid`);
    load();
  };

  const reject = async (gig: Gig) => {
    setBusy(gig.id);
    const { error } = await supabase
      .from("content_gigs" as any)
      .update({
        status: "rejected",
        review_notes: notes[gig.id] || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", gig.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Rejected. Lead can resubmit.");
    load();
  };

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  const submitted = gigs.filter((g) => g.status === "submitted");
  const inFlight = gigs.filter((g) => g.status === "claimed");
  const open = gigs.filter((g) => g.status === "open");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Content gigs</h2>
          <p className="text-xs text-muted-foreground">
            Review submissions, score quality, monitor claimed work, and see open tasks. Stale claims (&gt;7 days) auto-release on load.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="shrink-0">
          <RotateCcw className="h-3.5 w-3.5 mr-2" /> Refresh
        </Button>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Pending review ({submitted.length})</h3>
        {submitted.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">Nothing to review right now.</Card>
        ) : (
          submitted.map((g) => {
            const score = scores[g.id] || 3;
            return (
              <Card key={g.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{g.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {g.resource_type} · {g.expected_format || "any"} · base {g.credit_reward} CR
                    </p>
                  </div>
                  <Badge>submitted</Badge>
                </div>
                {g.submitted_url && (
                  <a
                    href={g.submitted_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline"
                  >
                    Open submission <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Textarea
                  placeholder="Notes (optional)"
                  value={notes[g.id] || ""}
                  onChange={(e) => setNotes((p) => ({ ...p, [g.id]: e.target.value }))}
                  className="text-xs"
                  rows={2}
                />
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground">Quality score</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGE_QUALITY_HINT.map((s) => (
                      <button
                        key={s.score}
                        type="button"
                        onClick={() => setScores((p) => ({ ...p, [g.id]: s.score }))}
                        className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold border transition-colors",
                          score === s.score
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        <Star className="h-2.5 w-2.5 inline mr-1 -mt-0.5" />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approve(g)} disabled={busy === g.id}>
                    Approve & publish
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reject(g)} disabled={busy === g.id}>
                    Reject
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">In progress ({inFlight.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {inFlight.map((g) => (
            <Card key={g.id} className="p-3 text-xs">
              <p className="font-medium">{g.title}</p>
              <p className="text-muted-foreground">
                {g.resource_type} · {g.credit_reward} CR
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Open ({open.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {open.slice(0, 30).map((g) => (
            <Card key={g.id} className="p-3 text-xs">
              <p className="font-medium">{g.title}</p>
              <p className="text-muted-foreground">
                {g.resource_type} · {g.credit_reward} CR
              </p>
            </Card>
          ))}
          {open.length > 30 && (
            <p className="text-[11px] text-muted-foreground col-span-full">+{open.length - 30} more open gigs.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default ContentGigReview;
