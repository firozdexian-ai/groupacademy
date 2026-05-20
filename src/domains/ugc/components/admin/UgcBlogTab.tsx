import { useState } from "react";
import { useUgcGraph } from "./hooks/useUgcGraph";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, FileText, ShieldCheck, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmPurge } from "@/components/dashboard/common/ConfirmPurge";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export function UgcBlogTab() {
  const { ugcGraphQuery, mutations: { upsertBlog, deleteBlog } } = useUgcGraph();
  const { data, isLoading } = ugcGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "draft" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const rows = (data?.blogs ?? []).filter((r) => {
    if (search && !r.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Blog Publisher</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Platform Articles &amp; Written Media</p>
        </div>
        <Button
          onClick={() => { setDraft({ status: "draft" }); setOpen(true); }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4" /> Inject Article
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title..." className="pl-10 h-11 rounded-xl border-2" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-11 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-2">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-black uppercase tracking-wide">Article Registry ({rows.length})</h3>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Zero articles detected.</TableCell></TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-bold">
                        <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[280px]">{row.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.author_name || (row.author_id ? row.author_id.substring(0, 8) : "System")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground uppercase">{row.category || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "uppercase text-[10px] font-bold",
                          row.status === "published" && "border-emerald-500 text-emerald-600",
                          row.status === "draft" && "border-muted-foreground text-muted-foreground"
                        )}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {new Date(row.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setDraft(row); setOpen(true); }} className="hover:bg-emerald-500/10 hover:text-emerald-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmPurge title="Purge Article?" description="This removes the article permanently." onConfirm={() => deleteBlog.mutate(row.id)}>
                          <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </ConfirmPurge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase">
              <FileText className="h-5 w-5 text-emerald-600" /> {draft.id ? "Edit" : "Inject"} Article
            </DialogTitle>
            <DialogDescription>Long-form blog post.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Title *</Label>
              <Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Slug (auto)</Label>
                <Input value={draft.slug || ""} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className="h-11 rounded-xl border-2" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Category</Label>
                <Input value={draft.category || ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="h-11 rounded-xl border-2" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Featured Image URL</Label>
                <Input value={draft.featured_image || ""} onChange={(e) => setDraft({ ...draft, featured_image: e.target.value })} className="h-11 rounded-xl border-2" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Excerpt</Label>
              <Textarea value={draft.excerpt || ""} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} className="min-h-[60px] rounded-xl border-2" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Body (Markdown)</Label>
              <Tabs defaultValue="edit">
                <TabsList className="rounded-xl">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                  <Textarea value={draft.content || ""} onChange={(e) => setDraft({ ...draft, content: e.target.value })} className="min-h-[200px] rounded-xl border-2 font-mono text-sm" />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="prose prose-sm dark:prose-invert max-w-none border-2 rounded-xl p-4 min-h-[200px]">
                    <ReactMarkdown>{draft.content || "*Nothing to preview.*"}</ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide">Status</Label>
                <Select value={draft.status || "draft"} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                  <SelectTrigger className="h-11 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border-2 px-3">
                <Label className="text-xs font-bold uppercase tracking-wide">Featured</Label>
                <Switch checked={!!draft.is_featured} onCheckedChange={(v) => setDraft({ ...draft, is_featured: v })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!draft.title || upsertBlog.isPending}
              onClick={() => upsertBlog.mutate(draft, { onSuccess: () => setOpen(false) })}
              className="h-12 rounded-xl font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShieldCheck className="h-4 w-4 mr-2" /> Authorize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UgcBlogTab;
