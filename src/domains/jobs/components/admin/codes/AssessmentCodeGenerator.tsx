import { useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { insertAssessmentAccessCode } from "@/domains/jobs/repo/jobsRepo";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, Copy, Check, Loader2, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

/**
 * Platform Logic: Cryptographic Handshake Node
 * High-fidelity orchestrator for generating single-use assessment access artifacts.
 * 2026 Standard: Executive Logic geometry with reinforced auth telemetry.
 */

interface AssessmentCodeGeneratorProps {
 leadEmail: string;
 leadName: string;
}

export function AssessmentCodeGenerator({ leadEmail, leadName }: AssessmentCodeGeneratorProps) {
 const [open, setOpen] = useState(false);
 const [generating, setGenerating] = useState(false);
 const [generatedCode, setGeneratedCode] = useState<string | null>(null);
 const [copied, setCopied] = useState(false);

 const generateCode = () => {
 const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
 let code = "";
 for (let i = 0; i < 8; i++) {
 code += chars.charAt(Math.floor(Math.random() * chars.length));
 }
 return code;
 };

 const handleGenerateHandshake = async () => {
 setGenerating(true);
 try {
 const user = await withTimeout(getCurrentUser(), TIMEOUTS.AUTH, "Auth Registry Link Timeout");

 if (!user) {
 toast.error("Admin permission required.");
 return;
 }

 const code = generateCode();

 const { error } = await withTimeout(
 insertAssessmentAccessCode({
 code,
 email: leadEmail.toLowerCase().trim(),
 created_by: user.id,
 expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
 }),
 TIMEOUTS.DEFAULT,
 "Request timed out",
 );

 if (error) throw error;

 setGeneratedCode(code);
 toast.success("Access code generated.");
 } catch (error: any) {
 console.error("Code Generation Fault:", error);
 toast.error("Transmission Error: Failed to synchronize access node.");
 } finally {
 setGenerating(false);
 }
 };

 const handleArtifactExport = () => {
 if (generatedCode) {
 const message = `Hi ${leadName},\n\nYour Career Readiness Assessment retake access code is: ${generatedCode}\n\nThis code is valid for 30 days.\n\nVisit: ${window.location.origin}/career-assessment\n\nBest,\nAcademy Administration`;
 navigator.clipboard.writeText(message);
 setCopied(true);
 toast.success("Payload exported to clipboard.");
 setTimeout(() => setCopied(false), 2000);
 }
 };

 return (
 <Dialog
 open={open}
 onOpenChange={(o) => {
 setOpen(o);
 if (!o) {
 setGeneratedCode(null);
 setCopied(false);
 }
 }}
 >
 <DialogTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 className="rounded-xl font-medium text-xs border hover:bg-primary/5 gap-2 transition-all active:scale-95"
 >
 <KeyRound className="h-3.5 w-3.5 text-primary" />
 Authorize Retake
 </Button>
 </DialogTrigger>

 <DialogContent className="rounded-2xl border border-border/60 bg-card shadow-sm p-0 overflow-hidden max-w-md">
 <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary to-primary opacity-50" />

 <div className="p-8">
 <DialogHeader className="mb-6 text-left">
 <div className="flex items-center gap-4 mb-2">
 <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
 <ShieldCheck className="h-5 w-5 text-primary" />
 </div>
 <div className="space-y-0.5">
 <DialogTitle className="text-xl font-medium tracking-tighter italic leading-none">
 Generate Access Node
 </DialogTitle>
 <DialogDescription className="text-sm font-medium text-muted-foreground/60">
 Target Entity: {leadName}
 </DialogDescription>
 </div>
 </div>
 </DialogHeader>

 <div className="space-y-6">
 <div className="space-y-2 px-1">
 <Label className="text-[10px] font-black text-primary ml-1">
 Entity Telemetry (Email)
 </Label>
 <Input value={leadEmail} disabled className="h-11 rounded-xl bg-muted/20 border font-bold opacity-60" />
 </div>

 {generatedCode ? (
 <div className="space-y-4 animate-in zoom-in-95 duration-500">
 <div className="space-y-2">
 <Label className="text-[10px] font-black text-success ml-1">
 Logic Artifact (Code)
 </Label>
 <div className="flex items-center gap-3">
 <Input
 value={generatedCode}
 readOnly
 className="h-10 rounded-xl bg-primary/5 border border-primary/20 font-mono text-2xl font-black tracking-[0.3em] text-center text-primary shadow-inner"
 />
 <Button
 variant="outline"
 className="h-14 w-14 rounded-2xl border shrink-0 transition-all hover:bg-primary hover:text-primary-foreground group"
 onClick={handleArtifactExport}
 >
 {copied ? (
 <Check className="h-5 w-5 text-success group-hover:text-primary-foreground" />
 ) : (
 <Copy className="h-5 w-5" />
 )}
 </Button>
 </div>
 </div>
 <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex items-start gap-3">
 <Zap className="h-4 w-4 text-warning shrink-0 mt-0.5" />
 <p className="text-[9px] font-bold leading-relaxed text-muted-foreground italic text-left">
 Artifact expires in 30 days. Export payload to transmit credentials via secondary channel.
 </p>
 </div>
 </div>
 ) : (
 <div className="py-10 text-center space-y-8 animate-in slide-in-from-bottom-4">
 <div className="space-y-2">
 <p className="text-sm font-medium italic text-muted-foreground/80">
 Authorize retake protocol for this user identifier.
 </p>
 <p className="text-[9px] font-black text-primary/40">
 Temporal Span: 720 Hours
 </p>
 </div>
 <Button
 onClick={handleGenerateHandshake}
 disabled={generating}
 className="w-full h-16 rounded-[20px] font-medium tracking-[0.3em] text-[11px] shadow-sm group relative overflow-hidden"
 >
 <span className="relative z-10 flex items-center gap-3">
 {generating ? <InlineSpinner size="md" /> : <KeyRound className="h-5 w-5" />}
 {generating ? "GENERATING..." : "GENERATE CODE"}
 </span>
 <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
 </Button>
 </div>
 )}
 </div>
 </div>

 <DialogFooter className="bg-muted/20 p-6 border-t border-border/10">
 <Button
 variant="ghost"
 onClick={() => setOpen(false)}
 className="rounded-xl font-medium text-xs w-full h-11"
 >
 Terminate Node
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
