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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IR_CONFIG } from "@/lib/irConfig";
import { Zap, MessageSquare, TrendingUp, Calendar, Target, ShieldCheck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Investor Interaction Intelligence Logger
 * CTO Reference: Primary ingestion node for stakeholder sentiment and engagement tracking.
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

      const { error: insertError } = await supabase.from("ir_investor_interactions").insert({
        investor_id: investorId,
        interaction_type: formData.interaction_type,
        subject: formData.subject || null,
        content: formData.content || null,
        sentiment: formData.sentiment || null,
        key_points: formData.key_points.length > 0 ? formData.key_points : null,
        follow_up_needed: formData.follow_up_needed,
        follow_up_date: formData.follow_up_date || null,
      });

      if (insertError) throw insertError;

      // Telemetry Update: Investor pulse record
      const updatePayload: any = { last_contacted_at: new Date().toISOString() };

      if (formData.interaction_type === "reply_received" && formData.content) {
        updatePayload.last_feedback_summary = formData.content.slice(0, 500);
      }

      const { error: updateError } = await supabase.from("ir_investors").update(updatePayload).eq("id", investorId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Protocol Successful: Interaction logged.");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-[40px] border-4 p-0 overflow-hidden bg-background shadow-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <div className="p-8 space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader className="text-left">
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary fill-current" /> Log Interaction
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
              Synchronize meeting artifacts and investor sentiment to the core registry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 text-left border-t border-border/10 pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary italic ml-2">
                  Interaction Protocol
                </Label>
                <Select
                  value={formData.interaction_type}
                  onValueChange={(v) => setFormData({ ...formData, interaction_type: v })}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold uppercase text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {IR_CONFIG.INTERACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="font-bold text-xs">
                        {type.label.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Investor Sentiment</Label>
                <Select value={formData.sentiment} onValueChange={(v) => setFormData({ ...formData, sentiment: v })}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold uppercase text-xs">
                    <SelectValue placeholder="NEUTRAL" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    <SelectItem value="" className="font-bold text-xs">
                      UNSPECIFIED
                    </SelectItem>
                    {IR_CONFIG.SENTIMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="font-bold text-xs">
                        {opt.label.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Strategic Subject</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="E.G. Q2 EQUITY ROUND INITIAL REVIEW..."
                className="h-14 rounded-2xl border-2 font-black uppercase italic text-xs tracking-widest bg-card/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary italic ml-2">
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
                className="min-h-[150px] rounded-3xl border-2 font-medium italic text-sm leading-relaxed bg-card/50 p-6"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Key Pulse Points</Label>
              <div className="flex gap-2">
                <Input
                  value={keyPointInput}
                  onChange={(e) => setKeyPointInput(e.target.value)}
                  placeholder="ADD STRATEGIC POINT..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyPoint())}
                  className="h-12 rounded-xl border-2 font-bold uppercase text-[10px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addKeyPoint}
                  className="h-12 rounded-xl border-2 font-black uppercase text-[10px]"
                >
                  + Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.key_points.map((point, i) => (
                  <Badge
                    key={i}
                    className="bg-primary/10 text-primary border-2 border-primary/20 font-black italic text-[9px] px-3 py-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() =>
                      setFormData((p) => ({ ...p, key_points: p.key_points.filter((_, idx) => idx !== i) }))
                    }
                  >
                    {point.toUpperCase()} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/20 p-6 rounded-[32px] border-2 border-border/10">
              <div className="flex items-center gap-4">
                <Switch
                  id="followup"
                  checked={formData.follow_up_needed}
                  onCheckedChange={(v) => setFormData({ ...formData, follow_up_needed: v })}
                />
                <Label htmlFor="followup" className="text-[10px] font-black uppercase italic tracking-widest">
                  Follow-up Protocol Required
                </Label>
              </div>

              {formData.follow_up_needed && (
                <Input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  className="w-44 h-12 rounded-xl border-2 font-black text-xs"
                />
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 gap-4 flex-col sm:flex-row border-t border-border/10 pt-8">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="font-black uppercase text-[10px] tracking-widest italic opacity-50"
            >
              Abort Log
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex-1 h-16 rounded-[24px] font-black uppercase italic tracking-tighter text-xl gap-3 shadow-xl"
            >
              {saveMutation.isPending ? (
                <RefreshCw className="animate-spin" />
              ) : (
                <ShieldCheck className="fill-current" />
              )}
              Synchronize Interaction
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
