import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Building2, Users, Calendar, Network, MapPin, Mail, Phone, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
  const [draft, setDraft] = useState<Record<string, any>>({});

  const institutionsQ = useQuery({
    queryKey: ["institutions-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institutions").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const listQ = useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = { ...draft };
      const { error } = await supabase.from(table as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Node Synchronized");
      qc.invalidateQueries({ queryKey: [table] });
      setDraft({});
      setOpen(false);
    },
    onError: (e: any) => toast.error(`Sync Fault: ${e.message}`),
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
      toast.success("Node Purged");
      qc.invalidateQueries({ queryKey: [table] });
    },
  });

  const institutionsById = useMemo(
    () => Object.fromEntries((institutionsQ.data ?? []).map((i: any) => [i.id, i.name])),
    [institutionsQ.data],
  );

  const rows = listQ.data ?? [];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Icon className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{title}</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            {description}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setOpen(true)}
            className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Inject Node
          </Button>
        </div>
      </header>

      {listQ.isLoading || institutionsQ.isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[24px] bg-muted/40" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-transparent shadow-none">
          <CardContent className="p-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center">
              <Icon className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-black uppercase tracking-widest text-muted-foreground/50 italic text-sm">
              Zero records detected.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-primary" />
          <CardContent className="p-0">
            <div className="divide-y divide-border/5">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 hover:bg-primary/[0.02] transition-colors group"
                >
                  <div className="flex items-start gap-5 min-w-0">
                    <div className="h-14 w-14 rounded-2xl bg-background/50 flex items-center justify-center border-2 border-border/20 shadow-sm shrink-0 group-hover:border-primary/30 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-xl uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors">
                          {r.name ?? r.title}
                        </h4>
                        {badgeKey && r[badgeKey] && (
                          <Badge
                            variant="outline"
                            className="font-black text-[9px] uppercase tracking-widest border-2 bg-primary/5 text-primary border-primary/20"
                          >
                            {r[badgeKey].replace("_", " ")}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/40">
                          <Building2 className="h-3 w-3" /> {institutionsById[r.institution_id] ?? "Orphaned Node"}
                        </span>
                        {r.department && (
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-l border-border/20 pl-2">
                            {r.department}
                          </span>
                        )}
                        {r.role && (
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-l border-border/20 pl-2">
                            {r.role}
                          </span>
                        )}
                      </div>

                      {(r.email || r.phone || r.location || r.starts_at) && (
                        <div className="flex flex-wrap gap-4 pt-1">
                          {r.email && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors">
                              <Mail className="h-3 w-3" /> {r.email}
                            </span>
                          )}
                          {r.phone && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                              <Phone className="h-3 w-3" /> {r.phone}
                            </span>
                          )}
                          {r.location && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {r.location}
                            </span>
                          )}
                          {r.starts_at && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                              <Clock className="h-3 w-3" />{" "}
                              {new Date(r.starts_at).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center shrink-0">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] border-4 border-border/40 p-0 overflow-hidden bg-background/95 backdrop-blur-2xl shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-8 pb-0 max-h-[80vh] overflow-y-auto no-scrollbar text-left">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <Icon className="h-8 w-8 text-primary fill-primary/20" />
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                    Node Deployment
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic text-muted-foreground/60">
                    Bind new entity to the Global Graph
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pb-8">
              <div className="space-y-2">
                <Select
                  value={draft.institution_id ?? ""}
                  onValueChange={(v) => setDraft({ ...draft, institution_id: v })}
                >
                  <SelectTrigger className="h-14 rounded-xl border-2 font-bold uppercase text-xs bg-muted/20">
                    <SelectValue placeholder="LINK TO INSTITUTION *" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {(institutionsQ.data ?? []).map((i: any) => (
                      <SelectItem key={i.id} value={i.id} className="font-bold text-xs uppercase tracking-widest">
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {fields.map((f) => {
                if (f.type === "select" && f.options) {
                  return (
                    <div key={f.key} className="space-y-2">
                      <Select value={draft[f.key] ?? ""} onValueChange={(v) => setDraft({ ...draft, [f.key]: v })}>
                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold uppercase text-xs bg-muted/20">
                          <SelectValue placeholder={f.label} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                          {f.options.map((o) => (
                            <SelectItem key={o} value={o} className="font-bold text-xs uppercase tracking-widest">
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                if (f.type === "textarea") {
                  return (
                    <Textarea
                      key={f.key}
                      placeholder={f.label}
                      rows={3}
                      value={draft[f.key] ?? ""}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      className="rounded-xl border-2 font-medium italic text-sm bg-muted/20 p-4 resize-none"
                    />
                  );
                }
                return (
                  <Input
                    key={f.key}
                    type={f.type ?? "text"}
                    placeholder={f.label}
                    value={draft[f.key] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                    className="h-12 rounded-xl border-2 font-bold bg-muted/20"
                  />
                );
              })}
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-border/10 bg-muted/5 flex-col sm:flex-row gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-12 px-6 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest italic text-muted-foreground"
            >
              Abort
            </Button>
            <Button
              disabled={!draft.institution_id || create.isPending}
              onClick={() => create.mutate()}
              className="h-12 px-8 rounded-[20px] font-black uppercase italic tracking-widest text-[10px] gap-2 shadow-lg flex-1"
            >
              {create.isPending ? "Syncing..." : "Authorize Deployment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ClubsManager() {
  return (
    <ChildRegistry
      table="institution_clubs"
      title="Clubs & Affiliations"
      description="Student clubs, societies and academic departments mapped to institutions."
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
      title="Institutional Liaisons"
      description="Point-of-contact operators inside each institution or club."
      icon={Users}
      fields={[
        { key: "name", label: "Operator Name *" },
        { key: "role", label: "Authority Level / Title" },
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
      title="Events & Competitions"
      description="Events, hackathons, and competitions hosted by the Global Graph."
      icon={Calendar}
      badgeKey="type"
      fields={[
        { key: "title", label: "Operation Title *" },
        {
          key: "type",
          label: "Event Classification",
          type: "select",
          options: ["event", "competition", "conference", "workshop"],
        },
        { key: "starts_at", label: "Initialization Sequence (Start)", type: "datetime-local" },
        { key: "ends_at", label: "Termination Sequence (End)", type: "datetime-local" },
        { key: "location", label: "Physical/Digital Vector (Location)" },
        { key: "url", label: "Comms Link (URL)" },
        {
          key: "status",
          label: "Deployment Status",
          type: "select",
          options: ["planned", "live", "completed", "cancelled"],
        },
        { key: "notes", label: "Telemetry Notes", type: "textarea" },
      ]}
    />
  );
}
