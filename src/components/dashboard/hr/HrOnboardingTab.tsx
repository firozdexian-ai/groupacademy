import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const sb = supabase as any;

export function HrOnboardingTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "pending" });

  const { data, isLoading } = useQuery({
    queryKey: ["hr_onboarding"],
    queryFn: async () => {
      const [tasksRes, workforceRes] = await Promise.all([
        sb.from("hr_onboarding_tasks").select("*").order("due_date", { ascending: true }),
        sb
          .from("workforce_members")
          .select("user_id, talents(full_name)")
          .eq("status", "active"),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (workforceRes.error) throw workforceRes.error;

      const userMap = new Map<string, string>();
      (workforceRes.data || []).forEach((w: any) => {
        if (w.user_id) userMap.set(w.user_id, (w.talents as any)?.full_name || "Unknown");
      });

      return {
        tasks: (tasksRes.data || []) as any[],
        userMap,
        workforce: (workforceRes.data || []) as any[],
      };
    },
  });

  const upsertTask = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const { error } = await sb.from("hr_onboarding_tasks").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("hr_onboarding_tasks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr_onboarding"] });
      toast.success("Protocol Synchronized");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("hr_onboarding_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr_onboarding"] });
      toast.success("Protocol Purged");
    },
    onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
  });

  const getStatusConfig = (status: string, dueDate: string | null) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== "completed";
    if (isOverdue)
      return { icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", label: "OVERDUE" };
    switch (status) {
      case "completed":
        return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "COMPLETED" };
      case "in_progress":
        return { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", label: "IN PROGRESS" };
      default:
        return { icon: ClipboardList, color: "text-amber-500", bg: "bg-amber-500/10", label: "PENDING" };
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <ClipboardList className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
              Onboarding Protocol
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Deployment Checklists &amp; Orientation Requirements
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft({ status: "pending" });
            setOpen(true);
          }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" /> Inject Task
        </Button>
      </header>

      {/* Tasks Registry */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500/50 to-primary/50" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                    Task Definition
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">
                    Assigned Node
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">
                    Temporal Deadline
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">Status</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 text-right pr-8">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/5">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <Skeleton className="h-8 w-32 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.tasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                    >
                      Zero tasks deployed.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.tasks.map((t: any) => {
                    const sc = getStatusConfig(t.status, t.due_date);
                    const StatusIcon = sc.icon;
                    return (
                      <TableRow key={t.id} className="group hover:bg-primary/[0.02]">
                        <TableCell className="py-5 pl-8">
                          <p className="font-black text-sm uppercase italic tracking-tight">{t.title}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            {data?.userMap.get(t.user_id) || "Orphaned User"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {t.due_date ? new Date(t.due_date).toLocaleDateString() : "NO DEADLINE"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-black uppercase text-[9px] tracking-widest",
                              sc.bg,
                              sc.color,
                            )}
                          >
                            <StatusIcon className="h-3 w-3" /> {sc.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDraft(t);
                                setOpen(true);
                              }}
                              className="hover:bg-primary/10 hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("Purge Task?")) deleteTask.mutate(t.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-[40px] p-8 border-4 border-border/40">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <ClipboardList className="h-7 w-7 text-amber-500" />
              <div>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                  Task Deployment
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-widest">
                  Initialize onboarding protocol for a specific node.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Task Definition</Label>
              <Input
                placeholder="e.g. Sign NDA, Setup laptop, Watch orientation"
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="h-14 rounded-xl border-2 font-bold bg-muted/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Assign To (Workforce Node)</Label>
              <Select value={draft.user_id || ""} onValueChange={(v) => setDraft({ ...draft, user_id: v })}>
                <SelectTrigger className="h-14 rounded-xl border-2 font-bold bg-muted/20">
                  <SelectValue placeholder="Select workforce member" />
                </SelectTrigger>
                <SelectContent>
                  {data?.workforce
                    .filter((w: any) => w.user_id)
                    .map((w: any) => (
                      <SelectItem key={w.user_id} value={w.user_id}>
                        {(w.talents as any)?.full_name || "Unknown"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Temporal Deadline</Label>
                <Input
                  type="date"
                  value={draft.due_date || ""}
                  onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
                  className="h-14 rounded-xl border-2 bg-background/50 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Protocol Status</Label>
                <Select value={draft.status || "pending"} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-14 px-8 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest italic text-muted-foreground"
            >
              Abort
            </Button>
            <Button
              disabled={!draft.title || !draft.user_id || upsertTask.isPending}
              onClick={() => upsertTask.mutate(draft)}
              className="h-14 px-10 rounded-[24px] font-black uppercase italic tracking-tighter text-lg gap-3 shadow-xl flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <ShieldCheck className="h-5 w-5" /> Deploy Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HrOnboardingTab;
