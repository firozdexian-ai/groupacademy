/**
 * Workforce Pulse Terminal — Phase HR-Z1 Hardened
 * CTO Version: May 2026
 * Fixes: W1 (Restored Dialogs), W2 (Team/Grade Wiring), W3 (RPC Adoption), W5 (Purged Fragments)
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { searchTalentsByNameOrEmail, insertWorkforceMember } from "@/domains/workforce/repo/workforceRepo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import {
  Search,
  Users,
  Plus,
  RefreshCw,
  Loader2,
  Coins,
  TrendingUp,
  UserCog,
  
  Zap,
  ShieldCheck,
  MapPin,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { DashboardTableSkeleton } from "@/platform/admin/chrome/DashboardSkeleton";
import { cn } from "@/lib/utils";
import { useHrGraph } from "./hooks/useHrGraph";

const ROLE_LABELS: Record<string, string> = {
  country_director: "Country Director",
  head_of_ta: "Head of TA",
  talent_executive: "Talent Executive",
  bde: "Business Dev Exec",
  academy_chancellor: "Academy Chancellor",
  school_dean: "School Dean",
  career_abroad_exec: "Career Abroad Exec",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  probation: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  inactive: "bg-muted text-muted-foreground",
};

export function WorkforceManager() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // W1/W2 Form State
  const { verticalsQuery, functionsQuery, teamsQuery, gradesQuery } = useHrGraph();
  const [talentSearch, setTalentSearch] = useState("");
  const [talentOptions, setTalentOptions] = useState<any[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    role_type: "talent_executive",
    status: "active",
    city: "",
    team_id: "",
    grade_id: "",
    specialization_type: "",
    specialization_value: "",
  });

  const [kpis, setKpis] = useState({ total: 0, active: 0, totalCommission: 0, totalAssigned: 0 });

  // W3 Fix: Adoption of high-performance dashboard RPC
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_workforce_dashboard");
      if (error) throw error;

      setMembers(data || []);
      setKpis({
        total: data?.length || 0,
        active: data?.filter((m: any) => m.status === "active").length || 0,
        totalCommission: data?.reduce((s: number, m: any) => s + (m.commission_earned || 0), 0) || 0,
        totalAssigned: data?.reduce((s: number, m: any) => s + (m.assigned_count || 0), 0) || 0,
      });
    } catch (err: any) {
      toast.error("Telemetry Fault: Registry Sync Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Talent Search logic for Deployment
  useEffect(() => {
    if (talentSearch.length < 2) return;
    const timer = setTimeout(async () => {
      const data = await searchTalentsByNameOrEmail(sanitizeIlike(talentSearch));
      setTalentOptions(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [talentSearch]);

  const handleAdd = async () => {
    if (!selectedTalent || !formData.team_id || !formData.grade_id) {
      toast.error("Protocol Fault: Identity, Team, and Grade required.");
      return;
    }
    setSaving(true);
    try {
      const spec = formData.specialization_type
        ? { type: formData.specialization_type, value: formData.specialization_value }
        : {};
      await insertWorkforceMember({
        talent_id: selectedTalent.id,
        role_type: formData.role_type,
        status: formData.status,
        city: formData.city || null,
        team_id: formData.team_id,
        grade_id: formData.grade_id,
        specialization: spec,
      });
      toast.success("Identity Deployed to Workforce");
      setShowAddDialog(false);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = members.filter((m) => {
    const matchesSearch =
      !search ||
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role_type === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <UserCog className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Workforce Pulse</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Executive Hierarchy & Performance Cluster
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchMembers} className="h-14 w-14 rounded-2xl border-2">
            <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Deploy Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIStat icon={Users} label="Total Members" value={kpis.total} color="primary" />
        <KPIStat icon={ShieldCheck} label="Active Assets" value={kpis.active} color="emerald" />
        <KPIStat icon={Coins} label="Total Commission" value={`₵${kpis.totalCommission}`} color="amber" />
        <KPIStat icon={TrendingUp} label="Yield Count" value={kpis.totalAssigned} color="blue" />
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-border/10 flex flex-col lg:flex-row gap-6 bg-muted/5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              placeholder="SEARCH WORKFORCE REGISTRY..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 rounded-2xl border-2 pl-12 font-bold uppercase text-[11px] tracking-widest bg-card/50"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full lg:w-[240px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] bg-background">
              <SelectValue placeholder="FILTER ROLE" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL AUTHORITIES</SelectItem>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="font-bold text-[10px]">
                  {v.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <DashboardTableSkeleton rows={8} />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/10 text-[10px] font-black uppercase tracking-widest">
                <TableRow className="border-b-2">
                  <TableHead className="py-6 pl-8">Executive Identity</TableHead>
                  <TableHead>Assignment / Grade</TableHead>
                  <TableHead className="text-center">Managed</TableHead>
                  <TableHead className="text-center">Yield</TableHead>
                  <TableHead className="text-right pr-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow
                    key={m.id}
                    className="group border-b border-border/5 hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="py-6 pl-8">
                      <div className="text-left min-w-[200px]">
                        <p className="font-black text-sm uppercase italic tracking-tight">{m.talent_name || "—"}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">{m.talent_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="font-black text-[9px] uppercase italic border-2 bg-primary/5"
                        >
                          {ROLE_LABELS[m.role_type] || m.role_type}
                        </Badge>
                        <p className="text-[9px] font-black text-muted-foreground/60 flex items-center gap-1 uppercase">
                          <Briefcase className="h-3 w-3" /> {m.city || "Remote"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-black italic">{m.assigned_count}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-black text-emerald-600 italic">₵{m.commission_earned}</span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Badge
                        className={cn(
                          "font-black text-[9px] uppercase italic rounded-full px-4",
                          STATUS_COLORS[m.status],
                        )}
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* W1 RESTORED: DEPLOY MEMBER DIALOG */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl rounded-[40px] border-4 p-0 overflow-hidden shadow-2xl bg-background">
          <div className="h-2 w-full bg-primary" />
          <div className="p-10 space-y-8 text-left">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
                Deploy Workforce Node
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Initialize executive authority and team binding
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Talent Lookup */}
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Search Talent Identity *</Label>
                <div className="relative">
                  <Input
                    placeholder="SEARCH NAME OR EMAIL..."
                    value={talentSearch}
                    onChange={(e) => setTalentSearch(e.target.value)}
                    className="h-12 border-2 rounded-xl"
                  />
                  {talentOptions.length > 0 && !selectedTalent && (
                    <Card className="absolute z-50 w-full mt-1 border-2 shadow-2xl">
                      {talentOptions.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTalent(t);
                            setTalentSearch(t.full_name);
                            setTalentOptions([]);
                          }}
                          className="p-3 hover:bg-primary/5 cursor-pointer border-b last:border-0"
                        >
                          <p className="font-black text-xs uppercase italic">{t.full_name}</p>
                          <p className="text-[9px] text-muted-foreground">{t.email}</p>
                        </div>
                      ))}
                    </Card>
                  )}
                </div>
              </div>

              {/* Team Binding (W2 Fix) */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Team Assignment *</Label>
                <Select value={formData.team_id} onValueChange={(v) => setFormData({ ...formData, team_id: v })}>
                  <SelectTrigger className="h-12 border-2 rounded-xl">
                    <SelectValue placeholder="SELECT TEAM" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamsQuery.data?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id} className="font-bold text-xs uppercase">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grade Binding (W2 Fix) */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Workforce Grade *</Label>
                <Select value={formData.grade_id} onValueChange={(v) => setFormData({ ...formData, grade_id: v })}>
                  <SelectTrigger className="h-12 border-2 rounded-xl">
                    <SelectValue placeholder="SELECT GRADE" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradesQuery.data?.map((g: any) => (
                      <SelectItem key={g.id} value={g.id} className="font-bold text-xs uppercase">
                        L{g.level} · {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Role Type</Label>
                <Select value={formData.role_type} onValueChange={(v) => setFormData({ ...formData, role_type: v })}>
                  <SelectTrigger className="h-12 border-2 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="font-bold text-xs uppercase">
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Location / City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Dhaka"
                  className="h-12 border-2 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-6 border-t">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddDialog(false);
                  setSelectedTalent(null);
                  setTalentSearch("");
                  setFormData({
                    role_type: "talent_executive",
                    status: "active",
                    city: "",
                    team_id: "",
                    grade_id: "",
                    specialization_type: "",
                    specialization_value: "",
                  });
                }}
                className="h-12 rounded-xl font-black uppercase text-[10px]"
              >
                Abort
              </Button>
              <Button
                onClick={handleAdd}
                disabled={saving || !selectedTalent}
                className="h-12 px-10 rounded-2xl font-black uppercase italic text-[11px] gap-2 shadow-xl bg-primary text-primary-foreground"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Authorize
                Deployment
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPIStat({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 border-primary/20 text-primary",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-600",
  };
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 shadow-xl overflow-hidden group">
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={cn(
            "p-4 rounded-2xl border-2 group-hover:rotate-6 transition-transform shadow-inner",
            colors[color],
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-left">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">{label}</p>
          <p className="text-3xl font-black italic tracking-tighter leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
