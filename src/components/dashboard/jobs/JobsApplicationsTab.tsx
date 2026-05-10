import { useState } from "react";
import { useJobsGraph } from "./hooks/useJobsGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Users, ShieldCheck, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function JobsApplicationsTab() {
  const {
    jobsGraphQuery,
    mutations: { upsertApplication, deleteApplication },
  } = useJobsGraph();
  const { data, isLoading } = jobsGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "pending" });

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-blue-500">
            <Users className="h-8 w-8 text-blue-500 fill-blue-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Applications
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Master Candidate Ledger
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft({ status: "pending" });
            setOpen(true);
          }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" /> Inject Candidate
        </Button>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">Job Node</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Talent Node</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Pipeline Status</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Applied</TableHead>
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
                ) : data?.applications?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                    >
                      Zero applications detected.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.applications?.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-blue-500/[0.02]">
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-background border-2 border-border/20 flex items-center justify-center shrink-0">
                            <Briefcase className="h-3 w-3 text-blue-500" />
                          </div>
                          <span className="font-mono text-xs uppercase tracking-tight text-muted-foreground">
                            {row.job_id?.substring(0, 8) || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-[10px] text-foreground font-black flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-blue-500" />{" "}
                          {row.talent_id ? row.talent_id.substring(0, 8) : "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-bold text-[9px] uppercase tracking-widest border-none px-3",
                            row.status === "hired"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : row.status === "rejected"
                                ? "bg-rose-500/10 text-rose-600"
                                : row.status === "in_review"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-muted text-muted-foreground",
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
                            size="icon"
                            onClick={() => {
                              setDraft(row);
                              setOpen(true);
                            }}
                            className="hover:bg-blue-500/10 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Purge Application?")) deleteApplication.mutate(row.id);
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
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-blue-500 flex items-center gap-2">
              <Users className="h-6 w-6" /> Evaluate Candidate
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Update pipeline stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Job Node ID
                </Label>
                <Input
                  placeholder="UUID"
                  value={draft.job_id || ""}
                  onChange={(e) => setDraft({ ...draft, job_id: e.target.value })}
                  className="h-14 rounded-xl border-2 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Talent Node ID
                </Label>
                <Input
                  placeholder="UUID"
                  value={draft.talent_id || ""}
                  onChange={(e) => setDraft({ ...draft, talent_id: e.target.value })}
                  className="h-14 rounded-xl border-2 font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Pipeline Status
              </Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger className="h-14 rounded-xl border-2 font-bold text-xs uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="font-bold text-xs uppercase tracking-widest">
                    Pending
                  </SelectItem>
                  <SelectItem value="in_review" className="font-bold text-xs uppercase tracking-widest text-amber-500">
                    In Review
                  </SelectItem>
                  <SelectItem
                    value="interviewing"
                    className="font-bold text-xs uppercase tracking-widest text-blue-500"
                  >
                    Interviewing
                  </SelectItem>
                  <SelectItem value="hired" className="font-bold text-xs uppercase tracking-widest text-emerald-500">
                    Hired
                  </SelectItem>
                  <SelectItem value="rejected" className="font-bold text-xs uppercase tracking-widest text-rose-500">
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            disabled={!draft.job_id || upsertApplication.isPending}
            onClick={() => upsertApplication.mutate(draft, { onSuccess: () => setOpen(false) })}
            className="h-14 rounded-xl font-black uppercase bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ShieldCheck className="mr-2 h-5 w-5" /> Enforce Status
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default JobsApplicationsTab;
