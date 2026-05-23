/**
 * HR Onboarding Registry — Phase HR-Z1 Hardened
 * CTO Version: May 2026
 * Fixes: W9 (Overdue/Status Grouping), W4 (Relation Mapping)
 * Features: Multi-tab Operational View, Institutional Analytics
 */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHrOnboardingMaster,
  upsertGraphRow,
  deleteGraphRow,
} from "@/domains/workforce/repo/workforceRepo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";

export function HrOnboardingTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "pending" });
  const [activeTab, setActiveTab] = useState<"pending" | "overdue" | "completed">("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["hr_onboarding"],
    queryFn: async () => {
      // W4 Fix: Ensure we are joining correctly to pull talent names via user_id link
      const { tasks, workforce } = await getHrOnboardingMaster();

      const userMap = new Map<string, string>();
      workforce.forEach((w: any) => {
        if (w.user_id) userMap.set(w.user_id, w.talents?.full_name || "Unknown Agent");
      });

      return { tasks, userMap, workforce };
    },
  });

  const upsertTask = useMutation({
    mutationFn: async (payload: any) => {
      await upsertGraphRow("hr_onboarding_tasks", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr_onboarding"] });
      toast.success("Onboarding saved");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
  });

  // W9 Logic: Grouping and Filtering
  const filteredTasks = useMemo(() => {
    if (!data?.tasks) return [];
    const now = new Date();

    return data.tasks.filter((t) => {
      const overdue =
        t.due_date && isPast(new Date(t.due_date)) && t.status !== "completed" && !isToday(new Date(t.due_date));
      if (activeTab === "overdue") return overdue;
      if (activeTab === "completed") return t.status === "completed";
      return t.status !== "completed" && !overdue;
    });
  }, [data?.tasks, activeTab]);

  const stats = useMemo(() => {
    const tasks = data?.tasks || [];
    return {
      pending: tasks.filter(
        (t) =>
          t.status !== "completed" && (!t.due_date || !isPast(new Date(t.due_date)) || isToday(new Date(t.due_date))),
      ).length,
      overdue: tasks.filter(
        (t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "completed" && !isToday(new Date(t.due_date)),
      ).length,
      completed: tasks.filter((t) => t.status === "completed").length,
    };
  }, [data?.tasks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/10 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <ClipboardList className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Onboarding</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Deployment Checklists & Orientation Cluster
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft({ status: "pending" });
            setOpen(true);
          }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Inject Task
        </Button>
      </header>

      {/* W9: Operational Tabs */}
      <div className="flex flex-wrap gap-3 p-1.5 bg-muted/20 rounded-2xl border-2 border-border/40 w-fit">
        <TabBtn
          label="Active onboardings"
          count={stats.pending}
          active={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
          color="amber"
        />
        <TabBtn
          label="Critical Overdue"
          count={stats.overdue}
          active={activeTab === "overdue"}
          onClick={() => setActiveTab("overdue")}
          color="rose"
        />
        <TabBtn
          label="Archive / Done"
          count={stats.completed}
          active={activeTab === "completed"}
          onClick={() => setActiveTab("completed")}
          color="emerald"
        />
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div
          className={cn(
            "h-1.5 w-full bg-gradient-to-r",
            activeTab === "overdue" ? "from-rose-500 to-orange-500" : "from-primary to-blue-500",
          )}
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 text-[10px] font-black uppercase tracking-widest">
                <TableRow className="border-b-2">
                  <TableHead className="py-6 pl-8">Task Definition</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/5">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-20 text-center">
                      <Skeleton className="h-8 w-32 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/30"
                    >
                      Registry clear in this segment
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((t: any) => (
                    <TableRow key={t.id} className="group hover:bg-primary/[0.02] transition-colors">
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              t.status === "completed" ? "bg-emerald-500" : "bg-primary animate-pulse",
                            )}
                          />
                          <p className="font-black text-sm uppercase italic tracking-tight">{t.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-bold flex items-center gap-1.5 text-muted-foreground uppercase">
                          <User className="h-3 w-3" /> {data?.userMap.get(t.user_id) || "Orphaned Identity"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />{" "}
                            {t.due_date ? format(new Date(t.due_date), "MMM dd, yyyy") : "OPEN"}
                          </span>
                          {activeTab === "overdue" && (
                            <Badge className="w-fit text-[8px] bg-rose-500/10 text-rose-600 border-rose-500/20">
                              SYSTEM_ALERT_OVERDUE
                            </Badge>
                          )}
                        </div>
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
                            className="hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              deleteGraphRow("hr_onboarding_tasks", t.id).then(() =>
                                qc.invalidateQueries({ queryKey: ["hr_onboarding"] }),
                              )
                            }
                            className="text-destructive hover:bg-destructive/10"
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
        <DialogContent className="max-w-2xl rounded-[40px] p-0 overflow-hidden border-4 shadow-2xl">
          <div className="h-2 w-full bg-primary" />
          <div className="p-10 space-y-6 text-left">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic">New onboarding</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Task Identity</Label>
                <Input
                  placeholder="e.g. Identity Access, Terminal Setup..."
                  value={draft.title || ""}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="h-14 rounded-xl border-2 font-bold bg-muted/5"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Assign to Member</Label>
                <Select value={draft.user_id || ""} onValueChange={(v) => setDraft({ ...draft, user_id: v })}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold">
                    <SelectValue placeholder="SELECT WORKFORCE NODE" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.workforce
                      .filter((w) => w.user_id)
                      .map((w) => (
                        <SelectItem key={w.user_id} value={w.user_id} className="font-bold text-xs uppercase">
                          {w.talents?.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Deadline</Label>
                  <Input
                    type="date"
                    value={draft.due_date || ""}
                    onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
                    className="h-14 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Current State</Label>
                  <Select value={draft.status || "pending"} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">PENDING</SelectItem>
                      <SelectItem value="in_progress">IN PROGRESS</SelectItem>
                      <SelectItem value="completed">COMPLETED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="h-12 rounded-xl font-black uppercase text-[10px]"
              >
                Abort
              </Button>
              <Button
                disabled={!draft.title || !draft.user_id || upsertTask.isPending}
                onClick={() => upsertTask.mutate(draft)}
                className="h-12 px-10 rounded-2xl font-black uppercase italic text-[11px] gap-2 shadow-xl bg-primary text-primary-foreground flex-1"
              >
                <ShieldCheck className="h-4 w-4" /> Authorize Sequence
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabBtn({ label, count, active, onClick, color }: any) {
  const colors: any = {
    amber: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-600 bg-rose-500/10 border-rose-500/20",
    emerald: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-2 border-transparent",
        active ? "bg-primary text-white shadow-lg scale-[1.02]" : "text-muted-foreground hover:bg-muted/50",
      )}
    >
      {label}
      <span
        className={cn(
          "px-2 py-0.5 rounded-md text-[9px] border",
          active ? "bg-white/20 border-white/30" : colors[color],
        )}
      >
        {count}
      </span>
    </button>
  );
}

export default HrOnboardingTab;
