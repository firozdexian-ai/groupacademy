import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Coins, Hammer, ShieldCheck, Send, ChevronRight, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";

/**
 * Build Academy — role-aware Content Studio surface inside the public Gig Hub.
 * - Admins: read-only preview of every content gig across all schools (with school filter).
 * - Content Leads: scoped list (RLS does the filtering) + claim/submit shortcut to /app/studio.
 * - Talents: marketing card + inline application form.
 */

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
  school_id: string | null;
}

const STAGE_LABEL: Record<number, string> = {
  1: "Orientation", 2: "Learn", 3: "Discuss", 4: "Practice", 5: "Assess", 6: "Progress",
};

export function BuildAcademyTab() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLead, setIsLead] = useState(false);
  const [gigs, setGigs] = useState<ContentGig[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [schoolFilter, setSchoolFilter] = useState<string>("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [schoolPref, setSchoolPref] = useState<string>("");
  const [applyBusy, setApplyBusy] = useState(false);
  const [hasApplication, setHasApplication] = useState(false);

  useEffect(() => {
    let cancel = false;
    const init = async () => {
      setLoading(true);
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) { setLoading(false); return; }

      const [{ data: roleRows }, { data: schoolRows }] = await Promise.all([
        supabase.from("user_roles").select("role, scope_school_id").eq("user_id", uid),
        supabase.from("schools").select("id, name").order("name"),
      ]);
      if (cancel) return;

      const adminRoles = ["admin", "super_admin", "talent_exec"];
      const admin = (roleRows || []).some((r: any) => adminRoles.includes(r.role));
      const lead = (roleRows || []).some((r: any) => r.role === "content_lead");
      setIsAdmin(admin);
      setIsLead(lead);
      setSchools((schoolRows as any) || []);

      if (admin || lead) {
        const { data } = await supabase
          .from("content_gigs" as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(300);
        setGigs(((data as any) || []) as ContentGig[]);
      } else {
        // talent — check if they already applied
        const { data: app } = await supabase
          .from("content_lead_applications" as any)
          .select("id")
          .eq("user_id", uid)
          .limit(1);
        setHasApplication(((app as any) || []).length > 0);
      }
      setLoading(false);
    };
    init();
    return () => { cancel = true; };
  }, []);

  const filteredGigs = useMemo(() => {
    if (!schoolFilter) return gigs;
    return gigs.filter((g) => g.school_id === schoolFilter);
  }, [gigs, schoolFilter]);

  const grouped = useMemo(() => {
    const open = filteredGigs.filter((g) => g.status === "open");
    const claimed = filteredGigs.filter((g) => g.status === "claimed");
    const submitted = filteredGigs.filter((g) => g.status === "submitted");
    const approved = filteredGigs.filter((g) => g.status === "approved");
    return { open, claimed, submitted, approved };
  }, [filteredGigs]);

  const submitApplication = async () => {
    if (!talent?.id) return toast.error("Sign in required.");
    if (motivation.trim().length < 30) return toast.error("Tell us a bit more (at least 30 chars).");
    setApplyBusy(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) { setApplyBusy(false); return; }
    const { error } = await supabase.from("content_lead_applications" as any).insert({
      talent_id: talent.id,
      user_id: uid,
      motivation: motivation.trim(),
      school_preference: schoolPref || null,
    } as any);
    setApplyBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Application submitted. We'll be in touch.");
    setApplyOpen(false);
    setHasApplication(true);
  };

  if (loading) return <Skeleton className="h-64 w-full rounded-[32px]" />;

  // ─── Talent (non-lead) view: marketing + apply ───
  if (!isAdmin && !isLead) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Card className="rounded-[32px] border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
          <CardContent className="p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Hammer className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Build the Academy</h3>
                <p className="text-xs text-muted-foreground">Get paid in earned credits to fill in courses.</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Each course needs videos, exercises, quizzes and reading material. Apply to become a{" "}
              <span className="font-semibold text-foreground">Content Lead</span> for a school you know well, claim open
              gigs, submit your work, and earn withdrawable credits when it's approved.
            </p>
            <div className="flex flex-wrap gap-3 text-[11px]">
              <Badge variant="secondary" className="rounded-full px-3 py-1">5–25 credits per resource</Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">Quality bonus up to 1.25×</Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">Withdrawable earnings</Badge>
            </div>
            {hasApplication ? (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" /> Application received — we'll reach out.
              </div>
            ) : (
              <Button size="lg" className="rounded-2xl" onClick={() => setApplyOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" /> Apply to become a Content Lead
              </Button>
            )}
          </CardContent>
        </Card>

        <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Apply: Content Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold mb-1.5">School preference (optional)</p>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={schoolPref}
                  onChange={(e) => setSchoolPref(e.target.value)}
                >
                  <option value="">Any school</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5">Why you?</p>
                <Textarea
                  placeholder="Briefly describe your background and what you can build (videos, quizzes, written modules…)"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  rows={5}
                />
              </div>
              <Button onClick={submitApplication} disabled={applyBusy} className="w-full">
                {applyBusy ? "Submitting…" : "Submit application"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Admin / Content Lead view ───
  const renderGig = (g: ContentGig) => (
    <Card key={g.id} className="rounded-2xl border-border/60">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <Badge variant="outline" className="text-[10px] font-bold">{STAGE_LABEL[g.stage_number]}</Badge>
              <Badge variant="secondary" className="text-[10px] font-bold capitalize">{g.resource_type}</Badge>
              <Badge variant="outline" className="text-[10px] capitalize">{g.status}</Badge>
            </div>
            <p className="font-bold text-sm leading-snug">{g.title}</p>
            {g.brief && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.brief}</p>}
          </div>
          <div className="flex items-center gap-1 text-primary shrink-0">
            <Coins className="h-3.5 w-3.5" />
            <span className="text-sm font-bold tabular-nums">{g.credit_reward}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-xl font-black tracking-tight">Build the Academy</h3>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? "Read-only admin preview of how Content Leads see this." : "Your scoped Content Studio gigs."}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {isAdmin && (
            <select
              className="h-9 rounded-md border bg-background px-3 text-xs"
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
            >
              <option value="">All schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate("/app/studio")} className="rounded-xl">
            Open full Studio <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {gigs.length === 0 ? (
        <Card className="p-6 rounded-2xl border-dashed text-center">
          <Lock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No content gigs in your scope yet. Admins can generate them from the Content Readiness board.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Open ({grouped.open.length})
            </h4>
            <div className="space-y-2">{grouped.open.slice(0, 20).map(renderGig)}</div>
            {grouped.open.length > 20 && (
              <p className="text-[11px] text-muted-foreground">+{grouped.open.length - 20} more open in this scope.</p>
            )}
          </section>
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              In flight ({grouped.claimed.length + grouped.submitted.length})
            </h4>
            <div className="space-y-2">
              {[...grouped.claimed, ...grouped.submitted].slice(0, 20).map(renderGig)}
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-3">
              Approved ({grouped.approved.length})
            </h4>
            <div className="space-y-2">{grouped.approved.slice(0, 5).map(renderGig)}</div>
          </section>
        </div>
      )}
    </div>
  );
}

export default BuildAcademyTab;
