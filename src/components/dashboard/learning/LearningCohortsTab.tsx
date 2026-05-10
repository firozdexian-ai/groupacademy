import { useState } from "react";
import { useLearningGraph } from "@/hooks/useLearningGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Users, ShieldCheck, Calendar, BookOpen, Video } from "lucide-react";
import CourseSessionsManager from "@/components/dashboard/learning/sessions/CourseSessionsManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LearningCohortsTab() {
  const {
    learningGraphQuery,
    mutations: { upsertCohort, deleteCohort },
  } = useLearningGraph();
  const { data, isLoading } = learningGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "upcoming" });
  const [sessionsRow, setSessionsRow] = useState<any>(null);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-indigo-500">
            <Users className="h-8 w-8 text-indigo-500 fill-indigo-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Cohorts
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Synchronous Group Learning
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft({ status: "upcoming" });
            setOpen(true);
          }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="h-4 w-4" /> Instantiate Cohort
        </Button>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-600" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                    Cohort Identifier
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Content Node</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">
                    Start Date
                  </TableHead>
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
                ) : data?.cohorts?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                    >
                      Zero cohorts detected.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.cohorts?.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-indigo-500/[0.02]">
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-background border-2 border-border/20 flex items-center justify-center shrink-0">
                            <Users className="h-3 w-3 text-indigo-500" />
                          </div>
                          <span className="font-black text-sm uppercase italic tracking-tight">{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-[10px] text-foreground font-black flex items-center gap-1.5">
                          <BookOpen className="h-3 w-3 text-indigo-500" />{" "}
                          {row.content_id ? row.content_id.substring(0, 8) : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-bold text-[9px] uppercase tracking-widest border-none px-3",
                            row.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : row.status === "completed"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-amber-500/10 text-amber-600",
                          )}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                        {row.starts_on ? new Date(row.starts_on).toLocaleDateString() : "TBD"}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!row.content_id}
                            onClick={() => setSessionsRow(row)}
                            className="hover:bg-indigo-500/10 hover:text-indigo-600"
                            title="Manage live sessions"
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDraft(row);
                              setOpen(true);
                            }}
                            className="hover:bg-indigo-500/10 hover:text-indigo-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Purge Cohort?")) deleteCohort.mutate(row.id);
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
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4 border-border/40 text-left">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-indigo-500 flex items-center gap-2">
              <Users className="h-6 w-6" /> Instantiate Cohort
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Update cohort execution parameters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Cohort Name</Label>
              <Input
                placeholder="e.g. Spring 2026 Alpha"
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="h-14 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Content Node ID
              </Label>
              <Input
                placeholder="UUID"
                value={draft.content_id || ""}
                onChange={(e) => setDraft({ ...draft, content_id: e.target.value })}
                className="h-14 rounded-xl border-2 font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={draft.start_date?.split("T")[0] || ""}
                    onChange={(e) => setDraft({ ...draft, start_date: e.target.value })}
                    className="h-14 rounded-xl border-2 pl-12 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold text-xs uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming" className="font-bold text-xs uppercase tracking-widest text-amber-500">
                      Upcoming
                    </SelectItem>
                    <SelectItem value="active" className="font-bold text-xs uppercase tracking-widest text-emerald-500">
                      Active
                    </SelectItem>
                    <SelectItem value="completed" className="font-bold text-xs uppercase tracking-widest text-blue-500">
                      Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Button
            disabled={!draft.title || upsertCohort.isPending}
            onClick={() => {
              // Map UI aliases back to the DB columns expected by Supabase
              const payload = { ...draft, name: draft.title, starts_on: draft.start_date };
              delete payload.title;
              delete payload.start_date;
              upsertCohort.mutate(payload, { onSuccess: () => setOpen(false) });
            }}
            className="h-14 rounded-xl font-black uppercase bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <ShieldCheck className="mr-2 h-5 w-5" /> Enforce Cohort
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={!!sessionsRow} onOpenChange={(o) => !o && setSessionsRow(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[24px] p-6 border-2 border-border/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-indigo-500 flex items-center gap-2">
              <Video className="h-5 w-5" /> Live Sessions — {sessionsRow?.name}
            </DialogTitle>
          </DialogHeader>
          {sessionsRow?.content_id && (
            <CourseSessionsManager
              contentId={sessionsRow.content_id}
              contentTitle={sessionsRow.name || "Cohort"}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LearningCohortsTab;
