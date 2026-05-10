import { useState } from "react";
import { useGtmGraph } from "hooks/useGtmGraph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Globe, Map, MapPin, Network } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ───────────────────────── Generic Registry Shell ─────────────────────────

type AccentColor = "primary" | "emerald" | "blue" | "amber";

interface RegistryShellProps {
  title: string;
  description: string;
  icon: any;
  data: any[] | undefined;
  isLoading: boolean;
  columns: string[];
  renderRow: (row: any) => React.ReactNode;
  onAdd: () => void;
  accentColor?: AccentColor;
}

function GtmRegistryShell({
  title,
  description,
  icon: Icon,
  data,
  isLoading,
  columns,
  renderRow,
  onAdd,
  accentColor = "primary",
}: RegistryShellProps) {
  const accentBg: Record<AccentColor, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-500",
    blue: "bg-blue-500/10 text-blue-500",
    amber: "bg-amber-500/10 text-amber-600",
  };
  const btnAccent: Record<AccentColor, string> = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    amber: "bg-amber-600 hover:bg-amber-700 text-white",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={cn("h-9 w-9 rounded-xl grid place-items-center", accentBg[accentColor])}>
              <Icon className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">{title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          onClick={onAdd}
          className={cn("h-11 rounded-xl px-5 font-black uppercase tracking-wider text-xs", btnAccent[accentColor])}
        >
          <Plus className="h-4 w-4 mr-2" /> Deploy Node
        </Button>
      </div>

      {/* Registry Table */}
      <Card className="border-2 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {columns.map((c, i) => (
                  <TableHead
                    key={i}
                    className={cn(
                      "text-[10px] uppercase tracking-widest font-black",
                      i === columns.length - 1 && "text-right",
                    )}
                  >
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center text-xs uppercase tracking-widest font-bold text-muted-foreground py-10"
                  >
                    Zero records detected.
                  </TableCell>
                </TableRow>
              ) : (
                data.map(renderRow)
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ───────────────────────── COUNTRIES ─────────────────────────

export function GtmCountriesTab() {
  const {
    gtmGraphQuery,
    mutations: { upsertCountry, deleteCountry },
  } = useGtmGraph();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ is_active: true, tier: "Tier 3" });

  const submit = async () => {
    await upsertCountry.mutateAsync(draft);
    setOpen(false);
  };

  return (
    <>
      <GtmRegistryShell
        title="Countries"
        description="Canonical country registry. Drives tiering, deployment status and downstream geographic FKs."
        icon={Globe}
        data={gtmGraphQuery.data?.countries}
        isLoading={gtmGraphQuery.isLoading}
        columns={["ISO", "Name", "Tier", "Status", "Actions"]}
        accentColor="primary"
        onAdd={() => {
          setDraft({ is_active: true, tier: "Tier 3" });
          setOpen(true);
        }}
        renderRow={(row: any) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono font-black">{row.iso2}</TableCell>
            <TableCell className="font-bold">{row.name}</TableCell>
            <TableCell>
              <Badge variant="outline" className="font-mono text-[10px]">
                {row.tier}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    row.is_active ? "bg-emerald-500" : "bg-muted-foreground/40",
                  )}
                />
                <span className="text-xs font-bold uppercase">
                  {row.is_active ? "Live" : "Dark"}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <RowActions
                onEdit={() => {
                  setDraft(row);
                  setOpen(true);
                }}
                onDelete={() => {
                  if (confirm("Purge this country?")) deleteCountry.mutate(row.id);
                }}
              />
            </TableCell>
          </TableRow>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">Deploy Country</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1 space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest font-black">ISO2</Label>
                <Input
                  value={draft.iso2 || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, iso2: e.target.value.toUpperCase().slice(0, 2) })
                  }
                  className="h-12 rounded-xl border-2 font-black font-mono text-center"
                  maxLength={2}
                />
              </div>
              <div className="col-span-3 space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest font-black">Name</Label>
                <Input
                  value={draft.name || ""}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="h-12 rounded-xl border-2 font-bold"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest font-black">Tier</Label>
                <Select value={draft.tier || "Tier 3"} onValueChange={(v) => setDraft({ ...draft, tier: v })}>
                  <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tier 1">Tier 1</SelectItem>
                    <SelectItem value="Tier 2">Tier 2</SelectItem>
                    <SelectItem value="Tier 3">Tier 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest font-black">Status</Label>
                <Select
                  value={draft.is_active ? "true" : "false"}
                  onValueChange={(v) => setDraft({ ...draft, is_active: v === "true" })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Live (Active)</SelectItem>
                    <SelectItem value="false">Dark (Inactive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={submit}
              disabled={!draft.iso2 || !draft.name}
              className="h-12 rounded-xl font-black uppercase tracking-wider w-full"
            >
              Authorize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ───────────────────────── REGIONS / STATES ─────────────────────────

export function GtmStatesTab() {
  const {
    gtmGraphQuery,
    mutations: { upsertRegion, deleteRegion },
  } = useGtmGraph();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({});

  const submit = async () => {
    await upsertRegion.mutateAsync(draft);
    setOpen(false);
  };

  return (
    <>
      <GtmRegistryShell
        title="States / Regions"
        description="Sub-national administrative areas linked to a parent country."
        icon={Map}
        data={gtmGraphQuery.data?.regions}
        isLoading={gtmGraphQuery.isLoading}
        columns={["Name", "Code", "Country", "Actions"]}
        accentColor="emerald"
        onAdd={() => {
          setDraft({});
          setOpen(true);
        }}
        renderRow={(row: any) => (
          <TableRow key={row.id}>
            <TableCell className="font-bold">{row.name}</TableCell>
            <TableCell className="font-mono text-xs">{row.code || "—"}</TableCell>
            <TableCell className="text-sm">
              {gtmGraphQuery.data?.countries.find((c) => c.id === row.country_id)?.name || "—"}
            </TableCell>
            <TableCell className="text-right">
              <RowActions
                onEdit={() => {
                  setDraft(row);
                  setOpen(true);
                }}
                onDelete={() => {
                  if (confirm("Purge this region?")) deleteRegion.mutate(row.id);
                }}
              />
            </TableCell>
          </TableRow>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">Deploy Region</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest font-black">Name</Label>
              <Input
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="h-12 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest font-black">Code</Label>
              <Input
                value={draft.code || ""}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                className="h-12 rounded-xl border-2 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest font-black">Parent Country</Label>
              <Select value={draft.country_id || ""} onValueChange={(v) => setDraft({ ...draft, country_id: v })}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {gtmGraphQuery.data?.countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={submit}
              disabled={!draft.name || !draft.country_id}
              className="h-12 rounded-xl font-black uppercase tracking-wider w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Authorize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ───────────────────────── CITIES ─────────────────────────

export function GtmCitiesTab() {
  const {
    gtmGraphQuery,
    mutations: { upsertCity, deleteCity },
  } = useGtmGraph();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ is_active: true });

  const submit = async () => {
    await upsertCity.mutateAsync(draft);
    setOpen(false);
  };

  return (
    <>
      <GtmRegistryShell
        title="Cities"
        description="City-level GTM nodes linked to a parent region/state."
        icon={MapPin}
        data={gtmGraphQuery.data?.cities}
        isLoading={gtmGraphQuery.isLoading}
        columns={["Name", "Region", "Status", "Actions"]}
        accentColor="blue"
        onAdd={() => {
          setDraft({ is_active: true });
          setOpen(true);
        }}
        renderRow={(row: any) => (
          <TableRow key={row.id}>
            <TableCell className="font-bold">{row.name}</TableCell>
            <TableCell className="text-sm">
              {gtmGraphQuery.data?.regions.find((r) => r.id === row.region_id)?.name || "—"}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-[10px]",
                  row.is_active ? "border-emerald-500/40 text-emerald-600" : "text-muted-foreground",
                )}
              >
                {row.is_active ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <RowActions
                onEdit={() => {
                  setDraft(row);
                  setOpen(true);
                }}
                onDelete={() => {
                  if (confirm("Purge this city?")) deleteCity.mutate(row.id);
                }}
              />
            </TableCell>
          </TableRow>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">Deploy City</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest font-black">Name</Label>
              <Input
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="h-12 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest font-black">Parent Region</Label>
              <Select value={draft.region_id || ""} onValueChange={(v) => setDraft({ ...draft, region_id: v })}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {gtmGraphQuery.data?.regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest font-black">Status</Label>
              <Select
                value={draft.is_active ? "true" : "false"}
                onValueChange={(v) => setDraft({ ...draft, is_active: v === "true" })}
              >
                <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active Target</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={submit}
              disabled={!draft.name || !draft.region_id}
              className="h-12 rounded-xl font-black uppercase tracking-wider w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Authorize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ───────────────────────── CLUSTERS ─────────────────────────

export function GtmClustersTab() {
  const {
    gtmGraphQuery,
    mutations: { upsertCluster, deleteCluster },
  } = useGtmGraph();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ countries: [], cities: [] });

  const submit = async () => {
    await upsertCluster.mutateAsync(draft);
    setOpen(false);
  };

  return (
    <>
      <GtmRegistryShell
        title="Custom Clusters"
        description='Curated geographic groupings (e.g. "Dhaka Metro", "GCC region") used for targeting and reporting.'
        icon={Network}
        data={gtmGraphQuery.data?.clusters}
        isLoading={gtmGraphQuery.isLoading}
        columns={["Name", "Description", "Composition", "Actions"]}
        accentColor="amber"
        onAdd={() => {
          setDraft({ countries: [], cities: [] });
          setOpen(true);
        }}
        renderRow={(row: any) => (
          <TableRow key={row.id}>
            <TableCell className="font-bold">{row.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-md truncate">
              {row.description || "—"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-mono">
                  {row.countries?.length || 0} countries
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {row.cities?.length || 0} cities
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <RowActions
                onEdit={() => {
                  setDraft({ countries: [], cities: [], ...row });
                  setOpen(true);
                }}
                onDelete={() => {
                  if (confirm("Purge this cluster?")) deleteCluster.mutate(row.id);
                }}
              />
            </TableCell>
          </TableRow>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">Deploy Cluster</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest font-black">Name</Label>
              <Input
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="h-12 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest font-black">Description</Label>
              <Input
                value={draft.description || ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="h-12 rounded-xl border-2"
              />
            </div>
            <p className="text-[11px] text-muted-foreground italic px-1">
              Node selection UI pending Phase 6.2 update.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={submit}
              disabled={!draft.name}
              className="h-12 rounded-xl font-black uppercase tracking-wider w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              Authorize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
