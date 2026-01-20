import { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Eye,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown"; // Ensure you have this, otherwise remove the preview component

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

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
  author_id: string | null;
  status: string;
  is_featured: boolean;
  views: number;
  reading_time_mins: number | null;
  published_at: string | null;
  created_at: string;
  external_url: string | null;
}

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const CATEGORIES = [
  "Career Tips",
  "Industry Insights",
  "Interview Prep",
  "Resume Writing",
  "Study Abroad",
  "Tech Skills",
  "Professional Growth",
  "Other",
];

const emptyPost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image: "",
  category: "",
  tags: [] as string[],
  author_name: "",
  status: "draft",
  is_featured: false,
  reading_time_mins: null as number | null,
  external_url: "",
};

const ITEMS_PER_PAGE = 10;

// --- Sub-Component: Blog Post Form ---
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev: any) => ({
      ...prev,
      title,
      slug: initialData.id ? prev.slug : generateSlug(title),
    }));
  };

  const uploadToStorage = async (file: File) => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
    const { error: uploadError } = await supabase.storage.from("blog-images").upload(fileName, file);
    if (uploadError) throw uploadError;
    const {
      data: { publicUrl },
    } = supabase.storage.from("blog-images").getPublicUrl(fileName);
    return publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const publicUrl = await uploadToStorage(file);
      setFormData((prev: any) => ({ ...prev, featured_image: publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev: any) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  return (
    <div className="space-y-4 py-4">
      {/* Title - Required */}
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., 10 Tips for Your First Job Interview"
        />
      </div>

      {/* Description/Excerpt - Prominent */}
      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          placeholder="Brief description of the article (shown in previews and feed)"
          className="min-h-[80px]"
        />
      </div>

      {/* Category and Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
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
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Featured Image - Upload */}
      <div className="space-y-2">
        <Label>Featured Image</Label>
        <div className="flex gap-2 items-center">
          <Input
            value={formData.featured_image}
            onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
            placeholder="Image URL or upload..."
            className="flex-1"
          />
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploadingImage}
            />
            <Button variant="outline" type="button" disabled={uploadingImage}>
              {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        {formData.featured_image && (
          <img src={formData.featured_image} alt="Preview" className="h-32 object-cover rounded border mt-2" />
        )}
      </div>

      {/* External Link - For linking to external articles */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" /> External Link (optional)
        </Label>
        <Input
          value={formData.external_url}
          onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
          placeholder="https://swift-summit-insight.lovable.app/article-name"
        />
        <p className="text-xs text-muted-foreground">
          If provided, clicking the post will open this link instead of the content below.
        </p>
      </div>

      {/* Slug - Auto-generated but editable */}
      <div className="space-y-2">
        <Label>URL Slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/blog/</span>
          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="auto-generated-from-title"
            className="flex-1"
          />
        </div>
      </div>

      {/* Content - Optional if external_url is provided */}
      <div className="space-y-2">
        <Label>Content (Markdown) {formData.external_url ? "(optional)" : ""}</Label>
        <Tabs defaultValue="edit" className="w-full">
          <TabsList>
            <TabsTrigger value="edit">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit">
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={formData.external_url ? "Optional when linking to external article..." : "Write your post in Markdown..."}
              className="min-h-[200px] font-mono text-sm"
            />
          </TabsContent>
          <TabsContent value="preview">
            <div className="min-h-[200px] border rounded-md p-4 prose dark:prose-invert max-w-none overflow-y-auto bg-muted/20">
              {formData.content ? (
                <ReactMarkdown>{formData.content}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground">Nothing to preview yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag..."
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
          />
          <Button type="button" variant="outline" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.tags.map((tag: string, i: number) => (
            <Badge
              key={i}
              variant="secondary"
              className="cursor-pointer"
              onClick={() =>
                setFormData((prev: any) => ({ ...prev, tags: prev.tags.filter((_: any, idx: number) => idx !== i) }))
              }
            >
              {tag} ✕
            </Badge>
          ))}
        </div>
      </div>

      {/* Author and Featured toggle */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Author Name</Label>
          <Input
            value={formData.author_name}
            onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })} />
          <Label>Featured Post</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(formData)} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {initialData.id ? "Update Post" : "Create Post"}
        </Button>
      </div>
    </div>
  );
};

// --- Main Component ---
export function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search
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
    setError(null);
    try {
      let query = supabase.from("blog_posts").select("*", { count: "exact" }).order("created_at", { ascending: false });

      if (debouncedSearch) {
        query = query.or(`title.ilike.%${debouncedSearch}%,author_name.ilike.%${debouncedSearch}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading posts timed out");

      if (result.error) throw result.error;
      setPosts((result.data as unknown as BlogPost[]) || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Error loading posts:", err);
      setError(err.message || "Failed to load posts");
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleSave = async (formData: any) => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const calculateReadingTime = (content: string) => {
        const wordsPerMinute = 200;
        const words = (content || "").trim().split(/\s+/).length;
        return Math.ceil(words / wordsPerMinute);
      };

      const readingTime = calculateReadingTime(formData.content);

      const postData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt?.trim() || null,
        content: formData.content?.trim() || null,
        featured_image: formData.featured_image?.trim() || null,
        category: formData.category || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        author_name: formData.author_name?.trim() || null,
        status: formData.status,
        is_featured: formData.is_featured,
        reading_time_mins: readingTime,
        external_url: formData.external_url?.trim() || null,
        published_at:
          formData.status === "published" && !editingPost?.published_at
            ? new Date().toISOString()
            : editingPost?.published_at,
      };

      if (editingPost) {
        const { error } = await supabase.from("blog_posts").update(postData).eq("id", editingPost.id);
        if (error) throw error;
        toast.success("Post updated");
      } else {
        const { error } = await supabase.from("blog_posts").insert(postData);
        if (error) throw error;
        toast.success("Post created");
      }

      setIsDialogOpen(false);
      loadPosts();
    } catch (error: any) {
      toast.error(error.message?.includes("duplicate") ? "Slug already exists" : "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete post?")) return;
    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Post deleted");
      loadPosts();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Blog Posts
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Total {totalCount} posts found</p>
          </div>
          <Button
            onClick={() => {
              setEditingPost(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> New Post
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <DashboardTableSkeleton rows={5} columns={6} />
        ) : error ? (
          <DashboardErrorState title="Error" message={error} onRetry={loadPosts} />
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No posts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {post.featured_image ? (
                              <img src={post.featured_image} alt="" className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium line-clamp-1">{post.title}</p>
                              {post.published_at && (
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(post.published_at), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{post.category ? <Badge variant="outline">{post.category}</Badge> : "-"}</TableCell>
                        <TableCell>{post.author_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={post.status === "published" ? "default" : "secondary"}>{post.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingPost(post);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
          </DialogHeader>
          <BlogPostForm
            initialData={editingPost || emptyPost}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
            saving={saving}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
