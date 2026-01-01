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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Building2, Plus, Edit, Trash2, Search, ExternalLink, 
  Mail, Loader2, RefreshCw, CheckCircle, Globe, Linkedin, Upload
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { BatchCompanyUpload } from "./BatchCompanyUpload";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  website: string | null;
  primary_email: string | null;
  secondary_emails: any;
  linkedin_url: string | null;
  facebook_url: string | null;
  notes: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

const emptyCompany = {
  name: "",
  logo_url: "",
  industry: "",
  website: "",
  primary_email: "",
  secondary_emails: [] as string[],
  linkedin_url: "",
  facebook_url: "",
  notes: "",
  is_verified: false,
};

export function CompaniesManager() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState(emptyCompany);
  const [saving, setSaving] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [showBatchUpload, setShowBatchUpload] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await withTimeout(
        Promise.resolve(supabase.from("companies").select("*").order("name")),
        TIMEOUTS.DEFAULT,
        "Loading companies timed out"
      );

      if (result.error) throw result.error;
      setCompanies(result.data || []);
    } catch (error: any) {
      console.error("Error loading companies:", error);
      setLoadError(error.message || "Failed to load companies");
      toast.error("Failed to load companies");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.industry?.toLowerCase().includes(query) ||
      c.primary_email?.toLowerCase().includes(query)
    );
  });

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        logo_url: company.logo_url || "",
        industry: company.industry || "",
        website: company.website || "",
        primary_email: company.primary_email || "",
        secondary_emails: company.secondary_emails || [],
        linkedin_url: company.linkedin_url || "",
        facebook_url: company.facebook_url || "",
        notes: company.notes || "",
        is_verified: company.is_verified,
      });
    } else {
      setEditingCompany(null);
      setFormData(emptyCompany);
    }
    setIsDialogOpen(true);
  };

  const handleAddEmail = () => {
    if (emailInput.trim() && !formData.secondary_emails.includes(emailInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        secondary_emails: [...prev.secondary_emails, emailInput.trim()],
      }));
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      secondary_emails: prev.secondary_emails.filter((e) => e !== email),
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSaving(true);
    try {
      const companyData = {
        name: formData.name.trim(),
        logo_url: formData.logo_url?.trim() || null,
        industry: formData.industry?.trim() || null,
        website: formData.website?.trim() || null,
        primary_email: formData.primary_email?.trim() || null,
        secondary_emails: formData.secondary_emails,
        linkedin_url: formData.linkedin_url?.trim() || null,
        facebook_url: formData.facebook_url?.trim() || null,
        notes: formData.notes?.trim() || null,
        is_verified: formData.is_verified,
      };

      if (editingCompany) {
        const { error } = await withTimeout(
          Promise.resolve(supabase
            .from("companies")
            .update(companyData)
            .eq("id", editingCompany.id)),
          TIMEOUTS.DEFAULT,
          "Update timed out"
        );
        if (error) throw error;
        toast.success("Company updated");
      } else {
        const { error } = await withTimeout(
          Promise.resolve(supabase.from("companies").insert(companyData)),
          TIMEOUTS.DEFAULT,
          "Insert timed out"
        );
        if (error) throw error;
        toast.success("Company created");
      }

      setIsDialogOpen(false);
      loadCompanies();
    } catch (error: any) {
      console.error("Error saving company:", error);
      toast.error("Failed to save company");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this company? Jobs linked to it won't be deleted.")) return;

    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("companies").delete().eq("id", id)),
        TIMEOUTS.DEFAULT,
        "Delete timed out"
      );
      if (error) throw error;
      toast.success("Company deleted");
      loadCompanies();
    } catch (error: any) {
      console.error("Error deleting company:", error);
      toast.error(error.message || "Failed to delete company");
    }
  };

  const verifiedCount = companies.filter((c) => c.is_verified).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Companies ({companies.length})
              </CardTitle>
              <CardDescription>
                {verifiedCount} verified employers
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadCompanies} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => setShowBatchUpload(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Batch Import
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, industry, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <DashboardTableSkeleton rows={5} columns={6} />
          ) : loadError ? (
            <DashboardErrorState
              title="Failed to load companies"
              message={loadError}
              onRetry={loadCompanies}
            />
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No companies found. Add your first employer!</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Links</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <p className="font-medium">{company.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{company.industry || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        {company.primary_email ? (
                          <a
                            href={`mailto:${company.primary_email}`}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            {company.primary_email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {company.website && (
                            <a href={company.website} target="_blank" rel="noopener noreferrer">
                              <Globe className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </a>
                          )}
                          {company.linkedin_url && (
                            <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.is_verified ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(company)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(company.id)}
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
              {editingCompany ? "Edit Company" : "Add Company"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Unilever Bangladesh"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g., FMCG, Banking, Tech"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook_url">Facebook URL</Label>
                <Input
                  id="facebook_url"
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_email">Primary Email</Label>
              <Input
                id="primary_email"
                type="email"
                value={formData.primary_email}
                onChange={(e) => setFormData({ ...formData, primary_email: e.target.value })}
                placeholder="hr@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Emails</Label>
              <div className="flex gap-2">
                <Input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Add another email..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                />
                <Button type="button" variant="outline" onClick={handleAddEmail}>
                  Add
                </Button>
              </div>
              {formData.secondary_emails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.secondary_emails.map((email) => (
                    <Badge key={email} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveEmail(email)}>
                      {email} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes about this company..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_verified"
                checked={formData.is_verified}
                onCheckedChange={(checked) => setFormData({ ...formData, is_verified: checked })}
              />
              <Label htmlFor="is_verified">Verified Employer</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingCompany ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Import Dialog */}
      <BatchCompanyUpload
        open={showBatchUpload}
        onOpenChange={setShowBatchUpload}
        onComplete={loadCompanies}
      />
    </div>
  );
}
