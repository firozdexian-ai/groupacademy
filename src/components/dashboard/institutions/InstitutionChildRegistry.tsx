/**
 * Generic CRUD list for child entities of institutions: clubs, representatives, events.
 * Keeps the UI minimal and reuses a single shape so we can add three modules cheaply.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
}

function ChildRegistry({ table, title, description, fields, badgeKey }: Props) {
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
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: [table] });
      setDraft({});
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
    },
  });

  const institutionsById = useMemo(
    () => Object.fromEntries((institutionsQ.data ?? []).map((i: any) => [i.id, i.name])),
    [institutionsQ.data],
  );

  const rows = listQ.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add {title.toLowerCase()}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select
                value={draft.institution_id ?? ""}
                onValueChange={(v) => setDraft({ ...draft, institution_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Institution *" /></SelectTrigger>
                <SelectContent>
                  {(institutionsQ.data ?? []).map((i: any) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fields.map((f) => {
                if (f.type === "select" && f.options) {
                  return (
                    <Select key={f.key} value={draft[f.key] ?? ""} onValueChange={(v) => setDraft({ ...draft, [f.key]: v })}>
                      <SelectTrigger><SelectValue placeholder={f.label} /></SelectTrigger>
                      <SelectContent>
                        {f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  );
                }
                if (f.type === "textarea") {
                  return (
                    <Textarea key={f.key} placeholder={f.label} rows={2}
                      value={draft[f.key] ?? ""}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
                  );
                }
                return (
                  <Input
                    key={f.key}
                    type={f.type ?? "text"}
                    placeholder={f.label}
                    value={draft[f.key] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  />
                );
              })}
              <Button
                disabled={!draft.institution_id || create.isPending}
                onClick={() => create.mutate()}
                className="w-full"
              >
                {create.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {listQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No records yet.</Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <Card key={r.id} className="p-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium truncate">{r.name ?? r.title}</p>
                  {badgeKey && r[badgeKey] && (
                    <Badge variant="outline" className="text-[10px]">{r[badgeKey]}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {institutionsById[r.institution_id] ?? "—"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                  {r.role && <span>{r.role}</span>}
                  {r.email && <span>{r.email}</span>}
                  {r.phone && <span>{r.phone}</span>}
                  {r.department && <span>{r.department}</span>}
                  {r.location && <span>{r.location}</span>}
                  {r.starts_at && <span>{new Date(r.starts_at).toLocaleString()}</span>}
                </div>
                {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.notes}</p>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remove?")) remove.mutate(r.id); }}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClubsManager() {
  return (
    <ChildRegistry
      table="institution_clubs"
      title="Clubs & Affiliated Departments"
      description="Student clubs, societies and academic departments under each institution."
      fields={[
        { key: "name", label: "Club / department name *" },
        { key: "department", label: "Parent department" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}

export function RepresentativesManager() {
  return (
    <ChildRegistry
      table="institution_representatives"
      title="Representatives"
      description="Point-of-contact people inside each institution or club."
      fields={[
        { key: "name", label: "Full name *" },
        { key: "role", label: "Role / title" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Phone" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}

export function OrgEventsManager() {
  return (
    <ChildRegistry
      table="institution_events"
      title="Events & Competitions"
      description="Events, hackathons, conferences and competitions hosted by these organizations."
      badgeKey="type"
      fields={[
        { key: "title", label: "Title *" },
        { key: "type", label: "Type", type: "select", options: ["event", "competition", "conference", "workshop"] },
        { key: "starts_at", label: "Starts at", type: "datetime-local" },
        { key: "ends_at", label: "Ends at", type: "datetime-local" },
        { key: "location", label: "Location" },
        { key: "url", label: "URL" },
        { key: "status", label: "Status", type: "select", options: ["planned", "live", "completed", "cancelled"] },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
