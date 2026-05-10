import { useState } from "react";
import { useUgcGraph } from "@/hooks/useUgcGraph";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, MessageSquare, ShieldCheck, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function UgcFeedTab() {
  const { ugcGraphQuery, mutations: { upsertFeedPost, deleteFeedPost } } = useUgcGraph();
  const { data, isLoading } = ugcGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({});

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
          onClick={() => { setDraft({}); setOpen(true); }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Inject Post
        </Button>
      </div>

      <Card className="border-2">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-wide">Feed Registry</h3>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content Preview</TableHead>
                <TableHead>Author ID</TableHead>
                <TableHead>String Length</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : data?.feedPosts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    Zero posts detected.
                  </TableCell>
                </TableRow>
              ) : (
                data?.feedPosts?.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium max-w-md">
                        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">
                          {row.content ? row.content.substring(0, 40) + "..." : "No text content"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {row.author_user_id ? row.author_user_id.substring(0, 8) : "System"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tabular-nums">
                        {row.content?.length || 0} Chars
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {new Date(row.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setDraft(row); setOpen(true); }}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { if (confirm("Purge Post?")) deleteFeedPost.mutate(row.id); }}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
              <MessageSquare className="h-5 w-5 text-primary" /> Modify Post
            </DialogTitle>
            <DialogDescription>Update or inject raw feed content.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide">Raw Markdown</Label>
              <Textarea
                value={draft.content || ""}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                className="min-h-[150px] rounded-xl border-2 font-mono text-sm bg-muted/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!draft.content || upsertFeedPost.isPending}
              onClick={() => upsertFeedPost.mutate(draft, { onSuccess: () => setOpen(false) })}
              className="h-14 rounded-xl font-black uppercase bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <ShieldCheck className="mr-2 h-5 w-5" /> Authorize Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UgcFeedTab;
