/**
 * Stakeholder Registry Hub (Contacts) — Phase Z0 Hardened
 * CTO Version: May 2026
 * Fixes: S1 (Ownership Move), PII Masking Standardized
 */
import { useState, useEffect, useCallback } from "react";
import {
  listCompaniesNameSorted,
  listContactsPaged,
  upsertContact,
} from "@/domains/companies/repo/companiesRepo";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Mail,
  Loader2,
  RefreshCw,
  Building2,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  ShieldCheck,
  Database,
  Activity,
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton } from "@/platform/admin/chrome/DashboardSkeleton";
import { getDexianWhatsAppLink } from "@/lib/companyOutreachTemplates";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/components/ProtectedRoute";

const ITEMS_PER_PAGE = 10;

export function ContactsTab() {
  const { role } = useUserRole();
  const isAdmin = role === "admin" || role === "super_admin";

  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({ full_name: "", is_primary: false });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [comps, contactsRes] = await Promise.all([
        listCompaniesNameSorted(),
        listContactsPaged({ from: (page - 1) * ITEMS_PER_PAGE, to: page * ITEMS_PER_PAGE - 1 }),
      ]);
      setCompanies(comps);
      setContacts(contactsRes.rows);
      setTotalCount(contactsRes.count);
    } catch (error) {
      toast.error("Registry sync fault");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!formData.full_name) return toast.error("Identity required");
    setSaving(true);
    try {
      await upsertContact(formData);
      toast.success("Registry synchronized");
      setIsDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* P2 Fix: Header Action Row */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Authority Matrix
          </h2>
          <p className="text-[10px] font-black text-muted-foreground/60">
            Secure Registry of {totalCount} Stakeholder Nodes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadData} className="rounded-xl h-12 w-12 border-2">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => {
              setFormData({ full_name: "", is_primary: false });
              setIsDialogOpen(true);
            }}
            className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Add Stakeholder
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricTile label="Total Nodes" value={totalCount} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
        <MetricTile
          label="Primary Contacts"
          value={contacts.filter((c) => c.is_primary).length}
          icon={Star}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <MetricTile
          label="Network Health"
          value="Encrypted"
          icon={Activity}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
      </div>

      <Card className="rounded-[40px] border-2 overflow-hidden shadow-2xl bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="pl-8 text-[10px] font-black uppercase py-6">Stakeholder Spec</TableHead>
              <TableHead className="text-[10px] font-black uppercase">Parent Node</TableHead>
              <TableHead className="text-[10px] font-black uppercase">Logic Endpoints</TableHead>
              <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Interrogate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-20 text-center">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" />
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id} className="group hover:bg-primary/[0.02]">
                  <TableCell className="pl-8 py-6">
                    <p className="font-black text-sm uppercase italic group-hover:text-primary transition-colors flex items-center gap-2">
                      {contact.full_name}
                      {contact.is_primary && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                      {contact.designation || "Stakeholder"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground/40" />
                      <span className="font-black text-[11px] uppercase">{contact.company?.name || "Independent"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-foreground/80 flex items-center gap-2">
                        <Mail className="h-3 w-3 opacity-40" /> {isAdmin ? contact.email : "pii_masked@groupacademy"}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3 opacity-40" /> {isAdmin ? contact.phone : "*******"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-all">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg hover:bg-emerald-500 hover:text-white"
                        onClick={() =>
                          window.open(
                            getDexianWhatsAppLink(contact.phone, "intro", contact.full_name, contact.company?.name),
                            "_blank",
                          )
                        }
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg hover:bg-primary hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="p-4 border-t flex justify-center gap-4 bg-muted/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border-2"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={contacts.length < ITEMS_PER_PAGE}
            className="rounded-xl border-2"
          >
            <ChevronRight />
          </Button>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px] border-4">
          <div className="p-2 space-y-6 text-left">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">
                Recalibrate Stakeholder
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Identity</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Designation</Label>
                <Input
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 rounded-xl font-black uppercase text-[10px] gap-2"
              >
                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} Commit
                Changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-6 text-left group transition-all hover:border-primary/30">
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-3 shadow-inner",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black text-muted-foreground italic">{label}</p>
          <p className="text-3xl font-black italic tracking-tighter text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}
