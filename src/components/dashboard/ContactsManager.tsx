import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { LinkedInJsonUpload } from "./LinkedInJsonUpload";

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
  Linkedin,
  ChevronLeft,
  ChevronRight,
  Star,
  PhoneOff,
  ShieldCheck,
  Zap,
  Activity,
  Terminal,
  Database,
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { getDexianWhatsAppLink } from "@/lib/companyOutreachTemplates";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Stakeholder Registry Hub (Contacts)
 * High-fidelity orchestrator for institutional relationship mapping and outreach telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced contact-sync guards.
 */

interface Contact {
  id: string;
  company_id: string | null;
  full_name: string;
  designation: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  linkedin_url: string | null;
  source: string | null;
  is_primary: boolean;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  company?: {
    id: string;
    name: string;
    industry: string | null;
  };
}

interface Company {
  id: string;
  name: string;
  industry: string | null;
}

const emptyContact = {
  company_id: "",
  full_name: "",
  designation: "",
  department: "",
  email: "",
  phone: "",
  whatsapp_number: "",
  linkedin_url: "",
  source: "manual",
  is_primary: false,
  notes: "",
};

const ITEMS_PER_PAGE = 10;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function ContactsManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState(emptyContact);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [linkedinImportOpen, setLinkedinImportOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (companies.length === 0) {
        const { data: companyData } = await supabase.from("companies").select("id, name, industry").order("name");
        setCompanies(companyData || []);
      }

      let query = supabase
        .from("contacts")
        .select("*, company:companies(id, name, industry)", { count: "exact" })
        .order("full_name");

      if (debouncedSearch) {
        const safe = sanitizeIlike(debouncedSearch);
        if (safe) query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
      }

      if (companyFilter !== "all") query = query.eq("company_id", companyFilter);
      if (sourceFilter !== "all") query = query.eq("source", sourceFilter);

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Registry Sync Timeout");
      if (result.error) throw result.error;

      setContacts((result.data as unknown as Contact[]) || []);
      setTotalCount(result.count || 0);
    } catch (error: any) {
      setLoadError(error.message || "Failed to synchronize contacts");
      toast.error("Transmission Error: Sync failure");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, companyFilter, sourceFilter, companies.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, companyFilter, sourceFilter]);

  const handleOpenDialog = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        company_id: contact.company_id || "",
        full_name: contact.full_name,
        designation: contact.designation || "",
        department: contact.department || "",
        email: contact.email || "",
        phone: contact.phone || "",
        whatsapp_number: contact.whatsapp_number || "",
        linkedin_url: contact.linkedin_url || "",
        source: contact.source || "manual",
        is_primary: contact.is_primary,
        notes: contact.notes || "",
      });
    } else {
      setEditingContact(null);
      setFormData(emptyContact);
    }
    setIsDialogOpen(true);
  };

  const handleSaveArtifact = async () => {
    if (!formData.full_name.trim()) return toast.error("Logic Fault: Name identifier required");
    setSaving(true);
    try {
      const payload = {
        ...formData,
        full_name: formData.full_name.trim(),
        company_id: formData.company_id || null,
        whatsapp_number: formData.whatsapp_number?.trim() || formData.phone?.trim() || null,
      };

      const { error } = editingContact
        ? await supabase.from("contacts").update(payload).eq("id", editingContact.id)
        : await supabase.from("contacts").insert(payload);

      if (error) throw error;
      toast.success("Registry Synchronized");
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error("Handshake Failed: Data rejection");
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsAppOutreach = async (contact: Contact) => {
    const phone = contact.whatsapp_number || contact.phone;
    if (!phone) return toast.error("No communication endpoint available");

    const companyName = contact.company?.name || "Target Organization";
    window.open(getDexianWhatsAppLink(phone, "intro", contact.full_name, companyName), "_blank");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("contact_outreach").insert({
          contact_id: contact.id,
          channel: "whatsapp",
          message_type: "intro",
          message_content: `Handshake initialized with ${contact.full_name} at ${companyName}`,
          sent_by: user.id,
        });
        toast.success("Outreach Protocol Registered");
      }
    } catch (error) {
      console.error("Telemetry log fault:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Entity Purged");
      setDeleteTarget(null);
      loadData();
    } catch (error: any) {
      toast.error("Purge Failed: " + (error.message || "Unknown error"));
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const primaryCount = contacts.filter((c) => c.is_primary).length;
  const neverContactedCount = contacts.filter((c) => !c.last_contacted_at).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* HUD: Registry Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Stakeholder Nodes", val: totalCount, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Primary Entities", val: primaryCount, icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
          {
            label: "Silent Logic (No Contact)",
            val: neverContactedCount,
            icon: PhoneOff,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
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
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" /> Stakeholder Registry
              </CardTitle>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                Authorized Relationship Artifacts: {totalCount} Nodes Detected
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="rounded-xl h-11 px-5 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
              >
                <RefreshCw className={cn("w-4 h-4 text-primary", isLoading && "animate-spin")} /> Re-Sync
              </Button>
              <Button
                variant="outline"
                onClick={() => setLinkedinImportOpen(true)}
                className="rounded-xl h-11 px-5 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
              >
                <Linkedin className="w-4 h-4 text-blue-600" /> Ingest JSON
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenDialog()}
                className="rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Entity
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Query Console */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 bg-muted/20 p-4 rounded-[28px] border-2 border-border/40 backdrop-blur-md">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Query registry by name, email, or endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-card/50 border-2 border-border/10 rounded-2xl font-bold tracking-tight text-base"
              />
            </div>
            <div className="relative flex items-center">
              <Database className="absolute left-4 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-full md:w-[220px] h-14 pl-11 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
                  <SelectValue placeholder="Company Protocol" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  <SelectItem value="all" className="font-bold">
                    GLOBAL REGISTRY
                  </SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="font-bold uppercase text-[9px]">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex items-center">
              <Zap className="absolute left-4 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-14 pl-11 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  <SelectItem value="all" className="font-bold">All Sources</SelectItem>
                  <SelectItem value="gro10x_signup" className="font-bold">Gro10x Signup</SelectItem>
                  <SelectItem value="manual" className="font-bold">Manual</SelectItem>
                  <SelectItem value="linkedin_import" className="font-bold">LinkedIn Import</SelectItem>
                  <SelectItem value="batch_upload" className="font-bold">Batch Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <DashboardTableSkeleton rows={5} columns={6} />
          ) : (
            <div className="rounded-[24px] border-2 border-border/20 overflow-hidden bg-background/50">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8">
                      Stakeholder Spec
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Parent Node</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Logic Endpoints</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Source</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                      Interrogate
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-32 text-muted-foreground/40 italic uppercase tracking-[0.2em] font-black"
                      >
                        No stakeholder entities detected.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow key={contact.id} className="group transition-all hover:bg-primary/[0.02]">
                        <TableCell className="px-8 py-6">
                          <div className="space-y-1">
                            <p className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors flex items-center gap-2">
                              {contact.full_name}
                              {contact.is_primary && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
                            </p>
                            {contact.designation && (
                              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                                {contact.designation}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {contact.company ? (
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center border border-border/40">
                                <Building2 className="h-4 w-4 text-muted-foreground/40" />
                              </div>
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-tighter italic leading-none">
                                  {contact.company.name}
                                </p>
                                {contact.company.industry && (
                                  <p className="text-[8px] font-bold text-primary/40 uppercase tracking-widest mt-1">
                                    {contact.company.industry}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] opacity-20 italic">ORPHAN_NODE</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/80 group/mail">
                                <Mail className="h-3.5 w-3.5 text-primary/40 group-hover/mail:text-primary transition-colors" />
                                <span className="truncate max-w-[120px]">{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground italic">
                                <Phone className="h-3 w-3 opacity-40" /> {contact.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-lg border-2 font-black text-[8px] uppercase tracking-widest",
                              contact.source === "gro10x_signup"
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                                : "bg-background",
                            )}
                          >
                            {contact.source === "gro10x_signup" ? "● Gro10x User" : (contact.source || "MANUAL")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner"
                                    onClick={() => handleWhatsAppOutreach(contact)}
                                    disabled={!contact.phone && !contact.whatsapp_number}
                                  >
                                    <MessageCircle className="h-5 w-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest border-none">
                                  Initialize WhatsApp Handshake
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-primary group-hover:text-white transition-all shadow-inner"
                              onClick={() => handleOpenDialog(contact)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                              onClick={() => setDeleteTarget(contact.id)}
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
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 mt-10">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft />
              </Button>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                Cycle {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-2"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recalibration Node (Dialog) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-10">
              <div className="flex items-center gap-5">
                <Activity className="h-8 w-8 text-primary" />
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                  {editingContact ? "Recalibrate Entity" : "Initialize Stakeholder Node"}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Parent Node (Company)
                </Label>
                <Select value={formData.company_id} onValueChange={(v) => setFormData({ ...formData, company_id: v })}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                    <SelectValue placeholder="Link to corporate registry..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2">
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="font-bold">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Entity Identity *
                    </Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="h-12 rounded-xl border-2 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Designation
                    </Label>
                    <Input
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="h-12 rounded-xl border-2"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Communication Endpoint (Email)
                    </Label>
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 rounded-xl border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Logic Path (LinkedIn)
                    </Label>
                    <Input
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="h-12 rounded-xl border-2"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Internal Relationship Notes
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-[120px] rounded-2xl border-2 p-6 italic"
                />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/20 border-2 border-border/10">
                <Switch
                  checked={formData.is_primary}
                  onCheckedChange={(v) => setFormData({ ...formData, is_primary: v })}
                />
                <Label className="text-[10px] font-black uppercase tracking-widest">
                  Designate as Primary Point of Contact
                </Label>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-border/10">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
                >
                  Abort
                </Button>
                <Button
                  onClick={handleSaveArtifact}
                  disabled={saving}
                  className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30"
                >
                  {saving ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  {saving ? "Syncing..." : editingContact ? "Commit Recalibration" : "Authorize Creation"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[32px] border-4 border-destructive/20 bg-background/95 p-8 shadow-2xl">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
              Purge Entity?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground italic leading-relaxed">
              System warning: Purging this stakeholder will permanently terminate all associated outreach logs and
              relationship telemetry. This logic cycle cannot be reverted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="rounded-xl font-black uppercase text-[10px] tracking-widest border-2 h-12 px-8">
              Decline Purge
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 px-10 hover:bg-destructive/90"
            >
              Confirm Termination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={linkedinImportOpen} onOpenChange={setLinkedinImportOpen}>
        <DialogContent className="max-w-xl rounded-[32px] border-4 border-blue-600/20 bg-background p-10">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-4">
              <Linkedin className="h-8 w-8 text-blue-600" />
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                Ingest LinkedIn Payload
              </DialogTitle>
            </div>
          </DialogHeader>
          <LinkedInJsonUpload
            mode="contact"
            onComplete={() => {
              setLinkedinImportOpen(false);
              loadData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Stakeholder Registry: Secured Management
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Node: Registry Contacts v2.6.4
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
