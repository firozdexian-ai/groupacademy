import { useState } from "react";
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
  Gift, Upload, Briefcase, Share2, FileText, BookOpen,
  Search, Clock, Coins, ChevronRight, Sparkles,
  Send, Star, Loader2, CheckCircle, BadgeCheck,
  ClipboardList, FolderKanban, Activity,
} from "lucide-react";
import { format } from "date-fns";

const TASK_CATEGORIES = [
  { key: "all", label: "All", icon: Gift },
  { key: "cv_upload", label: "CV Upload", icon: Upload },
  { key: "job_posting", label: "Job Posting", icon: Briefcase },
  { key: "job_sharing", label: "Job Sharing", icon: Share2 },
  { key: "content_creation", label: "Content", icon: FileText },
  { key: "course_resell", label: "Resell", icon: BookOpen },
];

export default function Gigs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  const initialTab = searchParams.get("tab") || "tasks";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedProjectCategory, setSelectedProjectCategory] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === "tasks" ? {} : { tab });
  };

  // ── Quick Tasks (System 1) ──
  const { data: gigs, isLoading: gigsLoading } = useQuery({
    queryKey: ["gigs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gigs")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
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
      data?.forEach((s: any) => {
        if (!counts[s.gig_id]) counts[s.gig_id] = { total: 0, pending: 0 };
        counts[s.gig_id].total++;
        if (s.status === "pending") counts[s.gig_id].pending++;
      });
      return counts;
    },
  });

  // ── Projects (System 2) ──
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["marketplace-gigs", selectedProjectCategory],
    queryFn: async () => {
      let query = supabase
        .from("marketplace_gigs")
        .select("*")
        .in("status", ["approved", "active"])
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (selectedProjectCategory) {
        query = query.eq("skill_category", selectedProjectCategory);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // ── My Activity (combined) ──
  const { data: myBids, isLoading: bidsLoading } = useQuery({
    queryKey: ["my-marketplace-bids", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_bids")
        .select("*, marketplace_gigs(title, skill_category, status, employer_name)")
        .eq("talent_id", talent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!talent?.id && activeTab === "activity",
  });

  const { data: myContracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["my-marketplace-contracts", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_contracts")
        .select("*, marketplace_gigs:gig_id(title, skill_category)")
        .eq("freelancer_id", talent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!talent?.id && activeTab === "activity",
  });

  // Deliverable dialog state
  const [deliverableDialog, setDeliverableDialog] = useState<string | null>(null);
  const [delivTitle, setDelivTitle] = useState("");
  const [delivDesc, setDelivDesc] = useState("");
  const [delivFile, setDelivFile] = useState<File | null>(null);

  const { data: myDeliverables } = useQuery({
    queryKey: ["my-deliverables", deliverableDialog],
    queryFn: async () => {
      if (!deliverableDialog) return [];
      const { data, error } = await supabase
        .from("marketplace_deliverables")
        .select("*")
        .eq("contract_id", deliverableDialog)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!deliverableDialog,
  });

  const submitDeliverable = useMutation({
    mutationFn: async () => {
      if (!deliverableDialog) throw new Error("No contract");
      let fileUrl: string | null = null;
      if (delivFile) {
        const ext = delivFile.name.split(".").pop();
        const path = `${talent!.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("marketplace-deliverables")
          .upload(path, delivFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage
          .from("marketplace-deliverables")
          .getPublicUrl(path);
        fileUrl = urlData.publicUrl;
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
      import("sonner").then(({ toast }) => toast.success("Deliverable submitted!"));
      setDelivTitle("");
      setDelivDesc("");
      setDelivFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-deliverables"] });
    },
    onError: (err: any) => {
      import("sonner").then(({ toast }) => toast.error(err.message));
    },
  });

  // ── Filters ──
  const filteredGigs = gigs?.filter(
    (g: any) => selectedCategory === "all" || g.category === selectedCategory
  );

  const filteredProjects = projects?.filter(
    (g: any) =>
      !projectSearch ||
      g.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
      g.description?.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const activeContracts = myContracts?.filter((c: any) => c.status === "active") || [];
  const completedContracts = myContracts?.filter((c: any) => c.status === "completed") || [];

  const bidStatusColor = (s: string) => {
    if (s === "accepted") return "default" as const;
    if (s === "rejected") return "destructive" as const;
    return "secondary" as const;
  };

  return (
    <div className="px-4 md:px-0 space-y-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Gigs</h1>
        <p className="text-muted-foreground text-sm">
          Complete tasks & projects to earn credits
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="tasks" className="flex-1 gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Quick Tasks
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex-1 gap-1.5">
            <FolderKanban className="h-3.5 w-3.5" /> Projects
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 gap-1.5">
            <Activity className="h-3.5 w-3.5" /> My Activity
          </TabsTrigger>
        </TabsList>

        {/* ════════ QUICK TASKS TAB ════════ */}
        <TabsContent value="tasks" className="mt-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TASK_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            ))}
          </div>

          {gigsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : filteredGigs?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No gigs available in this category yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGigs?.map((gig: any) => (
                <GigCard key={gig.id} gig={gig} userSubmissions={submissionCounts?.[gig.id]} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ════════ PROJECTS TAB ════════ */}
        <TabsContent value="projects" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button
              variant={!selectedProjectCategory ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => setSelectedProjectCategory(null)}
            >
              All
            </Button>
            {MARKETPLACE_SCHOOLS.map((school) => (
              <Button
                key={school.value}
                variant={selectedProjectCategory === school.value ? "default" : "outline"}
                size="sm"
                className="shrink-0"
                onClick={() => setSelectedProjectCategory(school.value)}
              >
                {school.label}
              </Button>
            ))}
          </div>

          {projectsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : !filteredProjects?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No projects available yet</p>
              <p className="text-sm mt-1">Check back soon for new projects!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((gig: any) => (
                <Card
                  key={gig.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/app/marketplace/${gig.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {gig.is_featured && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px]">
                              <Sparkles className="h-3 w-3 mr-0.5" /> Featured
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {MARKETPLACE_SCHOOL_MAP[gig.skill_category]?.label || gig.skill_category}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {gig.pricing_type === "fixed" ? "Fixed Price" : "Open to Bids"}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-1">{gig.title}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs text-primary font-medium">GroUp Academy</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {gig.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {gig.budget_amount && (
                            <span className="flex items-center gap-1">
                              <Coins className="h-3 w-3 text-amber-500" />
                              {gig.budget_amount} credits
                            </span>
                          )}
                          {gig.deadline && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(gig.deadline), "MMM d")}
                            </span>
                          )}
                          <span>{gig.total_bids} bid{gig.total_bids !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ════════ MY ACTIVITY TAB ════════ */}
        <TabsContent value="activity" className="mt-4 space-y-6">
          {/* Quick Task Submissions */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" /> Task Submissions
            </h3>
            <MySubmissions talentId={talent?.id} />
          </div>

          {/* Project Bids */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5" /> Project Bids
            </h3>
            {bidsLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : !myBids?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No project bids submitted yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myBids.map((bid: any) => (
                  <Card key={bid.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{bid.marketplace_gigs?.title || "Unknown Project"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {MARKETPLACE_SCHOOL_MAP[bid.marketplace_gigs?.skill_category]?.label}
                            <span className="mx-1">·</span>
                            <span className="text-primary">GroUp Academy</span>
                          </p>
                        </div>
                        <Badge variant={bidStatusColor(bid.status)}>{bid.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Coins className="h-3 w-3 text-amber-500" />{bid.bid_amount} credits
                        </span>
                        {bid.estimated_days && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{bid.estimated_days} days</span>
                        )}
                        <span>{format(new Date(bid.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Active Contracts */}
          {activeContracts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Active Contracts ({activeContracts.length})
              </h3>
              <div className="space-y-3">
                {activeContracts.map((contract: any) => (
                  <Card key={contract.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{contract.marketplace_gigs?.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {MARKETPLACE_SCHOOL_MAP[contract.marketplace_gigs?.skill_category]?.label}
                          </p>
                        </div>
                        <span className="flex items-center gap-1 font-semibold text-sm">
                          <Coins className="h-3.5 w-3.5 text-amber-500" />{contract.agreed_amount}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => setDeliverableDialog(contract.id)}
                      >
                        <Upload className="h-3.5 w-3.5" /> Submit Deliverable
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Contracts */}
          {completedContracts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> Completed
              </h3>
              <div className="space-y-3">
                {completedContracts.map((contract: any) => (
                  <Card key={contract.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{contract.marketplace_gigs?.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Completed {contract.completed_at && format(new Date(contract.completed_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <span className="flex items-center gap-1 font-semibold text-sm text-green-600">
                          <Coins className="h-3.5 w-3.5" />+{contract.agreed_amount}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Deliverable Dialog */}
      <Dialog open={!!deliverableDialog} onOpenChange={(o) => !o && setDeliverableDialog(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Deliverable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {myDeliverables?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Previous submissions</p>
                {myDeliverables.map((d: any) => (
                  <div key={d.id} className="border rounded-lg p-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{d.title}</span>
                      <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
                    </div>
                    {d.admin_notes && <p className="text-xs text-muted-foreground mt-1">Admin: {d.admin_notes}</p>}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={delivTitle} onChange={(e) => setDelivTitle(e.target.value)} placeholder="e.g. Final Logo Design" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={delivDesc} onChange={(e) => setDelivDesc(e.target.value)} placeholder="Describe what you're submitting..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>File (optional)</Label>
              <Input type="file" onChange={(e) => setDelivFile(e.target.files?.[0] || null)} />
            </div>
            <Button
              className="w-full"
              disabled={!delivTitle.trim() || submitDeliverable.isPending}
              onClick={() => submitDeliverable.mutate()}
            >
              {submitDeliverable.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
