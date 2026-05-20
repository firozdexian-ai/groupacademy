/**
 * HR Taxonomy Registry — Phase HR-Z1 Hardened
 * CTO Version: May 2026
 * Fixes: W6 (AlertDialog Integration), Institutional UI Parity
 */
import { useState } from "react";
import { useHrGraph } from "./hooks/useHrGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Briefcase,
  Layers,
  GraduationCap,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Generic Registry Shell ---
function HrRegistryShell({ title, description, icon: Icon, data, isLoading, columns, renderRow, onAdd }: any) {
  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-4 md:p-6 text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Icon className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{title}</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            {description}
          </p>
        </div>
        <Button
          onClick={onAdd}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Deploy Node
        </Button>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-600" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2">
                <TableRow className="hover:bg-transparent">
                  {columns.map((c: string, i: number) => (
                    <TableHead
                      key={i}
                      className={cn(
                        "font-black uppercase text-[10px] tracking-widest py-5",
                        i === 0 && "pl-8",
                        i === columns.length - 1 && "text-right pr-8",
                      )}
                    >
                      {c}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/5">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-20 text-center">
                      <Skeleton className="h-8 w-32 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/30 italic"
                    >
                      Zero records detected.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.map(renderRow)
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- VERTICALS ---
export function HrVerticalsTab() {
  const {
    hrGraphQuery,
    mutations: { upsertVertical, deleteVertical },
  } = useHrGraph();
  const [open, setOpen] = useState(false);
  const [purgeTarget, setPurgeTarget] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});

  return (
    <>
      <HrRegistryShell
        title="Verticals"
        description="Top-level organizational pillars"
        icon={Building2}
        data={hrGraphQuery.data?.verticals}
        isLoading={hrGraphQuery.isLoading}
        columns={["Vertical Name", "Description", "Actions"]}
        onAdd={() => {
          setDraft({});
          setOpen(true);
        }}
        renderRow={(row: any) => (
          <TableRow key={row.id} className="group hover:bg-primary/[0.02]">
            <TableCell className="py-5 pl-8 font-black text-sm uppercase italic tracking-tight">{row.name}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{row.description || "—"}</TableCell>
            <TableCell className="text-right pr-8">
              <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDraft(row);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setPurgeTarget(row.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic">Vertical Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Name</Label>
              <Input
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="h-14 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Description</Label>
              <Input
                value={draft.description || ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="h-14 rounded-xl border-2"
              />
            </div>
          </div>
          <Button
            disabled={!draft.name || upsertVertical.isPending}
            onClick={() => {
              upsertVertical.mutate(draft);
              setOpen(false);
            }}
            className="h-14 rounded-xl font-black uppercase"
          >
            <ShieldCheck className="mr-2 h-4 w-4" /> Deploy
          </Button>
        </DialogContent>
      </Dialog>

      <PurgeAlert
        targetId={purgeTarget}
        onOpenChange={setPurgeTarget}
        onConfirm={() => deleteVertical.mutate(purgeTarget!)}
      />
    </>
  );
}

// --- FUNCTIONS ---
export function HrFunctionsTab() {
  const {
    hrGraphQuery,
    mutations: { upsertFunction, deleteFunction },
  } = useHrGraph();
  const [open, setOpen] = useState(false);
  const [purgeTarget, setPurgeTarget] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});

  return (
    <>
      <HrRegistryShell
        title="Functions"
        description="Operational units within verticals"
        icon={Briefcase}
        data={hrGraphQuery.data?.functions}
        isLoading={hrGraphQuery.isLoading}
        columns={["Function Name", "Parent Vertical", "Actions"]}
        onAdd={() => {
          setDraft({});
          setOpen(true);
        }}
        renderRow={(row: any) => (
          <TableRow key={row.id} className="group hover:bg-primary/[0.02]">
            <TableCell className="py-5 pl-8 font-black text-sm uppercase italic tracking-tight">{row.name}</TableCell>
            <TableCell className="text-xs font-bold uppercase text-muted-foreground">
              {hrGraphQuery.data?.verticals.find((v) => v.id === row.vertical_id)?.name || "—"}
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
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setPurgeTarget(row.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic">Function Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Name"
              value={draft.name || ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-14 rounded-xl border-2 font-bold"
            />
            <Select value={draft.vertical_id || ""} onValueChange={(v) => setDraft({ ...draft, vertical_id: v })}>
              <SelectTrigger className="h-14 rounded-xl border-2 font-bold uppercase text-xs">
                <SelectValue placeholder="Select Parent Vertical" />
              </SelectTrigger>
              <SelectContent>
                {hrGraphQuery.data?.verticals.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="font-bold uppercase text-xs">
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!draft.name || !draft.vertical_id || upsertFunction.isPending}
            onClick={() => {
              upsertFunction.mutate(draft);
              setOpen(false);
            }}
            className="h-14 rounded-xl font-black uppercase"
          >
            Deploy
          </Button>
        </DialogContent>
      </Dialog>

      <PurgeAlert
        targetId={purgeTarget}
        onOpenChange={setPurgeTarget}
        onConfirm={() => deleteFunction.mutate(purgeTarget!)}
      />
    </>
  );
}

// --- TEAMS ---
export function HrTeamsTab() {
  const {
    hrGraphQuery,
    mutations: { upsertTeam, deleteTeam },
  } = useHrGraph();
  const [open, setOpen] = useState(false);
  const [purgeTarget, setPurgeTarget] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});

  return (
    <>
      <HrRegistryShell
        title="Teams"
        description="Execution squads within functions"
        icon={Layers}
        data={hrGraphQuery.data?.teams}
        isLoading={hrGraphQuery.isLoading}
        columns={["Team Name", "Parent Function", "Headcount", "Actions"]}
        onAdd={() => {
          setDraft({});
          setOpen(true);
        }}
        renderRow={(row: any) => (
          <TableRow key={row.id} className="group hover:bg-primary/[0.02]">
            <TableCell className="py-5 pl-8 font-black text-sm uppercase italic tracking-tight">{row.name}</TableCell>
            <TableCell className="text-xs font-bold uppercase text-muted-foreground">
              {hrGraphQuery.data?.functions.find((f) => f.id === row.function_id)?.name || "—"}
            </TableCell>
            <TableCell>
              <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md">
                {hrGraphQuery.data?.headcountByTeam[row.id] || 0} FTE
              </span>
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
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setPurgeTarget(row.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic">Team Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Name"
              value={draft.name || ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-14 rounded-xl border-2 font-bold"
            />
            <Select value={draft.function_id || ""} onValueChange={(v) => setDraft({ ...draft, function_id: v })}>
              <SelectTrigger className="h-14 rounded-xl border-2 font-bold uppercase text-xs">
                <SelectValue placeholder="Select Parent Function" />
              </SelectTrigger>
              <SelectContent>
                {hrGraphQuery.data?.functions.map((f) => (
                  <SelectItem key={f.id} value={f.id} className="font-bold uppercase text-xs">
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!draft.name || !draft.function_id || upsertTeam.isPending}
            onClick={() => {
              upsertTeam.mutate(draft);
              setOpen(false);
            }}
            className="h-14 rounded-xl font-black uppercase"
          >
            Deploy
          </Button>
        </DialogContent>
      </Dialog>

      <PurgeAlert
        targetId={purgeTarget}
        onOpenChange={setPurgeTarget}
        onConfirm={() => deleteTeam.mutate(purgeTarget!)}
      />
    </>
  );
}

// --- GRADES ---
export function HrGradesTab() {
  const {
    hrGraphQuery,
    mutations: { upsertGrade, deleteGrade },
  } = useHrGraph();
  const [open, setOpen] = useState(false);
  const [purgeTarget, setPurgeTarget] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});

  return (
    <>
      <HrRegistryShell
        title="Grades & Levels"
        description="Compensation and seniority mapping"
        icon={GraduationCap}
        data={hrGraphQuery.data?.grades}
        isLoading={hrGraphQuery.isLoading}
        columns={["Level", "Grade Name", "Headcount", "Actions"]}
        onAdd={() => {
          setDraft({ level: 1 });
          setOpen(true);
        }}
        renderRow={(row: any) => (
          <TableRow key={row.id} className="group hover:bg-primary/[0.02]">
            <TableCell className="py-5 pl-8">
              <span className="font-black italic text-muted-foreground/50 bg-muted/20 px-3 py-1 rounded-lg">
                L{row.level}
              </span>
            </TableCell>
            <TableCell className="font-black text-sm uppercase italic tracking-tight">{row.name}</TableCell>
            <TableCell>
              <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md">
                {hrGraphQuery.data?.headcountByGrade[row.id] || 0} FTE
              </span>
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
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setPurgeTarget(row.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic">Grade Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="number"
              placeholder="Level (e.g. 1)"
              value={draft.level || ""}
              onChange={(e) => setDraft({ ...draft, level: Number(e.target.value) })}
              className="h-14 rounded-xl border-2 font-black"
            />
            <Input
              placeholder="Name (e.g. Junior Engineer)"
              value={draft.name || ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-14 rounded-xl border-2 font-bold"
            />
          </div>
          <Button
            disabled={!draft.name || !draft.level || upsertGrade.isPending}
            onClick={() => {
              upsertGrade.mutate(draft);
              setOpen(false);
            }}
            className="h-14 rounded-xl font-black uppercase"
          >
            Deploy
          </Button>
        </DialogContent>
      </Dialog>

      <PurgeAlert
        targetId={purgeTarget}
        onOpenChange={setPurgeTarget}
        onConfirm={() => deleteGrade.mutate(purgeTarget!)}
      />
    </>
  );
}

// --- Shared Purge Protocol ---
function PurgeAlert({ targetId, onOpenChange, onConfirm }: any) {
  return (
    <AlertDialog open={!!targetId} onOpenChange={(open) => !open && onOpenChange(null)}>
      <AlertDialogContent className="rounded-3xl border-4 bg-background">
        <AlertDialogHeader className="items-center text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4 border-2 border-destructive/20">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <AlertDialogTitle className="font-black italic uppercase text-2xl tracking-tighter">
            Purge Taxonomy Node?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 leading-relaxed">
            System Warning: This protocol will permanently orphan linked workforce members and logic nodes. This action
            is immutable.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-3">
          <AlertDialogCancel className="h-12 rounded-xl font-black uppercase text-[10px] flex-1">
            Abort Protocol
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="h-12 bg-destructive text-white rounded-xl font-black uppercase text-[10px] flex-1 shadow-lg shadow-destructive/20"
          >
            Confirm Purge
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
