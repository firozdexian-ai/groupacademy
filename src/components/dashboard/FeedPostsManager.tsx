import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ImageUpload";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Pin,
  MessageSquare,
  ShieldCheck,
  Activity,
  Zap,
  Layers,
  Globe,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Community Intelligence Terminal (Feed Posts)
 * High-fidelity orchestrator for content distribution, poll logic, and announcements.
 * 2026 Standard: Executive Logic geometry with reinforced engagement guards.
 */

type PostContentType = "text" | "poll" | "tip" | "news" | "announcement" | "media";

interface PollOption {
  id: string;
  text: string;
}

interface FeedPost {
  id: string;
  author_name: string;
  author_avatar: string | null;
  author_title: string | null;
  content_type: PostContentType;
  text_content: string;
  media_url: string | null;
  poll_options: PollOption[] | null;
  poll_ends_at: string | null;
  link_url: string | null;
  tags: string[];
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
}

interface PostFormData {
  author_name: string;
  author_avatar: string;
  author_title: string;
  content_type: PostContentType;
  text_content: string;
  media_url: string;
  poll_options: PollOption[];
  poll_ends_at: string;
  link_url: string;
  tags: string;
  is_pinned: boolean;
  is_active: boolean;
}

const TYPE_CONFIG: Record<PostContentType, { label: string; color: string; bg: string; icon: any }> = {
  text: { label: "TEXT_POST", color: "text-muted-foreground", bg: "bg-muted", icon: Globe },
  poll: { label: "POLL_LOGIC", color: "text-purple-500", bg: "bg-purple-500/10", icon: BarChart3 },
  tip: { label: "QUICK_TIP", color: "text-amber-500", bg: "bg-amber-500/10", icon: Zap },
  news: { label: "INDUSTRY_INTEL", color: "text-blue-500", bg: "bg-blue-500/10", icon: Activity },
  announcement: { label: "SYSTEM_ALERT", color: "text-primary", bg: "bg-primary/10", icon: ShieldCheck },
  media: { label: "VISUAL_NODE", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: Layers },
};

const defaultFormData: PostFormData = {
  author_name: "GroUp Academy Team",
  author_avatar: "",
  author_title: "Career Experts",
  content_type: "text",
  text_content: "",
  media_url: "",
  poll_options: [
    { id: "1", text: "" },
    { id: "2", text: "" },
  ],
  poll_ends_at: "",
  link_url: "",
  tags: "",
  is_pinned: false,
  is_active: true,
};

export function FeedPostsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [formData, setFormData] = useState<PostFormData>(defaultFormData);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as FeedPost[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const payload: any = {
        author_name: data.author_name,
        author_avatar: data.author_avatar || null,
        author_title: data.author_title || null,
        content_type: data.content_type,
        text_content: data.text_content,
        media_url: data.media_url || null,
        poll_options: data.content_type === "poll" ? data.poll_options.filter((o) => o.text.trim()) : null,
        poll_ends_at:
          data.content_type === "poll" && data.poll_ends_at ? new Date(data.poll_ends_at).toISOString() : null,
        link_url: data.link_url || null,
        tags: data.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        is_pinned: data.is_pinned,
        is_active: data.is_active,
      };

      const { error } = editingPost
        ? await supabase.from("feed_posts").update(payload).eq("id", editingPost.id)
        : await supabase.from("feed_posts").insert(payload);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast({ title: "Protocol Synchronized", description: "Feed registry updated successfully." });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feed_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast({ title: "Artifact Purged" });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const { error } = await supabase.from("feed_posts").update({ is_pinned: !isPinned }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
  });

  const handleOpenEdit = (post: FeedPost) => {
    setEditingPost(post);
    setFormData({
      ...defaultFormData,
      ...post,
      author_avatar: post.author_avatar || "",
      author_title: post.author_title || "",
      media_url: post.media_url || "",
      poll_options: post.poll_options || defaultFormData.poll_options,
      poll_ends_at: post.poll_ends_at ? format(new Date(post.poll_ends_at), "yyyy-MM-dd'T'HH:mm") : "",
      link_url: post.link_url || "",
      tags: post.tags?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPost(null);
    setFormData(defaultFormData);
  };

  const addPollOption = () => {
    setFormData((prev) => ({
      ...prev,
      poll_options: [...prev.poll_options, { id: String(prev.poll_options.length + 1), text: "" }],
    }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Intelligence Feed</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Community Nodes & Announcement Telemetry
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPost(null);
            setFormData(defaultFormData);
            setIsDialogOpen(true);
          }}
          className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" /> Initialize Post
        </Button>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8">
                  Content Artifact
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Logic Class</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Author Node</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                  Interrogate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" />
                  </TableCell>
                </TableRow>
              ) : (
                posts?.map((post) => {
                  const config = TYPE_CONFIG[post.content_type];
                  return (
                    <TableRow key={post.id} className="group transition-all hover:bg-primary/[0.02]">
                      <TableCell className="px-8 py-6 max-w-sm">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center border shadow-inner shrink-0",
                              post.is_pinned ? "bg-primary border-primary" : "bg-muted/50",
                            )}
                          >
                            {post.is_pinned ? (
                              <Pin className="h-4 w-4 text-white fill-white" />
                            ) : (
                              <MessageSquare className="h-4 w-4 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-black text-sm uppercase tracking-tight italic line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                              {post.text_content}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                              {format(new Date(post.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg font-black text-[8px] uppercase tracking-widest border-none px-3 py-1 shadow-sm",
                            config.bg,
                            config.color,
                          )}
                        >
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-black uppercase tracking-tighter italic">{post.author_name}</p>
                          <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                            {post.author_title || "SYSTEM_ENTITY"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={post.is_active ? "default" : "secondary"}
                          className="rounded-lg font-black text-[8px] uppercase tracking-[0.2em] px-3 py-1"
                        >
                          {post.is_active ? "PUBLISHED" : "IDLE_DRAFT"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all"
                            onClick={() => handleOpenEdit(post)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                            onClick={() => {
                              if (confirm("Purge artifact?")) deleteMutation.mutate(post.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate(formData);
            }}
            className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-4">
                <Activity className="h-8 w-8 text-primary" />
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    {editingPost ? "Recalibrate Node" : "Initialize Content Node"}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                    Community Artifact Configuration Protocol
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Author Identity
                  </Label>
                  <Input
                    value={formData.author_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, author_name: e.target.value }))}
                    className="h-12 rounded-xl border-2 font-bold"
                    required
                  />
                  <Input
                    value={formData.author_title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, author_title: e.target.value }))}
                    placeholder="Title (e.g. Chief Career Logic)"
                    className="h-12 rounded-xl border-2 italic"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Logic Class
                  </Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, content_type: v as PostContentType }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 font-bold bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 shadow-2xl">
                      {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key} className="font-bold text-[10px] uppercase">
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Payload Synthesis
                </Label>
                <Textarea
                  value={formData.text_content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, text_content: e.target.value }))}
                  rows={6}
                  className="rounded-3xl border-2 bg-muted/5 font-mono text-sm p-6 italic"
                  required
                />
              </div>

              {formData.content_type === "poll" && (
                <div className="p-8 rounded-[32px] border-2 bg-purple-500/5 border-purple-500/20 space-y-6 shadow-inner">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-500 italic flex items-center gap-3 border-b border-purple-500/10 pb-4">
                    <BarChart3 className="h-4 w-4" /> Poll Logic Matrix
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formData.poll_options.map((option, index) => (
                      <Input
                        key={option.id}
                        value={option.text}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            poll_options: p.poll_options.map((o, i) =>
                              i === index ? { ...o, text: e.target.value } : o,
                            ),
                          }))
                        }
                        placeholder={`Option ${index + 1}`}
                        className="h-12 rounded-xl border-2"
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPollOption}
                    className="rounded-lg border-2 font-bold uppercase text-[9px]"
                  >
                    Inject Option Slot
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Visual Ingestion
                  </Label>
                  <ImageUpload
                    value={formData.media_url || undefined}
                    onUpload={(url) => setFormData((prev) => ({ ...prev, media_url: url }))}
                    onRemove={() => setFormData((prev) => ({ ...prev, media_url: "" }))}
                    bucket="feed-images"
                  />
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      External Logic Link
                    </Label>
                    <Input
                      value={formData.link_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, link_url: e.target.value }))}
                      placeholder="https://..."
                      className="h-12 rounded-xl border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Metadata Tags
                    </Label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="Career, Intel, News"
                      className="h-12 rounded-xl border-2 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-12 p-6 rounded-[28px] border-2 bg-muted/20 border-border/10">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_pinned}
                    onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_pinned: v }))}
                  />
                  <Label className="text-[10px] font-black uppercase tracking-widest">Pin to Global Feed</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_active: v }))}
                  />
                  <Label className="text-[10px] font-black uppercase tracking-widest">Authorize Deployment</Label>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-border/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseDialog}
                  className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
                >
                  Abort
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Commit Synthesis
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
