import { useState } from "react";
import { useUgcGraph } from "./hooks/useUgcGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Trophy, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmPurge } from "@/components/dashboard/common/ConfirmPurge";
import { cn } from "@/lib/utils";

export function UgcCompetitionsTab() {
  const { ugcGraphQuery, mutations: { upsertCompetition, deleteCompetition } } = useUgcGraph();
  const { data, isLoading } = ugcGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "draft" });

  const openEdit = (row: any) => {
    setDraft({ ...row, prizes: row.prizes ? JSON.stringify(row.prizes, null, 2) : "" });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-amber-500" />
            <h2 className="text-3xl font-black tracking-tight">Tournaments</h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Competitions &amp; Platform Challenges</p>
        </div>
        <Button
          onClick={() => { setDraft({ status: "draft" }); setOpen(true); }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="h-4 w-4" /> Deploy Tournament
        </Button>
      </div>

      <Card className="border-2 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Title</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Category</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Window</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
              ) : (data?.competitions ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-medium">Zero tournaments active.</TableCell></TableRow>
              ) : (
                data?.competitions.map((row: any) => (
                  <TableRow key={row.id} className="hover:bg-amber-500/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-amber-500" />
                        </div>
                        <span className="font-bold">{row.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs uppercase text-muted-foreground">{row.category || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-black uppercase text-[10px] tracking-widest",
                          row.status === "active" && "border-emerald-500/50 text-emerald-600 bg-emerald-500/10",
                          row.status === "draft" && "border-muted-foreground/30 text-muted-foreground bg-muted/30",
                          row.status === "completed" && "border-blue-500/50 text-blue-600 bg-blue-500/10",
                        )}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {row.start_date || "?"} → {row.end_date || "?"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(row)} className="hover:bg-amber-500/10 hover:text-amber-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmPurge title="Purge Tournament?" description="This permanently removes the competition." onConfirm={() => deleteCompetition.mutate(row.id)}>
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
        <DialogContent className="max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" /> {draft.id ? "Edit" : "Deploy"} Tournament
            </DialogTitle>
            <DialogDescription>Competition parameters.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="font-black uppercase text-[10px] tracking-widest">Title *</Label>
              <Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-black uppercase text-[10px] tracking-widest">Slug (auto)</Label>
                <Input value={draft.slug || ""} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className="h-11 rounded-xl border-2" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-black uppercase text-[10px] tracking-widest">Category</Label>
                <Input value={draft.category || ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="h-11 rounded-xl border-2" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-black uppercase text-[10px] tracking-widest">Featured Image</Label>
                <Input value={draft.featured_image || ""} onChange={(e) => setDraft({ ...draft, featured_image: e.target.value })} className="h-11 rounded-xl border-2" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-black uppercase text-[10px] tracking-widest">Description</Label>
              <Textarea value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="min-h-[80px] rounded-xl border-2" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-black uppercase text-[10px] tracking-widest">Start Date</Label>
                <Input type="date" value={draft.start_date || ""} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} className="h-11 rounded-xl border-2" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-black uppercase text-[10px] tracking-widest">End Date</Label>
                <Input type="date" value={draft.end_date || ""} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} className="h-11 rounded-xl border-2" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-black uppercase text-[10px] tracking-widest">Submission Deadline</Label>
                <Input type="datetime-local" value={draft.submission_deadline ? draft.submission_deadline.substring(0,16) : ""} onChange={(e) => setDraft({ ...draft, submission_deadline: e.target.value })} className="h-11 rounded-xl border-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-black uppercase text-[10px] tracking-widest">Max Participants</Label>
                <Input type="number" value={draft.max_participants || ""} onChange={(e) => setDraft({ ...draft, max_participants: e.target.value ? parseInt(e.target.value) : null })} className="h-11 rounded-xl border-2" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-black uppercase text-[10px] tracking-widest">Status</Label>
                <Select value={draft.status || "draft"} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                  <SelectTrigger className="h-11 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-black uppercase text-[10px] tracking-widest">Prizes (JSON)</Label>
              <Textarea
                value={typeof draft.prizes === "string" ? draft.prizes : JSON.stringify(draft.prizes ?? "", null, 2)}
                onChange={(e) => setDraft({ ...draft, prizes: e.target.value })}
                placeholder='[{"rank":1,"reward":"500 credits"}]'
                className="min-h-[80px] rounded-xl border-2 font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!draft.title || upsertCompetition.isPending}
              onClick={() => upsertCompetition.mutate(draft, { onSuccess: () => setOpen(false) })}
              className="h-12 rounded-xl font-black uppercase bg-amber-500 hover:bg-amber-600 text-white"
            >
              <ShieldCheck className="mr-2 h-5 w-5" /> Authorize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UgcCompetitionsTab;
