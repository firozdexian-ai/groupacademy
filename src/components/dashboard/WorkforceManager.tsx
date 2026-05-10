import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import type { Database } from "@/integrations/supabase/types";
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
  Coins,
  TrendingUp,
  UserCog,
  Link2,
  ShieldCheck,
  Layers,
  GraduationCap,
  Building2,
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useHrGraph } from "@/hooks/useHrGraph";
import { cn } from "@/lib/utils";

type WorkforceRoleType = Database["public"]["Enums"]["workforce_role_type"];

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
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  probation: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  inactive: "bg-muted text-muted-foreground",
};

interface WorkforceMember {
  id: string;
  talent_id: string;
  role_type: string;
  team_id: string | null;
  grade_id: string | null;
  status: string;
  created_at: string;
  talent_name?: string;
  talent_email?: string;
  assigned_count?: number;
  commission_earned?: number;
}

interface TalentOption {
  id: string;
  full_name: string;
  email: string;
}

export function WorkforceManager() {
  const { hrGraphQuery } = useHrGraph();
  const [members, setMembers] = useState<WorkforceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Deployment Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [talentSearch, setTalentSearch] = useState("");
  const [talentOptions, setTalentOptions] = useState<TalentOption[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<TalentOption | null>(null);
  const [draft, setDraft] = useState({
    role_type: "talent_executive",
    status: "active",
    team_id: "none",
    grade_id: "none",
  });

  const [kpis, setKpis] = useState({ total: 0, active: 0, totalCommission: 0, totalAssigned: 0 });

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const fetchProtocol = async () => {
        const { data: wfData, error } = await supabase
          .from("workforce_members")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const enriched = await Promise.all(
          (wfData || []).map(async (m: any) => {
            const { data: talent } = await supabase
              .from("talents")
              .select("full_name, email")
              .eq("id", m.talent_id)
              .single();
            const { count } = await supabase
              .from("talent_assignments")
              .select("id", { count: "exact", head: true })
              .eq("assigned_to", m.id);
            const { data: commData } = await supabase
              .from("credit_transactions")
              .select("amount")
              .eq("talent_id", m.talent_id)
              .eq("transaction_type", "commission");

            const commission = (commData || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

            return {
              ...m,
              talent_name: talent?.full_name || "Unknown",
              talent_email: talent?.email || "",
              assigned_count: count || 0,
              commission_earned: commission,
            };
          }),
        );
        return enriched;
      };

      const result = await withTimeout(fetchProtocol(), TIMEOUTS.DEFAULT, "Workforce synchronization timed out");
      setMembers(result as WorkforceMember[]);

      const enriched = result as WorkforceMember[];
      setKpis({
        total: enriched.length,
        active: enriched.filter((m) => m.status === "active").length,
        totalCommission: enriched.reduce((s, m) => s + (m.commission_earned || 0), 0),
        totalAssigned: enriched.reduce((s, m) => s + (m.assigned_count || 0), 0),
      });
    } catch (err: any) {
      toast.error("Telemetry Fault: Failed to load workforce registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Autocomplete Talent Search
  useEffect(() => {
    if (talentSearch.length < 2) {
      setTalentOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("talents")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${sanitizeIlike(talentSearch)}%,email.ilike.%${sanitizeIlike(talentSearch)}%`)
        .limit(5);
      setTalentOptions(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [talentSearch]);

  const handleAdd = async () => {
    if (!selectedTalent) {
      toast.error("Protocol Fault: Select a talent node.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        talent_id: selectedTalent.id,
        role_type: draft.role_type as WorkforceRoleType,
        status: draft.status,
        team_id: draft.team_id !== "none" ? draft.team_id : null,
        grade_id: draft.grade_id !== "none" ? draft.grade_id : null,
      };

      const { error } = await supabase.from("workforce_members").insert(payload as any);
      if (error) throw error;

      toast.success("Identity Deployed to Workforce");
      setShowAddDialog(false);
      setSelectedTalent(null);
      setTalentSearch("");
      fetchMembers();
      hrGraphQuery.refetch(); // Refresh graph headcounts
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = members.filter((m) => {
    const matchesSearch =
      !search ||
      m.talent_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.talent_email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role_type === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Helper lookups for the table
  const getTeamName = (id: string | null) => hrGraphQuery.data?.teams.find((t) => t.id === id)?.name;
  const getGradeLabel = (id: string | null) => {
    const g = hrGraphQuery.data?.grades.find((g) => g.id === id);
    return g ? `L${g.level}: ${g.name}` : null;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <UserCog className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Workforce Pulse</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Executive Hierarchy & Commission Registry
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchMembers}
            disabled={loading}
            className="h-12 w-12 rounded-xl border-2 bg-background/50 hover:bg-primary/5 shrink-0 shadow-sm"
          >
            <RefreshCw className={cn("h-4 w-4 text-primary", loading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Deploy Member
          </Button>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIStat icon={Users} label="Total Members" value={kpis.total} color="primary" bg="bg-primary/10" />
        <KPIStat icon={ShieldCheck} label="Active Assets" value={kpis.active} color="emerald" bg="bg-emerald-500/10" />
        <KPIStat
          icon={Coins}
          label="Total Commission"
          value={`₵${kpis.totalCommission.toLocaleString()}`}
          color="amber"
          bg="bg-amber-500/10"
        />
        <KPIStat
          icon={TrendingUp}
          label="Talents Assigned"
          value={kpis.totalAssigned}
          color="blue"
          bg="bg-blue-500/10"
        />
      </div>

      {/* Main Table Card */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-emerald-500" />
        <CardHeader className="p-6 md:p-8 border-b border-border/10 bg-muted/5 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              placeholder="SEARCH WORKFORCE REGISTRY..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-xl border-2 pl-12 font-bold uppercase text-[10px] tracking-widest bg-card/50 focus-visible:border-primary/40 transition-colors"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[240px] h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
              <SelectValue placeholder="FILTER ROLE" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2">
              <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest">
                ALL AUTHORITIES
              </SelectItem>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="font-bold text-[10px] uppercase tracking-widest">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <DashboardTableSkeleton rows={8} columns={6} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center">
                <UserCog className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="font-black uppercase tracking-widest text-muted-foreground/50 italic text-sm">
                Zero records detected.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                      Executive Node
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Authority Class</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Graph Position</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">
                      Yield
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                    <TableHead className="text-right py-5 pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/5">
                  {filtered.map((m) => (
                    <TableRow key={m.id} className="group hover:bg-primary/[0.02] transition-colors">
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-background border-2 border-border/20 flex items-center justify-center shrink-0 shadow-sm">
                            <UserCog className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase italic tracking-tight">{m.talent_name}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                              {m.talent_email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-black text-[9px] uppercase italic border-2 bg-primary/5 text-primary border-primary/20"
                        >
                          {ROLE_LABELS[m.role_type] || m.role_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
                            <Layers className="h-3 w-3" /> {getTeamName(m.team_id) || "Unassigned"}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
                            <GraduationCap className="h-3 w-3" /> {getGradeLabel(m.grade_id) || "No Grade"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-black text-emerald-600 italic bg-emerald-500/10 px-2 py-0.5 rounded-md text-xs">
                            ₵{m.commission_earned}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            {m.assigned_count} Assigned
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-black text-[9px] uppercase italic px-3 border-none",
                            STATUS_COLORS[m.status],
                          )}
                        >
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 opacity-20 group-hover:opacity-100 transition-opacity"
                        >
                          <Link2 className="h-4 w-4 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl rounded-[40px] border-4 border-border/40 p-0 overflow-hidden bg-background/95 backdrop-blur-2xl shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-8 pb-0">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <UserCog className="h-8 w-8 text-primary fill-primary/20" />
                <div className="space-y-1 text-left">
                  <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                    Deploy Member
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic text-muted-foreground/60">
                    Assign talent identity to the internal organizational graph
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pb-8 text-left">
              {/* Talent Lookup */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Identity Node (Talent Search)
                </Label>
                {selectedTalent ? (
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 bg-primary/5 border-primary/20">
                    <div>
                      <p className="font-black text-sm uppercase italic tracking-tight text-primary">
                        {selectedTalent.full_name}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {selectedTalent.email}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTalent(null)}
                      className="h-8 rounded-lg font-bold text-[10px] uppercase"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      placeholder="SEARCH EMAIL OR NAME..."
                      value={talentSearch}
                      onChange={(e) => setTalentSearch(e.target.value)}
                      className="h-14 rounded-xl border-2 pl-12 font-bold uppercase text-xs tracking-widest bg-muted/20"
                    />
                    {talentOptions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-background border-2 border-border/40 rounded-xl shadow-xl overflow-hidden z-50">
                        {talentOptions.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTalent(t)}
                            className="p-3 hover:bg-primary/5 cursor-pointer border-b border-border/5 last:border-0 transition-colors"
                          >
                            <p className="font-black text-xs uppercase italic">{t.full_name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.email}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Authority Class
                  </Label>
                  <Select value={draft.role_type} onValueChange={(v) => setDraft({ ...draft, role_type: v })}>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold uppercase text-[10px] tracking-widest bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {Object.entries(ROLE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="font-bold text-[10px] uppercase tracking-widest">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Deployment Status
                  </Label>
                  <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold uppercase text-[10px] tracking-widest bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {Object.keys(STATUS_COLORS).map((s) => (
                        <SelectItem key={s} value={s} className="font-bold text-[10px] uppercase tracking-widest">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Graph Positioning (Team & Grade) */}
              <div className="p-6 rounded-[24px] border-2 border-border/10 bg-muted/5 space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Internal Graph Coordinates
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <Select value={draft.team_id} onValueChange={(v) => setDraft({ ...draft, team_id: v })}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-bold uppercase text-[10px] tracking-widest bg-background/50">
                      <SelectValue placeholder="ASSIGN TEAM" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem
                        value="none"
                        className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground"
                      >
                        -- UNASSIGNED --
                      </SelectItem>
                      {hrGraphQuery.data?.teams.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="font-bold text-[10px] uppercase tracking-widest">
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={draft.grade_id} onValueChange={(v) => setDraft({ ...draft, grade_id: v })}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-bold uppercase text-[10px] tracking-widest bg-background/50">
                      <SelectValue placeholder="ASSIGN GRADE" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem
                        value="none"
                        className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground"
                      >
                        -- UNASSIGNED --
                      </SelectItem>
                      {hrGraphQuery.data?.grades.map((g) => (
                        <SelectItem key={g.id} value={g.id} className="font-bold text-[10px] uppercase tracking-widest">
                          L{g.level}: {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-border/10 bg-muted/5 flex-col sm:flex-row gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="h-12 px-6 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest italic text-muted-foreground"
            >
              Abort
            </Button>
            <Button
              disabled={!selectedTalent || saving}
              onClick={handleAdd}
              className="h-12 px-8 rounded-[20px] font-black uppercase italic tracking-widest text-[10px] gap-2 shadow-lg flex-1"
            >
              <ShieldCheck className="h-4 w-4" /> Authorize Deployment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPIStat({ icon: Icon, label, value, color, bg }: any) {
  const textColors: Record<string, string> = {
    primary: "text-primary",
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    blue: "text-blue-500",
  };
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden hover:border-primary/30 transition-all group">
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-6 shadow-inner shrink-0",
            bg,
            textColors[color],
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-1 truncate">
            {label}
          </p>
          <p className="text-3xl font-black italic tracking-tighter leading-none text-foreground/90 truncate">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
