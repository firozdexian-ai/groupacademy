import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { listVCFirms, upsertGraphRow, deleteGraphRow } from "@/domains/ir/repo/irRepo";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Building2,
  Zap,
  ShieldCheck,
  RefreshCw,
  Globe,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { IR_CONFIG } from "@/lib/irConfig";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Capital Registry (VCFirmsManager)
 * CTO Reference: High-fidelity orchestrator for VC firm categorization and IR telemetry.
 * 2024 Standard: Executive Logic geometry with reinforced interaction analysis.
 */

interface VCFirm {
  id: string;
  name: string;
  logo_url: string | null;
  stage_focus: string[] | null;
  sector_focus: string[] | null;
  website: string | null;
  linkedin_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export function VCFirmsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFirm, setEditingFirm] = useState<VCFirm | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    stage_focus: [] as string[],
    sector_focus: [] as string[],
    website: "",
    linkedin_url: "",
    status: "prospecting",
    notes: "",
  });

  const {
    data: firms,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["ir-vc-firms"],
    queryFn: async () => (await listVCFirms()) as VCFirm[],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: formData.name,
        logo_url: formData.logo_url || null,
        stage_focus: formData.stage_focus.length > 0 ? formData.stage_focus : null,
        sector_focus: formData.sector_focus.length > 0 ? formData.sector_focus : null,
        website: formData.website || null,
        linkedin_url: formData.linkedin_url || null,
        status: formData.status,
        notes: formData.notes || null,
      };
      if (editingFirm) payload.id = editingFirm.id;
      await upsertGraphRow("ir_vc_firms", payload);
    },
    onSuccess: () => {
      toast.success(editingFirm ? "Institutional Node Optimized" : "VC Identity Deployed");
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["ir-vc-firms"] });
    },
    onError: (error: any) => toast.error("Transmission Fault: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGraphRow("ir_vc_firms", id),
    onSuccess: () => {
      toast.success("Institutional Node Terminated");
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["ir-vc-firms"] });
      // Also invalidate investors to refetch the firm names in their tables
      queryClient.invalidateQueries({ queryKey: ["ir-investors"] });
    },
    onError: (error: any) => toast.error("Termination Fault: " + error.message),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      logo_url: "",
      stage_focus: [],
      sector_focus: [],
      website: "",
      linkedin_url: "",
      status: "prospecting",
      notes: "",
    });
    setEditingFirm(null);
  };

  const openEditDialog = (firm: VCFirm) => {
    setEditingFirm(firm);
    setFormData({
      name: firm.name,
      logo_url: firm.logo_url || "",
      stage_focus: firm.stage_focus || [],
      sector_focus: firm.sector_focus || [],
      website: firm.website || "",
      linkedin_url: firm.linkedin_url || "",
      status: firm.status,
      notes: firm.notes || "",
    });
    setDialogOpen(true);
  };

  const toggleArrayValue = (field: "stage_focus" | "sector_focus", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((v) => v !== value) : [...prev[field], value],
    }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-4 md:p-6">
      {/* EXECUTIVE COMMAND HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Building2 className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Firm Registry</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Institutional Capital Mapping & VC Pipeline
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-14 w-14 rounded-2xl border-2 bg-background/50 hover:bg-primary/5 shrink-0"
          >
            <RefreshCw className={cn("h-5 w-5 text-primary", isRefetching && "animate-spin")} />
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Deploy Firm
          </Button>
        </div>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-indigo-500" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                    Institution
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Stage Focus</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Neural Sectors</TableHead>
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
                        Loading…
                      </div>
                    </TableCell>
                  </TableRow>
                ) : firms?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-32 italic font-bold opacity-50 uppercase tracking-widest text-xs"
                    >
                      Zero active VC firms detected.
                    </TableCell>
                  </TableRow>
                ) : (
                  firms?.map((firm) => (
                    <TableRow key={firm.id} className="group hover:bg-primary/[0.02] transition-colors">
                      <TableCell className="py-5 pl-8 min-w-[250px]">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl border-2 border-border/20 bg-background/50 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                            {firm.logo_url ? (
                              <img src={firm.logo_url} alt={firm.name} className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-5 w-5 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <p className="font-black text-sm uppercase italic tracking-tight group-hover:text-primary transition-colors truncate">
                              {firm.name}
                            </p>
                            <div className="flex gap-3 mt-1.5">
                              {firm.website ? (
                                <a
                                  href={firm.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-blue-500 transition-colors"
                                >
                                  <Globe className="h-3 w-3" /> SITE
                                </a>
                              ) : (
                                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">
                                  <Globe className="h-3 w-3" /> NONE
                                </span>
                              )}
                              {firm.linkedin_url ? (
                                <a
                                  href={firm.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-blue-500 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" /> LINKEDIN
                                </a>
                              ) : (
                                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">
                                  <ExternalLink className="h-3 w-3" /> NONE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="flex flex-wrap gap-1.5">
                          {firm.stage_focus?.map((stage) => (
                            <Badge
                              key={stage}
                              variant="outline"
                              className="font-black text-[8px] px-2 py-0.5 border-primary/20 bg-background uppercase shadow-sm tracking-widest"
                            >
                              {stage}
                            </Badge>
                          ))}
                          {(!firm.stage_focus || firm.stage_focus.length === 0) && (
                            <span className="text-xs italic text-muted-foreground/40">Agnostic</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="flex flex-wrap gap-1.5">
                          {firm.sector_focus?.slice(0, 3).map((sector) => (
                            <Badge
                              key={sector}
                              variant="secondary"
                              className="font-black text-[8px] px-2 py-0.5 rounded-md uppercase tracking-tighter"
                            >
                              {sector}
                            </Badge>
                          ))}
                          {(firm.sector_focus?.length || 0) > 3 && (
                            <span className="text-[9px] font-black text-primary italic flex items-center">
                              +{firm.sector_focus!.length - 3}
                            </span>
                          )}
                          {(!firm.sector_focus || firm.sector_focus.length === 0) && (
                            <span className="text-xs italic text-muted-foreground/40">Agnostic</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-black text-[9px] uppercase italic rounded-full px-4 border-2 border-none",
                            firm.status === "portfolio"
                              ? "bg-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/10"
                              : "bg-muted text-muted-foreground/60",
                          )}
                        >
                          {firm.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(firm)}
                            className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(firm.id)}
                            className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
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

      {/* DEPLOYMENT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[40px] border-4 border-border/40 p-0 overflow-hidden bg-background/95 backdrop-blur-2xl shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 pb-0 space-y-8 max-h-[85vh] overflow-hidden text-left flex flex-col">
            <DialogHeader className="shrink-0">
              <div className="flex items-center gap-4">
                <Zap className="h-8 w-8 text-primary fill-primary/20" />
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                    Identity Deployment
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic text-muted-foreground/60">
                    Update firm details
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4 -mr-4 no-scrollbar">
              <div className="space-y-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary italic ml-1">
                      Institution Name *
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-14 rounded-xl border-2 font-bold bg-muted/20"
                      placeholder="E.G. SEQUOIA CAPITAL..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary italic ml-1">
                      Deployment Status
                    </Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger className="h-14 rounded-xl border-2 font-bold uppercase text-xs bg-muted/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        {IR_CONFIG.VC_STATUS_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="font-bold text-xs uppercase tracking-widest"
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-1">Logo Artifact URL</Label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="h-14 rounded-xl border-2 font-mono text-sm bg-muted/20"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary italic ml-1">Website Route</Label>
                    <Input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="h-14 rounded-xl border-2 font-mono text-sm bg-muted/20"
                      placeholder="https://sequoiacap.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary italic ml-1">LinkedIn Route</Label>
                    <Input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="h-14 rounded-xl border-2 font-mono text-sm bg-muted/20"
                      placeholder="https://linkedin.com/company/..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-1">
                    Target Stage Focus
                  </Label>
                  <div className="flex flex-wrap gap-2 p-5 rounded-2xl border-2 bg-muted/10 border-border/10">
                    {IR_CONFIG.STAGE_FOCUS_OPTIONS.map((stage) => (
                      <Badge
                        key={stage}
                        className={cn(
                          "cursor-pointer font-black text-[9px] uppercase px-3 py-1.5 transition-all",
                          formData.stage_focus.includes(stage)
                            ? "bg-primary/10 text-primary border-2 border-primary/20 hover:bg-primary/20 hover:text-primary"
                            : "bg-background text-muted-foreground border-2 border-border/40 hover:border-primary/40",
                        )}
                        onClick={() => toggleArrayValue("stage_focus", stage)}
                      >
                        {stage}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-1">
                    Neural Sector Focus
                  </Label>
                  <div className="flex flex-wrap gap-2 p-5 rounded-2xl border-2 bg-muted/10 border-border/10">
                    {IR_CONFIG.SECTOR_FOCUS_OPTIONS.map((sector) => (
                      <Badge
                        key={sector}
                        className={cn(
                          "cursor-pointer font-black text-[9px] uppercase px-3 py-1.5 transition-all",
                          formData.sector_focus.includes(sector)
                            ? "bg-primary/10 text-primary border-2 border-primary/20 hover:bg-primary/20 hover:text-primary"
                            : "bg-background text-muted-foreground border-2 border-border/40 hover:border-primary/40",
                        )}
                        onClick={() => toggleArrayValue("sector_focus", sector)}
                      >
                        {sector}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-1">Internal Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="min-h-[120px] rounded-3xl border-2 font-medium italic text-sm bg-muted/20 p-5 resize-none"
                    placeholder="Enter strategic context or private notes..."
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="py-6 border-t border-border/10 bg-transparent flex-col sm:flex-row gap-3 sm:gap-0 shrink-0">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="h-14 px-8 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest italic text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!formData.name || saveMutation.isPending}
                className="flex-1 h-14 rounded-[24px] font-black uppercase italic tracking-tighter text-lg gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-5 w-5 fill-current" />
                )}
                {saveMutation.isPending ? "Saving…" : "Authorize Deployment"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md rounded-[40px] border-4 border-destructive/20 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-destructive to-rose-600" />
          <div className="p-10 space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center border-4 border-destructive/20">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-destructive leading-none">
                  Terminate Node
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] italic text-muted-foreground/80">
                  This will permanently purge the institutional identity from the registry.
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-14 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="flex-1 h-14 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-destructive/20 gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Execute Purge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
