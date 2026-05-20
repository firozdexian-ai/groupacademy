import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHrGraph } from "./hooks/useHrGraph";
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
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Crosshair,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Users,
  Layers,
  Building2,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const sb = supabase as any;

export function HrTargetsTab() {
  const qc = useQueryClient();
  const { hrGraphQuery } = useHrGraph();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ scope: "team" });

  const targetsQuery = useQuery({
    queryKey: ["hr_targets"],
    queryFn: async () => {
      const { data, error } = await sb.from("hr_targets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const workforceQuery = useQuery({
    queryKey: ["workforce_min"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("workforce_members")
        .select("id, talents(full_name)")
        .eq("status", "active");
      if (error) throw error;
      return data as any[];
    },
  });

  const upsertTarget = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const { error } = await sb.from("hr_targets").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("hr_targets").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr_targets"] });
      toast.success("Target Parameters Synchronized");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
  });

  const deleteTarget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("hr_targets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr_targets"] });
      toast.success("Target Purged");
    },
    onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
  });

  const getScopeDetails = (scope: string, id: string) => {
    switch (scope) {
      case "vertical":
        return {
          name: hrGraphQuery.data?.verticals.find((v) => v.id === id)?.name || "Unknown",
          icon: Building2,
          color: "text-emerald-500",
        };
      case "function":
        return {
          name: hrGraphQuery.data?.functions.find((f) => f.id === id)?.name || "Unknown",
          icon: Briefcase,
          color: "text-blue-500",
        };
      case "team":
        return {
          name: hrGraphQuery.data?.teams.find((t) => t.id === id)?.name || "Unknown",
          icon: Layers,
          color: "text-amber-500",
        };
      case "user": {
        const user = workforceQuery.data?.find((u: any) => u.id === id);
        return {
          name: (user?.talents as any)?.full_name || "Unknown",
          icon: Users,
          color: "text-primary",
        };
      }
      default:
        return { name: "Unknown", icon: Target, color: "text-muted-foreground" };
    }
  };

  const renderScopeOptions = () => {
    switch (draft.scope) {
      case "vertical":
        return hrGraphQuery.data?.verticals.map((v) => (
          <SelectItem key={v.id} value={v.id}>
            {v.name}
          </SelectItem>
        ));
      case "function":
        return hrGraphQuery.data?.functions.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.name}
          </SelectItem>
        ));
      case "team":
        return hrGraphQuery.data?.teams.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ));
      case "user":
        return workforceQuery.data?.map((u: any) => (
          <SelectItem key={u.id} value={u.id}>
            {(u.talents as any)?.full_name || "Unknown"}
          </SelectItem>
        ));
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Crosshair className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Target Protocol</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Performance Metrics &amp; Incentive Distribution
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft({ scope: "team" });
            setOpen(true);
          }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" /> Deploy Target
        </Button>
      </header>

      {/* Targets Registry */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 to-emerald-500/50" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                    Metric Definition
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">
                    Target Scope
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">
                    Temporal Window
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">Incentive</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 text-right pr-8">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/5">
                {targetsQuery.isLoading || hrGraphQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <Skeleton className="h-8 w-32 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : targetsQuery.data?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                    >
                      Zero targets deployed.
                    </TableCell>
                  </TableRow>
                ) : (
                  targetsQuery.data?.map((t: any) => {
                    const scopeData = getScopeDetails(t.scope, t.scope_id);
                    const ScopeIcon = scopeData.icon;
                    return (
                      <TableRow key={t.id} className="group hover:bg-primary/[0.02]">
                        <TableCell className="py-5 pl-8">
                          <p className="font-black text-sm uppercase italic tracking-tight">{t.metric}</p>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mt-1">
                            GOAL: {t.target_value}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-fit font-black uppercase text-[9px] tracking-widest">
                              {t.scope}
                            </Badge>
                            <span className={cn("text-xs font-bold flex items-center gap-1.5", scopeData.color)}>
                              <ScopeIcon className="h-3.5 w-3.5" /> {scopeData.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
                            <span>STR: {t.period_start ? new Date(t.period_start).toLocaleDateString() : "N/A"}</span>
                            <span>END: {t.period_end ? new Date(t.period_end).toLocaleDateString() : "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {t.incentive_amount ? (
                            <span className="font-black text-emerald-600 text-sm">₵{t.incentive_amount}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
                                if (confirm("Purge Target?")) deleteTarget.mutate(t.id);
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
              <Target className="h-7 w-7 text-primary" />
              <div>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                  Target Deployment
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-widest">
                  Define parameters and set temporal windows.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Graph Scope</Label>
                <Select
                  value={draft.scope || "team"}
                  onValueChange={(v) => setDraft({ ...draft, scope: v, scope_id: "" })}
                >
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical (Macro)</SelectItem>
                    <SelectItem value="function">Function (Department)</SelectItem>
                    <SelectItem value="team">Team (Squad)</SelectItem>
                    <SelectItem value="user">User (Individual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Target Node</Label>
                <Select value={draft.scope_id || ""} onValueChange={(v) => setDraft({ ...draft, scope_id: v })}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold bg-muted/20">
                    <SelectValue placeholder="Select node" />
                  </SelectTrigger>
                  <SelectContent>{renderScopeOptions()}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Metric Definition</Label>
              <Input
                placeholder="e.g. Quarterly Revenue, Closed Deals"
                value={draft.metric || ""}
                onChange={(e) => setDraft({ ...draft, metric: e.target.value })}
                className="h-14 rounded-xl border-2 font-bold bg-muted/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Target Value</Label>
                <Input
                  type="number"
                  value={draft.target_value ?? ""}
                  onChange={(e) => setDraft({ ...draft, target_value: Number(e.target.value) })}
                  className="h-14 rounded-xl border-2 font-black text-lg bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Incentive Yield (₵)</Label>
                <Input
                  type="number"
                  value={draft.incentive_amount ?? ""}
                  onChange={(e) => setDraft({ ...draft, incentive_amount: Number(e.target.value) })}
                  className="h-14 rounded-xl border-2 border-emerald-500/20 font-black text-lg bg-emerald-500/5 text-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Start Window</Label>
                <Input
                  type="date"
                  value={draft.period_start || ""}
                  onChange={(e) => setDraft({ ...draft, period_start: e.target.value })}
                  className="h-12 rounded-xl border-2 bg-background/50 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">End Window</Label>
                <Input
                  type="date"
                  value={draft.period_end || ""}
                  onChange={(e) => setDraft({ ...draft, period_end: e.target.value })}
                  className="h-12 rounded-xl border-2 bg-background/50 font-mono text-xs"
                />
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
              disabled={!draft.metric || !draft.scope_id || upsertTarget.isPending}
              onClick={() => upsertTarget.mutate(draft)}
              className="h-14 px-10 rounded-[24px] font-black uppercase italic tracking-tighter text-lg gap-3 shadow-xl flex-1"
            >
              <ShieldCheck className="h-5 w-5" /> Deploy Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HrTargetsTab;
