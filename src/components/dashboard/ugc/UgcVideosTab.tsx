import { useState } from "react";
import { useUgcGraph } from "./hooks/useUgcGraph";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Video, ShieldCheck, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function UgcVideosTab() {
  const { ugcGraphQuery, mutations: { upsertVideo, deleteVideo } } = useUgcGraph();
  const { data, isLoading } = ugcGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ type: "video", status: "draft" });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Free Videos</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Open-Access Media Library</p>
        </div>
        <Button
          onClick={() => { setDraft({ type: "video", status: "draft" }); setOpen(true); }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" /> Deploy Video
        </Button>
      </div>

      <Card className="border-2">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-black uppercase tracking-wide">Catalog Registry</h3>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Media Title</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
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
              ) : data?.videos?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    Zero media nodes detected.
                  </TableCell>
                </TableRow>
              ) : (
                data?.videos?.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-bold">
                        <PlayCircle className="h-4 w-4 text-blue-600 shrink-0" />
                        {row.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground uppercase tracking-wide">{row.type}</TableCell>
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
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setDraft(row); setOpen(true); }}
                          className="hover:bg-blue-500/10 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { if (confirm("Purge Video?")) deleteVideo.mutate(row.id); }}
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
              <Video className="h-5 w-5 text-blue-600" /> Deploy Media
            </DialogTitle>
            <DialogDescription>Update free video catalog entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide">Media Title</Label>
              <Input
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="h-14 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide">Deployment Status</Label>
              <Select value={draft.status || "draft"} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger className="h-14 rounded-xl border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => upsertVideo.mutate(draft, { onSuccess: () => setOpen(false) })}
              className="h-14 rounded-xl font-black uppercase bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ShieldCheck className="h-4 w-4 mr-2" /> Authorize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UgcVideosTab;
