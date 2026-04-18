import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Headphones,
  Eye,
  Pencil,
  Mic,
  ExternalLink,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  { value: "listening", label: "Listening", icon: Headphones, color: "text-blue-500", bgColor: "bg-blue-50" },
  { value: "reading", label: "Reading", icon: Eye, color: "text-green-500", bgColor: "bg-green-50" },
  { value: "writing", label: "Writing", icon: Pencil, color: "text-orange-500", bgColor: "bg-orange-50" },
  { value: "speaking", label: "Speaking", icon: Mic, color: "text-purple-500", bgColor: "bg-purple-50" },
];

const emptyResource = {
  section: "listening",
  title: "",
  description: "",
  content_type: "article",
  content_url: "",
  content_data: null,
  duration_mins: 0 as number | null,
  difficulty_level: "intermediate",
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
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("ielts_resources")
        .select("*")
        .order("section")
        .order("display_order", { ascending: true });

      if (queryError) throw queryError;
      setResources(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
      toast.error("Resource Sync Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const filteredResources = resources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = sectionFilter === "all" || r.section === sectionFilter;
    return matchesSearch && matchesSection;
  });

  const handleOpenDialog = (resource?: IELTSResource) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        ...resource,
        description: resource.description || "",
        content_url: resource.content_url || "",
        difficulty_level: resource.difficulty_level || "intermediate",
      });
    } else {
      setEditingResource(null);
      setFormData(emptyResource);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        duration_mins: formData.duration_mins ? Number(formData.duration_mins) : null,
      };

      const { error: saveError } = editingResource
        ? await supabase.from("ielts_resources").update(payload).eq("id", editingResource.id)
        : await supabase.from("ielts_resources").insert([payload]);

      if (saveError) throw saveError;
      toast.success(editingResource ? "Resource Updated" : "Resource Created");
      setIsDialogOpen(false);
      loadResources();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (resource: IELTSResource) => {
    const { error } = await supabase
      .from("ielts_resources")
      .update({ is_active: !resource.is_active })
      .eq("id", resource.id);
    if (!error) {
      toast.success(`Status set to ${!resource.is_active ? "Active" : "Inactive"}`);
      loadResources();
    }
  };

  if (loading) return <DashboardTableSkeleton rows={8} columns={6} />;
  if (error) return <DashboardErrorState title="Sync Error" message={error} onRetry={loadResources} />;

  return (
    <Card className="shadow-sm border-muted">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2 font-bold">
              <BookOpen className="h-5 w-5 text-primary" />
              IELTS Curriculum Manager
            </CardTitle>
            <div className="flex flex-wrap gap-4 mt-2">
              {SECTIONS.map((s) => (
                <div
                  key={s.value}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
                >
                  <s.icon className={cn("h-3 w-3", s.color)} />
                  {s.label}: {resources.filter((r) => r.section === s.value).length}
                </div>
              ))}
            </div>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()} className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> New Resource
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 bg-muted/20 p-3 rounded-lg border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Global Catalog</SelectItem>
              {SECTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-muted bg-background overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[100px]">Section</TableHead>
                <TableHead>Resource Details</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Free</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/10">
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[10px] font-bold tracking-tight">
                      {r.section}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm">{r.title}</div>
                    <div className="text-[10px] text-muted-foreground uppercase flex gap-2">
                      <span>Order: {r.display_order}</span>
                      {r.duration_mins && <span>• {r.duration_mins} mins</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-muted text-muted-foreground border-none text-[10px] uppercase">
                      {r.content_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.is_free ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">YES</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground opacity-30">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleActive(r)}
                      className="transition-transform active:scale-90"
                      title="Click to toggle status"
                    >
                      {r.is_active ? "🟢" : "🔴"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(r)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingResource ? "Edit Resource" : "Create Curriculum Item"}
            </DialogTitle>
            <DialogDescription>Define the metadata for this IELTS practice asset.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Target Section</Label>
                <Select value={formData.section} onValueChange={(v) => setFormData((p) => ({ ...p, section: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Resource Title</Label>
                <Input value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Content Link (URL)</Label>
                <Input
                  value={formData.content_url}
                  onChange={(e) => setFormData((p) => ({ ...p, content_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(v) => setFormData((p) => ({ ...p, content_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Duration (Min)</Label>
                  <Input
                    type="number"
                    value={formData.duration_mins || 0}
                    onChange={(e) => setFormData((p) => ({ ...p, duration_mins: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData((p) => ({ ...p, display_order: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10 mt-6">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_free}
                    onCheckedChange={(v) => setFormData((p) => ({ ...p, is_free: v }))}
                  />
                  <Label className="font-bold">Public/Free</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData((p) => ({ ...p, is_active: v }))}
                  />
                  <Label className="font-bold">Published</Label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the resource from the platform immediately. Users who unlocked this may lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
