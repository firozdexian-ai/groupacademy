import { useState } from "react";
import { useGigGraph } from "./hooks/useGigGraph";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Zap, ShieldCheck, Coins } from "lucide-react";
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
import { cn } from "@/lib/utils";

export function GigsQuickActionsTab() {
  const {
    gigGraphQuery,
    mutations: { upsertQuickAction, deleteQuickAction },
  } = useGigGraph();
  const { data, isLoading } = gigGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "draft", reward_amount: 0 });

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-amber-500">
            <Zap className="h-8 w-8 text-amber-500 fill-amber-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Quick Actions
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Standardized Micro-Task Catalog
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft({ status: "draft", reward_amount: 0 });
            setOpen(true);
          }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="h-4 w-4" /> Deploy Action
        </Button>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                    Action Definition
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Reward</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">
                    Deployed
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
                ) : data?.quickActions?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                    >
                      Zero quick actions detected.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.quickActions?.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-amber-500/[0.02]">
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-background border-2 border-border/20 flex items-center justify-center shrink-0">
                            <Zap className="h-3 w-3 text-amber-500" />
                          </div>
                          <span className="font-black text-sm uppercase italic tracking-tight">{row.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-black text-amber-600 bg-amber-500/10 px-3 py-1 rounded-lg flex items-center gap-1 w-fit">
                          <Coins className="h-3 w-3" /> {row.reward_amount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-bold text-[9px] uppercase tracking-widest border-none px-3",
                            row.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600"
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
                            className="hover:bg-amber-500/10 hover:text-amber-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Purge Action?")) deleteQuickAction.mutate(row.id);
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
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-amber-500 flex items-center gap-2">
              <Zap className="h-6 w-6" /> Deploy Action
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Update micro-task catalog entry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Action Title</Label>
              <Input
                placeholder="Title"
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="h-14 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-amber-500 ml-1">
                  Reward (Credits)
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={draft.reward_amount || ""}
                  onChange={(e) => setDraft({ ...draft, reward_amount: Number(e.target.value) })}
                  className="h-14 rounded-xl border-2 border-amber-500/20 bg-amber-500/5 font-black text-amber-600 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Deployment Status
                </Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold text-xs uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft" className="font-bold text-xs uppercase tracking-widest">
                      Draft
                    </SelectItem>
                    <SelectItem value="active" className="font-bold text-xs uppercase tracking-widest text-emerald-500">
                      Active
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Button
            disabled={!draft.title || upsertQuickAction.isPending}
            onClick={() => upsertQuickAction.mutate(draft, { onSuccess: () => setOpen(false) })}
            className="h-14 rounded-xl font-black uppercase bg-amber-500 hover:bg-amber-600 text-white"
          >
            <ShieldCheck className="mr-2 h-5 w-5" /> Authorize
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GigsQuickActionsTab;
