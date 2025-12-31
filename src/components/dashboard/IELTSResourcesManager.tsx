import { useEffect, useState } from "react";
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
import { Plus, Search, Edit, Trash2, BookOpen, Headphones, Eye, Pencil, Mic, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface IELTSResource {
  id: string;
  section: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  content_data: any;
  duration_mins: number | null;
  difficulty_level: string | null;
  is_free: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const SECTIONS = [
  { value: "listening", label: "Listening", icon: Headphones, color: "text-blue-500" },
  { value: "reading", label: "Reading", icon: Eye, color: "text-green-500" },
  { value: "writing", label: "Writing", icon: Pencil, color: "text-orange-500" },
  { value: "speaking", label: "Speaking", icon: Mic, color: "text-purple-500" },
];

const CONTENT_TYPES = [
  { value: "video", label: "Video" },
  { value: "article", label: "Article" },
  { value: "practice_test", label: "Practice Test" },
  { value: "audio", label: "Audio" },
  { value: "pdf", label: "PDF" },
];

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const emptyResource = {
  section: "",
  title: "",
  description: "",
  content_type: "",
  content_url: "",
  content_data: null,
  duration_mins: null as number | null,
  difficulty_level: "",
  is_free: false,
  display_order: 0,
  is_active: true,
};

export function IELTSResourcesManager() {
  const [resources, setResources] = useState<IELTSResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<IELTSResource | null>(null);
  const [formData, setFormData] = useState(emptyResource);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("ielts_resources")
            .select("*")
            .order("section")
            .order("display_order")
        ).then(q => q),
        TIMEOUTS.DEFAULT,
        "Loading resources timed out"
      );

      if (queryError) throw queryError;
      setResources(data || []);
    } catch (err: any) {
      console.error("Error loading resources:", err);
      setError(err.message || "Failed to load resources");
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSection = sectionFilter === "all" || resource.section === sectionFilter;
    return matchesSearch && matchesSection;
  });

  const handleOpenDialog = (resource?: IELTSResource) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        section: resource.section,
        title: resource.title,
        description: resource.description || "",
        content_type: resource.content_type,
        content_url: resource.content_url || "",
        content_data: resource.content_data,
        duration_mins: resource.duration_mins,
        difficulty_level: resource.difficulty_level || "",
        is_free: resource.is_free,
        display_order: resource.display_order,
        is_active: resource.is_active,
      });
    } else {
      setEditingResource(null);
      setFormData(emptyResource);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.section || !formData.title.trim() || !formData.content_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const resourceData = {
        section: formData.section,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        content_type: formData.content_type,
        content_url: formData.content_url?.trim() || null,
        content_data: formData.content_data,
        duration_mins: formData.duration_mins,
        difficulty_level: formData.difficulty_level || null,
        is_free: formData.is_free,
        display_order: formData.display_order,
        is_active: formData.is_active,
      };

      if (editingResource) {
        const { error } = await withTimeout(
          Promise.resolve(supabase
            .from("ielts_resources")
            .update(resourceData)
            .eq("id", editingResource.id)),
          TIMEOUTS.DEFAULT,
          "Update timed out"
        );
        if (error) throw error;
        toast.success("Resource updated successfully");
      } else {
        const { error } = await withTimeout(
          Promise.resolve(supabase.from("ielts_resources").insert(resourceData)),
          TIMEOUTS.DEFAULT,
          "Insert timed out"
        );
        if (error) throw error;
        toast.success("Resource created successfully");
      }

      setIsDialogOpen(false);
      loadResources();
    } catch (error: any) {
      console.error("Error saving resource:", error);
      toast.error("Failed to save resource");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("ielts_resources").delete().eq("id", id)),
        TIMEOUTS.DEFAULT,
        "Delete timed out"
      );
      if (error) throw error;
      toast.success("Resource deleted successfully");
      loadResources();
    } catch (error: any) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  const handleToggleActive = async (resource: IELTSResource) => {
    try {
      const { error } = await withTimeout(
        Promise.resolve(supabase
          .from("ielts_resources")
          .update({ is_active: !resource.is_active })
          .eq("id", resource.id)),
        TIMEOUTS.DEFAULT,
        "Update timed out"
      );
      if (error) throw error;
      toast.success(resource.is_active ? "Resource deactivated" : "Resource activated");
      loadResources();
    } catch (error: any) {
      console.error("Error toggling resource:", error);
      toast.error("Failed to update resource");
    }
  };

  const getSectionIcon = (section: string) => {
    const sectionData = SECTIONS.find(s => s.value === section);
    if (!sectionData) return <BookOpen className="h-4 w-4" />;
    const Icon = sectionData.icon;
    return <Icon className={`h-4 w-4 ${sectionData.color}`} />;
  };

  const getSectionStats = (section: string) => {
    const sectionResources = resources.filter(r => r.section === section);
    return {
      total: sectionResources.length,
      free: sectionResources.filter(r => r.is_free).length,
    };
  };

  if (loading) {
    return <DashboardTableSkeleton rows={5} columns={6} />;
  }

  if (error) {
    return <DashboardErrorState title="Failed to load resources" message={error} onRetry={loadResources} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              IELTS Resources
            </CardTitle>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              {SECTIONS.map(section => {
                const stats = getSectionStats(section.value);
                return (
                  <span key={section.value} className="flex items-center gap-1">
                    <section.icon className={`h-3 w-3 ${section.color}`} />
                    {section.label}: {stats.total} ({stats.free} free)
                  </span>
                );
              })}
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {SECTIONS.map(section => (
                <SelectItem key={section.value} value={section.value}>
                  {section.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No resources found
                  </TableCell>
                </TableRow>
              ) : (
                filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSectionIcon(resource.section)}
                        <span className="capitalize">{resource.section}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{resource.title}</p>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{resource.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {resource.content_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {resource.duration_mins ? `${resource.duration_mins} mins` : "-"}
                    </TableCell>
                    <TableCell>
                      {resource.difficulty_level ? (
                        <Badge variant="secondary" className="capitalize">
                          {resource.difficulty_level}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={resource.is_active ? "default" : "secondary"}>
                          {resource.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {resource.is_free && (
                          <Badge variant="outline" className="text-xs text-green-600">Free</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {resource.content_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={resource.content_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(resource)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleActive(resource)}>
                          {resource.is_active ? "🔴" : "🟢"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
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
      </CardContent>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? "Edit Resource" : "Add New Resource"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section *</Label>
                <Select value={formData.section} onValueChange={(v) => setFormData(prev => ({ ...prev, section: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map(section => (
                      <SelectItem key={section.value} value={section.value}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content Type *</Label>
                <Select value={formData.content_type} onValueChange={(v) => setFormData(prev => ({ ...prev, content_type: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Listening Practice Test 1"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the resource"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Content URL</Label>
              <Input
                value={formData.content_url}
                onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_mins || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_mins: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="e.g., 30"
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select value={formData.difficulty_level} onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty_level: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_free}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_free: v }))}
                />
                <Label>Free Resource</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingResource ? "Update Resource" : "Create Resource"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
