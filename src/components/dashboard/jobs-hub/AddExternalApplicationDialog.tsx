import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Upload, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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

  // parsed/edit fields
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
    setName(""); setEmail(""); setPhone(""); setProfession(""); setSkills("");
    setCoverLetter(""); setExternalNotes("");
    setCvUrl(""); setTalentExists(null);
    if (!defaultJobId) setJobId("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleParse = async () => {
    if (!jobId) return toast.error("Select a job first");
    if (!cvFile && cvText.trim().length < 30) return toast.error("Upload a CV or paste at least 30 characters");
    setParsing(true);
    try {
      let publicUrl = "";
      if (cvFile) {
        const path = `external-applications/${Date.now()}-${cvFile.name}`;
        const { error: upErr } = await supabase.storage.from("talent-cvs").upload(path, cvFile);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("talent-cvs").getPublicUrl(path);
        publicUrl = data.publicUrl;
        setCvUrl(publicUrl);
      }
      const body: any = cvFile ? { cvUrl: publicUrl, serviceType: "external_application" } : { cvText, serviceType: "external_application" };
      const { data, error } = await supabase.functions.invoke("parse-cv", { body });
      if (error) throw error;
      const parsed = data?.parsed || data?.cv_data || data;
      setName(parsed?.name || parsed?.full_name || "");
      setEmail(parsed?.email || "");
      setPhone(parsed?.phone || "");
      setProfession(parsed?.profession || parsed?.current_role || "");
      const sk = parsed?.skills || parsed?.parsed_skills || [];
      setSkills(Array.isArray(sk) ? sk.join(", ") : String(sk || ""));
      toast.success("CV parsed — review and save");
      setStep("review");
    } catch (err: any) {
      toast.error("Parse failed: " + (err.message || "Unknown"));
    } finally {
      setParsing(false);
    }
  };

  const checkTalentExists = async (em: string) => {
    if (!em.includes("@")) { setTalentExists(null); return; }
    const { data } = await supabase.from("talents").select("id").ilike("email", em.trim()).maybeSingle();
    setTalentExists(!!data);
  };

  const handleSave = async () => {
    if (!email.trim() && !phone.trim()) return toast.error("Email or phone is required");
    if (!name.trim()) return toast.error("Candidate name is required");
    setSaving(true);
    try {
      // 1. Get or create talent
      const { data: talentId, error: tErr } = await supabase.rpc("get_or_create_talent", {
        p_email: email.trim() || `${Date.now()}@external.local`,
        p_full_name: name.trim(),
        p_phone: phone.trim() || null,
      });
      if (tErr) throw tErr;

      // 2. Insert job_application as external
      const { data: { user } } = await supabase.auth.getUser();
      const { error: appErr } = await supabase.from("job_applications").insert({
        job_id: jobId,
        talent_id: talentId as string,
        cv_url: cvUrl || null,
        cover_letter: coverLetter || null,
        application_status: "submitted",
        delivery_status: "pending",
        is_paid: true,
        source: "external",
        external_notes: externalNotes || null,
        added_by: user?.id || null,
      } as any);
      if (appErr) throw appErr;

      toast.success("External application added");
      handleClose(false);
      onCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Add External Application
          </DialogTitle>
          <DialogDescription>
            Log a candidate that came in through LinkedIn, email, walk-in, or any channel outside the platform. Their CV is parsed by AI, a talent record is created, and the application appears in the unified pipeline.
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Apply to job *</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger><SelectValue placeholder="Select a job posting" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>{j.title} — {j.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Upload CV (PDF / DOCX)</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
                {cvFile && <Badge variant="secondary" className="text-xs">{cvFile.name.slice(0, 24)}</Badge>}
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground">— or paste CV text —</div>

            <div className="space-y-1.5">
              <Label>Paste CV text</Label>
              <Textarea rows={6} value={cvText} onChange={(e) => setCvText(e.target.value)} placeholder="Paste resume text here..." />
            </div>

            <Button onClick={handleParse} disabled={parsing || !jobId} className="w-full">
              {parsing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Parse with AI &amp; Continue
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Profession</Label>
                <Input value={profession} onChange={(e) => setProfession(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); checkTalentExists(e.target.value); }} />
                {talentExists === true && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Existing talent — will link</p>
                )}
                {talentExists === false && (
                  <p className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> New talent record will be created</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Skills</Label>
              <Textarea rows={2} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, ..." />
            </div>

            <div className="space-y-1.5">
              <Label>Cover letter / pitch (optional)</Label>
              <Textarea rows={3} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Internal notes (admin only)</Label>
              <Textarea rows={2} value={externalNotes} onChange={(e) => setExternalNotes(e.target.value)} placeholder="Channel: LinkedIn DM · Referral by ..." />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep("input")}>← Back</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Application
              </Button>
            </div>
          </div>
        )}

        {step === "input" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
