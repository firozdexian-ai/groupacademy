/**
 * GroUp Academy: Multiplier Network (Key Influencers)
 * CTO Version: May 2026 (Phase IR-Z0 Hardened)
 * Fixes: P2 (Restored CRUD), P3 (Folder Path), P5 (Type Safety)
 */
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Star,
  ShieldCheck,
  Loader2,
  Users,
  Mail,
  Briefcase,
  Activity,
  Pencil,
  Trash2,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { listInfluencers, upsertInfluencer, deleteInfluencer } from "@/domains/ir/repo/irRepo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Influencer {
  id: string;
  name: string;
  role?: string;
  organization?: string;
  country?: string;
  tier: string;
  email?: string;
  created_at?: string;
}

export default function KeyInfluencersTab() {
  const [rows, setRows] = useState<Influencer[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Dialog & Form States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Influencer | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Omit<Influencer, "id">>({
    name: "",
    role: "",
    organization: "",
    email: "",
    tier: "standard",
  });

  const loadRegistry = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listInfluencers(filter);
      setRows(data || []);
    } catch (err: any) {
      toast.error("Registry Sync Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  const handleOpenDialog = (node?: Influencer) => {
    if (node) {
      setEditingNode(node);
      setForm({
        name: node.name,
        role: node.role || "",
        organization: node.organization || "",
        email: node.email || "",
        tier: node.tier,
      });
    } else {
      setEditingNode(null);
      setForm({ name: "", role: "", organization: "", email: "", tier: "standard" });
    }
    setDialogOpen(true);
  };

  const executeDeployment = async () => {
    if (!form.name.trim()) return toast.error("Identity Fault: Name required.");
    setBusy(true);
    try {
      const payload: any = { ...form };
      if (editingNode) payload.id = editingNode.id;
      await upsertInfluencer(payload);
      toast.success(editingNode ? "Node Recalibrated" : "Entity Injected Successfully");
      setDialogOpen(false);
      loadRegistry();
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  const executePurge = async (id: string) => {
    try {
      await deleteInfluencer(id);
      toast.success("Node Terminated");
      loadRegistry();
    } catch (err: any) {
      toast.error("Purge Fault: " + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-4 md:p-6 text-left">
      {/* Executive Header */}
      <header className="flex justify-between items-center bg-muted/10 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Star className="h-8 w-8 text-amber-500 fill-amber-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Multiplier Network</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Strategic Ecosystem Amplifiers
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> Register Node
        </Button>
      </header>

      {/* Registry Filters */}
      <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-muted/20 border-2 border-border/40 w-fit">
        {["all", "vip", "strategic", "standard"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "px-6 py-2 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest",
              filter === t
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Influencer Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-[32px] bg-muted/40" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-[40px] border-2 border-dashed p-20 text-center opacity-40 uppercase font-black tracking-widest italic text-xs">
          Registry Frame Empty
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map((r) => (
            <Card
              key={r.id}
              className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm group hover:border-primary/40 transition-all overflow-hidden flex flex-col"
            >
              <div
                className={cn(
                  "h-1.5 w-full bg-gradient-to-r",
                  r.tier === "vip"
                    ? "from-amber-400 to-orange-500"
                    : r.tier === "strategic"
                      ? "from-purple-400 to-indigo-500"
                      : "from-blue-400 to-cyan-500",
                )}
              />
              <CardContent className="p-6 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="font-black text-xl uppercase tracking-tighter italic group-hover:text-primary transition-colors truncate">
                      {r.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                      <Briefcase className="h-3 w-3" />
                      <span className="truncate">
                        {r.role || "STAKEHOLDER"} {r.organization ? `· ${r.organization}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(r)}
                      className="h-8 w-8 rounded-lg hover:bg-primary/10"
                    >
                      <Pencil className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => executePurge(r.id)}
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/10 pt-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono font-medium text-foreground/70">
                    <Mail className="h-3 w-3 opacity-40" /> {r.email || "—"}
                  </div>
                  <Badge
                    className={cn(
                      "text-[8px] font-black uppercase tracking-widest border-none px-3",
                      r.tier === "vip"
                        ? "bg-amber-500/10 text-amber-600"
                        : r.tier === "strategic"
                          ? "bg-purple-500/10 text-purple-600"
                          : "bg-blue-500/10 text-blue-600",
                    )}
                  >
                    {r.tier}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recalibration Dialog (CRUD Restored) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px] border-4 bg-background text-left">
          <div className="p-2 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-amber-500" />{" "}
                {editingNode ? "Recalibrate Node" : "Register Authority"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Identity Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl border-2 font-bold h-12"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Role</Label>
                  <Input
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="rounded-xl border-2 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Tier</Label>
                  <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-black uppercase text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="strategic">Strategic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Organization</Label>
                <Input
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  className="rounded-xl border-2 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Email Endpoint</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl border-2 h-12"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={executeDeployment}
                disabled={busy}
                className="w-full h-14 rounded-2xl font-black uppercase text-[11px] gap-2 shadow-xl bg-primary"
              >
                {busy ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}{" "}
                {editingNode ? "Commit Calibration" : "Authorize Node"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
