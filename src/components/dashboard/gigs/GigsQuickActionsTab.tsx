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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Coins,
  ShieldCheck,
  Activity,
  Zap,
  Layers,
  Rocket,
  Target,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Incentive Orchestration Terminal (Gigs Manager)
 * High-fidelity manager for talent micro-tasks and reward distribution.
 * 2026 Standard: Executive Logic geometry with reinforced state handshakes.
 */

const CATEGORIES = [
  { value: "cv_upload", label: "CV_INGESTION" },
  { value: "job_posting", label: "JOB_REGISTRY" },
  { value: "job_sharing", label: "PITCH_DISTRIBUTION" },
  { value: "content_creation", label: "INTEL_SYNTHESIS" },
  { value: "course_resell", label: "ACADEMIC_RESELL" },
];

interface GigForm {
  title: string;
  description: string;
  category: string;
  credit_reward: number;
  icon: string;
  is_active: boolean;
  max_completions_per_user: number;
  total_budget: number | null;
  requirements: string;
  display_order: number;
}

const defaultForm: GigForm = {
  title: "",
  description: "",
  category: "cv_upload",
  credit_reward: 10,
  icon: "gift",
  is_active: true,
  max_completions_per_user: 10,
  total_budget: null,
  requirements: "",
  display_order: 0,
};

export function GigsQuickActionsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GigForm>(defaultForm);

  const { data: gigs, isLoading } = useQuery({
    queryKey: ["admin-gigs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gigs").select("*").order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from("gigs").update(form).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("gigs").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Artifact Recalibrated" : "Incentive Node Initialized");
      queryClient.invalidateQueries({ queryKey: ["admin-gigs"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    },
    onError: (err: any) => toast.error(`Protocol Fault: ${err.message}`),
  });

  const openEdit = (gig: any) => {
    setEditingId(gig.id);
    setForm({
      title: gig.title,
      description: gig.description,
      category: gig.category,
      credit_reward: gig.credit_reward,
      icon: gig.icon || "gift",
      is_active: gig.is_active,
      max_completions_per_user: gig.max_completions_per_user || 10,
      total_budget: gig.total_budget,
      requirements: gig.requirements || "",
      display_order: gig.display_order || 0,
    });
    setDialogOpen(true);
  };

  const totalRewardsActive = gigs?.filter((g) => g.is_active).reduce((sum, g) => sum + g.credit_reward, 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive Telemetry HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Active Protocols",
            val: gigs?.filter((g) => g.is_active).length || 0,
            icon: Activity,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Global Yield (TKN)",
            val: totalRewardsActive,
            icon: Coins,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "Total Completions",
            val: gigs?.reduce((sum, g) => sum + (g.total_completed || 0), 0) || 0,
            icon: Target,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
        ].map((kpi, i) => (
          <Card
            key={i}
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm"
          >
            <CardContent className="p-6 flex items-center gap-6">
              <div
                className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                  kpi.bg,
                  "border-white/5",
                )}
              >
                <kpi.icon className={cn("h-7 w-7", kpi.color)} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                  {kpi.label}
                </p>
                <p className="text-3xl font-black tracking-tighter italic leading-none">{kpi.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <Rocket className="h-8 w-8 text-primary" /> Incentive Registry
              </CardTitle>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                Authorized Reward Artifacts: {gigs?.length || 0} Tasks Synchronized
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingId(null);
                setForm(defaultForm);
                setDialogOpen(true);
              }}
              className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" /> Initialize Protocol
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8">
                    Incentive Node
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Logic Class</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Token Yield</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Sync Count</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                    Interrogate
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-20 italic opacity-20 font-black uppercase tracking-widest"
                    >
                      Registry Syncing...
                    </TableCell>
                  </TableRow>
                ) : (
                  gigs?.map((gig: any) => (
                    <TableRow key={gig.id} className="group transition-all hover:bg-primary/[0.02]">
                      <TableCell className="px-8 py-6">
                        <p className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors">
                          {gig.title}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded-lg border-2 font-black text-[8px] uppercase tracking-widest bg-background"
                        >
                          {gig.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-black italic text-sm">
                          <Coins className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                          {gig.credit_reward} TKN
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-muted-foreground/60">
                        {gig.total_completed || 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg font-black text-[8px] uppercase tracking-[0.2em] px-3 py-1 border-none",
                            gig.is_active ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/60",
                          )}
                        >
                          {gig.is_active ? "ACTIVE_LOG" : "IDLE_DRAFT"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all"
                          onClick={() => openEdit(gig)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    Protocol Calibration
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                    Incentive Artifact Configuration Protocol
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Incentive Identity *
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-12 rounded-xl border-2 font-bold"
                  placeholder="e.g., GLOBAL_CV_SYNC"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Logic Payload (Description) *
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="rounded-2xl border-2 p-6 italic font-medium"
                  placeholder="Define artifact purpose..."
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Logic Class
                  </Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-bold bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="font-bold text-[10px] uppercase">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Token Yield (Reward)
                  </Label>
                  <Input
                    type="number"
                    value={form.credit_reward}
                    onChange={(e) => setForm({ ...form, credit_reward: parseInt(e.target.value) || 0 })}
                    className="h-12 rounded-xl border-2 font-black italic text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Visual Index (Icon)
                  </Label>
                  <Input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="h-12 rounded-xl border-2"
                    placeholder="Rocket, Zap, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Registry Limit (Max/User)
                  </Label>
                  <Input
                    type="number"
                    value={form.max_completions_per_user}
                    onChange={(e) => setForm({ ...form, max_completions_per_user: parseInt(e.target.value) || 10 })}
                    className="h-12 rounded-xl border-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Synchronization Requirements
                </Label>
                <Input
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  className="h-12 rounded-xl border-2"
                  placeholder="Prerequisites for yield distribution..."
                />
              </div>

              <div className="flex items-center gap-3 p-6 rounded-[28px] border-2 bg-muted/20 border-border/10">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="text-[10px] font-black uppercase tracking-widest">Authorize Node Deployment</Label>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-border/10">
                <Button
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
                >
                  Abort
                </Button>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={!form.title || !form.description || saveMutation.isPending}
                  className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 flex items-center gap-3"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {editingId ? "Commit Recalibration" : "Authorize Creation"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
