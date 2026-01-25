import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Search,
  Users,
  MessageSquare,
  Download,
  ExternalLink,
  RefreshCw,
  Eye,
  Loader2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Hand,
  Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BatchTalentUpload } from "./BatchTalentUpload";

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface Talent {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profession_category_id: string | null;
  custom_profession: string | null;
  cv_url: string | null;
  cv_text: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  services_used: string[]; // Fixed type
  created_at: string;
  updated_at: string;
  welcome_sent_at: string | null; // Track when welcome message was sent
}

interface ProfessionCategory {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 10;

export function TalentPoolManager() {
  // Data State
  const [talents, setTalents] = useState<Talent[]>([]);
  const [professionCategories, setProfessionCategories] = useState<ProfessionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // UI State
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [portfolioNotes, setPortfolioNotes] = useState("");
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [portfolioTalent, setPortfolioTalent] = useState<Talent | null>(null);

  // Fetch Data (Paginated)
  const loadTalents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase.from("talents").select("*", { count: "exact" }).order("updated_at", { ascending: false });

      // Search Logic
      if (debouncedSearch) {
        query = query.or(
          `full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%,custom_profession.ilike.%${debouncedSearch}%`,
        );
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading talent pool timed out");

      if (result.error) throw result.error;

      setTalents((result.data as unknown as Talent[]) || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Error loading talents:", err);
      setError(err.message || "Failed to load talent pool");
      toast.error("Failed to load talent pool");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  const loadProfessionCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("profession_categories").select("id, name").eq("is_active", true);

      if (error) throw error;
      setProfessionCategories(data || []);
    } catch (err: any) {
      console.error("Error loading profession categories:", err);
      // Don't show toast here to avoid spamming user if background load fails
    }
  }, []);

  useEffect(() => {
    loadTalents();
    loadProfessionCategories();
  }, [loadTalents, loadProfessionCategories]);

  // Reset page on search
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const getProfessionName = (categoryId: string | null, customProfession: string | null) => {
    if (customProfession) return customProfession;
    if (!categoryId) return "Not set";
    const category = professionCategories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const handleCreatePortfolioRequest = async () => {
    if (!portfolioTalent) return;

    setCreatingPortfolio(true);
    try {
      const { error } = await withTimeout(
        Promise.resolve(
          supabase.from("portfolio_requests").insert({
            full_name: portfolioTalent.full_name,
            email: portfolioTalent.email,
            phone: portfolioTalent.phone || "",
            profession_category_id: portfolioTalent.profession_category_id,
            cv_url: portfolioTalent.cv_url,
            additional_notes: portfolioNotes || `Created from Talent Pool on ${new Date().toLocaleDateString()}`,
            status: "pending",
          }),
        ),
        TIMEOUTS.DEFAULT,
        "Insert timed out",
      );

      if (error) throw error;

      toast.success("Portfolio request created!", {
        description: "View it in the Portfolio Requests tab.",
        action: {
          label: "View",
          onClick: () => {
            window.location.href = "/dashboard?tab=portfolios";
          },
        },
      });

      setPortfolioDialogOpen(false);
      setPortfolioNotes("");
      setPortfolioTalent(null);
    } catch (error: any) {
      console.error("Error creating portfolio request:", error);
      toast.error("Failed to create portfolio request");
    } finally {
      setCreatingPortfolio(false);
    }
  };

  const openPortfolioDialog = (talent: Talent) => {
    setPortfolioTalent(talent);
    setPortfolioNotes("");
    setPortfolioDialogOpen(true);
  };

  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
    if (cleaned.startsWith("880")) {
      return `https://wa.me/${cleaned}`;
    } else if (cleaned.startsWith("0")) {
      return `https://wa.me/880${cleaned.slice(1)}`;
    } else if (cleaned.length === 10) {
      return `https://wa.me/880${cleaned}`;
    }
    return `https://wa.me/${cleaned}`;
  };

  // Helper to extract actual first name, skipping common prefixes
  const getFirstName = (fullName: string): string => {
    const prefixes = ['md.', 'md', 'mst.', 'mst', 'dr.', 'dr', 'engr.', 'engr', 'prof.', 'prof', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms'];
    const parts = fullName.trim().split(/\s+/);
    if (parts.length > 1 && prefixes.includes(parts[0].toLowerCase())) {
      return parts[1];
    }
    return parts[0];
  };

  const formatWelcomeWhatsAppLink = (phone: string | null, name: string) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
    if (cleaned.startsWith("880")) {
      // already formatted
    } else if (cleaned.startsWith("0")) {
      cleaned = `880${cleaned.slice(1)}`;
    } else if (cleaned.length === 10) {
      cleaned = `880${cleaned}`;
    }
    
    const message = encodeURIComponent(
      `Hi ${name}! 👋\n\n` +
      `We're so glad to see you sign up with GroUp Academy!\n\n` +
      `We're building an AI-powered career platform designed specifically for Bangladesh's job market — and you're now part of it.\n\n` +
      `Feel free to knock us if you face any difficulties or have questions.\n\n` +
      `Best regards,\n` +
      `GroUp Academy Team`
    );
    
    return `https://wa.me/${cleaned}?text=${message}`;
  };

  const exportToCSV = () => {
    // Note: This currently exports only the visible page.
    // Ideally, this should trigger a backend function to generate a full CSV URL.
    const headers = ["Name", "Email", "Phone", "Category", "Services Used", "Created At"];
    const rows = talents.map((t) => [
      t.full_name,
      t.email,
      t.phone || "",
      getProfessionName(t.profession_category_id, t.custom_profession),
      t.services_used?.join("; ") || "",
      new Date(t.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `talent-pool-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully (Current Page)");
  };

  const getServiceBadges = (servicesUsed: string[]) => {
    if (!servicesUsed || servicesUsed.length === 0) return null;
    return servicesUsed.map((service: string, idx: number) => (
      <Badge key={idx} variant="outline" className="text-xs">
        {service?.replace("_", " ") || "Unknown"}
      </Badge>
    ));
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <BatchTalentUpload onComplete={loadTalents} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Talent Pool
              </CardTitle>
              <CardDescription>{totalCount} talents in the database</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadTalents} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or profession..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <DashboardTableSkeleton rows={5} columns={6} />
          ) : error ? (
            <DashboardErrorState title="Failed to load talent pool" message={error} onRetry={loadTalents} />
          ) : talents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No talents found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Profession</TableHead>
                      <TableHead>Services Used</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {talents.map((talent) => (
                      <TableRow key={talent.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{talent.full_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{talent.email}</p>
                            <p className="text-muted-foreground">{talent.phone || "No phone"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getProfessionName(talent.profession_category_id, talent.custom_profession)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getServiceBadges(talent.services_used) || (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(talent.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPortfolioDialog(talent)}
                              title="Create Portfolio Request"
                            >
                              <Briefcase className="w-4 h-4" />
                            </Button>
                            {talent.phone && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(formatWhatsAppLink(talent.phone), "_blank")}
                                  className="text-green-600 hover:text-green-700"
                                  title="Open WhatsApp"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </Button>
                                {talent.welcome_sent_at ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled
                                    className="text-green-600"
                                    title={`Welcome sent on ${new Date(talent.welcome_sent_at).toLocaleDateString()}`}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      // Update database first
                                      const { error } = await supabase
                                        .from('talents')
                                        .update({ welcome_sent_at: new Date().toISOString() })
                                        .eq('id', talent.id);
                                      
                                      if (error) {
                                        toast.error("Failed to track message");
                                      } else {
                                        // Open WhatsApp
                                        const link = formatWelcomeWhatsAppLink(talent.phone, getFirstName(talent.full_name));
                                        if (link) window.open(link, "_blank");
                                        // Refresh list
                                        loadTalents();
                                      }
                                    }}
                                    className="text-blue-600 hover:text-blue-700"
                                    title="Send Welcome Message"
                                  >
                                    <Hand className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedTalent(talent)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{talent.full_name}</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-[60vh]">
                                  <div className="space-y-4 p-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p>{talent.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p>{talent.phone || "N/A"}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Profession</p>
                                        <p>
                                          {getProfessionName(talent.profession_category_id, talent.custom_profession)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">CV</p>
                                        {talent.cv_url ? (
                                          <a
                                            href={talent.cv_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                          >
                                            View CV
                                          </a>
                                        ) : talent.cv_text ? (
                                          <p className="text-sm truncate max-w-xs">Has CV text</p>
                                        ) : (
                                          <p className="text-muted-foreground">N/A</p>
                                        )}
                                      </div>
                                    </div>

                                    {talent.services_used?.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium mb-2">Services Used</p>
                                        <div className="flex flex-wrap gap-1">
                                          {talent.services_used.map((service: string, idx: number) => (
                                            <Badge key={idx} variant="outline">
                                              {service?.replace("_", " ")}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex gap-2 pt-4 border-t">
                                      {talent.linkedin_url && (
                                        <Button variant="outline" size="sm" asChild>
                                          <a href={talent.linkedin_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            LinkedIn
                                          </a>
                                        </Button>
                                      )}
                                      {talent.portfolio_url && (
                                        <Button variant="outline" size="sm" asChild>
                                          <a href={talent.portfolio_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Portfolio
                                          </a>
                                        </Button>
                                      )}
                                      {talent.cv_url && (
                                        <Button variant="outline" size="sm" asChild>
                                          <a href={talent.cv_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            CV
                                          </a>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Request Dialog */}
      <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Portfolio Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {portfolioTalent && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p>
                  <strong>Name:</strong> {portfolioTalent.full_name}
                </p>
                <p>
                  <strong>Email:</strong> {portfolioTalent.email}
                </p>
                <p>
                  <strong>Phone:</strong> {portfolioTalent.phone || "N/A"}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={portfolioNotes}
                onChange={(e) => setPortfolioNotes(e.target.value)}
                placeholder="Add any notes for this portfolio request..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPortfolioDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePortfolioRequest} disabled={creatingPortfolio}>
              {creatingPortfolio ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
