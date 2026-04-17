import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, Users, Plus, RefreshCw, Loader2, Coins, TrendingUp, UserCog, Link2 } from "lucide-react";

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
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  probation: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
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

  // Assignment dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignMemberId, setAssignMemberId] = useState<string | null>(null);
  const [assignTalentSearch, setAssignTalentSearch] = useState("");
  const [assignTalentOptions, setAssignTalentOptions] = useState<TalentOption[]>([]);

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch workforce members
      const { data: wfData, error } = await supabase
        .from("workforce_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with talent info, assignment counts, and commission
      const enriched = await Promise.all(
        (wfData || []).map(async (m: any) => {
          // Get talent name/email
          const { data: talent } = await supabase
            .from("talents")
            .select("full_name, email")
            .eq("id", m.talent_id)
            .single();

          // Count assigned talents
          const { count } = await supabase
            .from("talent_assignments")
            .select("id", { count: "exact", head: true })
            .eq("assigned_to", m.id);

          // Sum commission earned (transaction_type = 'commission')
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
        })
      );

      setMembers(enriched);
      
      // KPIs
      setKpis({
        total: enriched.length,
        active: enriched.filter((m) => m.status === "active").length,
        totalCommission: enriched.reduce((s, m) => s + (m.commission_earned || 0), 0),
        totalAssigned: enriched.reduce((s, m) => s + (m.assigned_count || 0), 0),
      });
    } catch (err: any) {
      toast.error("Failed to load workforce: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search talents for add dialog
  useEffect(() => {
    if (talentSearch.length < 2) { setTalentOptions([]); return; }
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

  // Search talents for assign dialog
  useEffect(() => {
    if (assignTalentSearch.length < 2) { setAssignTalentOptions([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("talents")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${sanitizeIlike(assignTalentSearch)}%,email.ilike.%${sanitizeIlike(assignTalentSearch)}%`)
        .limit(10);
      setAssignTalentOptions(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [assignTalentSearch]);

  const handleAdd = async () => {
    if (!selectedTalent) { toast.error("Select a talent first"); return; }
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
      toast.success("Workforce member added");
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
      toast.success("Talent assigned successfully");
      setShowAssignDialog(false);
      setAssignTalentSearch("");
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleStatusChange = async (memberId: string, newStatus: string) => {
    const { error } = await supabase.from("workforce_members").update({ status: newStatus }).eq("id", memberId);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); fetchMembers(); }
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
    const matchesSearch = !search || m.talent_name?.toLowerCase().includes(search.toLowerCase()) || m.talent_email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role_type === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{kpis.total}</p><p className="text-xs text-muted-foreground">Total Members</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><UserCog className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold">{kpis.active}</p><p className="text-xs text-muted-foreground">Active</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Coins className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{kpis.totalCommission}</p><p className="text-xs text-muted-foreground">Total Commission (Credits)</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{kpis.totalAssigned}</p><p className="text-xs text-muted-foreground">Talents Assigned</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMembers}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}><Plus className="w-4 h-4 mr-1" /> Add Member</Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No workforce members found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead className="text-center">Assigned</TableHead>
                  <TableHead className="text-center">Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{m.talent_name}</p>
                        <p className="text-xs text-muted-foreground">{m.talent_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{ROLE_LABELS[m.role_type] || m.role_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {m.specialization?.type ? (
                        <span className="text-xs">{m.specialization.type}: {m.specialization.value}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{m.assigned_count}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium text-emerald-600">{m.commission_earned}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setAssignMemberId(m.id); setShowAssignDialog(true); }}>
                          <Link2 className="w-4 h-4 mr-1" /> Assign
                        </Button>
                        <Select value={m.status} onValueChange={(v) => handleStatusChange(m.id, v)}>
                          <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="probation">Probation</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Workforce Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Search Talent</Label>
              <Input placeholder="Type name or email..." value={talentSearch} onChange={(e) => setTalentSearch(e.target.value)} />
              {talentOptions.length > 0 && !selectedTalent && (
                <div className="border rounded-md mt-1 max-h-40 overflow-auto">
                  {talentOptions.map((t) => (
                    <button key={t.id} className="w-full text-left px-3 py-2 hover:bg-accent text-sm" onClick={() => { setSelectedTalent(t); setTalentSearch(t.full_name); }}>
                      <span className="font-medium">{t.full_name}</span> <span className="text-muted-foreground">({t.email})</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedTalent && (
                <Badge className="mt-1" variant="secondary">
                  {selectedTalent.full_name}
                  <button className="ml-1 text-xs" onClick={() => { setSelectedTalent(null); setTalentSearch(""); }}>✕</button>
                </Badge>
              )}
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Specialization Type</Label>
                <Input placeholder="e.g. university, industry" value={specType} onChange={(e) => setSpecType(e.target.value)} />
              </div>
              <div>
                <Label>Specialization Value</Label>
                <Input placeholder="e.g. BRAC University" value={specValue} onChange={(e) => setSpecValue(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>City</Label>
              <Input placeholder="City" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Talent Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Talent to Executive</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Search Talent to Assign</Label>
              <Input placeholder="Type name or email..." value={assignTalentSearch} onChange={(e) => setAssignTalentSearch(e.target.value)} />
            </div>
            {assignTalentOptions.length > 0 && (
              <div className="border rounded-md max-h-60 overflow-auto">
                {assignTalentOptions.map((t) => (
                  <button key={t.id} className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between items-center" onClick={() => handleAssignTalent(t.id)}>
                    <div>
                      <span className="font-medium">{t.full_name}</span>
                      <span className="text-muted-foreground ml-1 text-xs">({t.email})</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Assign</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
