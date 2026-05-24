/**
 * Global Broadcast Engine — Phase Z0 Hardened
 * CTO Version: May 2026
 * Fixes: B7 (RPC Broadcast), P4 (Identity List Freshness & Surgical Targeting)
 */
import { useState, useEffect, useCallback } from "react";
import { getCurrentUser } from "@/lib/auth";
import { talentRepo, broadcastNotifications } from "@/domains/talent/repo/talentRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BellRing, Send, ChevronLeft, ChevronRight, Loader2, Activity, Users, User } from "lucide-react";
import { format } from "date-fns";
import { InlineSpinner } from "@/components/common/InlineSpinner";

const ITEMS_PER_PAGE = 10;

export function NotificationsTab() {
 const [notifications, setNotifications] = useState<any[]>([]);
 const [talents, setTalents] = useState<any[]>([]);
 const [categories, setCategories] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [page, setPage] = useState(1);
 const [totalCount, setTotalCount] = useState(0);
 const [sendDialog, setSendDialog] = useState(false);
 const [isSending, setIsSending] = useState(false);

 // New notification state
 const [targetType, setTargetType] = useState<"all" | "category" | "single">("all");
 const [targetId, setTargetId] = useState("");
 const [payload, setPayload] = useState({ title: "", message: "", type: "announcement" });

 const loadData = useCallback(async () => {
 setIsLoading(true);
 try {
 const { data, count, error } = await talentRepo.listNotificationsPage(page, ITEMS_PER_PAGE);

 if (error) throw error;
 setNotifications(data || []);
 setTotalCount(count || 0);

 // Pre-fetch categories for segmenting
 const { data: catData } = await talentRepo.listProfessionCategoriesNames();
 if (catData) setCategories(catData);
 } catch (err) {
 toast.error("Transmission log sync failed");
 } finally {
 setIsLoading(false);
 }
 }, [page]);

 // P4 Fix: surgical targeting list refreshes on dialog open
 useEffect(() => {
 if (sendDialog && targetType === "single") {
 const fetchFreshTalents = async () => {
 const { data } = await talentRepo.listTalentsLite(200);
 if (data) setTalents(data);
 };
 fetchFreshTalents();
 }
 }, [sendDialog, targetType]);

 useEffect(() => {
 loadData();
 }, [loadData]);

 const executeBroadcast = async () => {
 if (!payload.title || !payload.message) return toast.error("Empty payload");
 if (targetType !== "all" && !targetId) return toast.error("Target node required");

 setIsSending(true);
 try {
 const user = await getCurrentUser();

 // B7 Fix: Server-side fan-out via optimized RPC
 await broadcastNotifications({
 title: payload.title,
 message: payload.message,
 type: payload.type,
 createdBy: user?.id ?? null,
 });


 toast.success("Broadcast deployed to global network");
 setSendDialog(false);
 setPayload({ title: "", message: "", type: "announcement" });
 loadData();
 } catch (err) {
 toast.error("Broadcast fault. Buffer overflow suspected.");
 } finally {
 setIsSending(false);
 }
 };

 return (
 <div className="space-y-8 animate-in fade-in duration-700">
 <div className="flex justify-between items-center bg-muted/10 p-6 rounded-2xl border border-border/60">
 <div className="text-left">
 <h2 className="text-2xl font-semibold font-medium flex items-center gap-2">
 <BellRing className="h-6 w-6 text-primary" /> Notifications
 </h2>
 <p className="text-[10px] font-semibold text-muted-foreground/60">
 Send push & in-app broadcasts
 </p>
 </div>
 <Button
 onClick={() => setSendDialog(true)}
 className="rounded-xl font-semibold uppercase text-xs gap-2 h-12 px-6 shadow-sm"
 >
 <Send className="h-4 w-4" /> Deploy Transmission
 </Button>
 </div>

 <Card className="rounded-2xl border overflow-hidden shadow-sm bg-card">
 <Table>
 <TableHeader className="bg-muted/20">
 <TableRow>
 <TableHead className="pl-8 text-[10px] font-semibold uppercase py-4">Temporal Index</TableHead>
 <TableHead className="text-[10px] font-semibold uppercase">Recipient Node</TableHead>
 <TableHead className="text-[10px] font-semibold uppercase">Payload</TableHead>
 <TableHead className="text-right pr-8 text-[10px] font-semibold uppercase">Status</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {notifications.map((n) => (
 <TableRow key={n.id} className="text-left group hover:bg-primary/[0.02]">
 <TableCell className="pl-8 py-4 font-mono text-[10px] opacity-60">
 {format(new Date(n.created_at), "MMM d, HH:mm:ss")}
 </TableCell>
 <TableCell className="font-semibold text-xs uppercase italic truncate max-w-[150px]">
 {n.talent?.full_name || "Unknown Identity"}
 </TableCell>
 <TableCell>
 <p className="text-xs font-bold">{n.title}</p>
 <p className="text-[10px] opacity-60 line-clamp-1 italic">{n.message}</p>
 </TableCell>
 <TableCell className="text-right pr-8">
 <Badge
 variant={n.is_read ? "secondary" : "default"}
 className="text-[9px] font-semibold uppercase rounded-lg"
 >
 {n.is_read ? "ACKNOWLEDGED" : "DISPATCHED"}
 </Badge>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 <div className="p-4 border-t flex justify-between items-center bg-muted/5 px-8">
 <p className="text-[10px] font-semibold uppercase text-muted-foreground/40 italic">
 Telemetry: {totalCount} total dispatches
 </p>
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="icon"
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 disabled={page === 1}
 className="rounded-xl border h-10 w-10"
 >
 <ChevronLeft />
 </Button>
 <Button
 variant="outline"
 size="icon"
 onClick={() => setPage((p) => p + 1)}
 disabled={notifications.length < ITEMS_PER_PAGE}
 className="rounded-xl border h-10 w-10"
 >
 <ChevronRight />
 </Button>
 </div>
 </div>
 </Card>

 <Dialog open={sendDialog} onOpenChange={setSendDialog}>
 <DialogContent className="max-w-md rounded-2xl border-4 bg-background/95 p-0 overflow-hidden shadow-sm text-left">
 <div className="h-2 w-full bg-gradient-to-r from-primary to-fuchsia-600" />
 <div className="p-8 space-y-6">
 <DialogHeader>
 <DialogTitle className="text-2xl font-semibold tracking-tight uppercase flex items-center gap-2">
 <Send className="h-6 w-6 text-primary" /> Transmission Setup
 </DialogTitle>
 </DialogHeader>

 <div className="space-y-4">
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold text-primary ml-1">
 Audience Type
 </Label>
 <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
 <SelectTrigger className="rounded-xl border h-12 bg-muted/20 font-bold uppercase text-[10px]">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="font-semibold uppercase text-[10px]">
 <SelectItem value="all">Global Network</SelectItem>
 <SelectItem value="category">Profession Segment</SelectItem>
 <SelectItem value="single">Single Node ID</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {targetType === "single" && (
 <div className="space-y-2 animate-in slide-in-from-top-2">
 <Label className="text-[10px] font-semibold text-primary ml-1">
 Select Identity
 </Label>
 <Select value={targetId} onValueChange={setTargetId}>
 <SelectTrigger className="rounded-xl border h-12 bg-muted/20 text-xs">
 <SelectValue placeholder="Choose target..." />
 </SelectTrigger>
 <SelectContent className="max-h-[200px]">
 {talents.map((t) => (
 <SelectItem key={t.id} value={t.id} className="text-xs uppercase font-bold">
 {t.full_name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 )}

 <div className="space-y-2">
 <Label className="text-[10px] font-semibold text-primary ml-1">
 Payload Title
 </Label>
 <Input
 value={payload.title}
 onChange={(e) => setPayload({ ...payload, title: e.target.value })}
 placeholder="Headline..."
 className="rounded-xl border h-12 bg-muted/20 font-bold"
 />
 </div>

 <div className="space-y-2">
 <Label className="text-[10px] font-semibold text-primary ml-1">
 Transmission Detail
 </Label>
 <Textarea
 value={payload.message}
 onChange={(e) => setPayload({ ...payload, message: e.target.value })}
 placeholder="The message body..."
 className="rounded-xl border min-h-[120px] bg-muted/20 resize-none p-4"
 />
 </div>
 </div>

 <DialogFooter>
 <Button
 onClick={executeBroadcast}
 disabled={isSending}
 className="w-full h-10 rounded-xl font-semibold text-[11px] gap-2 shadow-sm bg-primary hover:bg-primary/90"
 >
 {isSending ? <InlineSpinner size="md" /> : <Activity className="h-5 w-5" />}
 Execute Dispatch
 </Button>
 </DialogFooter>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
