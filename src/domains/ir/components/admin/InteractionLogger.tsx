import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { logInvestorInteraction } from "@/domains/ir/repo/irRepo";
import { toast } from "sonner";
import { IR_CONFIG } from "@/lib/irConfig";
import { Zap, ShieldCheck, RefreshCw, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Investor Interaction Intelligence Logger
 * CTO Reference: Primary ingestion node for stakeholder sentiment and engagement tracking.
 * 2024 Standard: Executive Logic geometry with reinforced interaction analysis.
 */

interface InteractionLoggerProps {
 investorId: string | null;
 open: boolean;
 onOpenChange: (open: boolean) => void;
}

export function InteractionLogger({ investorId, open, onOpenChange }: InteractionLoggerProps) {
 const queryClient = useQueryClient();

 const [formData, setFormData] = useState({
 interaction_type: "note",
 subject: "",
 content: "",
 sentiment: "",
 key_points: [] as string[],
 follow_up_needed: false,
 follow_up_date: "",
 });

 const [keyPointInput, setKeyPointInput] = useState("");

 const saveMutation = useMutation({
 mutationFn: async () => {
 if (!investorId) throw new Error("Registry Fault: Investor ID missing.");

 const updatePayload: any = { last_contacted_at: new Date().toISOString() };
 if (formData.interaction_type === "reply_received" && formData.content) {
 updatePayload.last_feedback_summary = formData.content.slice(0, 500);
 }

 await logInvestorInteraction({
 investorId,
 payload: {
 interaction_type: formData.interaction_type,
 subject: formData.subject || null,
 content: formData.content || null,
 sentiment: formData.sentiment || null,
 key_points: formData.key_points.length > 0 ? formData.key_points : null,
 follow_up_needed: formData.follow_up_needed,
 follow_up_date: formData.follow_up_date || null,
 },
 updatePayload,
 });
 },
 onSuccess: () => {
 toast.success("Interaction logged.");
 onOpenChange(false);
 resetForm();
 queryClient.invalidateQueries({ queryKey: ["ir-investor-interactions", investorId] });
 queryClient.invalidateQueries({ queryKey: ["ir-investor-detail", investorId] });
 queryClient.invalidateQueries({ queryKey: ["ir-investors"] });
 },
 onError: (error: any) => {
 toast.error("System Error: Interaction sync failed. " + error.message);
 },
 });

 const resetForm = () => {
 setFormData({
 interaction_type: "note",
 subject: "",
 content: "",
 sentiment: "",
 key_points: [],
 follow_up_needed: false,
 follow_up_date: "",
 });
 setKeyPointInput("");
 };

 const addKeyPoint = () => {
 if (keyPointInput.trim()) {
 setFormData((prev) => ({
 ...prev,
 key_points: [...prev.key_points, keyPointInput.trim()],
 }));
 setKeyPointInput("");
 }
 };

 return (
 <Dialog
 open={open}
 onOpenChange={(val) => {
 if (!val) resetForm();
 onOpenChange(val);
 }}
 >
 <DialogContent className="max-w-2xl rounded-2xl border-4 border-border/40 bg-background/95 p-0 overflow-hidden shadow-sm">
 <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
 <div className="p-10 pb-0">
 <DialogHeader className="mb-8">
 <div className="flex items-center gap-4">
 <Zap className="h-8 w-8 text-primary fill-primary/20" />
 <div className="space-y-1 text-left">
 <DialogTitle className="text-3xl font-semibold uppercase tracking-tight italic leading-none">
 Log Interaction
 </DialogTitle>
 <DialogDescription className="text-sm font-medium text-muted-foreground/60 italic">
 Log meeting details
 </DialogDescription>
 </div>
 </div>
 </DialogHeader>

 <ScrollArea className="max-h-[60vh] pr-4 -mr-4">
 <div className="space-y-8 pb-8">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label className="text-[10px] font-semibold text-primary ml-1">
 Interaction
 </Label>
 <Select
 value={formData.interaction_type}
 onValueChange={(v) => setFormData({ ...formData, interaction_type: v })}
 >
 <SelectTrigger className="h-10 rounded-xl border font-bold uppercase text-xs bg-muted/20">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="rounded-xl border">
 {IR_CONFIG.INTERACTION_TYPES.map((type) => (
 <SelectItem
 key={type.value}
 value={type.value}
 className="font-bold text-xs"
 >
 {type.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label className="text-[10px] font-semibold text-primary ml-1">
 Investor Sentiment
 </Label>
 <Select value={formData.sentiment} onValueChange={(v) => setFormData({ ...formData, sentiment: v })}>
 <SelectTrigger className="h-10 rounded-xl border font-bold uppercase text-xs bg-muted/20">
 <SelectValue placeholder="NEUTRAL" />
 </SelectTrigger>
 <SelectContent className="rounded-xl border">
 <SelectItem value="" className="font-bold text-xs">
 UNSPECIFIED
 </SelectItem>
 {IR_CONFIG.SENTIMENT_OPTIONS.map((opt) => (
 <SelectItem
 key={opt.value}
 value={opt.value}
 className="font-bold text-xs"
 >
 {opt.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="space-y-2">
 <Label className="text-[10px] font-semibold text-primary ml-1">
 Strategic Subject
 </Label>
 <Input
 value={formData.subject}
 onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
 placeholder="E.G. Q2 EQUITY ROUND INITIAL REVIEW..."
 className="h-10 rounded-xl border font-semibold uppercase italic text-sm tracking-widest bg-muted/10 focus-visible:border-primary/40 transition-colors"
 />
 </div>

 <div className="space-y-2">
 <Label className="text-[10px] font-semibold text-primary ml-1">
 {formData.interaction_type === "reply_received"
 ? "Neural Payload (Reply Text)"
 : "Core Artifact (Notes)"}
 </Label>
 <Textarea
 value={formData.content}
 onChange={(e) => setFormData({ ...formData, content: e.target.value })}
 placeholder={
 formData.interaction_type === "reply_received"
 ? "PASTE RAW REPLY FOR AI CONTEXT..."
 : "LOG KEY DISCUSSION POINTS..."
 }
 className="min-h-[160px] rounded-2xl border font-medium italic text-sm leading-relaxed bg-muted/10 p-6 resize-none focus-visible:border-primary/40 transition-colors"
 />
 </div>

 <div className="space-y-3">
 <Label className="text-[10px] font-semibold text-primary ml-1">
 Key Pulse Points
 </Label>
 <div className="flex flex-col sm:flex-row gap-3">
 <Input
 value={keyPointInput}
 onChange={(e) => setKeyPointInput(e.target.value)}
 placeholder="ADD STRATEGIC POINT..."
 onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyPoint())}
 className="h-12 rounded-xl border font-bold uppercase text-[10px] bg-muted/10"
 />
 <Button
 type="button"
 variant="outline"
 onClick={addKeyPoint}
 disabled={!keyPointInput.trim()}
 className="h-12 px-6 rounded-xl border font-semibold uppercase text-xs shrink-0"
 >
 Inject
 </Button>
 </div>
 {formData.key_points.length > 0 && (
 <div className="flex flex-wrap gap-2 pt-2">
 {formData.key_points.map((point, i) => (
 <Badge
 key={i}
 className="bg-primary/10 text-primary border border-primary/20 font-semibold text-[9px] px-3 py-1 cursor-pointer hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors group flex items-center gap-1"
 onClick={() =>
 setFormData((p) => ({ ...p, key_points: p.key_points.filter((_, idx) => idx !== i) }))
 }
 >
 {point.toUpperCase()}
 <span className="opacity-40 group-hover:opacity-100 transition-opacity">×</span>
 </Badge>
 ))}
 </div>
 )}
 </div>

 <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/20 p-6 rounded-2xl border border-border/40 gap-4">
 <div className="flex items-center gap-4">
 <Switch
 id="followup"
 checked={formData.follow_up_needed}
 onCheckedChange={(v) => setFormData({ ...formData, follow_up_needed: v })}
 className="data-[state=checked]:bg-primary"
 />
 <Label
 htmlFor="followup"
 className="text-[10px] font-semibold uppercase italic tracking-widest cursor-pointer"
 >
 Follow-up required
 </Label>
 </div>

 {formData.follow_up_needed && (
 <Input
 type="date"
 value={formData.follow_up_date}
 onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
 className="w-full sm:w-44 h-12 rounded-xl border font-semibold text-xs uppercase"
 />
 )}
 </div>
 </div>
 </ScrollArea>
 </div>

 <DialogFooter className="p-8 pt-6 border-t border-border/10 bg-muted/5 flex-col sm:flex-row gap-3 sm:gap-0">
 <Button
 variant="outline"
 onClick={() => onOpenChange(false)}
 className="h-14 px-8 rounded-xl border font-semibold uppercase text-xs italic text-muted-foreground hover:text-foreground transition-colors"
 >
 Abort Log
 </Button>
 <Button
 onClick={() => saveMutation.mutate()}
 disabled={saveMutation.isPending}
 className="h-14 px-10 rounded-xl font-semibold font-medium text-lg gap-3 shadow-sm transition-all hover:scale-[1.02] active:scale-95"
 >
 {saveMutation.isPending ? (
 <Loader2 className="h-5 w-5 animate-spin" />
 ) : (
 <ShieldCheck className="h-5 w-5 fill-current" />
 )}
 {saveMutation.isPending ? "Saving…" : "Save interaction"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
