import { useState } from "react";
import { useJobsGraph } from "hooks/useJobsGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, UserPlus, ShieldCheck, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function JobsSourcingTab() {
  const {
    jobsGraphQuery,
    mutations: { upsertInvitation, deleteInvitation },
  } = useJobsGraph();
  const { data, isLoading } = jobsGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "sent" });

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-fuchsia-500">
            <UserPlus className="h-8 w-8 text-fuchsia-500 fill-fuchsia-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Sourcing
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Outbound Job Invitations
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft({ status: "sent" });
            setOpen(true);
          }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-fuchsia-500/20 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
        >
          <Plus className="h-4 w-4" /> Send Invite
        </Button>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-fuchsia-400 via-pink-500 to-rose-500" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">Job Node</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Talent Node</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Invite Status</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">
                    Sent Date
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
                ) : data?.invitations?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                    >
                      Zero invitations detected.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.invitations?.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-fuchsia-500/[0.02]">
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-background border-2 border-border/20 flex items-center justify-center shrink-0">
                            <UserPlus className="h-3 w-3 text-fuchsia-500" />
                          </div>
                          <span className="font-mono text-xs uppercase tracking-tight text-muted-foreground">
                            {row.job_id?.substring(0, 8) || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-[10px] text-foreground font-black flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-fuchsia-500" />{" "}
                          {row.talent_id ? row.talent_id.substring(0, 8) : "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-bold text-[9px] uppercase tracking-widest border-none px-3",
                            row.status === "accepted"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : row.status === "declined"
                                ? "bg-rose-500/10 text-rose-600"
                                : "bg-amber-500/10 text-amber-600",
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
                            className="hover:bg-fuchsia-500/10 hover:text-fuchsia-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Purge Invitation?")) deleteInvitation.mutate(row.id);
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
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-fuchsia-500 flex items-center gap-2">
              <UserPlus className="h-6 w-6" /> Sourcing Invite
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Update outbound job invitation.
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
                Invite Status
              </Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger className="h-14 rounded-xl border-2 font-bold text-xs uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sent" className="font-bold text-xs uppercase tracking-widest text-amber-500">
                    Sent
                  </SelectItem>
                  <SelectItem value="accepted" className="font-bold text-xs uppercase tracking-widest text-emerald-500">
                    Accepted
                  </SelectItem>
                  <SelectItem value="declined" className="font-bold text-xs uppercase tracking-widest text-rose-500">
                    Declined
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            disabled={!draft.job_id || upsertInvitation.isPending}
            onClick={() => upsertInvitation.mutate(draft, { onSuccess: () => setOpen(false) })}
            className="h-14 rounded-xl font-black uppercase bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
          >
            <ShieldCheck className="mr-2 h-5 w-5" /> Enforce Status
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default JobsSourcingTab;
