import { useState } from "react";
import { useUgcGraph } from "./hooks/useUgcGraph";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Trophy, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function UgcCompetitionsTab() {
  const { ugcGraphQuery, mutations: { upsertCompetition, deleteCompetition } } = useUgcGraph();
  const { data, isLoading } = ugcGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "draft" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-amber-500" />
            <h2 className="text-3xl font-black tracking-tight">Tournaments</h2>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Competitions & Platform Challenges</p>
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
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Tournament Title</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Launch Date</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
              ) : data?.competitions?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium">Zero tournaments active.</TableCell></TableRow>
              ) : (
                data?.competitions?.map((row: any) => (
                  <TableRow key={row.id} className="hover:bg-amber-500/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-amber-500" />
                        </div>
                        <span className="font-bold">{row.title}</span>
                      </div>
                    </TableCell>
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
                    <TableCell className="text-sm text-muted-foreground font-medium">
                      {new Date(row.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setDraft(row); setOpen(true); }} className="hover:bg-amber-500/10 hover:text-amber-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm("Purge Tournament?")) deleteCompetition.mutate(row.id); }} className="hover:bg-destructive/10 hover:text-destructive">
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
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" /> Deploy Tournament
            </DialogTitle>
            <DialogDescription>Update competition parameters.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-black uppercase text-[10px] tracking-widest">Tournament Title</Label>
              <Input
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="h-14 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-black uppercase text-[10px] tracking-widest">Deployment Status</Label>
              <Select value={draft.status || "draft"} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger className="h-14 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            disabled={!draft.title || upsertCompetition.isPending}
            onClick={() => upsertCompetition.mutate(draft, { onSuccess: () => setOpen(false) })}
            className="h-14 rounded-xl font-black uppercase bg-amber-500 hover:bg-amber-600 text-white"
          >
            <ShieldCheck className="mr-2 h-5 w-5" /> Authorize
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UgcCompetitionsTab;
