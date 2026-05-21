/**
 * GroUp Academy: Stakeholder Capital Registry (InvestorsManager)
 * CTO Version: May 2026 (Phase IR-Z0 Hardened)
 * Fixes: B3 (Search Logic Restoration), P5 (Type Safety), Visual Unification
 */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listInvestors, listVCFirmsMin, upsertInvestor, deleteInvestor } from "@/domains/ir/repo/irRepo";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  FileJson2,
  Zap,
  ShieldCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { LinkedInJsonUpload } from "@/domains/talent/components/admin/LinkedInJsonUpload";
import { IR_CONFIG } from "@/lib/irConfig";
import { InvestorDetailSheet } from "./InvestorDetailSheet";
import { cn } from "@/lib/utils";

interface Investor {
  id: string;
  vc_firm_id: string | null;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  investor_interests: string[] | null;
  investment_stage_pref: string | null;
  relationship_summary: string | null;
  last_feedback_summary: string | null;
  subscription_status: string;
  last_contacted_at: string | null;
  notes: string | null;
  created_at: string;
  vc_firm?: { id: string; name: string } | null;
}

export function InvestorsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [linkedinImportOpen, setLinkedinImportOpen] = useState(false);
  const [filterFirmId, setFilterFirmId] = useState<string>("all");

  // B3 Fix: Restored Search State
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    vc_firm_id: "",
    full_name: "",
    title: "",
    email: "",
    phone: "",
    linkedin_url: "",
    twitter_handle: "",
    investor_interests: [] as string[],
    investment_stage_pref: "",
    relationship_summary: "",
    subscription_status: "pending",
    notes: "",
  });

  const {
    data: investors,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["ir-investors", filterFirmId],
    queryFn: () => listInvestors(filterFirmId),
  });

  // B3 Logic Restoration: High-Fidelity Client-Side Filtering
  const filteredInvestors = useMemo(() => {
    if (!investors) return [];
    if (!searchQuery.trim()) return investors;

    const query = searchQuery.toLowerCase();
    return investors.filter(
      (inv) =>
        inv.full_name?.toLowerCase().includes(query) ||
        inv.email?.toLowerCase().includes(query) ||
        inv.title?.toLowerCase().includes(query) ||
        inv.vc_firm?.name?.toLowerCase().includes(query),
    );
  }, [investors, searchQuery]);

  const { data: vcFirms } = useQuery({
    queryKey: ["ir-vc-firms-list"],
    queryFn: () => listVCFirmsMin(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        vc_firm_id: formData.vc_firm_id || null,
        full_name: formData.full_name,
        title: formData.title || null,
        email: formData.email || null,
        phone: formData.phone || null,
        linkedin_url: formData.linkedin_url || null,
        twitter_handle: formData.twitter_handle || null,
        investor_interests: formData.investor_interests.length > 0 ? formData.investor_interests : null,
        investment_stage_pref: formData.investment_stage_pref || null,
        relationship_summary: formData.relationship_summary || null,
        subscription_status: formData.subscription_status,
        notes: formData.notes || null,
      };
      if (editingInvestor) payload.id = editingInvestor.id;
      await upsertInvestor(payload);
    },
    onSuccess: () => {
      toast.success(editingInvestor ? "Stakeholder Node Optimized" : "Investor Identity Deployed");
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["ir-investors"] });
    },
    onError: (error: any) => toast.error("Transmission Fault: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvestor(id),
    onSuccess: () => {
      toast.success("Identity Node Terminated");
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["ir-investors"] });
    },
    onError: (error: any) => toast.error("Termination Fault: " + error.message),
  });

  const resetForm = () => {
    setFormData({
      vc_firm_id: "",
      full_name: "",
      title: "",
      email: "",
      phone: "",
      linkedin_url: "",
      twitter_handle: "",
      investor_interests: [],
      investment_stage_pref: "",
      relationship_summary: "",
      subscription_status: "pending",
      notes: "",
    });
    setEditingInvestor(null);
  };

  const openEditDialog = (investor: Investor) => {
    setEditingInvestor(investor);
    setFormData({
      vc_firm_id: investor.vc_firm_id || "",
      full_name: investor.full_name,
      title: investor.title || "",
      email: investor.email || "",
      phone: investor.phone || "",
      linkedin_url: investor.linkedin_url || "",
      twitter_handle: investor.twitter_handle || "",
      investor_interests: investor.investor_interests || [],
      investment_stage_pref: investor.investment_stage_pref || "",
      relationship_summary: investor.relationship_summary || "",
      subscription_status: investor.subscription_status,
      notes: investor.notes || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-4 md:p-6 text-left">
      {/* EXECUTIVE COMMAND HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Zap className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Capital Pulse</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Stakeholder Registry & Strategic IR Management
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setLinkedinImportOpen(true)}
            className="h-12 px-6 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm bg-background/50"
          >
            <FileJson2 className="h-4 w-4 text-blue-500" /> Neural Import
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20 bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Deploy Investor
          </Button>
        </div>
      </header>

      {/* REGISTRY FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="SEARCH STAKEHOLDER REGISTRY..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 rounded-2xl border-2 pl-12 font-bold uppercase text-[11px] tracking-widest bg-card/30 focus-visible:border-primary/40"
          />
        </div>
        <Select value={filterFirmId} onValueChange={setFilterFirmId}>
          <SelectTrigger className="w-full md:w-[260px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-background">
            <SelectValue placeholder="GLOBAL FIRMS" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2">
            <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest text-primary">
              🌍 ALL AUTHORITIES
            </SelectItem>
            {vcFirms?.map((firm) => (
              <SelectItem key={firm.id} value={firm.id} className="font-bold text-[10px] uppercase tracking-widest">
                {firm.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="h-14 w-14 rounded-2xl border-2 shadow-sm shrink-0 bg-background/50"
        >
          <RefreshCw className={cn("h-5 w-5 text-primary", isRefetching && "animate-spin")} />
        </Button>
      </div>

      {/* CORE REGISTRY TABLE */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-indigo-500" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent border-b-2 border-border/20">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                    Investor Identity
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Firm Authority</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Neural Interests</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right py-6 pr-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/5">
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-32 italic font-bold opacity-50 uppercase tracking-widest text-xs"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                        Synchronizing registry nodes...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredInvestors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-32 italic font-bold opacity-50 uppercase tracking-widest text-xs"
                    >
                      Zero matching authorities found in current frame.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvestors.map((investor) => (
                    <TableRow
                      key={investor.id}
                      className="group hover:bg-primary/[0.02] transition-colors cursor-pointer"
                      onClick={() => setSelectedInvestorId(investor.id)}
                    >
                      <TableCell className="py-5 pl-8 text-left min-w-[200px]">
                        <p className="font-black text-sm uppercase italic tracking-tight group-hover:text-primary transition-colors">
                          {investor.full_name}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest mt-1 truncate max-w-[250px]">
                          {investor.title || "STRATEGIC_NODE"}
                        </p>
                      </TableCell>
                      <TableCell className="text-left min-w-[150px]">
                        <Badge
                          variant="outline"
                          className="font-black text-[9px] uppercase italic border-2 bg-background shadow-sm"
                        >
                          {investor.vc_firm?.name || "INDEPENDENT_CAPITAL"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="flex flex-wrap gap-1.5">
                          {investor.investor_interests?.slice(0, 2).map((interest) => (
                            <Badge
                              key={interest}
                              variant="secondary"
                              className="font-black text-[8px] px-2 py-0.5 rounded-md uppercase tracking-tighter"
                            >
                              {interest}
                            </Badge>
                          ))}
                          {(investor.investor_interests?.length || 0) > 2 && (
                            <span className="text-[9px] font-black text-primary italic flex items-center">
                              +{investor.investor_interests!.length - 2}
                            </span>
                          )}
                          {(!investor.investor_interests || investor.investor_interests.length === 0) && (
                            <span className="text-xs italic text-muted-foreground/40 uppercase">Undisclosed</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-black text-[9px] uppercase italic rounded-full px-3 py-1 border-none",
                            investor.subscription_status === "active"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-muted text-muted-foreground/60",
                          )}
                        >
                          {investor.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div
                          className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(investor)}
                            className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(investor.id)}
                            className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InvestorDetailSheet
        investorId={selectedInvestorId}
        open={!!selectedInvestorId}
        onOpenChange={(open) => !open && setSelectedInvestorId(null)}
      />

      {/* DEPLOYMENT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[40px] border-4 border-border/40 p-0 overflow-hidden bg-background shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 pb-0 text-left">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4">
                <Zap className="h-8 w-8 text-primary fill-primary/20" />
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter leading-none text-foreground">
                    Identity Deployment
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-muted-foreground/60">
                    Synchronize stakeholder parameters and authority levels
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-4 -mr-4">
              <div className="space-y-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Stakeholder Name *
                    </Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="h-14 rounded-xl border-2 font-bold"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Authority Title
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-14 rounded-xl border-2 font-bold"
                      placeholder="General Partner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Firm Authority
                  </Label>
                  <Select
                    value={formData.vc_firm_id}
                    onValueChange={(v) => setFormData({ ...formData, vc_firm_id: v })}
                  >
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold uppercase text-xs">
                      <SelectValue placeholder="SELECT VC FIRM" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem
                        value=""
                        className="font-bold text-xs uppercase tracking-widest text-muted-foreground"
                      >
                        INDEPENDENT_CAPITAL
                      </SelectItem>
                      {vcFirms?.map((firm) => (
                        <SelectItem
                          key={firm.id}
                          value={firm.id}
                          className="font-bold text-xs uppercase tracking-widest"
                        >
                          {firm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Transmission Email
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-14 rounded-xl border-2 font-bold"
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Investment Stage
                    </Label>
                    <Select
                      value={formData.investment_stage_pref}
                      onValueChange={(v) => setFormData({ ...formData, investment_stage_pref: v })}
                    >
                      <SelectTrigger className="h-14 rounded-xl border-2 font-bold uppercase text-xs">
                        <SelectValue placeholder="SELECT STAGE" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        {IR_CONFIG.STAGE_FOCUS_OPTIONS.map((stage) => (
                          <SelectItem key={stage} value={stage} className="font-bold text-xs uppercase tracking-widest">
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Relationship Context
                  </Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="min-h-[120px] rounded-2xl border-2 font-medium italic text-sm p-5 resize-none bg-muted/20"
                    placeholder="Enter strategic context..."
                  />
                </div>
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="p-8 pt-6 border-t border-border/10 bg-muted/5 flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="h-14 px-8 rounded-xl border-2 font-black uppercase text-[10px]"
            >
              Abort Protocol
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!formData.full_name || saveMutation.isPending}
              className="h-14 px-10 rounded-[24px] font-black uppercase italic tracking-tighter text-lg shadow-primary/20 flex-1 bg-primary text-primary-foreground"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}{" "}
              Authorize Deployment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md rounded-[40px] border-4 border-destructive/20 bg-background p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-destructive" />
          <div className="p-10 space-y-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center border-4 border-destructive/20">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-destructive">
                  Terminate Node
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-muted-foreground/60">
                  This cycle cannot be reverted.
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-14 rounded-xl border-2 font-black uppercase text-[10px]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="flex-1 h-14 rounded-xl font-black uppercase text-[10px] shadow-destructive/20 gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}{" "}
                Execute Purge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEURAL IMPORT DIALOG */}
      <Dialog open={linkedinImportOpen} onOpenChange={setLinkedinImportOpen}>
        <DialogContent className="max-w-xl rounded-[40px] border-4 border-border/40 p-0 overflow-hidden bg-background text-left shadow-2xl">
          <div className="h-2 w-full bg-blue-500" />
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4">
                <FileJson2 className="h-8 w-8 text-blue-500" />
                <div className="space-y-1 text-left">
                  <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                    Neural Import
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase italic text-muted-foreground/60">
                    Scraper Artifact Bulk Provisioning
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <LinkedInJsonUpload
              mode="investor"
              onComplete={() => {
                setLinkedinImportOpen(false);
                queryClient.invalidateQueries({ queryKey: ["ir-investors"] });
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
