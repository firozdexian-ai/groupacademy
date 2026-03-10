import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Trophy,
  Calendar,
  Users,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface Competition {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  featured_image: string | null;
  start_date: string | null;
  end_date: string | null;
  submission_deadline: string | null;
  max_participants: number | null;
  prizes: { place: string; prize: string }[]; // Fixed type
  rules: string | null;
  status: string;
  is_featured: boolean;
  created_at: string;
}

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "judging", label: "Judging" },
  { value: "completed", label: "Completed" },
];

const CATEGORIES = ["Design", "Development", "Data Science", "Marketing", "Business", "Writing", "Other"];

const emptyCompetition = {
  title: "",
  slug: "",
  description: "",
  category: "",
  featured_image: "",
  start_date: "",
  end_date: "",
  submission_deadline: "",
  max_participants: null as number | null,
  prizes: [] as { place: string; prize: string }[],
  rules: "",
  status: "draft",
  is_featured: false,
};

const ITEMS_PER_PAGE = 10;

export function CompetitionsManager() {
  // Data State
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [formData, setFormData] = useState(emptyCompetition);
  const [saving, setSaving] = useState(false);
  const [prizeInput, setPrizeInput] = useState({ place: "", prize: "" });

  // Fetch Data (Paginated)
  const loadCompetitions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("competitions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Search Logic
      if (debouncedSearch) {
        query = query.ilike("title", `%${debouncedSearch}%`);
      }

      // Filter Logic
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading competitions timed out");

      if (result.error) throw result.error;
      setCompetitions((result.data as unknown as Competition[]) || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Error loading competitions:", err);
      setError(err.message || "Failed to load competitions");
      toast.error("Failed to load competitions");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadCompetitions();
  }, [loadCompetitions]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleOpenDialog = (competition?: Competition) => {
    if (competition) {
      setEditingCompetition(competition);
      setFormData({
        title: competition.title,
        slug: competition.slug,
        description: competition.description || "",
        category: competition.category || "",
        featured_image: competition.featured_image || "",
        start_date: competition.start_date ? competition.start_date.split("T")[0] : "",
        end_date: competition.end_date ? competition.end_date.split("T")[0] : "",
        submission_deadline: competition.submission_deadline ? competition.submission_deadline.split("T")[0] : "",
        max_participants: competition.max_participants,
        prizes: Array.isArray(competition.prizes) ? competition.prizes : [],
        rules: competition.rules || "",
        status: competition.status,
        is_featured: competition.is_featured,
      });
    } else {
      setEditingCompetition(null);
      setFormData(emptyCompetition);
    }
    setIsDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingCompetition ? prev.slug : generateSlug(title),
    }));
  };

  const handleAddPrize = () => {
    if (prizeInput.place.trim() && prizeInput.prize.trim()) {
      setFormData((prev) => ({
        ...prev,
        prizes: [...prev.prizes, { place: prizeInput.place.trim(), prize: prizeInput.prize.trim() }],
      }));
      setPrizeInput({ place: "", prize: "" });
    }
  };

  const handleRemovePrize = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      prizes: prev.prizes.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const competitionData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        description: formData.description?.trim() || null,
        category: formData.category || null,
        featured_image: formData.featured_image?.trim() || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        submission_deadline: formData.submission_deadline || null,
        max_participants: formData.max_participants,
        prizes: formData.prizes.length > 0 ? formData.prizes : null,
        rules: formData.rules?.trim() || null,
        status: formData.status,
        is_featured: formData.is_featured,
      };

      if (editingCompetition) {
        const { error } = await supabase.from("competitions").update(competitionData).eq("id", editingCompetition.id);
        if (error) throw error;
        toast.success("Competition updated successfully");
      } else {
        const { error } = await supabase.from("competitions").insert(competitionData);
        if (error) throw error;
        toast.success("Competition created successfully");
      }

      setIsDialogOpen(false);
      loadCompetitions();
    } catch (error: any) {
      console.error("Error saving competition:", error);
      toast.error(error.message?.includes("duplicate") ? "Slug already exists" : "Failed to save competition");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this competition?")) return;
    try {
      const { error } = await supabase.from("competitions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Competition deleted successfully");
      loadCompetitions();
    } catch (error) {
      toast.error("Failed to delete competition");
    }
  };

  const handleStatusChange = async (competition: Competition, newStatus: string) => {
    try {
      const { error } = await supabase.from("competitions").update({ status: newStatus }).eq("id", competition.id);
      if (error) throw error;
      toast.success(`Status changed to ${newStatus}`);
      loadCompetitions(); // Ideally optimistic update
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "upcoming":
        return "secondary";
      case "judging":
        return "outline";
      case "completed":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Competitions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Total {totalCount} competitions found</p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="sm">
            <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Add Competition</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search competitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <DashboardTableSkeleton rows={5} columns={6} />
        ) : error ? (
          <DashboardErrorState title="Error" message={error} onRetry={loadCompetitions} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competition</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No competitions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    competitions.map((comp) => (
                      <TableRow key={comp.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{comp.title}</p>
                            <p className="text-sm text-muted-foreground">{comp.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell>{comp.category ? <Badge variant="outline">{comp.category}</Badge> : "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {comp.start_date && (
                              <p className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(comp.start_date), "MMM d, yyyy")}
                              </p>
                            )}
                            {comp.submission_deadline && (
                              <p className="text-muted-foreground text-xs mt-1">
                                Deadline: {format(new Date(comp.submission_deadline), "MMM d")}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <Select value={comp.status} onValueChange={(v) => handleStatusChange(comp, v)}>
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <Badge
                                  variant={getStatusColor(comp.status)}
                                  className="capitalize w-full justify-center"
                                >
                                  {comp.status}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {comp.is_featured && (
                              <Badge variant="outline" className="text-[10px]">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(comp)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(comp.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-2">
              {competitions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No competitions found</p>
              ) : (
                competitions.map((comp) => (
                  <div key={comp.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm line-clamp-1">{comp.title}</p>
                        {comp.start_date && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(comp.start_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(comp)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(comp.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {comp.category && <Badge variant="outline" className="text-xs">{comp.category}</Badge>}
                      <Badge variant={getStatusColor(comp.status)} className="text-xs capitalize">{comp.status}</Badge>
                      {comp.is_featured && <Badge variant="outline" className="text-[10px]">Featured</Badge>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompetition ? "Edit Competition" : "Add New Competition"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., UI/UX Design Challenge 2025"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="ui-ux-design-challenge-2025"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Competition description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Featured Image URL</Label>
              <Input
                value={formData.featured_image}
                onChange={(e) => setFormData((prev) => ({ ...prev, featured_image: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Submission Deadline</Label>
                <Input
                  type="date"
                  value={formData.submission_deadline}
                  onChange={(e) => setFormData((prev) => ({ ...prev, submission_deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Participants</Label>
                <Input
                  type="number"
                  value={formData.max_participants || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_participants: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prizes</Label>
              <div className="flex gap-2">
                <Input
                  value={prizeInput.place}
                  onChange={(e) => setPrizeInput((prev) => ({ ...prev, place: e.target.value }))}
                  placeholder="e.g., 1st Place"
                  className="flex-1"
                />
                <Input
                  value={prizeInput.prize}
                  onChange={(e) => setPrizeInput((prev) => ({ ...prev, prize: e.target.value }))}
                  placeholder="e.g., $500"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleAddPrize}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.prizes.map((prize, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => handleRemovePrize(i)}>
                    {prize.place}: {prize.prize} ✕
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rules</Label>
              <Textarea
                value={formData.rules}
                onChange={(e) => setFormData((prev) => ({ ...prev, rules: e.target.value }))}
                placeholder="Competition rules and guidelines"
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_featured: v }))}
              />
              <Label>Featured Competition</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingCompetition ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
