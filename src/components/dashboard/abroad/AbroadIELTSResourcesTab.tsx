import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "../DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Headphones,
  Eye,
  Pencil,
  Mic,
  Filter,
  RefreshCw,
  Layers,
  ShieldCheck,
  Activity,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Curriculum Intelligence Terminal (IELTS Resources)
 * High-fidelity orchestrator for practice artifacts and academic telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced sectional guards.
 */

interface IELTSResource {
  id: string;
  section: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  content_data: any;
  duration_mins: number | null;
  difficulty_level: string | null;
  is_free: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const SECTION_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  listening: { label: "LISTENING_NODE", icon: Headphones, color: "text-blue-500", bg: "bg-blue-500/10" },
  reading: { label: "READING_NODE", icon: Eye, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  writing: { label: "WRITING_NODE", icon: Pencil, color: "text-orange-500", bg: "bg-orange-500/10" },
  speaking: { label: "SPEAKING_NODE", icon: Mic, color: "text-purple-500", bg: "bg-purple-500/10" },
};

const emptyResource = {
  section: "listening",
  title: "",
  description: "",
  content_type: "article",
  content_url: "",
  content_data: null,
  duration_mins: 0,
  difficulty_level: "intermediate",
  is_free: false,
  display_order: 0,
  is_active: true,
};

export function AbroadIELTSResourcesTab() {
  const [resources, setResources] = useState<IELTSResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<IELTSResource | null>(null);
  const [formData, setFormData] = useState(emptyResource);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadRegistry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("ielts_resources")
        .select("*")
        .order("section")
        .order("display_order", { ascending: true });

      if (queryError) throw queryError;
      setResources(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error("Transmission Error: Registry sync failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  const filteredNodes = resources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = sectionFilter === "all" || r.section === sectionFilter;
    return matchesSearch && matchesSection;
  });

  const handleOpenCalibration = (resource?: IELTSResource) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        ...resource,
        description: resource.description || "",
        content_url: resource.content_url || "",
        difficulty_level: resource.difficulty_level || "intermediate",
        duration_mins: resource.duration_mins || 0,
      });
    } else {
      setEditingResource(null);
      setFormData(emptyResource);
    }
    setIsDialogOpen(true);
  };

  const handleCommitHandshake = async () => {
    if (!formData.title.trim()) return toast.error("Logic Fault: Identifier required");
    setSaving(true);
    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        duration_mins: formData.duration_mins ? Number(formData.duration_mins) : null,
      };

      const { error: saveError } = editingResource
        ? await supabase.from("ielts_resources").update(payload).eq("id", editingResource.id)
        : await supabase.from("ielts_resources").insert([payload]);

      if (saveError) throw saveError;
      toast.success("Registry Synchronized");
      setIsDialogOpen(false);
      loadRegistry();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTerminateArtifact = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from("ielts_resources").delete().eq("id", id);
      if (deleteError) throw deleteError;
      toast.success("Artifact Purged");
      setDeleteId(null);
      loadRegistry();
    } catch (err: any) {
      toast.error("Purge Error: Active dependencies locked");
    }
  };

  const handleToggleState = async (resource: IELTSResource) => {
    const { error } = await supabase
      .from("ielts_resources")
      .update({ is_active: !resource.is_active })
      .eq("id", resource.id);

    if (!error) {
      toast.success(`Protocol set to ${!resource.is_active ? "ACTIVE" : "IDLE"}`);
      loadRegistry();
    }
  };

  if (loading) return <DashboardTableSkeleton rows={8} columns={6} />;
  if (error) return <DashboardErrorState title="Registry Fault" message={error} onRetry={loadRegistry} />;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Telemetry HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(SECTION_CONFIG).map(([key, cfg]) => (
          <Card
            key={key}
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm"
          >
            <CardContent className="p-6 flex items-center gap-5">
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                  cfg.bg,
                  "border-white/5",
                )}
              >
                <cfg.icon className={cn("h-6 w-6", cfg.color)} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                  {cfg.label}
                </p>
                <p className="text-2xl font-black tracking-tighter italic leading-none">
                  {resources.filter((r) => r.section === key).length}
                </p>
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
                <Layers className="h-8 w-8 text-primary" /> Curriculum Registry
              </CardTitle>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                Authorized Practice Artifacts: {resources.length} Nodes Synchronized
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenCalibration()}
              className="rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" /> Initialize Artifact
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-4 mb-8 bg-muted/20 p-4 rounded-[28px] border-2 border-border/40 backdrop-blur-md">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Query registry by title or logic node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-card/50 border-2 border-border/10 rounded-2xl font-bold tracking-tight text-base shadow-inner"
              />
            </div>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-full md:w-[240px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
                <Filter className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder="Node Class" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 shadow-2xl">
                <SelectItem value="all" className="font-bold">
                  GLOBAL_REGISTRY
                </SelectItem>
                {Object.entries(SECTION_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="font-bold uppercase">
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-[24px] border-2 border-border/20 overflow-hidden bg-background/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8">
                    Section Protocol
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">
                    Artifact Specification
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Logic Class</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Access</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                    Interrogate
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNodes.map((r) => {
                  const cfg = SECTION_CONFIG[r.section] || SECTION_CONFIG.listening;
                  return (
                    <TableRow
                      key={r.id}
                      className="group transition-all hover:bg-primary/[0.02] border-b-2 border-border/5 last:border-0"
                    >
                      <TableCell className="px-8 py-6">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-lg border-2 font-black text-[8px] uppercase tracking-widest bg-background py-1.5",
                            cfg.color,
                          )}
                        >
                          {r.section}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none">
                            {r.title}
                          </p>
                          <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                            <span>Index: {r.display_order}</span>
                            {r.duration_mins && (
                              <>
                                {" "}
                                <span className="h-1 w-1 rounded-full bg-border" />{" "}
                                <span>{r.duration_mins} MIN_CYC</span>{" "}
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-muted text-muted-foreground/60 border-none font-black text-[8px] uppercase px-3 py-1">
                          {r.content_type}_NODE
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.is_free ? (
                          <Badge className="bg-emerald-500 text-white font-black text-[8px] border-none px-3 py-1 shadow-sm">
                            ALPHA_FREE
                          </Badge>
                        ) : (
                          <span className="text-[10px] font-bold opacity-20 italic">NODE_LOCKED</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleState(r)}
                          className="transition-all hover:scale-110 active:scale-95 grayscale hover:grayscale-0"
                        >
                          {r.is_active ? "🟢" : "🔴"}
                        </button>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl hover:bg-primary hover:text-white transition-all shadow-inner"
                            onClick={() => handleOpenCalibration(r)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                            onClick={() => setDeleteId(r.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-5">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    Protocol Calibration
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                    Artifact Configuration Handshake
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Section Node *
                    </Label>
                    <Select value={formData.section} onValueChange={(v) => setFormData((p) => ({ ...p, section: v }))}>
                      <SelectTrigger className="h-12 rounded-xl border-2 font-bold bg-muted/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        {Object.entries(SECTION_CONFIG).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="font-bold text-[10px] uppercase">
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Artifact Identity *
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                      className="h-12 rounded-xl border-2 font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Logic Path (URL)
                    </Label>
                    <Input
                      value={formData.content_url || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, content_url: e.target.value }))}
                      className="h-12 rounded-xl border-2 font-mono text-xs"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Logic Class
                    </Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(v) => setFormData((p) => ({ ...p, content_type: v }))}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        {["video", "article", "audio", "pdf"].map((t) => (
                          <SelectItem key={t} value={t} className="font-bold text-[10px] uppercase">
                            {t}_NODE
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Node Specification (Description)
                </Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="rounded-2xl border-2 p-6 italic font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Temporal Cycle (Min)
                  </Label>
                  <Input
                    type="number"
                    value={formData.duration_mins || 0}
                    onChange={(e) => setFormData((p) => ({ ...p, duration_mins: parseInt(e.target.value) }))}
                    className="h-12 rounded-xl border-2 font-black italic text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Registry Index (Order)
                  </Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData((p) => ({ ...p, display_order: parseInt(e.target.value) }))}
                    className="h-12 rounded-xl border-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-12 p-6 rounded-[28px] border-2 bg-muted/20 border-border/10">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_free}
                    onCheckedChange={(v) => setFormData((p) => ({ ...p, is_free: v }))}
                  />
                  <Label className="text-[10px] font-black uppercase tracking-widest">Alpha_Free Access</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData((p) => ({ ...p, is_active: v }))}
                  />
                  <Label className="text-[10px] font-black uppercase tracking-widest">Authorize Deployment</Label>
                </div>
              </div>

              <DialogFooter className="mt-10 pt-8 border-t border-border/10 gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
                >
                  Abort
                </Button>
                <Button
                  onClick={handleCommitHandshake}
                  disabled={saving}
                  className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 flex items-center gap-3"
                >
                  {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  {editingResource ? "Commit Recalibration" : "Authorize Creation"}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[32px] border-4 border-destructive/20 bg-background/95 p-10 shadow-2xl">
          <AlertDialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 border-2 border-destructive/20">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
              Terminate Node?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground italic leading-relaxed">
              System warning: This logic cycle cannot be reversed. Artifact and all associated history will be purged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-4">
            <AlertDialogCancel className="rounded-xl h-14 px-8 font-black uppercase text-[10px] border-2">
              Abort
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleTerminateArtifact(deleteId)}
              className="bg-destructive text-white rounded-xl h-14 px-10 font-black uppercase text-[10px]"
            >
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1 text-left">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Curriculum Registry Hub: Secured Access
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Protocol: Verified Executive Logic 2026.4
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}

export default AbroadIELTSResourcesTab;
