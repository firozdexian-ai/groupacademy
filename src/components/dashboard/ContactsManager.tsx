import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, Plus, Edit, Trash2, Search, 
  Mail, Loader2, RefreshCw, Building2, Phone,
  MessageCircle, Linkedin, ExternalLink
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";

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

export function ContactsManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState(emptyContact);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [contactsResult, companiesResult] = await Promise.all([
        withTimeout(
          Promise.resolve(
            supabase
              .from("contacts")
              .select("*, company:companies(id, name, industry)")
              .order("full_name")
          ),
          TIMEOUTS.DEFAULT,
          "Loading contacts timed out"
        ),
        withTimeout(
          Promise.resolve(supabase.from("companies").select("id, name, industry").order("name")),
          TIMEOUTS.DEFAULT,
          "Loading companies timed out"
        ),
      ]);

      if (contactsResult.error) throw contactsResult.error;
      if (companiesResult.error) throw companiesResult.error;
      
      setContacts(contactsResult.data || []);
      setCompanies(companiesResult.data || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      setLoadError(error.message || "Failed to load contacts");
      toast.error("Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      c.full_name.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query) ||
      c.designation?.toLowerCase().includes(query) ||
      c.company?.name?.toLowerCase().includes(query);

    const matchesCompany = companyFilter === "all" || c.company_id === companyFilter;

    return matchesSearch && matchesCompany;
  });

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
        const { error } = await withTimeout(
          Promise.resolve(
            supabase.from("contacts").update(contactData).eq("id", editingContact.id)
          ),
          TIMEOUTS.DEFAULT,
          "Update timed out"
        );
        if (error) throw error;
        toast.success("Contact updated");
      } else {
        const { error } = await withTimeout(
          Promise.resolve(supabase.from("contacts").insert(contactData)),
          TIMEOUTS.DEFAULT,
          "Insert timed out"
        );
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
    if (!confirm("Delete this contact?")) return;

    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("contacts").delete().eq("id", id)),
        TIMEOUTS.DEFAULT,
        "Delete timed out"
      );
      if (error) throw error;
      toast.success("Contact deleted");
      loadData();
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      toast.error(error.message || "Failed to delete contact");
    }
  };

  const handleWhatsApp = async (contact: Contact) => {
    const phone = contact.whatsapp_number || contact.phone;
    if (!phone) {
      toast.error("No phone number available");
      return;
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, "");
    const message = `Hi ${contact.full_name}, hope you're doing well!`;
    
    // Open WhatsApp
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");

    // Log outreach
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("contact_outreach").insert({
        contact_id: contact.id,
        channel: "whatsapp",
        message_type: "intro",
        message_content: message,
        sent_by: user?.id,
      });

      // Update last contacted
      await supabase
        .from("contacts")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("id", contact.id);
    } catch (error) {
      console.error("Failed to log outreach:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Contacts ({contacts.length})
              </CardTitle>
              <CardDescription>
                Manage hiring managers and company contacts
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-[200px]">
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
            <DashboardErrorState
              title="Failed to load contacts"
              message={loadError}
              onRetry={loadData}
            />
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No contacts found. Add your first contact!</p>
            </div>
          ) : (
            <div className="rounded-md border">
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
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {contact.full_name}
                            {contact.is_primary && (
                              <Badge variant="secondary" className="text-xs">Primary</Badge>
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
                                <Badge variant="outline" className="text-xs">{contact.company.industry}</Badge>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsApp(contact)}
                            disabled={!contact.phone && !contact.whatsapp_number}
                            className="text-green-600 hover:text-green-700"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          {contact.linkedin_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(contact.linkedin_url!, "_blank")}
                            >
                              <Linkedin className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(contact)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contact.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Edit Contact" : "Add Contact"}
            </DialogTitle>
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
}
