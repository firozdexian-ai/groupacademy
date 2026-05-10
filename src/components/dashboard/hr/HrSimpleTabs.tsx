import { useState } from "react";
import { useHrGraph } from "@/hooks/useHrGraph";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Building2, Briefcase, Layers, GraduationCap, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Generic Registry Shell ---
function HrRegistryShell({ title, description, icon: Icon, data, isLoading, columns, renderRow, onAdd }: any) {
  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Icon className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{title}</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            {description}
          </p>
        </div>
        <Button
          onClick={onAdd}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" /> Deploy Node
        </Button>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 to-blue-500/50" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
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
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
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
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Purge?")) deleteVertical.mutate(row.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4 border-border/40">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Vertical Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Name"
              value={draft.name || ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-14 rounded-xl border-2 font-bold"
            />
            <Input
              placeholder="Description"
              value={draft.description || ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="h-14 rounded-xl border-2"
            />
          </div>
          <Button
            disabled={!draft.name || upsertVertical.isPending}
            onClick={() => {
              upsertVertical.mutate(draft);
              setOpen(false);
            }}
            className="h-14 rounded-xl font-black uppercase"
          >
            <ShieldCheck className="mr-2" /> Deploy
          </Button>
        </DialogContent>
      </Dialog>
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
            <TableCell className="text-xs text-muted-foreground">
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
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Purge?")) deleteFunction.mutate(row.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4 border-border/40">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Function Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Name"
              value={draft.name || ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-14 rounded-xl border-2 font-bold"
            />
            <Select value={draft.vertical_id || ""} onValueChange={(v) => setDraft({ ...draft, vertical_id: v })}>
              <SelectTrigger className="h-14 rounded-xl border-2">
                <SelectValue placeholder="Select Parent Vertical" />
              </SelectTrigger>
              <SelectContent>
                {hrGraphQuery.data?.verticals.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
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
            <ShieldCheck className="mr-2" /> Deploy
          </Button>
        </DialogContent>
      </Dialog>
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
            <TableCell className="text-xs text-muted-foreground">
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
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Purge?")) deleteTeam.mutate(row.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4 border-border/40">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Team Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Name"
              value={draft.name || ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-14 rounded-xl border-2 font-bold"
            />
            <Select value={draft.function_id || ""} onValueChange={(v) => setDraft({ ...draft, function_id: v })}>
              <SelectTrigger className="h-14 rounded-xl border-2">
                <SelectValue placeholder="Select Parent Function" />
              </SelectTrigger>
              <SelectContent>
                {hrGraphQuery.data?.functions.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
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
            <ShieldCheck className="mr-2" /> Deploy
          </Button>
        </DialogContent>
      </Dialog>
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
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Purge?")) deleteGrade.mutate(row.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4 border-border/40">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Grade Node</DialogTitle>
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
            <ShieldCheck className="mr-2" /> Deploy
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Stubs for remaining tabs so routing doesn't break
export const HrPayrollTab = () => (
  <div className="p-8 font-black uppercase tracking-widest text-muted-foreground italic">Phase 6 Upgrade Pending</div>
);
