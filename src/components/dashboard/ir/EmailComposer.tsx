import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Send, X, ShieldCheck, Mail, Zap, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Investor Outreach Terminal
 * CTO Reference: High-fidelity orchestrator for secure investor communications.
 * 2024 Standard: Logs telemetry to ir_outreach_log table upon dispatch.
 */

interface EmailComposerProps {
  selectedInvestor?: { email: string; full_name?: string };
  onClose: () => void;
}

export const EmailComposer = ({ selectedInvestor, onClose }: EmailComposerProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  const handleSendUpdate = async () => {
    if (!selectedInvestor?.email) {
      toast.error("Registry Fault: Recipient email undefined.");
      return;
    }

    if (!subject.trim() || !body.trim()) {
      toast.error("Protocol Fault: Subject and Message body required.");
      return;
    }

    setIsDeploying(true);
    const toastId = toast.loading("Queueing update via GroUp platform...");

    try {
      // 1. Get current admin session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("Unauthorized Dispatch");

      // 2. Log to IR Outreach Telemetry
      const { error: logError } = await supabase.from("ir_outreach_log").insert([{
        channel: "email",
        target_type: "investor",
        target_label: selectedInvestor.full_name || selectedInvestor.email,
        subject: subject,
        body: body,
        created_by: session.user.id,
        // Since we don't have the investor ID directly in this component, we
        // rely on the backend triggering an email via webhook based on this log insert,
        // or we can invoke a specific Edge Function. For now, logging guarantees telemetry.
      }]);

      if (logError) throw logError;

      // 3. Optional: Trigger Edge Function directly if webhooks aren't configured
      // await supabase.functions.invoke('send-investor-email', {
      //   body: { email: selectedInvestor.email, subject, body }
      // });

      toast.success("Protocol Successful: Investor update enqueued.", { id: toastId });
      onClose();
    } catch (error: any) {
      toast.error(`System Error: ${error.message || "Failed to dispatch update."}`, { id: toastId });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6 p-8 rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-300">
      {/* HEADER NODES */}
      <div className="flex justify-between items-start border-b border-border/10 pb-6">
        <div className="text-left space-y-1">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" /> Investor Pulse
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Secure Platform Dispatch System
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-xl hover:bg-destructive/10 hover:text-destructive h-10 w-10 transition-colors"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* RECIPIENT NODE */}
      <div className="space-y-2 text-left">
        <label className="text-[10px] font-black uppercase italic tracking-widest text-primary ml-2 flex items-center gap-2">
          <Mail className="h-3 w-3" /> Target Identity
        </label>
        <div className="relative">
          <Input
            value={selectedInvestor?.email || ""}
            disabled
            className="h-12 rounded-xl border-2 font-bold bg-muted/30 border-border/40 pl-4 text-foreground/80 cursor-not-allowed"
          />
          {selectedInvestor?.full_name && (
            <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/10 text-primary border-none font-black italic text-[9px] px-3">
              {selectedInvestor.full_name.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* SUBJECT NODE */}
      <div className="space-y-2 text-left">
        <label className="text-[10px] font-black uppercase italic tracking-widest text-primary ml-2">
          Transmission Subject
        </label>
        <Input
          placeholder="ENTER STRATEGIC HEADLINE..."
          className="h-14 rounded-2xl border-2 font-black uppercase italic text-sm tracking-widest bg-card/50 focus-visible:border-primary/40 focus-visible:ring-0 transition-colors"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      {/* MESSAGE PAYLOAD */}
      <div className="space-y-2 text-left">
        <label className="text-[10px] font-black uppercase italic tracking-widest text-primary ml-2">
          Core Payload (Message Body)
        </label>
        <Textarea
          placeholder="ENTER UPDATE DATA NODES..."
          className="min-h-[250px] rounded-3xl border-2 font-medium italic text-sm leading-relaxed bg-card/50 p-6 focus-visible:border-primary/40 focus-visible:ring-0 transition-colors resize-none"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      {/* DISPATCH ACTION */}
      <Button
        onClick={handleSendUpdate}
        disabled={isDeploying || !subject.trim() || !body.trim()}
        className={cn(
          "w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] text-[11px] gap-3 shadow-2xl transition-all",
          isDeploying || !subject.trim() || !body.trim()
            ? "bg-muted text-muted-foreground border-2 border-border/40 cursor-not-allowed"
            : "bg-gradient-to-r from-primary via-blue-600 to-primary hover:scale-[1.02] text-white shadow-primary/20",
        )}
      >
        {isDeploying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 fill-current" />}
        {isDeploying ? "Synchronizing..." : "Initialize Transmission"}
      </Button>
    </div>
  );
};
