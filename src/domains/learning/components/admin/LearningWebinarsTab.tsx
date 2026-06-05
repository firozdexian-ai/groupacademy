import { useState } from "react";
import { useLearningGraph } from "./hooks/useLearningGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, CalendarDays, ShieldCheck, Video, CalendarClock } from "lucide-react";
import CourseSessionsManager from "./sessions/CourseSessionsManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LearningWebinarsTab() {
 const {
 learningGraphQuery,
 mutations: { upsertContent, deleteContent },
 } = useLearningGraph();
 const { data, isLoading } = learningGraphQuery;
 const [open, setOpen] = useState(false);
 const [draft, setDraft] = useState<any>({ status: "draft", content_type: "live_webinar" });
 const [sessionsRow, setSessionsRow] = useState<any>(null);

 // Filter for webinars only
 const webinars = data?.content?.filter((c) => c.content_type === "live_webinar") || [];

 return (
 <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
 <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
 <div className="space-y-1 text-left">
 <div className="flex items-center gap-3 text-destructive">
 <CalendarDays className="h-8 w-8 text-destructive fill-destructive/20" />
 <h2 className="text-3xl font-medium tracking-tighter italic leading-none text-foreground">
 Webinars
 </h2>
 </div>
 <p className="text-[10px] font-medium tracking-[0.3em] text-muted-foreground/60 italic">
 Live Educational Broadcasts
 </p>
 </div>
 <Button
 onClick={() => {
 setDraft({ status: "draft", content_type: "live_webinar" });
 setOpen(true);
 }}
 className="h-12 px-8 rounded-xl font-medium text-xs gap-2 shadow-lg shadow-pink-500/20 bg-destructive hover:bg-destructive text-primary-foreground"
 >
 <Plus className="h-4 w-4" /> Inject Webinar
 </Button>
 </header>

 <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
 <div className="h-1.5 w-full bg-gradient-to-r from-destructive via-destructive to-destructive" />
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <Table>
 <TableHeader className="bg-muted/10 border-b border-border/20">
 <TableRow className="hover:bg-transparent">
 <TableHead className="font-medium text-xs py-5 pl-8">
 Event Title
 </TableHead>
 <TableHead className="font-medium text-xs">Type</TableHead>
 <TableHead className="font-medium text-xs">Status</TableHead>
 <TableHead className="font-medium text-xs text-right">Added</TableHead>
 <TableHead className="text-right py-5 pr-8">Manage</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-border/5">
 {isLoading ? (
 <TableRow>
 <TableCell colSpan={5} className="py-20 text-center">
 <Skeleton className="h-8 w-32 mx-auto" />
 </TableCell>
 </TableRow>
 ) : webinars.length === 0 ? (
 <TableRow>
 <TableCell
 colSpan={5}
 className="py-20 text-center font-medium text-xs text-muted-foreground/50 italic"
 >
 Zero webinars detected.
 </TableCell>
 </TableRow>
 ) : (
 webinars.map((row) => (
 <TableRow key={row.id} className="group hover:bg-destructive/[0.02]">
 <TableCell className="py-6 pl-8">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-background border border-border/40 flex items-center justify-center shrink-0">
 <Video className="h-3 w-3 text-destructive" />
 </div>
 <span className="font-black text-sm font-medium">{row.title}</span>
 </div>
 </TableCell>
 <TableCell>
 <Badge variant="outline" className="font-mono text-[9px] border">
 Live Event
 </Badge>
 </TableCell>
 <TableCell>
 <Badge
 className={cn(
 "font-bold text-[9px] border-none px-3",
 row.status === "published"
 ? "bg-success/10 text-success"
 : "bg-warning/10 text-warning",
 )}
 >
 {row.status}
 </Badge>
 </TableCell>
 <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
 {new Date(row.created_at).toLocaleDateString()}
 </TableCell>
 <TableCell className="text-right pr-8">
 <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
 <Button
 variant="ghost"
 size="icon" aria-label="Manage sessions"
 onClick={() => setSessionsRow(row)}
 className="hover:bg-destructive/10 hover:text-destructive"
 title="Manage sessions"
 >
 <CalendarClock className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon" aria-label="Edit"
 onClick={() => {
 setDraft(row);
 setOpen(true);
 }}
 className="hover:bg-destructive/10 hover:text-destructive"
 >
 <Pencil className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon" aria-label="Delete"
 className="text-destructive hover:bg-destructive/10"
 onClick={() => {
 if (confirm("Purge Webinar?")) deleteContent.mutate(row.id);
 }}
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
 </div>
 </CardContent>
 </Card>

 <Dialog open={open} onOpenChange={setOpen}>
 <DialogContent className="max-w-md rounded-2xl p-8 border-4 border-border/40 text-left">
 <DialogHeader>
 <DialogTitle className="text-2xl font-semibold text-destructive flex items-center gap-2">
 <CalendarDays className="h-6 w-6" /> Inject Webinar
 </DialogTitle>
 <DialogDescription className="text-sm text-muted-foreground">
 Update live event parameters.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <Label className="text-[10px] font-black text-primary ml-1">Event Title</Label>
 <Input
 placeholder="Title"
 value={draft.title || ""}
 onChange={(e) => setDraft({ ...draft, title: e.target.value })}
 className="h-14 rounded-xl border font-bold"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-black text-primary ml-1">
 Visibility Status
 </Label>
 <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
 <SelectTrigger className="h-14 rounded-xl border font-bold text-xs uppercase">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="draft" className="font-bold text-xs text-warning">
 Draft / Scheduled
 </SelectItem>
 <SelectItem
 value="published"
 className="font-bold text-xs text-success"
 >
 Published
 </SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 <Button
 disabled={!draft.title || upsertContent.isPending}
 onClick={() => {
 const payload = { ...draft, is_published: draft.status === "published" };
 delete payload.status;
 upsertContent.mutate(payload, { onSuccess: () => setOpen(false) });
 }}
 className="h-14 rounded-xl font-medium bg-destructive hover:bg-destructive text-primary-foreground"
 >
 <ShieldCheck className="mr-2 h-5 w-5" /> Authorize Event
 </Button>
 </DialogContent>
 </Dialog>
 <Dialog open={!!sessionsRow} onOpenChange={(o) => !o && setSessionsRow(null)}>
 <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-6 border border-border/60">
 <DialogHeader>
 <DialogTitle className="text-xl font-medium italic tracking-tight text-destructive flex items-center gap-2">
 <CalendarClock className="h-5 w-5" /> Sessions — {sessionsRow?.title}
 </DialogTitle>
 </DialogHeader>
 {sessionsRow && (
 <CourseSessionsManager
 contentId={sessionsRow.id}
 contentTitle={sessionsRow.title || "Webinar"}
 />
 )}
 </DialogContent>
 </Dialog>
 </div>
 );
}

export default LearningWebinarsTab;
