/**
 * GroUp Academy: Investor Outreach Terminal
 * CTO Version: May 2026 (Phase IR-Z0 Hardened)
 * Fixes: P1 (Log + mailto Fallback), Visual Unification
 * Standard: Logs telemetry to ir_outreach_log and initializes native mail client.
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Send, X, ShieldCheck, Mail, Zap, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EmailComposerProps {
  selectedInvestor?: { email: string; full_name?: string };
  onClose: () => void;
}

export const EmailComposer = ({ selectedInvestor, onClose }: EmailComposerProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  const handleLogAndOpenClient = async () => {
    if (!selectedInvestor?.email) {
      toast.error("Registry Fault: Recipient identity undefined.");
      return;
    }

    if (!subject.trim() || !body.trim()) {
      toast.error("Protocol Fault: Transmission requires subject and payload.");
      return;
    }

    setIsDeploying(true);
    const toastId = toast.loading("Logging telemetry and preparing client...");

    try {
      // 1. Authenticate Administrative Session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) throw new Error("Unauthorized Dispatch");

      // 2. Commit to IR Outreach Telemetry (ir_outreach_log)
      const { error: logError } = await supabase.from("ir_outreach_log").insert([
        {
          channel: "email",
          target_type: "investor",
          target_label: selectedInvestor.full_name || selectedInvestor.email,
          subject: subject,
          body: body,
          created_by: session.user.id,
        },
      ]);

      if (logError) throw logError;

      // 3. P1 Fix: Initialize Native Handshake (mailto fallback)
      const mailtoUrl = `mailto:${selectedInvestor.email}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;

      window.open(mailtoUrl, "_blank");

      toast.success("Protocol Registered: Opening mail client.", { id: toastId });
      onClose();
    } catch (error: any) {
      toast.error(`System Error: ${error.message || "Transmission fault."}`, { id: toastId });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6 p-8 rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-300 text-left">
      {/* HEADER NODES */}
      <div className="flex justify-between items-start border-b border-border/10 pb-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" /> Investor Pulse
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Phase IR-Z0 Secure Dispatch
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
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase italic tracking-widest text-primary ml-2 flex items-center gap-2">
          <Mail className="h-3 w-3" /> Target Identity
        </label>
        <div className="relative">
          <Input
            value={selectedInvestor?.email || ""}
            disabled
            className="h-12 rounded-xl border-2 font-bold bg-muted/30 border-border/40 pl-4 text-foreground/80"
          />
          {selectedInvestor?.full_name && (
            <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/10 text-primary border-none font-black italic text-[9px] px-3">
              {selectedInvestor.full_name.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* SUBJECT NODE */}
      <div className="space-y-2">
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
      <div className="space-y-2">
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
        onClick={handleLogAndOpenClient}
        disabled={isDeploying || !subject.trim() || !body.trim()}
        className={cn(
          "w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] text-[11px] gap-3 shadow-2xl transition-all",
          isDeploying || !subject.trim() || !body.trim()
            ? "bg-muted text-muted-foreground border-2 border-border/40 cursor-not-allowed"
            : "bg-gradient-to-r from-primary via-blue-600 to-primary hover:scale-[1.02] text-white shadow-primary/20",
        )}
      >
        {isDeploying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ExternalLink className="h-5 w-5 fill-current" />}
        {isDeploying ? "Committing..." : "Log Outreach & Open Client"}
      </Button>
    </div>
  );
};
