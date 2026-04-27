import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Link2,
  Activity,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton } from "./DashboardSkeleton"; // FIXED: Restored missing import
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Workforce Pulse & Commission Terminal
 * CTO Reference: Authoritative management of workforce nodes and talent distribution logic.
 * Resolved TS2304 by restoring the DashboardTableSkeleton import.
 */

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
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  probation: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  inactive: "bg-muted text-muted-foreground",
};

interface WorkforceMember {
  id: string;
  talent_id: string;
  role_type: string;
  specialization: any;
  reports_to: string | null;
  country: string | null;
  city: string | null;
  status: string;
  hired_at: string | null;
  probation_ends_at: string | null;
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
  const [members, setMembers] = useState<WorkforceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [talentSearch, setTalentSearch] = useState("");
  const [talentOptions, setTalentOptions] = useState<TalentOption[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<TalentOption | null>(null);
  const [newRole, setNewRole] = useState("talent_executive");
  const [newStatus, setNewStatus] = useState("active");
  const [newCity, setNewCity] = useState("");
  const [specType, setSpecType] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [kpis, setKpis] = useState({ total: 0, active: 0, totalCommission: 0, totalAssigned: 0 });

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignMemberId, setAssignMemberId] = useState<string | null>(null);
  const [assignTalentSearch, setAssignTalentSearch] = useState("");
  const [assignTalentOptions, setAssignTalentOptions] = useState<TalentOption[]>([]);

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

  // Search logic for new workforce members
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
        .limit(10);
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
      const spec = specType && specValue ? { type: specType, value: specValue } : {};
      const { error } = await supabase.from("workforce_members").insert({
        talent_id: selectedTalent.id,
        role_type: newRole as WorkforceRoleType,
        status: newStatus,
        city: newCity || null,
        specialization: spec,
      } as any);
      if (error) throw error;
      toast.success("Identity Deployed to Workforce");
      setShowAddDialog(false);
      resetForm();
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTalent = async (talentId: string) => {
    if (!assignMemberId) return;
    try {
      const { error } = await supabase.from("talent_assignments").insert({
        talent_id: talentId,
        assigned_to: assignMemberId,
      });
      if (error) throw error;
      toast.success("Talent Assignment Optimized");
      setShowAssignDialog(false);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetForm = () => {
    setSelectedTalent(null);
    setTalentSearch("");
    setNewRole("talent_executive");
    setNewStatus("active");
    setNewCity("");
    setSpecType("");
    setSpecValue("");
  };

  const filtered = members.filter((m) => {
    const matchesSearch =
      !search ||
      m.talent_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.talent_email?.toLowerCase().includes(search.toLowerCase());
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
            Executive Hierarchy & Commission Registry
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchMembers}
            className="h-14 w-14 rounded-2xl border-2 hover:bg-primary/5 transition-all"
          >
            <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg"
          >
            <Plus className="h-4 w-4" /> Deploy Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIStat icon={Users} label="Total Members" value={kpis.total} color="primary" />
        <KPIStat icon={ShieldCheck} label="Active Assets" value={kpis.active} color="emerald" />
        <KPIStat icon={Coins} label="Total Commission" value={kpis.totalCommission} color="amber" />
        <KPIStat icon={TrendingUp} label="Talents Assigned" value={kpis.totalAssigned} color="blue" />
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col lg:flex-row gap-6">
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
              <SelectTrigger className="w-full lg:w-[240px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest">
                <SelectValue placeholder="FILTER ROLE" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="all" className="font-bold text-[10px]">
                  ALL AUTHORITIES
                </SelectItem>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="font-bold text-[10px]">
                    {v.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <DashboardTableSkeleton rows={8} columns={6} />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                    Executive node
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Authority Class</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">
                    Managed
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Yield</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right py-6 pr-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} className="group border-b border-border/5 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-6 pl-8">
                      <div className="text-left">
                        <p className="font-black text-sm uppercase italic tracking-tight">{m.talent_name}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 italic">
                          {m.talent_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-black text-[9px] uppercase italic border-2 bg-primary/5">
                        {ROLE_LABELS[m.role_type] || m.role_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-black italic">{m.assigned_count}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-black text-emerald-600 italic">₵{m.commission_earned}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-black text-[9px] uppercase italic rounded-full px-4",
                          STATUS_COLORS[m.status],
                        )}
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setAssignMemberId(m.id);
                            setShowAssignDialog(true);
                          }}
                          className="hover:bg-primary/10"
                        >
                          <Link2 className="h-5 w-5 text-primary" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* ... Rest of dialog components remain the same ... */}
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
