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
import { supabase } from "@/integrations/supabase/client";
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
  Search,
  Globe,
} from "lucide-react";
import { IR_CONFIG } from "@/lib/irConfig";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Capital Registry (VCFirmsManager)
 * CTO Reference: High-fidelity orchestrator for VC firm categorization and IR telemetry.
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
  } = useQuery({
    queryKey: ["ir-vc-firms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ir_vc_firms").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as VCFirm[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name,
        logo_url: formData.logo_url || null,
        stage_focus: formData.stage_focus.length > 0 ? formData.stage_focus : null,
        sector_focus: formData.sector_focus.length > 0 ? formData.sector_focus : null,
        website: formData.website || null,
        linkedin_url: formData.linkedin_url || null,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (editingFirm) {
        const { error } = await supabase.from("ir_vc_firms").update(payload).eq("id", editingFirm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ir_vc_firms").insert(payload);
        if (error) throw error;
      }
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
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ir_vc_firms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Institutional Node Terminated");
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["ir-vc-firms"] });
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
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* EXECUTIVE COMMAND HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Building2 className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Firm Registry</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Institutional Capital Mapping & VC Pipeline
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-14 w-14 rounded-2xl border-2">
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg"
          >
            <Plus className="h-4 w-4" /> Deploy Firm
          </Button>
        </div>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                  Institution
                </TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Stage Focus</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Neural Sectors</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right py-6 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 italic font-bold opacity-50">
                    Synchronizing institutional nodes...
                  </TableCell>
                </TableRow>
              ) : firms?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 italic font-bold opacity-50">
                    Zero active VC firms detected.
                  </TableCell>
                </TableRow>
              ) : (
                firms?.map((firm) => (
                  <TableRow
                    key={firm.id}
                    className="group border-b border-border/5 hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="py-6 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl border-2 border-border/10 bg-muted/20 flex items-center justify-center overflow-hidden shadow-inner">
                          {firm.logo_url ? (
                            <img src={firm.logo_url} alt={firm.name} className="h-full w-full object-cover" />
                          ) : (
                            <Building2 className="h-6 w-6 text-primary/40" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-black text-sm uppercase italic tracking-tight">{firm.name}</p>
                          <div className="flex gap-2 mt-1">
                            {firm.website && (
                              <a href={firm.website} target="_blank" className="text-primary hover:text-blue-600">
                                <Globe className="h-3 w-3" />
                              </a>
                            )}
                            {firm.linkedin_url && (
                              <a href={firm.linkedin_url} target="_blank" className="text-primary hover:text-blue-600">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {firm.stage_focus?.map((stage) => (
                          <Badge
                            key={stage}
                            variant="outline"
                            className="font-black text-[8px] px-2 py-0 h-5 border-primary/20 bg-primary/5 uppercase"
                          >
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {firm.sector_focus?.slice(0, 3).map((sector) => (
                          <Badge
                            key={sector}
                            className="font-black text-[8px] px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-tighter"
                          >
                            {sector}
                          </Badge>
                        ))}
                        {(firm.sector_focus?.length || 0) > 3 && (
                          <span className="text-[9px] font-black text-primary italic">
                            +{firm.sector_focus!.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-black text-[9px] uppercase italic rounded-full px-4 border-2",
                          firm.status === "portfolio"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {firm.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(firm)}
                          className="h-10 w-10 hover:bg-primary/10 transition-all"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(firm.id)}
                          className="h-10 w-10 hover:bg-destructive/10 text-destructive"
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
        </CardContent>
      </Card>

      {/* DEPLOYMENT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl rounded-[40px] border-4 p-0 overflow-hidden bg-background">
          <div className="h-2 w-full bg-primary" />
          <div className="p-10 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar text-left">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Zap className="h-8 w-8 text-primary fill-current" /> Identity Deployment
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
                Synchronize institutional parameters and authority levels
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Institution Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-14 rounded-2xl border-2 font-bold"
                  placeholder="E.G. SEQUOIA CAPITAL..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Logo Artifact URL</Label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="h-14 rounded-2xl border-2 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Deployment Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold uppercase text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {IR_CONFIG.VC_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="font-bold text-xs uppercase">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Neural Sector Focus</Label>
                <div className="flex flex-wrap gap-2 p-4 rounded-2xl border-2 bg-muted/10">
                  {IR_CONFIG.SECTOR_FOCUS_OPTIONS.map((sector) => (
                    <Badge
                      key={sector}
                      variant={formData.sector_focus.includes(sector) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer font-black text-[9px] uppercase px-3 py-1",
                        formData.sector_focus.includes(sector) ? "" : "opacity-40",
                      )}
                      onClick={() => toggleArrayValue("sector_focus", sector)}
                    >
                      {sector}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Internal Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-[100px] rounded-3xl border-2 font-medium italic text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-4 flex-col sm:flex-row border-t border-border/10 pt-8">
              <Button
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="font-black uppercase text-[10px] tracking-widest italic opacity-50"
              >
                Abort Protocol
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!formData.name || saveMutation.isPending}
                className="flex-1 h-16 rounded-[24px] font-black uppercase italic tracking-tighter text-xl gap-3 shadow-xl"
              >
                {saveMutation.isPending ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <ShieldCheck className="fill-current" />
                )}
                Authorize Deployment
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
