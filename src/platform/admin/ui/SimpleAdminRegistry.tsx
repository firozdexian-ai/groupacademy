/**
 * Generic CRUD registry for admin-only tables. Used by HR, GTM and similar
 * lightweight tabs to avoid duplicating the same dialog + list shape.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
 listAdminTableRows,
 insertAdminTableRow,
 deleteAdminTableRow,
} from "@/domains/admin/repo/adminRepo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
 Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export interface SimpleField {
 key: string;
 label: string;
 type?: "text" | "number" | "textarea" | "email";
 required?: boolean;
 placeholder?: string;
}

interface Props {
 table: string;
 title: string;
 description: string;
 fields: SimpleField[];
 primaryKey?: string;
}

export function SimpleAdminRegistry({
 table, title, description, fields, primaryKey = "name",
}: Props) {
 const qc = useQueryClient();
 const [open, setOpen] = useState(false);
 const [draft, setDraft] = useState<Record<string, any>>({});

 const listQ = useQuery({
 queryKey: [`admin-table:${table}`],
 queryFn: () => listAdminTableRows(table),
 });

 const create = useMutation({
 mutationFn: async () => {
 const payload: any = {};
 for (const f of fields) {
 const v = draft[f.key];
 if (v === undefined || v === "") continue;
 payload[f.key] = f.type === "number" ? Number(v) : v;
 }
 await insertAdminTableRow(table, payload);
 },
 onSuccess: () => {
 toast.success("Saved");
 qc.invalidateQueries({ queryKey: [`admin-table:${table}`] });
 setDraft({});
 setOpen(false);
 },
 onError: (e: any) => toast.error(e.message),
 });

 const remove = useMutation({
 mutationFn: (id: string) => deleteAdminTableRow(table, id),
 onSuccess: () => qc.invalidateQueries({ queryKey: [`admin-table:${table}`] }),
 });

 const rows = listQ.data ?? [];
 const requiredOk = fields.filter((f) => f.required).every((f) => draft[f.key]);

 return (
 <div className="space-y-4">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
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
 {fields.map((f) => (
 f.type === "textarea" ? (
 <Textarea key={f.key} placeholder={f.label + (f.required ? " *" : "")} rows={2}
 value={draft[f.key] ?? ""}
 onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
 ) : (
 <Input
 key={f.key}
 type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
 placeholder={f.label + (f.required ? " *" : "")}
 value={draft[f.key] ?? ""}
 onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
 />
 )
 ))}
 <Button disabled={!requiredOk || create.isPending} onClick={() => create.mutate()} className="w-full">
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
 <p className="font-medium truncate">
 {r[primaryKey] ?? r.title ?? r.id}
 </p>
 <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
 {fields
 .filter((f) => f.key !== primaryKey && r[f.key])
 .slice(0, 4)
 .map((f) => <span key={f.key}>{String(r[f.key]).slice(0, 60)}</span>)}
 </div>
 </div>
 <Button size="sm" variant="ghost"
 onClick={() => { if (confirm("Remove?")) remove.mutate(r.id); }}>
 <Trash2 className="h-3.5 w-3.5 text-destructive" />
 </Button>
 </Card>
 ))}
 </div>
 )}
 </div>
 );
}
