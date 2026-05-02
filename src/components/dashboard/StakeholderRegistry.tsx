/**
 * Generic stakeholder registry table used by both Institutions and
 * Partner Organizations. Provides list + add/edit/delete for super-admins.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Globe, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
  typeOptions: string[];
}

const STATUS_OPTIONS = ["prospect", "engaged", "active", "paused", "dropped"];

export function StakeholderRegistry({ table, title, typeOptions }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<StakeholderRow>>({ type: typeOptions[0], status: "prospect" });

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

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from(table as any).insert(draft as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${title.slice(0, -1)} added`);
      qc.invalidateQueries({ queryKey: [table] });
      setDraft({ type: typeOptions[0], status: "prospect" });
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
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: [table] });
    },
  });

  const rows = listQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{rows.length} record{rows.length === 1 ? "" : "s"}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add {title.toLowerCase().slice(0, -1)}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Name *" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Country" value={draft.country ?? ""} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
              <Input placeholder="Website" value={draft.website ?? ""} onChange={(e) => setDraft({ ...draft, website: e.target.value })} />
              <Input placeholder="Contact name" value={draft.contact_name ?? ""} onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })} />
              <Input placeholder="Contact email" type="email" value={draft.contact_email ?? ""} onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })} />
              <Input placeholder="Contact phone" value={draft.contact_phone ?? ""} onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })} />
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea placeholder="Notes" rows={2} value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              <Button disabled={!draft.name || create.isPending} onClick={() => create.mutate()} className="w-full">
                {create.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {listQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No records yet. Add your first.</Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <Card key={r.id} className="p-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{r.name}</p>
                  <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{r.status}</Badge>
                  {r.country && <span className="text-xs text-muted-foreground">{r.country}</span>}
                </div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                  {r.website && <a href={r.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary"><Globe className="h-3 w-3" />{r.website.replace(/^https?:\/\//, "")}</a>}
                  {r.contact_email && <a href={`mailto:${r.contact_email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" />{r.contact_email}</a>}
                  {r.contact_name && <span>· {r.contact_name}</span>}
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

export function InstitutionsManager() {
  return <StakeholderRegistry table="institutions" title="Institutions" typeOptions={["university", "training_partner", "accelerator", "school"]} />;
}

export function PartnerOrgsManager() {
  return <StakeholderRegistry table="partner_organizations" title="Partner Organizations" typeOptions={["ngo", "employer_association", "government", "chamber", "other"]} />;
}
