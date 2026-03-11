import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Dialog as ImportDialog, DialogContent as ImportDialogContent, DialogHeader as ImportDialogHeader, DialogTitle as ImportDialogTitle } from "@/components/ui/dialog";
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
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { getDexianWhatsAppLink } from "@/lib/companyOutreachTemplates";

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

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

export function ContactsManager() {
  // Data State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState(emptyContact);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [linkedinImportOpen, setLinkedinImportOpen] = useState(false);

  // Fetch Data (Paginated)
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
        query = query.or(
          `full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`,
        );
      }

      if (companyFilter !== "all") {
        query = query.eq("company_id", companyFilter);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading contacts timed out");

      if (result.error) throw result.error;

      setContacts((result.data as unknown as Contact[]) || []);
      setTotalCount(result.count || 0);
    } catch (error: any) {
      console.error("Error loading data:", error);
      setLoadError(error.message || "Failed to load contacts");
      toast.error("Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, companyFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, companyFilter]);

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

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    setSaving(true);
    try {
      const contactData = {
        company_id: formData.company_id || null,
        full_name: formData.full_name.trim(),
        designation: formData.designation?.trim() || null,
        department: formData.department?.trim() || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        whatsapp_number: formData.whatsapp_number?.trim() || formData.phone?.trim() || null,
        linkedin_url: formData.linkedin_url?.trim() || null,
        source: formData.source || "manual",
        is_primary: formData.is_primary,
        notes: formData.notes?.trim() || null,
      };

      if (editingContact) {
        const { error } = await supabase.from("contacts").update(contactData).eq("id", editingContact.id);
        if (error) throw error;
        toast.success("Contact updated");
      } else {
        const { error } = await supabase.from("contacts").insert(contactData);
        if (error) throw error;
        toast.success("Contact created");
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error saving contact:", error);
      toast.error("Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Contact deleted");
      setDeleteTarget(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete contact");
    }
  };

  const handleWhatsApp = async (contact: Contact) => {
    const phone = contact.whatsapp_number || contact.phone;
    if (!phone) {
      toast.error("No phone number available");
      return;
    }

    const companyName = contact.company?.name || "your organization";
    const whatsappLink = getDexianWhatsAppLink(phone, "intro", contact.full_name, companyName);
    window.open(whatsappLink, "_blank");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        supabase
          .from("contact_outreach")
          .insert({
            contact_id: contact.id,
            channel: "whatsapp",
            message_type: "intro",
            message_content: `Dexian intro message to ${contact.full_name} at ${companyName}`,
            sent_by: user.id,
          })
          .then(() => {
            toast.success("WhatsApp outreach logged");
          });
      }
    } catch (error) {
      console.error("Failed to log outreach:", error);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // KPI derived values
  const primaryCount = contacts.filter((c) => c.is_primary).length;
  const neverContactedCount = contacts.filter((c) => !c.last_contacted_at).length;

  return (
    <div className="space-y-4">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Users className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{totalCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-100">
              <Star className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Primary</p>
              <p className="text-lg font-bold">{primaryCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-orange-100">
              <PhoneOff className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">No Contact</p>
              <p className="text-lg font-bold">{neverContactedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Contacts
              </CardTitle>
              <CardDescription>{totalCount} contacts found</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={() => handleOpenDialog()} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Add Contact</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <Button variant="outline" onClick={() => setLinkedinImportOpen(true)} size="sm">
                <Linkedin className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Import LinkedIn</span>
                <span className="sm:hidden">Import</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <DashboardTableSkeleton rows={5} columns={6} />
          ) : loadError ? (
            <DashboardErrorState title="Error" message={loadError} onRetry={loadData} />
          ) : contacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No contacts found. Add your first contact!</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate flex items-center gap-1.5">
                          {contact.full_name}
                          {contact.is_primary && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Primary
                            </Badge>
                          )}
                        </p>
                        {contact.designation && (
                          <p className="text-xs text-muted-foreground truncate">{contact.designation}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {contact.source || "manual"}
                      </Badge>
                    </div>

                    {contact.company && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{contact.company.name}</span>
                        {contact.company.industry && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {contact.company.industry}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-primary hover:underline flex items-center gap-1 truncate min-w-0">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </a>
                      )}
                      {contact.phone && (
                        <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-1 pt-1 border-t">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600"
                              onClick={() => handleWhatsApp(contact)}
                              disabled={!contact.phone && !contact.whatsapp_number}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>WhatsApp</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {contact.linkedin_url && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(contact.linkedin_url!, "_blank")}>
                          <Linkedin className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(contact)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(contact.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {contact.full_name}
                              {contact.is_primary && (
                                <Badge variant="secondary" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </p>
                            {contact.designation && (
                              <p className="text-sm text-muted-foreground">{contact.designation}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {contact.company ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm">{contact.company.name}</p>
                                {contact.company.industry && (
                                  <Badge variant="outline" className="text-xs">
                                    {contact.company.industry}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <Mail className="w-3 h-3" />
                                {contact.email}
                              </a>
                            )}
                            {contact.phone && (
                              <p className="text-sm flex items-center gap-1 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{contact.source || "manual"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleWhatsApp(contact)}
                                    disabled={!contact.phone && !contact.whatsapp_number}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>WhatsApp (Dexian Intro)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {contact.linkedin_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(contact.linkedin_url!, "_blank")}
                              >
                                <Linkedin className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(contact)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(contact.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company_id">Company</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => setFormData({ ...formData, company_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g., HR Manager"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Human Resources"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+880..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input
                  id="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="Leave empty to use phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
              />
              <Label htmlFor="is_primary">Primary Contact for this company</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingContact ? "Update" : "Create"} Contact
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this contact and any associated outreach history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* LinkedIn JSON Import Dialog */}
      <ImportDialog open={linkedinImportOpen} onOpenChange={setLinkedinImportOpen}>
        <ImportDialogContent className="max-w-lg">
          <ImportDialogHeader>
            <ImportDialogTitle>Import Contacts from LinkedIn JSON</ImportDialogTitle>
          </ImportDialogHeader>
          <LinkedInJsonUpload mode="contact" onComplete={() => { setLinkedinImportOpen(false); loadData(); }} />
        </ImportDialogContent>
      </ImportDialog>
    </div>
  );
}
