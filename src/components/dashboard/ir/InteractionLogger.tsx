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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IR_CONFIG } from "@/lib/irConfig";

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
      if (!investorId) throw new Error("No investor selected");
      
      const { error } = await supabase
        .from("ir_investor_interactions")
        .insert({
          investor_id: investorId,
          interaction_type: formData.interaction_type,
          subject: formData.subject || null,
          content: formData.content || null,
          sentiment: formData.sentiment || null,
          key_points: formData.key_points.length > 0 ? formData.key_points : null,
          follow_up_needed: formData.follow_up_needed,
          follow_up_date: formData.follow_up_date || null,
        });
      
      if (error) throw error;
      
      // Update last_contacted_at on investor
      await supabase
        .from("ir_investors")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("id", investorId);
      
      // If it's a reply, also update last_feedback_summary
      if (formData.interaction_type === "reply_received" && formData.content) {
        await supabase
          .from("ir_investors")
          .update({ 
            last_feedback_summary: formData.content.slice(0, 500),
            last_contacted_at: new Date().toISOString(),
          })
          .eq("id", investorId);
      }
    },
    onSuccess: () => {
      toast.success("Interaction logged");
      onOpenChange(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["ir-investor-interactions", investorId] });
      queryClient.invalidateQueries({ queryKey: ["ir-investor-detail", investorId] });
      queryClient.invalidateQueries({ queryKey: ["ir-investors"] });
    },
    onError: (error) => {
      toast.error("Failed to log interaction: " + error.message);
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
  
  const removeKeyPoint = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      key_points: prev.key_points.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Interaction</DialogTitle>
          <DialogDescription>
            Record a conversation, meeting, or note about this investor
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Interaction Type *</Label>
              <Select
                value={formData.interaction_type}
                onValueChange={(v) => setFormData({ ...formData, interaction_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IR_CONFIG.INTERACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sentiment">Sentiment</Label>
              <Select
                value={formData.sentiment}
                onValueChange={(v) => setFormData({ ...formData, sentiment: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not specified</SelectItem>
                  {IR_CONFIG.SENTIMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief summary..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">
              {formData.interaction_type === "reply_received" 
                ? "Paste Investor Reply/Feedback" 
                : "Content/Notes"}
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={
                formData.interaction_type === "reply_received"
                  ? "Paste the investor's reply here..."
                  : "Details of the interaction..."
              }
              rows={4}
            />
            {formData.interaction_type === "reply_received" && (
              <p className="text-xs text-muted-foreground">
                This will be used to personalize future AI-generated emails
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Key Points</Label>
            <div className="flex gap-2">
              <Input
                value={keyPointInput}
                onChange={(e) => setKeyPointInput(e.target.value)}
                placeholder="Add a key point..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyPoint())}
              />
              <Button type="button" variant="outline" onClick={addKeyPoint}>
                Add
              </Button>
            </div>
            {formData.key_points.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.key_points.map((point, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeKeyPoint(i)}
                  >
                    {point} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="followup"
                checked={formData.follow_up_needed}
                onCheckedChange={(v) => setFormData({ ...formData, follow_up_needed: v })}
              />
              <Label htmlFor="followup">Follow-up needed</Label>
            </div>
            
            {formData.follow_up_needed && (
              <Input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                className="w-40"
              />
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Log Interaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
