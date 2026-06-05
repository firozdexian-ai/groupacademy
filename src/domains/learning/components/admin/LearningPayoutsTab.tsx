import { useState } from "react";
import { useLearningGraph } from "./hooks/useLearningGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Wallet, ShieldCheck, DollarSign, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LearningPayoutsTab() {
 const {
 learningGraphQuery,
 mutations: { upsertPayout, deletePayout },
 } = useLearningGraph();
 const { data, isLoading } = learningGraphQuery;
 const [open, setOpen] = useState(false);
 const [draft, setDraft] = useState<any>({ status: "pending", amount: 0 });

 return (
 <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
 <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
 <div className="space-y-1 text-left">
 <div className="flex items-center gap-3 text-success">
 <Wallet className="h-8 w-8 text-success fill-success/20" />
 <h2 className="text-3xl font-medium tracking-tighter italic leading-none text-foreground">
 Instructor Payouts
 </h2>
 </div>
 <p className="text-[10px] font-medium tracking-[0.3em] text-muted-foreground/60 italic">
 Educational Revenue Ledgers
 </p>
 </div>
 <Button
 onClick={() => {
 setDraft({ status: "pending", amount: 0 });
 setOpen(true);
 }}
 className="h-12 px-8 rounded-xl font-medium text-xs gap-2 shadow-lg shadow-emerald-500/20 bg-success hover:bg-success text-primary-foreground"
 >
 <Plus className="h-4 w-4" /> Log Payout
 </Button>
 </header>

 <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
 <div className="h-1.5 w-full bg-gradient-to-r from-success via-accent to-success" />
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <Table>
 <TableHeader className="bg-muted/10 border-b border-border/20">
 <TableRow className="hover:bg-transparent">
 <TableHead className="font-medium text-xs py-5 pl-8">
 Transaction ID
 </TableHead>
 <TableHead className="font-medium text-xs">Instructor Node</TableHead>
 <TableHead className="font-medium text-xs">Disbursement</TableHead>
 <TableHead className="font-medium text-xs">Status</TableHead>
 <TableHead className="text-right py-5 pr-8">Manage</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-border/5">
 {isLoading ? (
 <TableRow>
 <TableCell colSpan={5} className="py-20 text-center">
 <Skeleton className="h-8 w-32 mx-auto" />
 </TableCell>
 </TableRow>
 ) : data?.payouts?.length === 0 ? (
 <TableRow>
 <TableCell
 colSpan={5}
 className="py-20 text-center font-medium text-xs text-muted-foreground/50 italic"
 >
 Zero payout requests detected.
 </TableCell>
 </TableRow>
 ) : (
 data?.payouts?.map((row: any) => (
 <TableRow key={row.id} className="group hover:bg-success/[0.02]">
 <TableCell className="py-6 pl-8">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-background border border-border/40 flex items-center justify-center shrink-0">
 <Wallet className="h-3 w-3 text-success" />
 </div>
 <span className="font-mono text-xs uppercase tracking-tight text-muted-foreground">
 {row.id?.substring(0, 8)}
 </span>
 </div>
 </TableCell>
 <TableCell>
 <span className="font-mono text-[10px] text-foreground font-black flex items-center gap-1.5">
 <User className="h-3 w-3 text-success" />{" "}
 {row.instructor_user_id ? row.instructor_user_id.substring(0, 8) : "System"}
 </span>
 </TableCell>
 <TableCell>
 <span className="font-mono text-sm font-black text-success bg-success/10 px-3 py-1 rounded-lg flex items-center gap-1 w-fit">
 <DollarSign className="h-3 w-3" /> {row.amount_credits || row.amount || 0}
 </span>
 </TableCell>
 <TableCell>
 <Badge
 className={cn(
 "font-bold text-[9px] border-none px-3",
 row.status === "completed"
 ? "bg-success/10 text-success"
 : row.status === "rejected"
 ? "bg-destructive/10 text-destructive"
 : "bg-warning/10 text-warning",
 )}
 >
 {row.status}
 </Badge>
 </TableCell>
 <TableCell className="text-right pr-8">
 <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
 <Button
 variant="ghost"
 size="icon" aria-label="Edit"
 onClick={() => {
 setDraft({ ...row, amount: row.amount_credits || row.amount });
 setOpen(true);
 }}
 className="hover:bg-success/10 hover:text-success"
 >
 <Pencil className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon" aria-label="Delete"
 className="text-destructive hover:bg-destructive/10"
 onClick={() => {
 if (confirm("Purge Request?")) deletePayout.mutate(row.id);
 }}
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>

 <Dialog open={open} onOpenChange={setOpen}>
 <DialogContent className="max-w-md rounded-2xl p-8 border-4 border-border/40 text-left">
 <DialogHeader>
 <DialogTitle className="text-2xl font-semibold text-success flex items-center gap-2">
 <Wallet className="h-6 w-6" /> Process Payout
 </DialogTitle>
 <DialogDescription className="text-sm text-muted-foreground">
 Update instructor withdrawal ledger.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <Label className="text-[10px] font-black text-primary ml-1">
 Instructor User ID
 </Label>
 <Input
 placeholder="UUID"
 value={draft.instructor_user_id || ""}
 onChange={(e) => setDraft({ ...draft, instructor_user_id: e.target.value })}
 className="h-14 rounded-xl border font-mono text-xs"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label className="text-[10px] font-black text-success ml-1">
 Disbursement
 </Label>
 <Input
 type="number"
 placeholder="0"
 value={draft.amount || ""}
 onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
 className="h-14 rounded-xl border border-success/30 bg-success/5 font-black text-success text-lg"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-black text-primary ml-1">
 Payout Status
 </Label>
 <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
 <SelectTrigger className="h-14 rounded-xl border font-bold text-xs uppercase">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="pending" className="font-bold text-xs text-warning">
 Pending
 </SelectItem>
 <SelectItem
 value="completed"
 className="font-bold text-xs text-success"
 >
 Completed
 </SelectItem>
 <SelectItem value="rejected" className="font-bold text-xs text-destructive">
 Rejected
 </SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </div>
 <Button
 disabled={!draft.instructor_user_id || upsertPayout.isPending}
 onClick={() => {
 const payload = { ...draft, amount_credits: draft.amount };
 delete payload.amount;
 upsertPayout.mutate(payload, { onSuccess: () => setOpen(false) });
 }}
 className="h-14 rounded-xl font-medium bg-success hover:bg-success text-primary-foreground"
 >
 <ShieldCheck className="mr-2 h-5 w-5" /> Authorize Ledger
 </Button>
 </DialogContent>
 </Dialog>
 </div>
 );
}

export default LearningPayoutsTab;
