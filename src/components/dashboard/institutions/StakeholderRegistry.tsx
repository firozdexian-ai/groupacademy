import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Globe,
  Mail,
  Building2,
  Search,
  RefreshCw,
  ShieldCheck,
  Activity,
  GraduationCap,
  Users,
  Pencil,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInstitutionGraph } from "hooks/useInstitutionGraph";
import { cn } from "@/lib/utils";

interface StakeholderRow {
  id: string;
  name: string;
  type: string;
  country: string | null;
  website: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Props {
  table: "institutions" | "partner_organizations";
  title: string;
  fallbackTypeOptions: string[];
}

const STATUS_OPTIONS = ["prospect", "engaged", "active", "paused", "dropped"];

export function StakeholderRegistry({ table, title, fallbackTypeOptions }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { typesQuery } = useInstitutionGraph();
  const [draft, setDraft] = useState<Partial<StakeholderRow>>({ status: "prospect" });

  // Use dynamic taxonomy for institutions, fallback for partner orgs
  const typeOptions =
    table === "institutions" && typesQuery.data ? typesQuery.data.map((t) => t.key) : fallbackTypeOptions;

  const listQuery = useQuery({
    queryKey: [table],
    queryFn: async (): Promise<StakeholderRow[]> => {
      const { data, error } = await supabase
        .from(table as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  // Relational Rollups (For Institutions Only)
  const { data: rollups } = useQuery({
    queryKey: ["all_institution_rollups", table],
    enabled: table === "institutions" && !!listQuery.data,
    queryFn: async () => {
      const ids = listQuery.data?.map((i) => i.id) || [];
      if (ids.length === 0) return {};

      const [talents, programs] = await Promise.all([
        supabase.from("talents").select("institution_id"),
        supabase.from("study_abroad_programs").select("institution_id"),
      ]);

      const rollupMap: Record<string, { talents: number; programs: number }> = {};
      ids.forEach((id) => (rollupMap[id] = { talents: 0, programs: 0 }));

      talents.data?.forEach((t) => {
        if (t.institution_id) rollupMap[t.institution_id].talents++;
      });
      programs.data?.forEach((p) => {
        if (p.institution_id) rollupMap[p.institution_id].programs++;
      });

      return rollupMap;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      // Ensure type is set before saving
      const finalDraft = { ...draft, type: draft.type || typeOptions[0] };
      const { error } = await supabase.from(table as any).insert(finalDraft as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${title.slice(0, -1)} Deployed`);
      qc.invalidateQueries({ queryKey: [table] });
      setDraft({ type: typeOptions[0], status: "prospect" });
      setOpen(false);
    },
    onError: (e: any) => toast.error(`Deployment Fault: ${e.message}`),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Node Terminated");
      qc.invalidateQueries({ queryKey: [table] });
    },
  });

  const rows = listQuery.data?.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Building2 className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{title}</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Global Graph Registry & Node Management
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="SEARCH REGISTRY..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-[250px] rounded-xl border-2 pl-10 font-bold uppercase text-[10px] tracking-widest bg-card/30 focus-visible:border-primary/40 transition-colors"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => listQuery.refetch()}
            disabled={listQuery.isRefetching}
            className="h-12 w-12 rounded-xl border-2 bg-background/50 hover:bg-primary/5 shrink-0 shadow-sm"
          >
            <RefreshCw className={cn("h-4 w-4 text-primary", listQuery.isRefetching && "animate-spin")} />
          </Button>
          <Button
            onClick={() => {
              setDraft({ type: typeOptions[0], status: "prospect" });
              setOpen(true);
            }}
            className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Deploy Node
          </Button>
        </div>
      </header>

      {listQuery.isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-full rounded-[32px] bg-muted/40" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-transparent shadow-none">
          <CardContent className="p-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-black uppercase tracking-widest text-muted-foreground/50 italic text-sm">
              Zero records detected.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => (
            <Card
              key={r.id}
              className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-sm hover:border-primary/20 hover:bg-primary/5 transition-all group overflow-hidden"
            >
              <CardContent className="p-6 flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="flex items-start gap-5 min-w-0 flex-1">
                  <div className="h-14 w-14 rounded-2xl bg-background/50 flex items-center justify-center border-2 border-border/20 shadow-sm shrink-0 group-hover:border-primary/30 transition-colors">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-xl uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors">
                        {r.name}
                      </h4>
                      <Badge
                        className={cn(
                          "font-black text-[8px] uppercase tracking-widest border-none px-2 py-0.5",
                          r.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground/60",
                        )}
                      >
                        {r.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-black text-[8px] uppercase tracking-widest border-2">
                        {typesQuery.data?.find((t) => t.key === r.type)?.label || r.type.replace("_", " ")}
                      </Badge>
                      {r.country && (
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1 border-l border-border/20 pl-2">
                          <Globe className="h-3 w-3" /> {r.country}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      {r.website && (
                        <a
                          href={r.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-blue-500 transition-colors uppercase tracking-widest"
                        >
                          <Globe className="h-3 w-3" /> Site
                        </a>
                      )}
                      {r.contact_email && (
                        <a
                          href={`mailto:${r.contact_email}`}
                          className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-blue-500 transition-colors uppercase tracking-widest"
                        >
                          <Mail className="h-3 w-3" /> Email
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-4 shrink-0 w-full md:w-auto">
                  <div className="flex items-center gap-2 self-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all opacity-20 group-hover:opacity-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm("Purge Node?")) remove.mutate(r.id);
                      }}
                      className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all opacity-20 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Global Graph Telemetry (Institutions Only) */}
                  {table === "institutions" && rollups && rollups[r.id] && (
                    <div className="flex items-center gap-3 bg-muted/10 px-4 py-2 rounded-xl border border-border/10">
                      <div className="flex items-center gap-1.5" title="Connected Talent">
                        <Users className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black font-mono text-muted-foreground">
                          {rollups[r.id].talents}
                        </span>
                      </div>
                      <div className="h-3 w-px bg-border/40" />
                      <div className="flex items-center gap-1.5" title="Study Abroad Programs">
                        <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-[10px] font-black font-mono text-muted-foreground">
                          {rollups[r.id].programs}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Deployment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-[40px] border-4 border-border/40 p-0 overflow-hidden bg-background/95 backdrop-blur-2xl shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 pb-0">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4">
                <Activity className="h-8 w-8 text-primary fill-primary/20" />
                <div className="space-y-1 text-left">
                  <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                    Node Deployment
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic text-muted-foreground/60">
                    Initialize new stakeholder identity in the global graph
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pb-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Entity Name *
                </Label>
                <Input
                  placeholder="E.g. Harvard University"
                  value={draft.name ?? ""}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="h-14 rounded-xl border-2 font-bold bg-muted/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Classification
                  </Label>
                  <Select value={draft.type || typeOptions[0]} onValueChange={(v) => setDraft({ ...draft, type: v })}>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold uppercase text-xs bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {typeOptions.map((t) => (
                        <SelectItem key={t} value={t} className="font-bold text-xs uppercase tracking-widest">
                          {typesQuery.data?.find((node) => node.key === t)?.label || t.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Deployment Status
                  </Label>
                  <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                    <SelectTrigger className="h-14 rounded-xl border-2 font-bold uppercase text-xs bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s} className="font-bold text-xs uppercase tracking-widest">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Country</Label>
                  <Input
                    placeholder="E.g. USA"
                    value={draft.country ?? ""}
                    onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                    className="h-14 rounded-xl border-2 bg-muted/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Website Route
                  </Label>
                  <Input
                    placeholder="https://"
                    value={draft.website ?? ""}
                    onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                    className="h-14 rounded-xl border-2 font-mono text-sm bg-muted/20"
                  />
                </div>
              </div>

              <div className="p-6 rounded-[24px] border-2 border-border/10 bg-muted/5 space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Routing Point of Contact
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Name"
                    value={draft.contact_name ?? ""}
                    onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })}
                    className="h-12 rounded-xl border-2 bg-background/50"
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={draft.contact_email ?? ""}
                    onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })}
                    className="h-12 rounded-xl border-2 bg-background/50"
                  />
                  <Input
                    placeholder="Phone"
                    value={draft.contact_phone ?? ""}
                    onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })}
                    className="h-12 rounded-xl border-2 bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Internal Notes
                </Label>
                <Textarea
                  placeholder="Context..."
                  rows={2}
                  value={draft.notes ?? ""}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  className="min-h-[100px] rounded-2xl border-2 bg-muted/20 p-4"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-border/10 bg-muted/5 flex-col sm:flex-row gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-14 px-8 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest italic text-muted-foreground hover:text-foreground transition-colors"
            >
              Abort
            </Button>
            <Button
              disabled={!draft.name || create.isPending}
              onClick={() => create.mutate()}
              className="h-14 px-10 rounded-[24px] font-black uppercase italic tracking-tighter text-lg gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex-1"
            >
              <ShieldCheck className="h-5 w-5 fill-current" />
              {create.isPending ? "Syncing..." : "Authorize Deployment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function InstitutionsManager() {
  return (
    <StakeholderRegistry
      table="institutions"
      title="Institutions"
      fallbackTypeOptions={["university", "training_partner", "accelerator", "school"]}
    />
  );
}

export function PartnerOrgsManager() {
  return (
    <StakeholderRegistry
      table="partner_organizations"
      title="Partner Organizations"
      fallbackTypeOptions={["ngo", "employer_association", "government", "chamber", "other"]}
    />
  );
}
