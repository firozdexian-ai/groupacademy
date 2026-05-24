import { useState } from "react";
import { useUgcGraph } from "./hooks/useUgcGraph";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Video, ShieldCheck, PlayCircle, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ConfirmPurge } from "@/platform/admin/ui/ConfirmPurge";
import { cn } from "@/lib/utils";

export function UgcVideosTab() {
 const { ugcGraphQuery, mutations: { upsertVideo, deleteVideo } } = useUgcGraph();
 const { data, isLoading } = ugcGraphQuery;
 const [open, setOpen] = useState(false);
 const [draft, setDraft] = useState<any>({ is_published: false });
 const [search, setSearch] = useState("");

 const rows = (data?.videos ?? []).filter((r) =>
 !search || r.title?.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex items-start justify-between gap-4 flex-wrap">
 <div>
 <div className="flex items-center gap-2">
 <Video className="h-5 w-5 text-blue-600" />
 <h2 className="text-2xl font-medium tracking-tight">Free Videos</h2>
 </div>
 <p className="text-sm text-muted-foreground mt-1">Open-Access Media Library</p>
 </div>
 <Button
 onClick={() => { setDraft({ is_published: false }); setOpen(true); }}
 className="h-12 px-8 rounded-xl font-medium text-xs gap-2 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white"
 >
 <Plus className="h-4 w-4" /> Deploy Video
 </Button>
 </div>

 <div className="relative max-w-sm">
 <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <Input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search title..."
 className="pl-10 h-11 rounded-xl border"
 />
 </div>

 <Card className="border">
 <CardHeader className="pb-2 flex flex-row items-center gap-2">
 <ShieldCheck className="h-4 w-4 text-blue-600" />
 <h3 className="text-sm font-medium tracking-wide">Catalog Registry ({rows.length})</h3>
 </CardHeader>
 <CardContent className="p-0">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Media Title</TableHead>
 <TableHead>YouTube</TableHead>
 <TableHead>Published</TableHead>
 <TableHead>Created</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {isLoading ? (
 <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
 ) : rows.length === 0 ? (
 <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Zero free videos detected.</TableCell></TableRow>
 ) : (
 rows.map((row) => (
 <TableRow key={row.id}>
 <TableCell>
 <div className="flex items-center gap-2 font-bold">
 <PlayCircle className="h-4 w-4 text-blue-600 shrink-0" />
 {row.title}
 </div>
 </TableCell>
 <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
 {row.youtube_url || "—"}
 </TableCell>
 <TableCell>
 <Badge
 variant="outline"
 className={cn(
 "uppercase text-sm font-medium",
 row.is_published ? "border-emerald-500 text-emerald-600" : "border-muted-foreground text-muted-foreground"
 )}
 >
 {row.is_published ? "Published" : "Draft"}
 </Badge>
 </TableCell>
 <TableCell className="text-xs text-muted-foreground tabular-nums">
 {new Date(row.created_at).toLocaleDateString()}
 </TableCell>
 <TableCell className="text-right">
 <div className="flex items-center justify-end gap-1">
 <Button size="icon" variant="ghost" onClick={() => { setDraft(row); setOpen(true); }} className="hover:bg-blue-500/10 hover:text-blue-600">
 <Pencil className="h-4 w-4" />
 </Button>
 <ConfirmPurge title="Purge Video?" description="This removes the free video from the catalog." onConfirm={() => deleteVideo.mutate(row.id)}>
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
 <DialogContent className="max-w-xl">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-xl font-medium">
 <Video className="h-5 w-5 text-blue-600" /> {draft.id ? "Edit" : "Deploy"} Video
 </DialogTitle>
 <DialogDescription>Free video catalog entry.</DialogDescription>
 </DialogHeader>
 <div className="space-y-3 py-2">
 <div className="space-y-1.5">
 <Label className="text-xs font-bold uppercase tracking-wide">Title *</Label>
 <Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-11 rounded-xl border font-bold" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <Label className="text-xs font-bold uppercase tracking-wide">Slug (auto)</Label>
 <Input value={draft.slug || ""} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className="h-11 rounded-xl border" />
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs font-bold uppercase tracking-wide">Thumbnail URL</Label>
 <Input value={draft.thumbnail_url || ""} onChange={(e) => setDraft({ ...draft, thumbnail_url: e.target.value })} className="h-11 rounded-xl border" />
 </div>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs font-bold uppercase tracking-wide">YouTube URL</Label>
 <Input value={draft.youtube_url || ""} onChange={(e) => setDraft({ ...draft, youtube_url: e.target.value })} className="h-11 rounded-xl border" />
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs font-bold uppercase tracking-wide">Description</Label>
 <Textarea value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="min-h-[80px] rounded-xl border" />
 </div>
 <div className="flex items-center justify-between rounded-xl border px-3 py-2.5">
 <Label className="text-xs font-bold uppercase tracking-wide">Published</Label>
 <Switch checked={!!draft.is_published} onCheckedChange={(v) => setDraft({ ...draft, is_published: v })} />
 </div>
 </div>
 <DialogFooter>
 <Button
 disabled={!draft.title || upsertVideo.isPending}
 onClick={() => upsertVideo.mutate(draft, { onSuccess: () => setOpen(false) })}
 className="h-12 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white"
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
