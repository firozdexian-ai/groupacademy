import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GigCard } from "@/components/gigs/GigCard";
import { MySubmissions } from "@/components/gigs/MySubmissions";
import { GigUploader, type UploadedFile } from "@/components/gigs/GigUploader";
import { GigForYouTab } from "@/components/gigs/GigForYouTab";
import { AvailabilityWidget } from "@/components/gigs/AvailabilityWidget";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Coins,
  ChevronRight,
  Send,
  Loader2,
  Briefcase,
  Activity,
  ShieldCheck,
  
  BookOpen,
  Zap,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Gig Hub v3 — Two-tab simplified surface.
 *
 * Tab 1 — Earn: Quick Tasks (1-tap micro gigs) + Course Projects (course-bundled work)
 *               + Marketplace Projects (employer-posted) shown below the fold.
 * Tab 2 — My Work: My submissions, bids, contracts, deliverables.
 *
 * Build Academy (Content Lead studio) is now a thin banner shown only to roles
 * Course Projects (course-as-project) is the single source of truth for build work.
 */

export default function Gigs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  // 4-tab layout with back-compat for older links
  const rawTab = searchParams.get("tab") || "for-you";
  const activeTab = ["work", "activity"].includes(rawTab)
    ? "work"
    : ["projects", "course", "courses", "course-projects"].includes(rawTab)
    ? "course"
    : ["client", "marketplace", "employer"].includes(rawTab)
    ? "client"
    : ["earn", "tasks", "quick"].includes(rawTab)
    ? "tasks"
    : ["for-you", "foryou", "matches"].includes(rawTab)
    ? "for-you"
    : "for-you";

  const [search, setSearch] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<string>("unverified");

  useEffect(() => {
    if (!talent?.id) return;
    supabase.from("talents").select("verification_status").eq("id", talent.id).maybeSingle()
      .then(({ data }) => setVerificationStatus(((data as any)?.verification_status) || "unverified"));
  }, [talent?.id]);

  const handleTabChange = (tab: string) => setSearchParams({ tab });

  // ── Quick Tasks (1-tap gigs from `gigs` table) ──
  const { data: gigs, isLoading: gigsLoading } = useQuery({
    queryKey: ["gigs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gigs").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: submissionCounts } = useQuery({
    queryKey: ["gig-submission-counts", talent?.id],
    enabled: !!talent?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gig_submissions")
        .select("gig_id, status")
        .eq("talent_id", talent!.id);
      if (error) throw error;
      const counts: Record<string, { total: number; pending: number }> = {};
      data?.forEach((s) => {
        if (!counts[s.gig_id]) counts[s.gig_id] = { total: 0, pending: 0 };
        counts[s.gig_id].total++;
        if (s.status === "pending") counts[s.gig_id].pending++;
      });
      return counts;
    },
  });

  // ── Course Projects: open course_projects (Phase 3 model) ──
  const { data: courseProjects, isLoading: courseProjectsLoading } = useQuery({
    queryKey: ["course-projects-grouped"],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from("course_projects" as any)
        .select("id, course_id, status, total_credit_reward, completion_bonus, deadline, progress_percent")
        .in("status", ["open", "claimed", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(60);

      const rows = (projects as any[]) || [];
      if (!rows.length) return [];

      const contentIds = Array.from(new Set(rows.map((r) => r.course_id).filter(Boolean)));
      const { data: courses } = contentIds.length
        ? await supabase.from("content").select("id, title, cover_image_url").in("id", contentIds)
        : { data: [] as any[] };

      const { data: subtaskCounts } = await supabase
        .from("course_project_subtasks" as any)
        .select("project_id")
        .in("project_id", rows.map((r) => r.id));

      const counts: Record<string, number> = {};
      ((subtaskCounts as any[]) || []).forEach((s: any) => {
        counts[s.project_id] = (counts[s.project_id] || 0) + 1;
      });

      const courseMap: Record<string, any> = {};
      (courses || []).forEach((c: any) => { courseMap[c.id] = c; });

      return rows.map((p) => ({
        projectId: p.id,
        course: courseMap[p.course_id] || { id: p.course_id, title: "Untitled course" },
        subtasks: Array(counts[p.id] || 0).fill(null),
        totalReward: Number(p.total_credit_reward || 0),
        status: p.status,
      }));
    },
  });

  // ── Marketplace projects (employer-posted, kept here as a peek; full UI at /app/marketplace) ──
  const { data: marketProjects } = useQuery({
    queryKey: ["marketplace-peek"],
    queryFn: async () => {
      const { data } = await supabase
        .from("marketplace_gigs")
        .select("id, title, description, skill_category, budget_amount, total_bids, is_featured, employer_name")
        .in("status", ["approved", "active"])
        .order("is_featured", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // ── My Work data ──
  const { data: myBids } = useQuery({
    queryKey: ["my-marketplace-bids", talent?.id],
    enabled: !!talent?.id && activeTab === "work",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_bids")
        .select("*, marketplace_gigs(title, skill_category, employer_name)")
        .eq("talent_id", talent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: myContracts } = useQuery({
    queryKey: ["my-marketplace-contracts", talent?.id],
    enabled: !!talent?.id && activeTab === "work",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_contracts")
        .select("*, marketplace_gigs:gig_id(title, skill_category)")
        .eq("freelancer_id", talent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [deliverableDialog, setDeliverableDialog] = useState<string | null>(null);
  const [delivTitle, setDelivTitle] = useState("");
  const [delivDesc, setDelivDesc] = useState("");
  const [delivFiles, setDelivFiles] = useState<UploadedFile[]>([]);

  const submitDeliverable = useMutation({
    mutationFn: async () => {
      if (!deliverableDialog) throw new Error("Contract context lost");
      // Store the first uploaded file URL for back-compat with the existing schema.
      const primary = delivFiles[0];
      const fileUrl = primary
        ? supabase.storage.from("gig-submissions").getPublicUrl(primary.path).data.publicUrl
        : null;
      const { error } = await supabase.from("marketplace_deliverables").insert({
        contract_id: deliverableDialog,
        title: delivTitle,
        description: delivDesc || null,
        file_url: fileUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDeliverableDialog(null);
      setDelivTitle("");
      setDelivDesc("");
      setDelivFiles([]);
      queryClient.invalidateQueries({ queryKey: ["my-marketplace-contracts"] });
    },
  });

  const filteredCourseProjects = useMemo(() => {
    if (!search) return courseProjects;
    const q = search.toLowerCase();
    return (courseProjects || []).filter(
      (p: any) => p.course?.title?.toLowerCase().includes(q),
    );
  }, [courseProjects, search]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 pb-32 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none truncate">Gig Hub</h1>
          <p className="text-[11px] text-muted-foreground mt-1">Earn credits by building the platform.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/profile/verify")}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-semibold shrink-0 transition-all active:scale-95",
            verificationStatus === "verified"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
              : "border-amber-500/30 bg-amber-500/10 text-amber-700",
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">
            {verificationStatus === "verified" ? "Verified" : "Verify to withdraw"}
          </span>
          <span className="sm:hidden">{verificationStatus === "verified" ? "Verified" : "Verify"}</span>
        </button>
      </header>

      <div className="px-3 pt-2">
        <Button size="sm" className="w-full" onClick={() => navigate("/app/gigs/new")}>
          <Sparkles className="h-4 w-4 mr-1" /> Post a gig with AI
        </Button>
      </div>


      {/* 4-tab strip */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-11 bg-muted/40 p-1 rounded-xl border border-border/40">
          <TabsTrigger value="for-you" className="rounded-lg text-[11px] font-bold uppercase tracking-wide gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">For You</span>
            <span className="sm:hidden">You</span>
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="rounded-lg text-[11px] font-bold uppercase tracking-wide gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Quick Tasks</span>
            <span className="sm:hidden">Tasks</span>
          </TabsTrigger>
          <TabsTrigger
            value="course"
            className="rounded-lg text-[11px] font-bold uppercase tracking-wide gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Course</span>
            <span className="sm:hidden">Course</span>
          </TabsTrigger>
          <TabsTrigger
            value="client"
            className="rounded-lg text-[11px] font-bold uppercase tracking-wide gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Client</span>
            <span className="sm:hidden">Client</span>
          </TabsTrigger>
          <TabsTrigger
            value="work"
            className="rounded-lg text-[11px] font-bold uppercase tracking-wide gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">My Work</span>
            <span className="sm:hidden">Mine</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="mt-4 space-y-4 animate-in fade-in duration-300">
          <AvailabilityWidget />
          <GigForYouTab />
        </TabsContent>

        {/* ───── QUICK TASKS ───── */}
        <TabsContent value="tasks" className="mt-4 space-y-4 animate-in fade-in duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search quick tasks..."
              className="pl-9 h-10 rounded-xl text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            1-tap gigs · auto-reviewed · instant credits
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {gigsLoading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl bg-muted/40" />)
              : (gigs || [])
                  .filter((g: any) => !search || g.title.toLowerCase().includes(search.toLowerCase()))
                  .map((gig: any) => (
                    <GigCard key={gig.id} gig={gig} userSubmissions={submissionCounts?.[gig.id]} />
                  ))}
          </div>
        </TabsContent>

        {/* ───── COURSE PROJECTS ───── */}
        <TabsContent value="course" className="mt-4 space-y-4 animate-in fade-in duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search course projects..."
              className="pl-9 h-10 rounded-xl text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Build a full course — bundled subtasks · higher payout
          </p>
          <div className="space-y-2">
            {courseProjectsLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl bg-muted/40" />)
            ) : (filteredCourseProjects || []).length === 0 ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="p-6 text-center text-xs text-muted-foreground">
                  No open course projects right now. Check back soon.
                </CardContent>
              </Card>
            ) : (
              (filteredCourseProjects || []).map((proj: any) => (
                <button
                  key={proj.projectId || proj.course.id}
                  type="button"
                  onClick={() => navigate(`/app/course-project/${proj.projectId}`)}
                  className="w-full text-left rounded-2xl border border-border/50 bg-card/60 hover:border-primary/40 hover:shadow-md transition-all p-3 active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    {proj.course.cover_image_url ? (
                      <img
                        src={proj.course.cover_image_url}
                        alt=""
                        className="h-14 w-14 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-1.5 h-5">
                          Course
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-semibold px-1.5 h-5">
                          {proj.subtasks.length} subtasks
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-semibold px-1.5 h-5 capitalize">
                          {proj.status}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-bold leading-tight line-clamp-1">{proj.course.title}</h3>
                      <div className="flex items-center gap-3 pt-0.5">
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-700">
                          <Coins className="h-3 w-3" /> {proj.totalReward} total
                        </span>
                        <span className="text-[11px] text-muted-foreground">Tap to claim subtasks</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </button>
              ))
            )}
          </div>
        </TabsContent>

        {/* ───── CLIENT PROJECTS (Marketplace) ───── */}
        <TabsContent value="client" className="mt-4 space-y-4 animate-in fade-in duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search client projects..."
              className="pl-9 h-10 rounded-xl text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Bid on freelance gigs from companies · negotiate scope and price
          </p>
          <div className="space-y-2">
            {(marketProjects || []).length === 0 ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="p-6 text-center text-xs text-muted-foreground">
                  No open client projects right now.
                </CardContent>
              </Card>
            ) : (
              (marketProjects || [])
                .filter((m: any) => !search || m.title.toLowerCase().includes(search.toLowerCase()))
                .map((m: any) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => navigate(`/app/marketplace/${m.id}`)}
                    className="w-full text-left rounded-2xl border border-border/50 bg-card/60 hover:border-primary/40 transition-all p-3 active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-1.5 h-5">
                            Client
                          </Badge>
                          {m.is_featured && (
                            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] font-bold px-1.5 h-5">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-sm font-bold leading-tight line-clamp-1">{m.title}</h3>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {m.employer_name || "Anonymous employer"}
                        </p>
                        <div className="flex items-center gap-3 pt-0.5">
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-700">
                            <Coins className="h-3 w-3" /> {m.budget_amount}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Send className="h-3 w-3" /> {m.total_bids || 0} bids
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </button>
                ))
            )}
          </div>
        </TabsContent>

        {/* ───── MY WORK ───── */}
        <TabsContent value="work" className="mt-4 space-y-6 animate-in fade-in duration-300">
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" /> Quick Task Submissions
            </h3>
            <MySubmissions talentId={talent?.id} />
          </section>

          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-blue-600 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" /> My Bids
              </h3>
              <div className="space-y-2">
                {myBids?.length ? (
                  myBids.map((bid: any) => (
                    <div
                      key={bid.id}
                      className="rounded-2xl border border-border/40 bg-card p-3 hover:border-blue-500/40 transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-semibold leading-tight">
                          {bid.marketplace_gigs?.title}
                        </h4>
                        <Badge variant="outline" className="text-[10px] h-5 capitalize shrink-0">
                          {bid.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {bid.marketplace_gigs?.employer_name}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground italic px-1">No bids yet.</p>
                )}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-600 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Active Contracts
              </h3>
              <div className="space-y-2">
                {myContracts?.filter((c: any) => c.status === "active").length ? (
                  myContracts
                    ?.filter((c: any) => c.status === "active")
                    .map((contract: any) => (
                      <div
                        key={contract.id}
                        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex justify-between items-center gap-2"
                      >
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold leading-tight truncate">
                            {contract.marketplace_gigs?.title}
                          </h4>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            {contract.agreed_amount} credits
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="h-8 px-3 rounded-lg text-[11px] shrink-0"
                          onClick={() => setDeliverableDialog(contract.id)}
                        >
                          Deliver
                        </Button>
                      </div>
                    ))
                ) : (
                  <p className="text-[11px] text-muted-foreground italic px-1">No active contracts.</p>
                )}
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit deliverable */}
      <Dialog open={!!deliverableDialog} onOpenChange={(o) => !o && setDeliverableDialog(null)}>
        <DialogContent className="rounded-2xl max-w-md p-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Submit deliverable</DialogTitle>
            <p className="text-xs text-muted-foreground">Share your work for review.</p>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Title</Label>
              <Input
                value={delivTitle}
                onChange={(e) => setDelivTitle(e.target.value)}
                placeholder="My deliverable"
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea
                value={delivDesc}
                onChange={(e) => setDelivDesc(e.target.value)}
                placeholder="Brief notes about your submission..."
                className="rounded-xl min-h-[100px] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Files</Label>
              <GigUploader
                value={delivFiles}
                onChange={setDelivFiles}
                folder={`deliverable/${deliverableDialog || "misc"}`}
                maxFiles={5}
              />
            </div>
            <Button
              className="w-full h-11 rounded-xl text-sm"
              onClick={() => submitDeliverable.mutate()}
              disabled={submitDeliverable.isPending}
            >
              {submitDeliverable.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              Submit deliverable
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
