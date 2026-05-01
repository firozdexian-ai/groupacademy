import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Coins, FileText, Send, Hammer, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ContentGig {
  id: string;
  title: string;
  brief: string | null;
  expected_format: string | null;
  stage_number: number;
  resource_type: string;
  credit_reward: number;
  status: string;
  claimed_by: string | null;
  submitted_url: string | null;
  review_notes: string | null;
  school_id: string | null;
}

const STAGE_LABEL: Record<number, string> = {
  1: "Orientation", 2: "Learn", 3: "Discuss", 4: "Practice", 5: "Assess", 6: "Progress",
};

/**
 * Content Studio — private workspace for hired Content Leads
 * Visibility is enforced by RLS (content_lead role). Non-leads see an empty list.
 */
export default function ContentStudio() {
  const { talent } = useTalent();
  const [gigs, setGigs] = useState<ContentGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"open" | "mine">("open");
  const [submitUrl, setSubmitUrl] = useState<Record<string, string>>({});
  const [submitNotes, setSubmitNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("content_gigs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error(error);
    } else {
      setGigs((data as any) || []);
    }
    setLoading(false);
  };

  const claim = async (gig: ContentGig) => {
    if (!talent?.id) return;
    const { error } = await supabase
      .from("content_gigs" as any)
      .update({ status: "claimed", claimed_by: talent.id, claimed_at: new Date().toISOString() } as any)
      .eq("id", gig.id);
    if (error) toast.error("Couldn't claim — already taken?");
    else { toast.success("Gig claimed"); load(); }
  };

  const submit = async (gig: ContentGig) => {
    const url = submitUrl[gig.id]?.trim();
    if (!url) { toast.error("Add a resource URL first"); return; }
    const { error } = await supabase
      .from("content_gigs" as any)
      .update({
        status: "submitted",
        submitted_url: url,
        submitted_at: new Date().toISOString(),
        submitted_data: submitNotes[gig.id] ? { notes: submitNotes[gig.id] } : null,
      } as any)
      .eq("id", gig.id);
    if (error) toast.error("Submit failed");
    else { toast.success("Submitted for review"); load(); }
  };

  const open = gigs.filter((g) => g.status === "open");
  const mine = gigs.filter((g) => g.claimed_by === talent?.id);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    );
  }

  const renderGig = (gig: ContentGig) => {
    const isMine = gig.claimed_by === talent?.id;
    return (
      <Card key={gig.id} className="rounded-2xl border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-[10px] font-bold">{STAGE_LABEL[gig.stage_number]}</Badge>
                <Badge variant="secondary" className="text-[10px] font-bold capitalize">{gig.resource_type}</Badge>
                {gig.status === "submitted" && <Badge className="text-[10px] bg-amber-500/15 text-amber-700 border-none">In review</Badge>}
                {gig.status === "approved" && <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 border-none"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>}
              </div>
              <h3 className="font-bold text-sm leading-snug">{gig.title}</h3>
              {gig.brief && <p className="text-xs text-muted-foreground mt-1">{gig.brief}</p>}
              {gig.expected_format && (
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
                  <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{gig.expected_format}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 text-primary shrink-0">
              <Coins className="h-3.5 w-3.5" />
              <span className="text-sm font-bold tabular-nums">{gig.credit_reward}</span>
            </div>
          </div>

          {gig.status === "open" && (
            <Button size="sm" className="w-full h-9 rounded-xl" onClick={() => claim(gig)}>
              <Hammer className="h-3.5 w-3.5 mr-2" /> Claim this gig
            </Button>
          )}

          {isMine && gig.status === "claimed" && (
            <div className="space-y-2 pt-1 border-t border-border/40">
              <Input
                placeholder="Resource URL (Drive, YouTube unlisted, etc.)"
                value={submitUrl[gig.id] || ""}
                onChange={(e) => setSubmitUrl({ ...submitUrl, [gig.id]: e.target.value })}
                className="h-9 text-xs"
              />
              <Textarea
                placeholder="Notes for reviewer (optional)"
                value={submitNotes[gig.id] || ""}
                onChange={(e) => setSubmitNotes({ ...submitNotes, [gig.id]: e.target.value })}
                className="text-xs min-h-[60px]"
              />
              <Button size="sm" className="w-full h-9 rounded-xl" onClick={() => submit(gig)}>
                <Send className="h-3.5 w-3.5 mr-2" /> Submit for review
              </Button>
            </div>
          )}

          {gig.review_notes && gig.status !== "approved" && (
            <p className="text-[11px] text-amber-700 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2">
              Reviewer: {gig.review_notes}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 pb-32 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Content Studio</h1>
        <p className="text-sm text-muted-foreground">
          Build the missing pieces of our academies. Claim a gig, submit your work, get paid in earned credits.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="mine">My gigs ({mine.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="space-y-3 mt-4">
          {open.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              No open gigs in your scope right now. Check back soon.
            </p>
          ) : open.map(renderGig)}
        </TabsContent>
        <TabsContent value="mine" className="space-y-3 mt-4">
          {mine.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              You haven't claimed any gigs yet.
            </p>
          ) : mine.map(renderGig)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
