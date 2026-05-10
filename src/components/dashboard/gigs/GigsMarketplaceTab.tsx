import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Coins,
  Eye,
  Check,
  X,
  FileText,
  CheckCircle2,
  Loader2,
  Briefcase,
  Zap,
  Activity,
  ExternalLink,
  Clock,
  TrendingUp,
} from "lucide-react";
import { MARKETPLACE_SCHOOLS } from "@/lib/constants/marketplaceCategories";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Marketplace Gigs Management System
 * CTO Reference: Fixed import dependencies and scoped deliverable mutations.
 */

interface GigForm {
  title: string;
  description: string;
  skill_category: string;
  skill_subcategory: string;
  pricing_type: string;
  budget_amount: number | null;
  deadline: string;
  requirements: string;
  employer_name: string;
  employer_email: string;
  status: string;
  is_featured: boolean;
}

const defaultForm: GigForm = {
  title: "",
  description: "",
  skill_category: "digital_freelancing",
  skill_subcategory: "",
  pricing_type: "fixed",
  budget_amount: null,
  deadline: "",
  requirements: "",
  employer_name: "GroUp Academy",
  employer_email: "",
  status: "approved",
  is_featured: false,
};

export function GigsMarketplaceTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GigForm>(defaultForm);
  const [viewBidsId, setViewBidsId] = useState<string | null>(null);
  const [viewContractId, setViewContractId] = useState<string | null>(null);

  // --- DATA FETCHING ---
  const { data: gigs, isLoading } = useQuery({
    queryKey: ["admin-marketplace-gigs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_gigs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: bids } = useQuery({
    queryKey: ["admin-marketplace-bids", viewBidsId],
    queryFn: async () => {
      if (!viewBidsId) return [];
      const { data, error } = await supabase
        .from("marketplace_bids")
        .select("*, talents(full_name, email, profile_photo_url)")
        .eq("gig_id", viewBidsId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!viewBidsId,
  });

  const { data: contractData } = useQuery({
    queryKey: ["admin-marketplace-contract", viewContractId],
    queryFn: async () => {
      if (!viewContractId) return null;
      const { data: contract } = await supabase
        .from("marketplace_contracts")
        .select("*, talents(full_name, email)")
        .eq("gig_id", viewContractId)
        .maybeSingle();

      if (!contract) return null;

      const { data: deliverables } = await supabase
        .from("marketplace_deliverables")
        .select("*")
        .eq("contract_id", contract.id)
        .order("created_at", { ascending: false });

      return { contract, deliverables: deliverables || [] };
    },
    enabled: !!viewContractId,
  });

  // --- MUTATIONS ---
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, budget_amount: form.budget_amount || null, deadline: form.deadline || null };
      const { error } = editingId
        ? await supabase.from("marketplace_gigs").update(payload).eq("id", editingId)
        : await supabase.from("marketplace_gigs").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editingId ? "Gig optimized" : "Gig deployed");
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-gigs"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const acceptBidMutation = useMutation({
    mutationFn: async (bid: any) => {
      const { error: contractErr } = await supabase.from("marketplace_contracts").insert({
        gig_id: bid.gig_id,
        bid_id: bid.id,
        freelancer_id: bid.talent_id,
        employer_name: gigs?.find((g: any) => g.id === bid.gig_id)?.employer_name || "",
        agreed_amount: bid.bid_amount,
      });
      if (contractErr) throw contractErr;

      await supabase.from("marketplace_bids").update({ status: "accepted" }).eq("id", bid.id);
      await supabase.from("marketplace_bids").update({ status: "rejected" }).eq("gig_id", bid.gig_id).neq("id", bid.id);
      await supabase
        .from("marketplace_gigs")
        .update({ selected_bid_id: bid.id, status: "in_progress" })
        .eq("id", bid.gig_id);
    },
    onSuccess: () => {
      toast.success("Contract activated. Credits locked.");
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-bids"] });
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-gigs"] });
      setViewBidsId(null);
    },
  });

  const updateDeliverableMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("marketplace_deliverables")
        .update({ status, admin_notes: notes || null, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deliverable status synchronized");
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-contract"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const completeContractMutation = useMutation({
    mutationFn: async (contract: any) => {
      await supabase
        .from("marketplace_contracts")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", contract.id);
      await supabase.from("marketplace_gigs").update({ status: "completed" }).eq("id", contract.gig_id);

      if (contract.agreed_amount > 0) {
        const { error: credErr } = await supabase.rpc("add_credits", {
          p_talent_id: contract.freelancer_id,
          p_amount: contract.agreed_amount,
          p_transaction_type: "marketplace_earning",
          p_description: `Marketplace payout: ${contract.agreed_amount} credits`,
        });
        if (credErr) throw credErr;

        // Earned balance sync
        const { data: balanceData } = await supabase
          .from("talent_credits")
          .select("earned_balance")
          .eq("talent_id", contract.freelancer_id)
          .single();
        if (balanceData) {
          await supabase
            .from("talent_credits")
            .update({ earned_balance: (balanceData.earned_balance || 0) + contract.agreed_amount })
            .eq("talent_id", contract.freelancer_id);
        }
      }
    },
    onSuccess: () => {
      toast.success("Contract Finalized. Credits Disbursed.");
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-contract"] });
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-gigs"] });
      setViewContractId(null);
    },
  });

  const openEdit = (gig: any) => {
    setEditingId(gig.id);
    setForm({
      title: gig.title,
      description: gig.description,
      skill_category: gig.skill_category,
      skill_subcategory: gig.skill_subcategory || "",
      pricing_type: gig.pricing_type,
      budget_amount: gig.budget_amount,
      deadline: gig.deadline ? gig.deadline.split("T")[0] : "",
      requirements: gig.requirements || "",
      employer_name: gig.employer_name || "GroUp Academy",
      employer_email: gig.employer_email || "",
      status: gig.status,
      is_featured: gig.is_featured || false,
    });
    setDialogOpen(true);
  };

  const selectedSchool = MARKETPLACE_SCHOOLS.find((s) => s.value === form.skill_category);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Briefcase className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Marketplace Ops</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Seed Listings & Contract Governance
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm(defaultForm);
            setDialogOpen(true);
          }}
          className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest shadow-lg gap-3"
        >
          <Plus className="h-5 w-5" /> Deploy New Gig
        </Button>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-primary to-amber-500" />
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="hover:bg-transparent border-b-2">
              <TableHead className="font-black uppercase text-[10px] tracking-widest py-6">Gig Node</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest">Structural Class</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Protocol</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest">Allocated Credits</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Bids</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="text-right py-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 italic font-bold opacity-50">
                  Synchronizing Market Data...
                </TableCell>
              </TableRow>
            ) : !gigs?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 italic font-bold opacity-50">
                  Marketplace Inactive. Seeding Required.
                </TableCell>
              </TableRow>
            ) : (
              gigs.map((gig: any) => (
                <TableRow key={gig.id} className="group border-b border-border/5 hover:bg-muted/10 transition-colors">
                  <TableCell className="py-6">
                    <p className="font-black text-sm uppercase italic tracking-tight">{gig.title}</p>
                    <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-0.5 italic">
                      {gig.employer_name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-black text-[9px] uppercase tracking-tighter border-2">
                      {gig.skill_category?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={cn(
                        "font-black text-[9px] uppercase italic",
                        gig.pricing_type === "bidding"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-blue-500/10 text-blue-600",
                      )}
                    >
                      {gig.pricing_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-black italic text-sm">
                      <Coins className="h-4 w-4 text-amber-500" />
                      {gig.budget_amount?.toLocaleString() || "UNSET"}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-black italic">{gig.total_bids || 0}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "font-black text-[9px] uppercase tracking-widest italic rounded-full px-4",
                        gig.status === "completed"
                          ? "bg-green-500/10 text-green-600"
                          : gig.status === "in_progress"
                            ? "bg-primary/10 text-primary animate-pulse"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {gig.status?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-6">
                    <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                      {["in_progress", "completed"].includes(gig.status) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewContractId(gig.id)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewBidsId(gig.id)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(gig)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* FORM DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[40px] border-4 p-0 overflow-hidden">
          <div className="h-2 w-full bg-primary" />
          <div className="p-8 space-y-6">
            <DialogHeader className="text-left">
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
                Gig Deployment Protocol
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest">
                Define marketplace node parameters and credit allocation
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest text-primary italic">
                  Gig Title
                </Label>
                <Input
                  className="h-14 rounded-2xl border-2 font-bold uppercase text-xs"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest text-primary italic">
                  Description & Scope
                </Label>
                <Textarea
                  className="rounded-2xl border-2 font-medium min-h-[120px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest text-primary italic">
                  School (Category)
                </Label>
                <Select
                  value={form.skill_category}
                  onValueChange={(v) => setForm({ ...form, skill_category: v, skill_subcategory: "" })}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold uppercase text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {MARKETPLACE_SCHOOLS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="font-bold uppercase text-[10px]">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest text-primary italic">
                  Program (Subcategory)
                </Label>
                <Select
                  value={form.skill_subcategory}
                  onValueChange={(v) => setForm({ ...form, skill_subcategory: v })}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold uppercase text-[10px]">
                    <SelectValue placeholder="AUTO-DETECT" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {selectedSchool?.programs.map((p) => (
                      <SelectItem key={p} value={p} className="font-bold uppercase text-[10px]">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest text-primary italic">
                  Pricing Protocol
                </Label>
                <Select value={form.pricing_type} onValueChange={(v) => setForm({ ...form, pricing_type: v })}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold uppercase text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    <SelectItem value="fixed" className="font-bold uppercase text-[10px]">
                      FIXED CREDIT RATE
                    </SelectItem>
                    <SelectItem value="bidding" className="font-bold uppercase text-[10px]">
                      OPEN BIDDING
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest text-primary italic">
                  Budget (Credits)
                </Label>
                <div className="relative">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                  <Input
                    type="number"
                    className="h-14 rounded-2xl border-2 pl-12 font-black italic text-lg"
                    value={form.budget_amount || ""}
                    onChange={(e) => setForm({ ...form, budget_amount: parseInt(e.target.value) || null })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                <div className="text-left">
                  <Label className="font-black uppercase text-[10px] tracking-widest italic">High Visibility</Label>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase italic">
                    Feature on main marketplace hub
                  </p>
                </div>
              </div>
            </div>
            <Button
              className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-tighter text-xl gap-3 shadow-xl"
              onClick={() => saveMutation.mutate()}
              disabled={!form.title || saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin" /> : <Zap className="fill-current" />}
              {editingId ? "Update Node" : "Deploy Gig"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* BIDS OVERLAY */}
      <Dialog open={!!viewBidsId} onOpenChange={(o) => !o && setViewBidsId(null)}>
        <DialogContent className="max-w-2xl rounded-[40px] border-4 p-8 overflow-hidden">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                Proposal Pulse ({bids?.length || 0})
              </h3>
              <Activity className="text-primary h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {!bids?.length ? (
                <div className="py-20 text-center font-black uppercase text-xs italic opacity-20">
                  Zero Incoming Proposals
                </div>
              ) : (
                bids.map((bid: any) => (
                  <div
                    key={bid.id}
                    className="group relative border-2 border-border/40 rounded-3xl p-6 bg-muted/10 hover:border-primary/40 transition-all text-left"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-black text-primary">
                          {bid.talents?.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black uppercase italic text-sm">{bid.talents?.full_name}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            {bid.talents?.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 font-black italic text-lg text-amber-600">
                          <Coins className="h-5 w-5" /> {bid.bid_amount}
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black uppercase italic mt-1">
                          {bid.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs font-medium bg-background/50 p-4 rounded-xl mb-4 italic leading-relaxed border-l-4 border-primary">
                      "{bid.cover_letter}"
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 text-[9px] font-black uppercase text-muted-foreground italic">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {bid.estimated_days} Days Delivery
                        </span>
                        <span>Applied {format(new Date(bid.created_at), "MMM d")}</span>
                      </div>
                      {bid.status === "pending" && (
                        <Button
                          size="sm"
                          className="rounded-xl font-black uppercase italic text-[10px] px-6"
                          onClick={() => acceptBidMutation.mutate(bid)}
                          disabled={acceptBidMutation.isPending}
                        >
                          {acceptBidMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Activate Contract"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CONTRACTS OVERLAY */}
      <Dialog open={!!viewContractId} onOpenChange={(o) => !o && setViewContractId(null)}>
        <DialogContent className="max-w-2xl rounded-[40px] border-4 p-8 overflow-hidden">
          {!contractData?.contract ? (
            <div className="py-20 text-center font-black italic opacity-20">NO ACTIVE CONTRACT DATA</div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b-2 pb-6">
                <div className="text-left">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                    Contract ID: {contractData.contract.id.slice(0, 8)}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                    Active Marketplace Engagement
                  </p>
                </div>
                <Badge className="h-10 px-6 rounded-full font-black uppercase italic bg-green-500/10 text-green-600 border-2 border-green-500/20">
                  {contractData.contract.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-6 bg-muted/20 p-6 rounded-[32px] border-2 border-border/40">
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-muted-foreground italic mb-1">Freelancer Node</p>
                  <p className="font-black uppercase italic text-sm">
                    {(contractData.contract as any).talents?.full_name}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-muted-foreground italic mb-1">Agreement Total</p>
                  <p className="font-black italic text-sm flex items-center gap-1 text-amber-600">
                    <Coins className="h-4 w-4" /> {contractData.contract.agreed_amount}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-muted-foreground italic mb-1">Deployment Date</p>
                  <p className="font-black uppercase italic text-sm">
                    {format(new Date(contractData.contract.started_at!), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="font-black uppercase italic text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Deliverable Tracking
                  </h4>
                  <Badge variant="outline" className="font-black italic text-[9px]">
                    {contractData.deliverables.length} NODES
                  </Badge>
                </div>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {!contractData.deliverables.length ? (
                    <div className="bg-muted/10 border-2 border-dashed rounded-3xl py-12 text-center text-[10px] font-black uppercase italic opacity-30">
                      Waiting for Freelancer Submission
                    </div>
                  ) : (
                    contractData.deliverables.map((d: any) => (
                      <div
                        key={d.id}
                        className="bg-background border-2 border-border/40 rounded-2xl p-5 group hover:border-primary/40 transition-all text-left"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-black uppercase italic text-xs leading-none">{d.title}</p>
                          <Badge
                            className={cn(
                              "font-black text-[8px] uppercase",
                              d.status === "approved"
                                ? "bg-green-500/10 text-green-600"
                                : "bg-amber-500/10 text-amber-600",
                            )}
                          >
                            {d.status}
                          </Badge>
                        </div>
                        {d.description && (
                          <p className="text-[10px] font-medium text-muted-foreground mb-3 leading-relaxed italic">
                            "{d.description}"
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          {d.file_url ? (
                            <a
                              href={d.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[9px] font-black uppercase text-primary underline italic"
                            >
                              <ExternalLink className="h-3 w-3" /> Audit Artifact
                            </a>
                          ) : (
                            <span />
                          )}
                          {d.status === "submitted" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-xl font-black text-[9px] border-green-500/50 hover:bg-green-500/10 text-green-600"
                                onClick={() => updateDeliverableMutation.mutate({ id: d.id, status: "approved" })}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-xl font-black text-[9px] border-red-500/50 hover:bg-red-500/10 text-red-600"
                                onClick={() =>
                                  updateDeliverableMutation.mutate({
                                    id: d.id,
                                    status: "revision_requested",
                                    notes: "Please revise",
                                  })
                                }
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {contractData.contract.status === "active" && (
                <Button
                  className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-tighter text-xl gap-3 shadow-xl bg-green-600 hover:bg-green-700"
                  onClick={() => completeContractMutation.mutate(contractData.contract)}
                  disabled={completeContractMutation.isPending}
                >
                  {completeContractMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <CheckCircle2 className="fill-current" />
                  )}
                  Finalize & Disburse {contractData.contract.agreed_amount} Credits
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
