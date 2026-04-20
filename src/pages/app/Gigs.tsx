import { useState, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETPLACE_SCHOOLS, MARKETPLACE_SCHOOL_MAP } from "@/lib/constants/marketplaceCategories";
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
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Neural Gig Ecosystem
 * High-fidelity orchestrator for micro-missions, professional projects, and contractual telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced transaction guards.
 */

const TASK_CATEGORIES = [
  { key: "all", label: "All Missions", icon: Gift },
  { key: "cv_upload", label: "CV Intake", icon: Upload },
  { key: "job_posting", label: "Job Sourcing", icon: Briefcase },
  { key: "job_sharing", label: "Viral Share", icon: Share2 },
  { key: "content_creation", label: "Content Synth", icon: FileText },
  { key: "course_resell", label: "Resell Logic", icon: BookOpen },
];

export default function Gigs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get("tab") || "tasks";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedProjectCategory, setSelectedProjectCategory] = useState<string | null>(null);

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

  // ── Marketplace Intelligence ──
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["marketplace-gigs", selectedProjectCategory],
    queryFn: async () => {
      let query = supabase
        .from("marketplace_gigs")
        .select("*")
        .in("status", ["approved", "active"])
        .order("is_featured", { ascending: false });
      if (selectedProjectCategory) query = query.eq("skill_category", selectedProjectCategory);
      const { data, error } = await query;
      if (error) throw error;
      return data;
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
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12 pb-40 animate-in fade-in duration-1000">
      {/* Immersive Executive Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-[0.9]">Gig Ecosystem</h1>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
              Neural Economy Protocol v2.6
            </p>
          </div>
        </div>

        <Card className="rounded-[28px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden min-w-[280px]">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="h-12 w-12 rounded-[20px] bg-primary flex items-center justify-center rotate-3 shadow-primary/20 shadow-xl">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] italic">Active Ledger</p>
              <p className="text-lg font-black tracking-tighter leading-none mt-0.5">Verification Pending</p>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Primary Orchestration HUD */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 p-1.5 h-16 bg-muted/30 backdrop-blur-md rounded-[32px] border border-border/40 max-w-2xl">
          {[
            { id: "tasks", label: "Missions", icon: ClipboardList },
            { id: "projects", label: "Projects", icon: Target },
            { id: "activity", label: "Registry", icon: Activity },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-[24px] font-black uppercase text-[10px] tracking-widest gap-3 data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="tasks" className="mt-12 space-y-10 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
            {TASK_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2",
                  selectedCategory === cat.key
                    ? "bg-primary text-white border-primary shadow-2xl shadow-primary/30 scale-105"
                    : "bg-card/50 border-border/40 text-muted-foreground hover:bg-muted",
                )}
              >
                <cat.icon className="h-4 w-4" /> {cat.label}
              </button>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {gigsLoading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-[32px] bg-muted/40" />)
              : gigs
                  ?.filter((g) => selectedCategory === "all" || g.category === selectedCategory)
                  .map((gig) => <GigCard key={gig.id} gig={gig} userSubmissions={submissionCounts?.[gig.id]} />)}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-12 space-y-10 animate-in slide-in-from-bottom-4 duration-700">
          <div className="grid md:grid-cols-[280px,1fr] gap-12">
            <aside className="space-y-10">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Query projects..."
                  className="pl-12 h-14 bg-card/50 backdrop-blur-sm border-2 border-border/40 rounded-2xl font-bold tracking-tight"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary ml-1 italic">
                  Academy Faculties
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant={!selectedProjectCategory ? "secondary" : "ghost"}
                    className="justify-between h-12 px-5 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
                    onClick={() => setSelectedProjectCategory(null)}
                  >
                    Global Registry <ChevronRight className="h-3.5 w-3.5 opacity-20" />
                  </Button>
                  {MARKETPLACE_SCHOOLS.map((s) => (
                    <Button
                      key={s.value}
                      variant={selectedProjectCategory === s.value ? "secondary" : "ghost"}
                      className="justify-between h-12 px-5 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
                      onClick={() => setSelectedProjectCategory(s.value)}
                    >
                      {s.label} <ChevronRight className="h-3.5 w-3.5 opacity-20" />
                    </Button>
                  ))}
                </div>
              </div>
            </aside>

            <main className="space-y-6">
              {projectsLoading ? (
                <Skeleton className="h-[600px] rounded-[40px] bg-muted/40" />
              ) : (
                projects
                  ?.filter((p) => !projectSearch || p.title.toLowerCase().includes(projectSearch.toLowerCase()))
                  .map((gig) => (
                    <Card
                      key={gig.id}
                      className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/40 transition-all duration-500 cursor-pointer overflow-hidden group shadow-sm hover:shadow-2xl"
                      onClick={() => navigate(`/app/marketplace/${gig.id}`)}
                    >
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start gap-8">
                          <div className="space-y-5">
                            <div className="flex flex-wrap gap-3 items-center">
                              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                {MARKETPLACE_SCHOOL_MAP[gig.skill_category]?.label}
                              </Badge>
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                                <Zap className="h-3 w-3" /> {gig.pricing_type} Logic
                              </div>
                            </div>
                            <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none group-hover:text-primary transition-colors">
                              {gig.title}
                            </h3>
                            <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed italic line-clamp-2">
                              {gig.description}
                            </p>
                            <div className="flex items-center gap-6 pt-2">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                  <Coins className="h-4 w-4 text-amber-500" />
                                </div>
                                <span className="text-lg font-black tracking-tighter uppercase italic">
                                  {gig.budget_amount} Credits
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                  <Send className="h-4 w-4 text-blue-500" />
                                </div>
                                <span className="text-sm font-black text-muted-foreground/60 uppercase italic">
                                  {gig.total_bids} Handshakes
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="h-14 w-14 rounded-2xl bg-muted/50 border border-border/20 flex items-center justify-center transition-all group-hover:rotate-6 group-hover:bg-primary/10">
                            <ChevronRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </main>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-12 space-y-16 animate-in slide-in-from-bottom-4 duration-700">
          <section className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-4">
              <ClipboardList className="h-5 w-5" /> Operational Mission Queue
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
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
              Deliver Performance
            </DialogTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 italic">
              Registry Handshake Node
            </p>
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
