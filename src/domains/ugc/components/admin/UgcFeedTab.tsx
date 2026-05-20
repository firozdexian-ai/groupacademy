import { useState } from "react";
import { useUgcGraph } from "./hooks/useUgcGraph";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, MessageSquare, ShieldCheck, User, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmPurge } from "@/platform/admin/ui/ConfirmPurge";

export function UgcFeedTab() {
  const { ugcGraphQuery, mutations: { upsertFeedPost, deleteFeedPost } } = useUgcGraph();
  const { data, isLoading } = ugcGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ content_type: "text" });
  const [search, setSearch] = useState("");

  const rows = (data?.feedPosts ?? []).filter((r) =>
    !search || r.text_content?.toLowerCase().includes(search.toLowerCase()) || r.author_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Global Feed</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">User Generated Posts &amp; Discussions</p>
        </div>
        <Button
          onClick={() => { setDraft({ content_type: "text" }); setOpen(true); }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Inject Post
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content or author..." className="pl-10 h-11 rounded-xl border-2" />
      </div>

      <Card className="border-2">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-wide">Feed Registry ({rows.length})</h3>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content Preview</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Zero posts detected.</TableCell></TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium max-w-md">
                        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">
                          {row.text_content ? row.text_content.substring(0, 60) + (row.text_content.length > 60 ? "…" : "") : "(no text)"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {row.author_name || (row.author_user_id ? row.author_user_id.substring(0, 8) : "System")}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] uppercase font-bold tabular-nums">{row.content_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tabular-nums">
                        {row.text_content?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {new Date(row.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setDraft(row); setOpen(true); }} className="hover:bg-primary/10 hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmPurge title="Purge Post?" description="This removes the feed post permanently." onConfirm={() => deleteFeedPost.mutate(row.id)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase">
              <MessageSquare className="h-5 w-5 text-primary" /> {draft.id ? "Edit" : "Inject"} Post
            </DialogTitle>
            <DialogDescription>
              {draft.id && draft.author_name ? `Editing post by ${draft.author_name}` : "Raw feed content."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Type</Label>
              <Select value={draft.content_type || "text"} onValueChange={(v) => setDraft({ ...draft, content_type: v })}>
                <SelectTrigger className="h-11 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="poll">Poll</SelectItem>
                  <SelectItem value="tip">Tip</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">Body</Label>
              <Textarea value={draft.text_content || ""} onChange={(e) => setDraft({ ...draft, text_content: e.target.value })} className="min-h-[150px] rounded-xl border-2 font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!draft.text_content || upsertFeedPost.isPending}
              onClick={() => upsertFeedPost.mutate(draft, { onSuccess: () => setOpen(false) })}
              className="h-12 rounded-xl font-black uppercase bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <ShieldCheck className="mr-2 h-5 w-5" /> Authorize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UgcFeedTab;
