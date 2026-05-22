import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadTalentCv, createTalentCvSignedUrl } from "@/domains/jobs/repo/jobsRepo";
import { parseCv } from "@/domains/jobs/api/jobsApi";
import { insertExternalJobApplication, getOrCreateTalent } from "@/domains/jobs/repo/jobsRepo";
import { findTalentByEmail } from "@/domains/talent/repo/talentRepo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area"; // FIXED: Restored ScrollArea import
import {
  Loader2,
  Sparkles,
  Upload,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldCheck,
  FileText, // FIXED: Restored FileText import
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: External Application Ingress Terminal
 * CTO Reference: Neural-driven node for bridging external leads.
 * Resolved TS2552/TS2304 by restoring ScrollArea and Icon primitives.
 */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultJobId?: string;
  jobs: { id: string; title: string; company_name: string }[];
  onCreated?: () => void;
}

type Step = "input" | "review";

export function AddExternalApplicationDialog({ open, onOpenChange, defaultJobId, jobs, onCreated }: Props) {
  const [step, setStep] = useState<Step>("input");
  const [jobId, setJobId] = useState<string>(defaultJobId || "");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Parsed Intelligence Nodes
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("");
  const [skills, setSkills] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState("");
  const [externalNotes, setExternalNotes] = useState("");
  const [cvUrl, setCvUrl] = useState<string>("");
  const [talentExists, setTalentExists] = useState<null | boolean>(null);

  const reset = () => {
    setStep("input");
    setCvFile(null);
    setCvText("");
    setName("");
    setEmail("");
    setPhone("");
    setProfession("");
    setSkills("");
    setCoverLetter("");
    setExternalNotes("");
    setCvUrl("");
    setTalentExists(null);
    if (!defaultJobId) setJobId("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleParse = async () => {
    if (!jobId) return toast.error("Protocol Fault: Select job target first.");
    if (!cvFile && cvText.trim().length < 30) return toast.error("Payload Fault: Insufficient CV data.");

    setParsing(true);
    const toastId = toast.loading("Neural Ingestion in progress...");

    try {
      let publicUrl = "";
      if (cvFile) {
        const path = `external-applications/${Date.now()}-${cvFile.name}`;
        await uploadTalentCv(path, cvFile);
        publicUrl = await createTalentCvSignedUrl(path, 60 * 60 * 24 * 365);
        setCvUrl(publicUrl);
      }

      const body: Record<string, unknown> = cvFile
        ? { cvUrl: publicUrl, serviceType: "external_application" }
        : { cvText, serviceType: "external_application" };
      const parseData: any = await parseCv(body);

      const parsed = parseData?.parsed || parseData?.cv_data || parseData;
      setName(parsed?.name || parsed?.full_name || "");
      setEmail(parsed?.email || "");
      setPhone(parsed?.phone || "");
      setProfession(parsed?.profession || parsed?.current_role || "");
      const sk = parsed?.skills || parsed?.parsed_skills || [];
      setSkills(Array.isArray(sk) ? sk.join(", ") : String(sk || ""));

      toast.success("Intelligence Extracted", { id: toastId });
      setStep("review");
      if (parsed?.email) checkTalentExists(parsed.email);
    } catch (err: any) {
      toast.error("Extraction Fault: " + err.message, { id: toastId });
    } finally {
      setParsing(false);
    }
  };

  const checkTalentExists = async (em: string) => {
    if (!em.includes("@")) {
      setTalentExists(null);
      return;
    }
    const found = await findTalentByEmail(em);
    setTalentExists(!!found);
  };

  const handleSave = async () => {
    if (!email.trim() && !phone.trim()) return toast.error("Contact string required.");
    if (!name.trim()) return toast.error("Identity name required.");

    setSaving(true);
    try {
      const talentId = await getOrCreateTalent({
        email: email.trim() || `${Date.now()}@external.local`,
        fullName: name.trim(),
        phone: phone.trim() || null,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      await insertExternalJobApplication({
        job_id: jobId,
        talent_id: talentId as string,
        cv_url: cvUrl || null,
        cover_letter: coverLetter || null,
        external_notes: externalNotes || null,
        added_by: user?.id || null,
      });

      toast.success("Node Synchronized");
      handleClose(false);
      onCreated?.();
    } catch (err: any) {
      toast.error("Save Fault: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-4 border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-[40px]">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />

        <DialogHeader className="p-8 pb-4 text-left">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Zap className="h-8 w-8 text-primary fill-current" /> Bridge Terminal
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
                External lead ingestion and AI artifact parsing
              </DialogDescription>
            </div>
            <Badge variant="outline" className="font-black text-[9px] border-2 uppercase italic px-3 py-1">
              {step === "input" ? "Ingestion_Phase" : "Review_Phase"}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-8 pt-0">
          {step === "input" ? (
            <div className="space-y-8 py-4 text-left animate-in fade-in duration-500">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-primary italic ml-2 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> Target Post Selection *
                </Label>
                <Select value={jobId} onValueChange={setJobId}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold uppercase text-xs">
                    <SelectValue placeholder="SELECT TARGET INFRASTRUCTURE" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={j.id} className="font-bold text-[10px] uppercase">
                        {j.title} — {j.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-2">
                    Artifact Upload (PDF/DOCX)
                  </Label>
                  <div className="relative group">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      className="h-14 rounded-2xl border-2 border-dashed bg-muted/10 cursor-pointer file:hidden pr-12 font-bold"
                    />
                    <Upload className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {cvFile && (
                      <Badge className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/10 text-primary border-none font-black italic text-[9px]">
                        {cvFile.name.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-2">
                    Raw Payload Ingress
                  </Label>
                  <Textarea
                    rows={6}
                    value={cvText}
                    onChange={(e) => setCvText(e.target.value)}
                    placeholder="PASTE UNSYNCED RESUME DATA..."
                    className="rounded-3xl border-2 font-medium italic bg-muted/5 p-6"
                  />
                </div>
              </div>

              <Button
                onClick={handleParse}
                disabled={parsing || !jobId}
                className="w-full h-20 rounded-[32px] font-black uppercase italic tracking-tighter text-2xl gap-4 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-transform"
              >
                {parsing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Sparkles className="h-8 w-8 fill-current" />}
                Initialize Neural Extraction
              </Button>
            </div>
          ) : (
            <div className="space-y-8 py-4 text-left animate-in slide-in-from-right-10 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FieldNode label="Identity Name *" value={name} onChange={setName} />
                <FieldNode label="Authority Profession" value={profession} onChange={setProfession} />
                <div className="space-y-2">
                  <FieldNode
                    label="Transmission Email"
                    value={email}
                    onChange={(v) => {
                      setEmail(v);
                      checkTalentExists(v);
                    }}
                    type="email"
                  />
                  {talentExists === true && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-black italic text-[9px] px-3 py-1">
                      REGISTERED_TALENT_DETECTED
                    </Badge>
                  )}
                  {talentExists === false && (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 font-black italic text-[9px] px-3 py-1">
                      NEW_NODE_PROVISIONING
                    </Badge>
                  )}
                </div>
                <FieldNode label="Mobile Link" value={phone} onChange={setPhone} />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Skill Matrix</Label>
                <Textarea
                  rows={2}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="rounded-2xl border-2 font-black italic text-xs bg-muted/10"
                />
              </div>

              <div className="space-y-3 bg-primary/5 p-6 rounded-[32px] border-2 border-primary/20">
                <Label className="text-[10px] font-black uppercase text-primary italic flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> Registry Notes (Private)
                </Label>
                <Textarea
                  rows={2}
                  value={externalNotes}
                  onChange={(e) => setExternalNotes(e.target.value)}
                  placeholder="LOG SOURCE CHANNEL..."
                  className="border-none bg-transparent font-black uppercase italic text-[10px] p-0 focus-visible:ring-0"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border/10">
                <Button
                  variant="ghost"
                  onClick={() => setStep("input")}
                  className="font-black uppercase text-[10px] tracking-widest italic opacity-50"
                >
                  Back to Ingress
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-16 px-10 rounded-[24px] font-black uppercase italic tracking-tighter text-xl gap-3 shadow-xl"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <ShieldCheck className="fill-current" />}
                  Deploy Application
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>

        {step === "input" && (
          <div className="p-6 bg-muted/10 border-t border-border/10 flex justify-end">
            <Button
              variant="ghost"
              className="font-black uppercase text-[10px] tracking-widest italic opacity-50"
              onClick={() => handleClose(false)}
            >
              Abort Sync
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldNode({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase text-primary italic ml-2">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl border-2 font-bold bg-muted/10"
      />
    </div>
  );
}
