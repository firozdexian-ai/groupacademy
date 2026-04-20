import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
  ExternalLink,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Intel Artifact Manager (Blog)
 * High-fidelity orchestrator for career insights and technical documentation.
 * 2026 Standard: Executive Logic geometry with reinforced storage handshakes.
 */

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  category: string | null;
  tags: string[] | null;
  author_name: string | null;
  status: string;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  external_url: string | null;
}

const CATEGORIES = [
  "Career Tips",
  "Industry Insights",
  "Interview Prep",
  "Resume Writing",
  "Study Abroad",
  "Tech Skills",
  "Professional Growth",
];

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// --- Sub-Component: Blog Post Form Node ---
const BlogPostForm = ({
  initialData,
  onSave,
  onCancel,
  saving,
}: {
  initialData: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) => {
  const [formData, setFormData] = useState(initialData);
  const [tagInput, setTagInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      const { error: uploadError } = await supabase.storage.from("blog-images").upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(fileName);
      setFormData((prev: any) => ({ ...prev, featured_image: publicUrl }));
      toast.success("Artifact Ingested: Image sync complete");
    } catch (error: any) {
      toast.error("Transmission Error: Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6 py-4 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Post Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: e.target.value,
                  slug: formData.id ? formData.slug : generateSlug(e.target.value),
                })
              }
              className="h-12 rounded-xl border-2 font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Summary Excerpt *</Label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="min-h-[100px] rounded-xl border-2 italic font-medium"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
              Featured Artifact (Image)
            </Label>
            <div className="flex gap-2">
              <Input
                value={formData.featured_image}
                onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                placeholder="URL or Upload..."
                className="h-12 rounded-xl border-2"
              />
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploadingImage}
                />
                <Button variant="outline" type="button" className="h-12 rounded-xl border-2" disabled={uploadingImage}>
                  {uploadingImage ? <Loader2 className="animate-spin" /> : <Upload />}
                </Button>
              </div>
            </div>
            {formData.featured_image && (
              <img
                src={formData.featured_image}
                className="h-24 w-full object-cover rounded-xl border-2 border-primary/20 mt-2"
                alt="Preview"
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Registry Category</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger className="h-11 rounded-xl border-2 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Logic Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger className="h-11 rounded-xl border-2 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft Protocol</SelectItem>
              <SelectItem value="published">Live Node</SelectItem>
              <SelectItem value="archived">Archived Logic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-3 pt-6 px-2">
          <Switch
            checked={formData.is_featured}
            onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
          />
          <Label className="text-[10px] font-black uppercase tracking-widest">Promoted Node</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Zap className="w-3 h-3" /> External Uplink (Optional)
        </Label>
        <Input
          value={formData.external_url}
          onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
          placeholder="https://..."
          className="h-11 rounded-xl border-2"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
          Content Synthesis (Markdown)
        </Label>
        <Tabs defaultValue="edit" className="w-full border-2 rounded-2xl overflow-hidden bg-muted/5">
          <TabsList className="bg-muted/50 rounded-none border-b-2">
            <TabsTrigger value="edit" className="text-[10px] font-black uppercase tracking-widest">
              Logic Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-[10px] font-black uppercase tracking-widest">
              Artifact Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="p-0">
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="min-h-[300px] border-0 rounded-none font-mono text-sm p-6 focus-visible:ring-0"
            />
          </TabsContent>
          <TabsContent
            value="preview"
            className="p-6 prose dark:prose-invert max-w-none bg-background/50 min-h-[300px]"
          >
            <ReactMarkdown>{formData.content || "_No content synthesized yet._"}</ReactMarkdown>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t-2">
        <Button variant="ghost" onClick={onCancel} className="font-black uppercase text-[10px] tracking-widest">
          Abort
        </Button>
        <Button
          onClick={() => onSave(formData)}
          disabled={saving}
          className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
        >
          {saving ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
          {initialData.id ? "Update Registry" : "Authorize Creation"}
        </Button>
      </div>
    </div>
  );
};

// --- Main Blog Manager Node ---
export function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("blog_posts").select("*", { count: "exact" }).order("created_at", { ascending: false });
      if (debouncedSearch) {
        const safe = sanitizeIlike(debouncedSearch);
        if (safe) query = query.or(`title.ilike.%${safe}%,author_name.ilike.%${safe}%`);
      }
      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Registry link timeout");
      if (result.error) throw result.error;
      setPosts((result.data as any) || []);
      setTotalCount(result.count || 0);
    } catch (err) {
      toast.error("Handshake Failed: Could not sync registry");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSave = async (formData: any) => {
    if (!formData.title.trim() || !formData.slug.trim()) return toast.error("Logic Fault: Required parameters missing");
    setSaving(true);
    try {
      const words = (formData.content || "").trim().split(/\s+/).length;
      const readingTime = Math.ceil(words / 200);

      const postData = {
        ...formData,
        reading_time_mins: readingTime,
        published_at:
          formData.status === "published" && !editingPost?.published_at
            ? new Date().toISOString()
            : editingPost?.published_at,
        tags: formData.tags?.length ? formData.tags : null,
      };

      const { error } = editingPost
        ? await supabase.from("blog_posts").update(postData).eq("id", editingPost.id)
        : await supabase.from("blog_posts").insert(postData);

      if (error) throw error;
      toast.success("Registry Synchronized");
      setIsDialogOpen(false);
      loadPosts();
    } catch (error: any) {
      toast.error(error.message?.includes("duplicate") ? "Slug Conflict: Handle already exists" : "Transmission Error");
    } finally {
      setSaving(false);
    }
  };

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Card className="rounded-[32px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
      <CardHeader className="p-8 border-b-2 border-border/10 bg-muted/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" /> Intel Registry
            </CardTitle>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
              Authorized Insights: {totalCount} Artifacts Detected
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingPost(null);
              setIsDialogOpen(true);
            }}
            className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2" /> Initialize New Artifact
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Query artifact by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-2 bg-card/50 font-bold"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Global View</SelectItem>
              <SelectItem value="published">Live Protocols</SelectItem>
              <SelectItem value="draft">Draft Sequences</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <DashboardTableSkeleton rows={5} columns={6} />
        ) : (
          <div className="rounded-[24px] border-2 border-border/20 overflow-hidden bg-background/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Artifact Spec</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Logic Class</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Authority</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} className="group transition-all hover:bg-primary/[0.02]">
                    <TableCell className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl border-2 overflow-hidden bg-muted flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors">
                          {post.featured_image ? (
                            <img src={post.featured_image} className="object-cover h-full w-full" />
                          ) : (
                            <ImageIcon className="h-5 w-5 opacity-20" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-sm uppercase tracking-tight italic line-clamp-1 group-hover:text-primary transition-colors">
                            {post.title}
                          </p>
                          {post.published_at && (
                            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                              Synced: {format(new Date(post.published_at), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-lg border-2 font-black text-[9px] uppercase tracking-widest bg-background"
                      >
                        {post.category || "UNCLASSED"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-[11px] font-bold uppercase italic text-muted-foreground/60">
                        {post.author_name || "System"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-lg font-black text-[8px] uppercase tracking-[0.2em] border-none px-3",
                          post.status === "published"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all"
                          onClick={() => {
                            setEditingPost(post);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                          onClick={() => {
                            /* Delete logic */
                          }}
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
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 mt-8">
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                {editingPost ? "Recalibrate Artifact" : "Initialize New Artifact"}
              </DialogTitle>
            </DialogHeader>
            <BlogPostForm
              initialData={
                editingPost || {
                  title: "",
                  slug: "",
                  excerpt: "",
                  content: "",
                  featured_image: "",
                  category: "Career Tips",
                  tags: [],
                  author_name: "",
                  status: "draft",
                  is_featured: false,
                  external_url: "",
                }
              }
              onSave={handleSave}
              onCancel={() => setIsDialogOpen(false)}
              saving={saving}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
