/**
 * Stakeholder Registry Hub — Phase INST-Z2 Hardened
 * CTO Version: May 2026
 * Fixes: R1 (Restore 6 dialog fields), R2 (Card metadata surface), P5 (Empty States)
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
 listStakeholders,
 getInstitutionRollups,
 upsertGraphRow,
 deleteGraphRow,
} from "@/domains/institutions/repo/institutionsRepo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
 Filter,
 AlertTriangle,
 User,
 FileText,
 Phone,
 ExternalLink,
} from "lucide-react";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
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
import { useInstitutionGraph } from "./hooks/useInstitutionGraph";
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
 const [statusFilter, setStatusFilter] = useState("all");
 const [editingRow, setEditingRow] = useState<StakeholderRow | null>(null);
 const [purgeId, setPurgeId] = useState<string | null>(null);

 const { typesQuery } = useInstitutionGraph();
 const [draft, setDraft] = useState<Partial<StakeholderRow>>({ status: "prospect" });

 const typeOptions =
 table === "institutions" && typesQuery.data ? typesQuery.data.map((t) => t.key) : fallbackTypeOptions;

 const listQuery = useQuery({
 queryKey: [table],
 queryFn: async (): Promise<StakeholderRow[]> => {
 const data = await listStakeholders(table);
 return data as unknown as StakeholderRow[];
 },
 });

 const { data: rollups } = useQuery({
 queryKey: ["institution_rollups_rpc"],
 enabled: table === "institutions",
 queryFn: getInstitutionRollups,
 });

 const saveMutation = useMutation({
 mutationFn: async () => {
 const finalDraft = { ...draft, type: draft.type || typeOptions[0] };
 const payload = editingRow ? { ...finalDraft, id: editingRow.id } : finalDraft;
 await upsertGraphRow(table, payload);
 },
 onSuccess: () => {
 toast.success(editingRow ? "Node Recalibrated" : "Node Deployed");
 qc.invalidateQueries({ queryKey: [table] });
 setOpen(false);
 setEditingRow(null);
 },
 onError: (e: any) => toast.error(`Operation Fault: ${e.message}`),
 });

 const purgeMutation = useMutation({
 mutationFn: (id: string) => deleteGraphRow(table, id),
 onSuccess: () => {
 toast.success("Node Purged");
 setPurgeId(null);
 qc.invalidateQueries({ queryKey: [table] });
 },
 });

 const handleEdit = (row: StakeholderRow) => {
 setEditingRow(row);
 setDraft(row);
 setOpen(true);
 };

 const rows =
 listQuery.data?.filter((r) => {
 const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
 const matchesStatus = statusFilter === "all" || r.status === statusFilter;
 return matchesSearch && matchesStatus;
 }) ?? [];

 return (
 <div className="space-y-10 animate-in fade-in duration-700 p-4 md:p-6 text-left">
 <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
 <div className="space-y-1">
 <div className="flex items-center gap-3 text-primary">
 <Building2 className="h-8 w-8 text-primary" />
 <h2 className="text-4xl font-medium tracking-tighter italic leading-none">{title}</h2>
 </div>
 <p className="text-[10px] font-medium tracking-[0.3em] text-muted-foreground/60 italic">
 Global Graph Registry · Total Nodes: {listQuery.data?.length || 0}
 </p>
 </div>
 <Button
 onClick={() => {
 setEditingRow(null);
 setDraft({ type: typeOptions[0], status: "prospect" });
 setOpen(true);
 }}
 className="h-10 px-4 rounded-xl font-medium text-xs gap-2 shadow-sm bg-primary text-primary-foreground"
 >
 <Plus className="h-4 w-4" /> Deploy Node
 </Button>
 </header>

 <div className="flex flex-col md:flex-row gap-4">
 <div className="relative flex-1 group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
 <Input
 placeholder="FILTER REGISTRY BY IDENTITY..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="h-10 rounded-xl border pl-12 font-bold uppercase text-xs bg-card"
 />
 </div>
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-full md:w-[220px] h-10 rounded-xl border font-medium text-[10px] bg-background">
 <Filter className="h-4 w-4 mr-2" />
 <SelectValue placeholder="STATUS" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">ALL STATUSES</SelectItem>
 {STATUS_OPTIONS.map((s) => (
 <SelectItem key={s} value={s} className="uppercase font-bold text-[10px]">
 {s}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="grid gap-4">
 {listQuery.isLoading ? (
 <div className="h-64 animate-pulse bg-muted/40 rounded-2xl" />
 ) : rows.length === 0 ? (
 <Card className="rounded-2xl border border-dashed p-20 text-center opacity-30 font-black text-xs italic">
 No matching nodes detected
 </Card>
 ) : (
 rows.map((r) => (
 <Card
 key={r.id}
 className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm group hover:border-primary/20 transition-all"
 >
 <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="flex items-start gap-5 flex-1 min-w-0">
 <div className="h-14 w-14 rounded-2xl bg-background/50 flex items-center justify-center border border-border/40 shrink-0 group-hover:border-primary/30 transition-colors">
 <Building2 className="h-6 w-6 text-primary" />
 </div>
 <div className="space-y-1 flex-1 min-w-0">
 <div className="flex items-center gap-3">
 <h4 className="font-black text-xl font-mediumer truncate">{r.name}</h4>
 <Badge
 variant={r.status === "active" ? "default" : "secondary"}
 className="font-black text-[8px] px-2"
 >
 {r.status}
 </Badge>
 </div>
 <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground/60">
 <span className="flex items-center gap-1.5">
 <Activity className="h-3 w-3" /> {r.type}
 </span>
 {r.country && (
 <span className="border-l border-border/40 pl-3 flex items-center gap-1.5">
 <Globe className="h-3 w-3" /> {r.country}
 </span>
 )}
 </div>
 {/* R2 Fix: Surface Contact Data on Card */}
 <div className="flex flex-wrap items-center gap-4 mt-2 border-t border-border/5 pt-2">
 {r.website && (
 <a
 href={r.website}
 target="_blank"
 rel="noreferrer"
 className="flex items-center gap-1 text-sm font-medium text-blue-500 uppercase hover:underline"
 >
 <ExternalLink className="h-3 w-3" /> Website
 </a>
 )}
 {r.contact_email && (
 <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground uppercase">
 <Mail className="h-3 w-3" /> {r.contact_email}
 </span>
 )}
 {r.contact_name && (
 <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground uppercase tracking-tighter">
 <User className="h-3 w-3" /> {r.contact_name}
 </span>
 )}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-4">
 {table === "institutions" && rollups?.[r.id] && (
 <div className="flex items-center gap-3 bg-muted/10 px-4 py-2 rounded-xl border border-border/10">
 <MetricMini icon={Users} val={rollups[r.id].talent_count} color="text-emerald-500" />
 <MetricMini icon={GraduationCap} val={rollups[r.id].program_count} color="text-blue-500" />
 <MetricMini icon={Activity} val={rollups[r.id].event_count} color="text-amber-500" />
 </div>
 )}
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
 </div>
 </CardContent>
 </Card>
 ))
 )}
 </div>

 <Dialog open={open} onOpenChange={setOpen}>
 <DialogContent className="max-w-2xl rounded-2xl border-4 border-border/40 p-0 overflow-hidden bg-background shadow-sm">
 <div className="h-2 w-full bg-primary" />
 <div className="p-10 space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar">
 <DialogHeader>
 <DialogTitle className="text-3xl font-semibold">
 {editingRow ? "Recalibrate Node" : "Node Deployment"}
 </DialogTitle>
 </DialogHeader>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Identity Block */}
 <div className="md:col-span-2 space-y-2 border-b border-border/10 pb-2">
 <Label className="text-[10px] font-medium italic tracking-widest text-primary">
 Identity & Status
 </Label>
 </div>
 <div className="space-y-2 md:col-span-2">
 <Label className="text-[10px] font-medium ml-1">Entity Name *</Label>
 <Input
 value={draft.name ?? ""}
 onChange={(e) => setDraft({ ...draft, name: e.target.value })}
 className="h-12 rounded-xl border font-bold"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-medium ml-1">Classification</Label>
 <Select value={draft.type || typeOptions[0]} onValueChange={(v) => setDraft({ ...draft, type: v })}>
 <SelectTrigger className="h-12 rounded-xl border font-bold">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {typeOptions.map((t) => (
 <SelectItem key={t} value={t} className="uppercase font-bold">
 {t}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-medium ml-1">Current Status</Label>
 <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
 <SelectTrigger className="h-12 rounded-xl border font-bold">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {STATUS_OPTIONS.map((s) => (
 <SelectItem key={s} value={s} className="uppercase font-bold">
 {s}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* R1 Fix: Geolocation & Web */}
 <div className="md:col-span-2 space-y-2 border-b border-border/10 pb-2 mt-4">
 <Label className="text-[10px] font-medium italic tracking-widest text-primary">
 Reach & Localization
 </Label>
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-medium ml-1">Country</Label>
 <Input
 value={draft.country ?? ""}
 onChange={(e) => setDraft({ ...draft, country: e.target.value })}
 placeholder="e.g. United Kingdom"
 className="h-12 rounded-xl border"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-medium ml-1">Website URL</Label>
 <Input
 value={draft.website ?? ""}
 onChange={(e) => setDraft({ ...draft, website: e.target.value })}
 placeholder="https://"
 className="h-12 rounded-xl border font-mono text-xs"
 />
 </div>

 {/* R1 Fix: Point of Contact */}
 <div className="md:col-span-2 space-y-2 border-b border-border/10 pb-2 mt-4">
 <Label className="text-[10px] font-medium italic tracking-widest text-primary">
 Administrative POC
 </Label>
 </div>
 <div className="space-y-2 md:col-span-2">
 <Label className="text-[10px] font-medium ml-1">Contact Full Name</Label>
 <Input
 value={draft.contact_name ?? ""}
 onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })}
 className="h-12 rounded-xl border"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-medium ml-1">Email Endpoint</Label>
 <Input
 value={draft.contact_email ?? ""}
 onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })}
 type="email"
 className="h-12 rounded-xl border"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-medium ml-1">Phone</Label>
 <Input
 value={draft.contact_phone ?? ""}
 onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })}
 className="h-12 rounded-xl border"
 />
 </div>

 {/* R1 Fix: Internal Notes */}
 <div className="md:col-span-2 space-y-2 mt-4">
 <Label className="text-[10px] font-medium ml-1">Telemetry Notes</Label>
 <Textarea
 value={draft.notes ?? ""}
 onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
 className="min-h-[120px] rounded-2xl border bg-muted/5"
 placeholder="Contextual intelligence..."
 />
 </div>
 </div>

 <DialogFooter className="pt-6 border-t">
 <Button
 variant="ghost"
 onClick={() => setOpen(false)}
 className="h-14 px-8 rounded-xl font-medium text-[10px]"
 >
 Abort
 </Button>
 <Button
 onClick={() => saveMutation.mutate()}
 disabled={saveMutation.isPending}
 className="h-10 px-4 rounded-xl font-medium italic text-lg flex-1 shadow-lg bg-primary"
 >
 {saveMutation.isPending ? "Syncing..." : editingRow ? "Commit Recalibration" : "Authorize Deployment"}
 </Button>
 </DialogFooter>
 </div>
 </DialogContent>
 </Dialog>

 <AlertDialog open={!!purgeId} onOpenChange={() => setPurgeId(null)}>
 <AlertDialogContent className="rounded-2xl border border-destructive/30 bg-background/95">
 <AlertDialogHeader className="items-center text-center">
 <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4 border border-destructive/30">
 <AlertTriangle className="h-8 w-8 text-destructive" />
 </div>
 <AlertDialogTitle className="text-2xl font-semibold">
 Terminate Node?
 </AlertDialogTitle>
 <AlertDialogDescription className="text-xs font-bold text-muted-foreground/60 leading-relaxed">
 This action is immutable. Linked graph dependencies will be orphaned.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter className="mt-8 gap-3">
 <AlertDialogCancel className="h-12 rounded-xl font-medium text-[10px]">Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={() => purgeId && purgeMutation.mutate(purgeId)}
 className="h-12 bg-destructive text-white rounded-xl font-medium text-[10px]"
 >
 Confirm Termination
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </div>
 );
}

export function InstitutionsManager() {
 return (
 <StakeholderRegistry
 table="institutions"
 title="Institutions"
 fallbackTypeOptions={["university", "college", "school", "training_center"]}
 />
 );
}

export function PartnerOrgsManager() {
 return (
 <StakeholderRegistry
 table="partner_organizations"
 title="Partner Organizations"
 fallbackTypeOptions={["ngo", "association", "company", "government"]}
 />
 );
}

function MetricMini({ icon: Icon, val, color }: any) {
 return (
 <div className="flex items-center gap-1.5 px-1">
 <Icon className={cn("h-3.5 w-3.5", color)} />
 <span className="text-[10px] font-black font-mono text-muted-foreground">{val || 0}</span>
 </div>
 );
}
