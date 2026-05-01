import { useState, useMemo, useEffect } from "react";
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
import { BuildAcademyTab } from "@/components/gigs/BuildAcademyTab";
import { Skeleton } from "@/components/ui/skeleton";
import { GIG_CATEGORIES, GIG_CATEGORY_MAP, categoryFromResourceType, type GigCategory } from "@/lib/constants/gigCategories";
import {
  Gift,
  Upload,
  Briefcase,
  Share2,
  FileText,
  BookOpen,
  Search,
  Clock,
  Coins,
  ChevronRight,
  Sparkles,
  Send,
  Star,
  Loader2,
  CheckCircle,
  BadgeCheck,
  ClipboardList,
  FolderKanban,
  Activity,
  Target,
  Zap,
  ShieldCheck,
  Hammer,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Neural Gig Ecosystem
 * High-fidelity orchestrator for micro-missions, professional projects, and contractual telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced transaction guards.
 */

export default function Gigs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  // Renamed: 'tasks' tab now labelled "Platform Tasks". Keep query key for back-compat.
  const activeTab = searchParams.get("tab") || "tasks";
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedProjectCategory, setSelectedProjectCategory] = useState<GigCategory | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>("unverified");

  useEffect(() => {
    if (!talent?.id) return;
    supabase.from("talents").select("verification_status").eq("id", talent.id).maybeSingle()
      .then(({ data }) => setVerificationStatus(((data as any)?.verification_status) || "unverified"));
  }, [talent?.id]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  // ── Telemetry Logic: Quick Tasks ──
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

  // ── Projects feed: marketplace gigs + open academy content gigs, unified by resource_category ──
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["unified-projects", selectedProjectCategory],
    queryFn: async () => {
      let mq = supabase
        .from("marketplace_gigs")
        .select("*")
        .in("status", ["approved", "active"])
        .order("is_featured", { ascending: false });
      if (selectedProjectCategory) mq = mq.eq("resource_category", selectedProjectCategory);
      const { data: market, error: mErr } = await mq;
      if (mErr) throw mErr;

      let cq = supabase
        .from("content_gigs" as any)
        .select("id, title, brief, resource_category, resource_type, credit_reward, school_id, stage_number, status")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(60);
      if (selectedProjectCategory) cq = cq.eq("resource_category", selectedProjectCategory);
      const { data: content } = await cq;

      const mapped = ((content as any) || []).map((c: any) => ({
        id: `content:${c.id}`,
        kind: "academy" as const,
        title: c.title,
        description: c.brief || `Academy ${c.resource_type} resource`,
        resource_category: c.resource_category || categoryFromResourceType(c.resource_type),
        budget_amount: c.credit_reward,
        pricing_type: "fixed",
        total_bids: 0,
        contentId: c.id,
      }));

      const marketRows = ((market as any) || []).map((m: any) => ({
        ...m,
        kind: "marketplace" as const,
        resource_category: m.resource_category || "writing",
      }));
      return [...mapped, ...marketRows];
    },
  });

  // ── Activity Registry ──
  const { data: myBids } = useQuery({
    queryKey: ["my-marketplace-bids", talent?.id],
    enabled: !!talent?.id && activeTab === "activity",
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
    enabled: !!talent?.id && activeTab === "activity",
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

  // ── Deliverable Handshake ──
  const [deliverableDialog, setDeliverableDialog] = useState<string | null>(null);
  const [delivTitle, setDelivTitle] = useState("");
  const [delivDesc, setDelivDesc] = useState("");
  const [delivFile, setDelivFile] = useState<File | null>(null);

  const submitDeliverable = useMutation({
    mutationFn: async () => {
      if (!deliverableDialog) throw new Error("Contract Context Lost");
      let fileUrl = null;
      if (delivFile) {
        const path = `deliv/${talent!.id}/${deliverableDialog}/${Date.now()}-${delivFile.name}`;
        const { error: uploadErr } = await supabase.storage.from("marketplace-deliverables").upload(path, delivFile);
        if (uploadErr) throw uploadErr;
        fileUrl = supabase.storage.from("marketplace-deliverables").getPublicUrl(path).data.publicUrl;
      }
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
      queryClient.invalidateQueries({ queryKey: ["my-marketplace-contracts"] });
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-10 space-y-4 sm:space-y-8 pb-32 animate-in fade-in duration-500">
      {/* Compact mobile-first header */}
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none truncate">Gig Hub</h1>
            <p className="text-[11px] text-muted-foreground mt-1">Earn credits, build the platform.</p>
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
        </div>
      </header>

      {/* Tab strip — scrollable on mobile, no collisions */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex w-full overflow-x-auto no-scrollbar h-11 sm:h-12 bg-muted/40 p-1 rounded-xl border border-border/40 max-w-3xl gap-1">
          {[
            { id: "tasks", label: "Tasks", icon: ClipboardList },
            { id: "projects", label: "Projects", icon: Target },
            { id: "build", label: "Build", icon: Hammer },
            { id: "activity", label: "Activity", icon: Activity },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 min-w-[72px] rounded-lg text-[11px] font-bold uppercase tracking-wide gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <tab.icon className="h-3.5 w-3.5" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="tasks" className="mt-4 sm:mt-6 space-y-3 animate-in fade-in duration-300">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Platform Tasks</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Earn credits by helping the platform grow. Most tasks are reviewed automatically.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            {gigsLoading
              ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl bg-muted/40" />)
              : gigs?.map((gig) => <GigCard key={gig.id} gig={gig} userSubmissions={submissionCounts?.[gig.id]} />)}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-4 sm:mt-6 space-y-4 animate-in fade-in duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search projects..."
              className="pl-9 h-10 rounded-xl text-sm"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 pb-1">
            <Button
              variant={!selectedProjectCategory ? "default" : "outline"}
              size="sm"
              className="rounded-full h-8 text-xs font-semibold shrink-0"
              onClick={() => setSelectedProjectCategory(null)}
            >
              All
            </Button>
            {GIG_CATEGORIES.map((s) => (
              <Button
                key={s.value}
                variant={selectedProjectCategory === s.value ? "default" : "outline"}
                size="sm"
                className="rounded-full h-8 text-xs font-semibold shrink-0"
                onClick={() => setSelectedProjectCategory(s.value)}
              >
                {s.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {projectsLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl bg-muted/40" />)
            ) : (
              projects
                ?.filter((p: any) => !projectSearch || p.title.toLowerCase().includes(projectSearch.toLowerCase()))
                .map((gig: any) => {
                  const cat = GIG_CATEGORY_MAP[gig.resource_category as GigCategory];
                  const isAcademy = gig.kind === "academy";
                  return (
                    <button
                      key={gig.id}
                      type="button"
                      onClick={() => navigate(isAcademy ? `/app/studio` : `/app/marketplace/${gig.id}`)}
                      className="w-full text-left rounded-2xl border border-border/50 bg-card/60 hover:border-primary/40 hover:shadow-md transition-all px-3 py-3 sm:px-4 active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-1.5 h-5">
                              {cat?.label || gig.resource_category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-semibold px-1.5 h-5">
                              {isAcademy ? "Academy" : "Marketplace"}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-bold leading-tight line-clamp-1">{gig.title}</h3>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{gig.description}</p>
                          <div className="flex items-center gap-3 pt-0.5">
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-700">
                              <Coins className="h-3 w-3" /> {gig.budget_amount}
                            </span>
                            {!isAcademy && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Send className="h-3 w-3" /> {gig.total_bids || 0} bids
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })
            )}
          </div>
        </TabsContent>

        <TabsContent value="build" className="mt-4 sm:mt-6 animate-in fade-in duration-300">
          <BuildAcademyTab />
        </TabsContent>

        <TabsContent value="activity" className="mt-4 sm:mt-6 space-y-6 animate-in fade-in duration-300">
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> My Submissions
            </h3>
            <MySubmissions talentId={talent?.id} />
          </section>

          <div className="grid md:grid-cols-2 gap-12 pt-12 border-t border-border/40">
            <section className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 text-blue-500">
                <Send className="h-5 w-5" /> Transmission Registry (Proposals)
              </h3>
              <div className="space-y-4">
                {myBids?.map((bid) => (
                  <div
                    key={bid.id}
                    className="p-6 rounded-[28px] bg-card/30 border-2 border-border/40 shadow-sm space-y-4 group hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-base font-black uppercase tracking-tight italic leading-tight group-hover:text-blue-500 transition-colors">
                        {bid.marketplace_gigs?.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className="rounded-lg text-[8px] font-black uppercase tracking-widest border-blue-500/20 bg-blue-500/5 text-blue-600"
                      >
                        {bid.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] italic">
                      {bid.marketplace_gigs?.employer_name}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 text-emerald-500">
                <ShieldCheck className="h-5 w-5" /> Active Logic Handshakes (Contracts)
              </h3>
              <div className="space-y-4">
                {myContracts
                  ?.filter((c) => c.status === "active")
                  .map((contract) => (
                    <div
                      key={contract.id}
                      className="p-6 rounded-[28px] bg-emerald-500/5 border-2 border-emerald-500/20 shadow-sm flex justify-between items-center group"
                    >
                      <div className="space-y-1">
                        <h4 className="text-base font-black uppercase tracking-tight italic">
                          {contract.marketplace_gigs?.title}
                        </h4>
                        <p className="text-xs font-black text-emerald-600 italic tracking-tighter">
                          {contract.agreed_amount} Performance Credits
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:scale-105"
                        onClick={() => setDeliverableDialog(contract.id)}
                      >
                        Execute
                      </Button>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>

      {/* High-Fidelity Deliverable Protocol */}
      <Dialog open={!!deliverableDialog} onOpenChange={(o) => !o && setDeliverableDialog(null)}>
        <DialogContent className="rounded-[40px] border-2 border-border/40 bg-background/80 backdrop-blur-2xl p-10 max-w-xl">
          <DialogHeader className="mb-6">
          <DialogTitle className="text-lg font-bold">Submit deliverable</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Share your work for review.</p>
          </DialogHeader>
          <div className="space-y-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Artifact Title
              </Label>
              <Input
                value={delivTitle}
                onChange={(e) => setDelivTitle(e.target.value)}
                placeholder="Logic Submission V1.0"
                className="h-12 rounded-xl border-2 bg-background/50 font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Documentation Briefing
              </Label>
              <Textarea
                value={delivDesc}
                onChange={(e) => setDelivDesc(e.target.value)}
                placeholder="Log work parameters and performance metrics..."
                className="rounded-xl min-h-[140px] bg-muted/10 border-2 italic font-medium p-4 leading-relaxed"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Artifact Evidence
              </Label>
              <div className="p-4 rounded-xl border-2 border-dashed border-border/60 bg-muted/5 group hover:border-primary/40 transition-all cursor-pointer">
                <Input
                  type="file"
                  onChange={(e) => setDelivFile(e.target.files?.[0] || null)}
                  className="border-none bg-transparent h-auto p-0 cursor-pointer"
                />
              </div>
            </div>
            <Button
              className="w-full h-16 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
              onClick={() => submitDeliverable.mutate()}
              disabled={submitDeliverable.isPending}
            >
              {submitDeliverable.isPending ? (
                <Loader2 className="animate-spin h-5 w-5 mr-3" />
              ) : (
                <Zap className="h-5 w-5 mr-3 fill-current" />
              )}
              Finalize Submission Protocol
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
