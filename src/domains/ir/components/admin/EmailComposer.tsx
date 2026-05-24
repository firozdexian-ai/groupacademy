/**
 * GroUp Academy: Investor Outreach Terminal
 * Phase IR-Z1.1: dual-log to ir_outreach_log (cross-channel telemetry) and
 * ir_email_communications (per-investor email history); render recent
 * communication timeline beneath the composer.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getCurrentSession } from "@/lib/auth";
import { logOutreachAndEmail, listIrEmailCommunications } from "@/domains/ir/repo/irRepo";
import { Send, X, ShieldCheck, Mail, Loader2, ExternalLink, History, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EmailComposerProps {
  selectedInvestor?: { id?: string; email: string; full_name?: string };
  onClose: () => void;
}

interface CommunicationRow {
  id: string;
  investor_id: string | null;
  email_type: string;
  subject: string;
  content: string | null;
  ai_generated: boolean | null;
  sent_at: string | null;
  status: string | null;
  open_count: number | null;
  click_count: number | null;
  created_at: string;
}

function CommunicationHistory({ investorId }: { investorId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["ir-email-communications", investorId ?? "all"],
    queryFn: async () => {
      const rows = await listIrEmailCommunications(investorId, 10);
      return rows as CommunicationRow[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted/40" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-[10px] font-bold text-muted-foreground/50 italic py-6 text-center">
        No prior transmissions logged
        {investorId ? " for this investor" : ""}.
      </p>
    );
  }

  return (
    <ScrollArea className="h-[320px] pr-3">
      <ul className="space-y-2">
        {data.map((row) => (
          <li
            key={row.id}
            className="p-4 rounded-2xl border border-border/60 bg-card/40 hover:border-primary/30 transition-colors"
          >
            <div className="flex justify-between items-start gap-3 mb-1.5">
              <p className="font-semibold uppercase italic tracking-tight text-sm text-foreground/90 line-clamp-1 flex-1">
                {row.subject}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                {row.ai_generated && (
                  <Badge className="bg-primary/10 text-primary border-none font-semibold text-[8px] px-2 gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> AI
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="font-semibold uppercase italic text-[8px] px-2 border-2 tracking-widest"
                >
                  {row.status || "logged"}
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground/60">
              <span>
                {row.email_type} · {format(new Date(row.sent_at || row.created_at), "dd MMM yyyy HH:mm")}
              </span>
              {(row.open_count || row.click_count) ? (
                <span className="tabular-nums">
                  {row.open_count ?? 0} open · {row.click_count ?? 0} clk
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

export const EmailComposer = ({ selectedInvestor, onClose }: EmailComposerProps) => {
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [emailType, setEmailType] = useState("update");
  const [isDeploying, setIsDeploying] = useState(false);

  const handleLogAndOpenClient = async () => {
    if (!selectedInvestor?.email) {
      toast.error("Error: Recipient identity undefined.");
      return;
    }

    if (!subject.trim() || !body.trim()) {
      toast.error("Error: Transmission requires subject and payload.");
      return;
    }

    setIsDeploying(true);
    const toastId = toast.loading("Logging telemetry and preparing client...");

    try {
      const session = await getCurrentSession();
      if (!session) throw new Error("Unauthorized Dispatch");

      // 1. Cross-channel outreach log (kept for IR FP&A agent's unified feed)
      await logOutreachAndEmail({
        outreach: {
          channel: "email",
          target_type: "investor",
          target_label: selectedInvestor.full_name || selectedInvestor.email,
          subject,
          body,
          created_by: session.user.id,
        },
        email: {
          investor_id: selectedInvestor.id ?? null,
          email_type: emailType,
          subject,
          content: body,
          ai_generated: false,
          sent_at: new Date().toISOString(),
          sent_by: session.user.id,
          status: "logged",
        },
      });

      // 3. Native handshake (mailto)
      const mailtoUrl = `mailto:${selectedInvestor.email}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl, "_blank");

      qc.invalidateQueries({ queryKey: ["ir-email-communications"] });

      toast.success("Opening mail client…", { id: toastId });
      setSubject("");
      setBody("");
    } catch (error: any) {
      toast.error(`System Error: ${error.message || "Transmission fault."}`, { id: toastId });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
      <div className="space-y-6 p-8 rounded-2xl border border-border/60 bg-card shadow-sm animate-in zoom-in-95 duration-300 text-left">
        <div className="flex justify-between items-start border-b border-border/10 pb-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold uppercase italic tracking-tight flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" /> Investor Pulse
            </h3>
            <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground/60 italic">
              Phase IR-Z1.1 · dual-logged to outreach & comms history
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

        <div className="space-y-2">
          <label className="text-[10px] font-semibold uppercase italic tracking-widest text-primary ml-2 flex items-center gap-2">
            <Mail className="h-3 w-3" /> Target Identity
          </label>
          <div className="relative">
            <Input
              value={selectedInvestor?.email || ""}
              disabled
              placeholder="SELECT AN INVESTOR FROM THE REGISTRY..."
              className="h-12 rounded-xl border-2 font-bold bg-muted/30 border-border/40 pl-4 text-foreground/80"
            />
            {selectedInvestor?.full_name && (
              <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/10 text-primary border-none font-semibold text-[9px] px-3">
                {selectedInvestor.full_name.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase italic tracking-widest text-primary ml-2">
              Transmission Subject
            </label>
            <Input
              placeholder="ENTER STRATEGIC HEADLINE..."
              className="h-10 rounded-xl border-2 font-semibold uppercase italic text-sm tracking-widest bg-card focus-visible:border-primary/40 focus-visible:ring-0 transition-colors"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase italic tracking-widest text-primary ml-2">
              Type
            </label>
            <select
              value={emailType}
              onChange={(e) => setEmailType(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border/60 bg-card px-4 font-semibold uppercase italic text-[10px] tracking-widest focus-visible:border-primary/40 focus-visible:outline-none"
            >
              <option value="update">Update</option>
              <option value="intro">Intro</option>
              <option value="follow_up">Follow-up</option>
              <option value="diligence">Diligence</option>
              <option value="closing">Closing</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold uppercase italic tracking-widest text-primary ml-2">
            Core Payload (Message Body)
          </label>
          <Textarea
            placeholder="ENTER UPDATE DATA NODES..."
            className="min-h-[220px] rounded-3xl border-2 font-medium italic text-sm leading-relaxed bg-card p-6 focus-visible:border-primary/40 focus-visible:ring-0 transition-colors resize-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <Button
          onClick={handleLogAndOpenClient}
          disabled={isDeploying || !subject.trim() || !body.trim() || !selectedInvestor?.email}
          className={cn(
            "w-full h-16 rounded-xl text-sm font-medium gap-3 shadow-sm transition-all",
            isDeploying || !subject.trim() || !body.trim() || !selectedInvestor?.email
              ? "bg-muted text-muted-foreground border border-border/40 cursor-not-allowed"
              : "bg-gradient-to-r from-primary via-blue-600 to-primary hover:scale-[1.02] text-white shadow-primary/20",
          )}
        >
          {isDeploying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ExternalLink className="h-5 w-5 fill-current" />}
          {isDeploying ? "Committing..." : "Log Outreach & Open Client"}
        </Button>
      </div>

      <aside className="space-y-4 p-6 rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/10 pb-4">
          <History className="h-5 w-5 text-primary" />
          <div>
            <h4 className="text-sm font-semibold uppercase italic tracking-tight">Communication History</h4>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
              {selectedInvestor?.id ? "this investor · last 10" : "global · last 10"}
            </p>
          </div>
        </div>
        <CommunicationHistory investorId={selectedInvestor?.id} />
      </aside>
    </div>
  );
};
