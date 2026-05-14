/**
 * Institutional Child Registry — Phase INST-Z2 Hardened
 * CTO Version: May 2026
 * Fixes: B4 (Radix Crash), B5 (Null club_id), R3/R4 (Field Restoration), P5 (Empty States)
 */
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  Building2,
  Calendar,
  Network,
  MapPin,
  Mail,
  Phone,
  Clock,
  Pencil,
  Filter,
  AlertTriangle,
  Users,
  ExternalLink,
  Globe,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const NONE_SENTINEL = "__none__";

interface Field {
  key: string;
  label: string;
  type?: "text" | "email" | "datetime-local" | "select" | "textarea";
  options?: string[];
}

interface Props {
  table: "institution_clubs" | "institution_representatives" | "institution_events";
  title: string;
  description: string;
  fields: Field[];
  badgeKey?: string;
  icon: any;
}

function ChildRegistry({ table, title, description, fields, badgeKey, icon: Icon }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [purgeId, setPurgeId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<any | null>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});

  const [instFilter, setInstFilter] = useState<string>("all");
  const [eventTab, setEventTab] = useState<"upcoming" | "past">("upcoming");

  const institutionsQ = useQuery({
    queryKey: ["institutions-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institutions").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const clubsQ = useQuery({
    queryKey: ["clubs-lookup", draft.institution_id],
    enabled: table === "institution_representatives" && !!draft.institution_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("institution_clubs")
        .select("id, name")
        .eq("institution_id", draft.institution_id);
      return data ?? [];
    },
  });

  const listQ = useQuery({
    queryKey: [table, instFilter, eventTab],
    queryFn: async () => {
      let query = supabase.from(table as any).select("*");
      if (instFilter !== "all") query = query.eq("institution_id", instFilter);

      if (table === "institution_events") {
        const now = new Date().toISOString();
        query =
          eventTab === "upcoming"
            ? query.gte("starts_at", now).order("starts_at", { ascending: true })
            : query.lt("starts_at", now).order("starts_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...draft };
      // B5 Fix: Explicit nullification of club_id via sentinel
      if (payload.club_id === NONE_SENTINEL) payload.club_id = null;

      const query = editingNode
        ? supabase
            .from(table as any)
            .update(payload)
            .eq("id", editingNode.id)
        : supabase.from(table as any).insert([payload]);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registry Protocol Updated");
      qc.invalidateQueries({ queryKey: [table] });
      setOpen(false);
      setEditingNode(null);
      setDraft({});
    },
    onError: (e: any) => toast.error(`Sync Fault: ${e.message}`),
  });

  const handleEdit = (row: any) => {
    setEditingNode(row);
    // B4 Fix: Map null to sentinel for Radix safety
    setDraft({ ...row, club_id: row.club_id ?? NONE_SENTINEL });
    setOpen(true);
  };

  const institutionsById = useMemo(
    () => Object.fromEntries((institutionsQ.data ?? []).map((i: any) => [i.id, i.name])),
    [institutionsQ.data],
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-4 md:p-6 text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Icon className="h-8 w-8 text-primary" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{title}</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            {description}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingNode(null);
            setDraft({});
            setOpen(true);
          }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Inject Node
        </Button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-[300px]">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <Select value={instFilter} onValueChange={setInstFilter}>
            <SelectTrigger className="h-12 rounded-xl border-2 pl-10 font-black uppercase text-[10px] bg-card/30">
              <SelectValue placeholder="FILTER BY INSTITUTION" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL INSTITUTIONS</SelectItem>
              {institutionsQ.data?.map((i) => (
                <SelectItem key={i.id} value={i.id} className="uppercase font-bold text-[10px]">
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {table === "institution_events" && (
          <div className="flex p-1 bg-muted/20 rounded-xl border-2 border-border/40">
            <button
              onClick={() => setEventTab("upcoming")}
              className={cn(
                "px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                eventTab === "upcoming" ? "bg-primary text-white shadow-lg" : "text-muted-foreground",
              )}
            >
              Upcoming
            </button>
            <button
              onClick={() => setEventTab("past")}
              className={cn(
                "px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                eventTab === "past" ? "bg-primary text-white shadow-lg" : "text-muted-foreground",
              )}
            >
              Past
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {listQ.isLoading ? (
          <div className="h-48 animate-pulse bg-muted/40 rounded-[32px]" />
        ) : listQ.data?.length === 0 ? (
          <Card className="rounded-[40px] border-2 border-dashed p-20 text-center opacity-30 font-black uppercase tracking-widest text-xs italic">
            Registry Context Empty
          </Card>
        ) : (
          listQ.data?.map((r) => (
            <Card
              key={r.id}
              className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm group hover:border-primary/20 transition-all"
            >
              <CardContent className="p-6 flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="flex items-start gap-5 flex-1 min-w-0">
                  <div className="h-14 w-14 rounded-2xl bg-background/50 flex items-center justify-center border-2 border-border/20 shrink-0 group-hover:border-primary/30 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-xl uppercase italic tracking-tighter truncate">
                        {r.name ?? r.title}
                      </h4>
                      {badgeKey && r[badgeKey] && (
                        <Badge
                          variant="outline"
                          className="font-black text-[8px] uppercase tracking-widest border-2 bg-primary/5"
                        >
                          {r[badgeKey].replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md">
                        <Building2 className="h-3 w-3" /> {institutionsById[r.institution_id] ?? "Independent"}
                      </span>
                    </div>
                    {/* R3 Fix: Rich Data Display for Reps/Clubs/Events */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] font-bold text-muted-foreground/60 uppercase">
                      {r.role && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {r.role}
                        </span>
                      )}
                      {r.email && (
                        <span className="flex items-center gap-1 text-blue-500/80">
                          <Mail className="h-3 w-3" /> {r.email}
                        </span>
                      )}
                      {r.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {r.phone}
                        </span>
                      )}
                      {r.department && (
                        <span className="flex items-center gap-1">
                          <Network className="h-3 w-3" /> Dept: {r.department}
                        </span>
                      )}
                      {r.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {r.location}
                        </span>
                      )}
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="h-3 w-3" /> Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(r)}
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPurgeId(r.id)}
                    className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] border-4 border-border/40 p-0 overflow-hidden bg-background shadow-2xl">
          <div className="h-2 w-full bg-primary" />
          <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                {editingNode ? "Recalibrate Node" : "Node Deployment"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Parent Institution *</Label>
                <Select
                  value={draft.institution_id ?? ""}
                  onValueChange={(v) => setDraft({ ...draft, institution_id: v })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                    <SelectValue placeholder="LINK TO INSTITUTION" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutionsQ.data?.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {table === "institution_representatives" && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Linked Club / Society</Label>
                  {/* B4 Fix: Using NONE_SENTINEL to avoid Radix empty string crash */}
                  <Select
                    value={draft.club_id ?? NONE_SENTINEL}
                    onValueChange={(v) => setDraft({ ...draft, club_id: v })}
                    disabled={!draft.institution_id}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2">
                      <SelectValue placeholder="SELECT CLUB (OPTIONAL)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_SENTINEL}>NO SPECIFIC CLUB</SelectItem>
                      {clubsQ.data?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {fields.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      value={draft[f.key] ?? ""}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      className="rounded-xl border-2 h-24"
                    />
                  ) : f.type === "select" ? (
                    <Select value={draft[f.key] ?? ""} onValueChange={(v) => setDraft({ ...draft, [f.key]: v })}>
                      <SelectTrigger className="h-12 rounded-xl border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {f.options?.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={f.type ?? "text"}
                      value={draft[f.key] ?? ""}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      className="h-12 rounded-xl border-2 font-bold"
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="h-12 rounded-xl font-black uppercase text-[10px]"
              >
                Abort
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!draft.institution_id || saveMutation.isPending}
                className="h-12 rounded-xl font-black uppercase italic text-[10px] flex-1 shadow-lg"
              >
                {saveMutation.isPending ? "Syncing..." : editingNode ? "Commit Calibration" : "Authorize Node"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!purgeId} onOpenChange={() => setPurgeId(null)}>
        <AlertDialogContent className="rounded-[32px] border-4 border-destructive/20 bg-background/95">
          <AlertDialogHeader className="items-center text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4 border-2 border-destructive/20">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-destructive">
              Terminate Node?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 leading-relaxed">
              System warning: This protocol permanently purges the entity from the Global Graph.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl font-black uppercase text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => purgeId && qc.invalidateQueries({ queryKey: [table] })}
              className="h-12 bg-destructive text-white rounded-xl font-black uppercase text-[10px]"
            >
              Confirm Termination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ClubsManager() {
  return (
    <ChildRegistry
      table="institution_clubs"
      title="Clubs & Affiliations"
      description="Campus societies and academic department mappings."
      icon={Network}
      fields={[
        { key: "name", label: "Node Name *" },
        { key: "department", label: "Parent Department" },
        { key: "notes", label: "Telemetry Notes", type: "textarea" },
      ]}
    />
  );
}

export function RepresentativesManager() {
  return (
    <ChildRegistry
      table="institution_representatives"
      title="Liaisons"
      description="Operational points-of-contact within institutions."
      icon={Users}
      fields={[
        { key: "name", label: "Operator Name *" },
        { key: "role", label: "Authority / Title" },
        { key: "email", label: "Transmission Email", type: "email" },
        { key: "phone", label: "Comms Link (Phone)" },
        { key: "notes", label: "Telemetry Notes", type: "textarea" },
      ]}
    />
  );
}

export function OrgEventsManager() {
  return (
    <ChildRegistry
      table="institution_events"
      title="Events & Ops"
      description="Global Graph hosted hackathons and summits."
      icon={Calendar}
      badgeKey="status"
      fields={[
        { key: "title", label: "Operation Title *" },
        {
          key: "type",
          label: "Classification",
          type: "select",
          options: ["event", "competition", "conference", "workshop"],
        },
        { key: "starts_at", label: "Start Sequence", type: "datetime-local" },
        { key: "ends_at", label: "End Sequence", type: "datetime-local" },
        { key: "location", label: "Vector (Location)" },
        { key: "url", label: "Link (URL)" }, // R4 Fix: URL field added
        { key: "status", label: "Status", type: "select", options: ["planned", "live", "completed", "cancelled"] },
      ]}
    />
  );
}
