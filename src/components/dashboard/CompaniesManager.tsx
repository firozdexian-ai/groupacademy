import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  Mail,
  Loader2,
  RefreshCw,
  CheckCircle,
  Globe,
  Linkedin,
  Upload,
  ChevronLeft,
  ChevronRight,
  Send,
  Briefcase,
  ShieldCheck,
  PhoneOff,
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { BatchCompanyUpload } from "./BatchCompanyUpload";
import { getDexianEmailLink, EMAIL_TEMPLATE_OPTIONS, DexianEmailTemplate } from "@/lib/companyOutreachTemplates";

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  website: string | null;
  primary_email: string | null;
  secondary_emails: string[];
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

const ITEMS_PER_PAGE = 10;

export function CompaniesManager() {
  const [, setSearchParams] = useSearchParams();
  // Data State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [outreachHistory, setOutreachHistory] = useState<Record<string, { last_sent: string; template: string } | null>>({});

  // Pagination & Search & Filter State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [industryFilter, setIndustryFilter] = useState("all");
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);

  // Modal & Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState(emptyCompany);
  const [saving, setSaving] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DexianEmailTemplate>('discovery');

  // Delete AlertDialog state
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  // KPI State
  const [kpiVerified, setKpiVerified] = useState(0);
  const [kpiNeverContacted, setKpiNeverContacted] = useState(0);

  // Fetch Data
  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      let query = supabase.from("companies").select("*", { count: "exact" }).order("name");

      if (debouncedSearch) {
        query = query.or(
          `name.ilike.%${debouncedSearch}%,industry.ilike.%${debouncedSearch}%,primary_email.ilike.%${debouncedSearch}%`,
        );
      }

      if (industryFilter === "none") {
        query = query.is("industry", null);
      } else if (industryFilter !== "all") {
        query = query.eq("industry", industryFilter);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading companies timed out");

      if (result.error) throw result.error;

      const mappedCompanies: Company[] = (result.data || []).map((company) => ({
        ...company,
        secondary_emails: Array.isArray(company.secondary_emails)
          ? (company.secondary_emails as string[])
          : [],
      }));
      setCompanies(mappedCompanies);
      setTotalCount(result.count || 0);
    } catch (error: any) {
      console.error("Error loading companies:", error);
      setLoadError(error.message || "Failed to load companies");
      toast.error("Failed to load companies");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, industryFilter]);

  // Load KPI counts once
  useEffect(() => {
    const loadKPIs = async () => {
      const [verifiedRes, outreachRes] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("is_verified", true),
        supabase.from("contact_outreach").select("company_id"),
      ]);
      setKpiVerified(verifiedRes.count || 0);
      const contactedIds = new Set((outreachRes.data || []).map((r: any) => r.company_id).filter(Boolean));
      // We'll compute never contacted from totalCount minus contacted
      // But totalCount changes with filters, so use a separate total query
      const totalRes = await supabase.from("companies").select("id", { count: "exact", head: true });
      setKpiNeverContacted((totalRes.count || 0) - contactedIds.size);
    };
    loadKPIs();
  }, []);

  // Load outreach history for displayed companies
  const loadOutreachHistory = useCallback(async (companyIds: string[]) => {
    if (companyIds.length === 0) return;

    try {
      const { data } = await supabase
        .from("contact_outreach")
        .select("company_id, sent_at, message_type")
        .in("company_id", companyIds)
        .order("sent_at", { ascending: false });

      const historyMap: Record<string, { last_sent: string; template: string } | null> = {};
      data?.forEach((record) => {
        if (record.company_id && !historyMap[record.company_id]) {
          historyMap[record.company_id] = {
            last_sent: record.sent_at,
            template: record.message_type || 'unknown',
          };
        }
      });
      setOutreachHistory(historyMap);
    } catch (error) {
      console.error("Error loading outreach history:", error);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    if (companies.length > 0) {
      loadOutreachHistory(companies.map((c) => c.id));
    }
  }, [companies, loadOutreachHistory]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, industryFilter]);

  // Load industry options once
  useEffect(() => {
    const loadIndustryOptions = async () => {
      const { data } = await supabase.from("companies").select("industry");
      const unique = [...new Set((data || []).map((c: any) => c.industry?.trim()).filter(Boolean))] as string[];
      unique.sort((a, b) => a.localeCompare(b));
      setIndustryOptions(unique);
    };
    loadIndustryOptions();
  }, []);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
          Promise.resolve(supabase.from("companies").update(companyData).eq("id", editingCompany.id)),
          TIMEOUTS.DEFAULT,
          "Update timed out",
        );
        if (error) throw error;
        toast.success("Company updated");
      } else {
        const { error } = await withTimeout(
          Promise.resolve(supabase.from("companies").insert(companyData)),
          TIMEOUTS.DEFAULT,
          "Insert timed out",
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);

    try {
      const { error: unlinkError } = await withTimeout(
        Promise.resolve(supabase.from("jobs").update({ company_id: null }).eq("company_id", id)),
        TIMEOUTS.DEFAULT,
        "Unlink jobs timed out",
      );
      if (unlinkError) {
        console.warn("Could not unlink jobs:", unlinkError);
      }

      const { error } = await withTimeout(
        Promise.resolve(supabase.from("companies").delete().eq("id", id)),
        TIMEOUTS.DEFAULT,
        "Delete timed out",
      );
      if (error) throw error;
      toast.success("Company deleted successfully");

      if (companies.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        loadCompanies();
      }
    } catch (error: any) {
      console.error("Error deleting company:", error);
      if (error.message?.includes("foreign key") || error.message?.includes("violates")) {
        toast.error("Cannot delete: This company has linked records. Please contact support.");
      } else if (error.message?.includes("timed out")) {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error(error.message || "Failed to delete company");
      }
    }
  };

  const handleEmailOutreach = async (company: Company, template: DexianEmailTemplate) => {
    if (!company.primary_email) {
      toast.error("No email address available");
      return;
    }

    const mailtoLink = getDexianEmailLink(company.primary_email, template, company.name);
    window.open(mailtoLink, '_blank');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const templateLabel = EMAIL_TEMPLATE_OPTIONS.find(t => t.value === template)?.label || template;
        await supabase.from("contact_outreach").insert({
          company_id: company.id,
          channel: "email",
          message_type: template,
          message_content: `Dexian ${templateLabel} email to ${company.name}`,
          sent_by: user.id,
        });

        setOutreachHistory((prev) => ({
          ...prev,
          [company.id]: { last_sent: new Date().toISOString(), template },
        }));

        toast.success("Email opened & outreach logged");
      } else {
        toast.success("Email client opened");
      }
    } catch (error) {
      console.error("Error logging outreach:", error);
      toast.success("Email client opened (tracking failed)");
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  // Render a single company as a mobile card
  const renderCompanyCard = (company: Company) => (
    <div key={company.id} className="border rounded-lg p-3 space-y-2">
      {/* Row 1: Logo + Name + Industry */}
      <div className="flex items-center gap-3">
        {company.logo_url ? (
          <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{company.name}</p>
          <Badge variant="outline" className="text-[10px] mt-0.5">{company.industry || "N/A"}</Badge>
        </div>
        {company.is_verified && (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] flex-shrink-0">
            <CheckCircle className="w-3 h-3 mr-0.5" /> Verified
          </Badge>
        )}
      </div>

      {/* Row 2: Email + Outreach */}
      <div className="flex items-center justify-between gap-2 text-xs">
        {company.primary_email ? (
          <a href={`mailto:${company.primary_email}`} className="text-primary hover:underline flex items-center gap-1 truncate min-w-0">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{company.primary_email}</span>
          </a>
        ) : (
          <span className="text-muted-foreground">No email</span>
        )}
        {outreachHistory[company.id] ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] flex-shrink-0">
            {getRelativeTime(outreachHistory[company.id]!.last_sent)}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-[10px] flex-shrink-0">Never</Badge>
        )}
      </div>

      {/* Row 3: Action icons */}
      <div className="flex items-center gap-1 pt-1 border-t">
        <Select
          value={selectedTemplate}
          onValueChange={(val) => {
            setSelectedTemplate(val as DexianEmailTemplate);
            handleEmailOutreach(company, val as DexianEmailTemplate);
          }}
        >
          <SelectTrigger className="w-auto h-7 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 text-xs" disabled={!company.primary_email}>
            <Send className="w-3 h-3" />
          </SelectTrigger>
          <SelectContent>
            {EMAIL_TEMPLATE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {company.website && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
            <a href={company.website} target="_blank" rel="noopener noreferrer"><Globe className="w-3.5 h-3.5" /></a>
          </Button>
        )}
        {company.linkedin_url && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
            <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer"><Linkedin className="w-3.5 h-3.5" /></a>
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSearchParams({ tab: "jobs", company: company.id })}>
          <Briefcase className="w-3.5 h-3.5" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenDialog(company)}>
          <Edit className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(company)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10"><Building2 className="w-4 h-4 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{totalCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-green-100"><ShieldCheck className="w-4 h-4 text-green-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Verified</p>
              <p className="text-lg font-bold">{kpiVerified}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-orange-100"><PhoneOff className="w-4 h-4 text-orange-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">No Outreach</p>
              <p className="text-lg font-bold">{kpiNeverContacted}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5" />
                Companies
              </CardTitle>
              <CardDescription>{totalCount} total companies found</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadCompanies} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowBatchUpload(true)}>
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Batch Import</span>
              </Button>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Add Company</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, industry, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="none">No Industry</SelectItem>
                {industryOptions.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <DashboardTableSkeleton rows={5} columns={6} />
          ) : loadError ? (
            <DashboardErrorState title="Failed to load companies" message={loadError} onRetry={loadCompanies} />
          ) : companies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No companies found. Add your first employer!</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {companies.map(renderCompanyCard)}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Outreach</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {company.logo_url ? (
                              <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded object-cover" />
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
                          {outreachHistory[company.id] ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {getRelativeTime(outreachHistory[company.id]!.last_sent)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Never contacted
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.is_verified ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle className="w-3 h-3 mr-1" /> Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Select
                              value={selectedTemplate}
                              onValueChange={(val) => {
                                setSelectedTemplate(val as DexianEmailTemplate);
                                handleEmailOutreach(company, val as DexianEmailTemplate);
                              }}
                            >
                              <SelectTrigger className="w-auto h-8 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50" disabled={!company.primary_email}>
                                <Send className="w-3 h-3" />
                                <span className="text-xs">Email</span>
                              </SelectTrigger>
                              <SelectContent>
                                {EMAIL_TEMPLATE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    <span className="flex items-center gap-2">
                                      <span>{opt.icon}</span>
                                      <span>{opt.label}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {company.website && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" asChild>
                                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                                        <Globe className="w-4 h-4" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Website</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {company.linkedin_url && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" asChild>
                                      <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer">
                                        <Linkedin className="w-4 h-4" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>LinkedIn</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSearchParams({ tab: "jobs", company: company.id })}
                              title="View jobs for this company"
                            >
                              <Briefcase className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(company)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(company)}
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
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Previous</span>
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                  >
                    <span className="hidden sm:inline mr-1">Next</span>
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
            <DialogTitle>{editingCompany ? "Edit Company" : "Add Company"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <Badge
                      key={email}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveEmail(email)}
                    >
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

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Any jobs linked to this company will be unlinked first. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Import Dialog */}
      <BatchCompanyUpload open={showBatchUpload} onOpenChange={setShowBatchUpload} onComplete={loadCompanies} />
    </div>
  );
}
