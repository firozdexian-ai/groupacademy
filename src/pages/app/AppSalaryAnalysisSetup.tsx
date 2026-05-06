import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  FileCheck,
  ArrowLeft,
  Coins,
  Zap,
  Target,
  ShieldCheck,
} from "lucide-react";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { recordToolRun } from "@/hooks/useToolRuns";
import { ExistingCVCard } from "@/components/cv/ExistingCVCard";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Market Value Diagnostic
 * High-fidelity orchestrator for AI-powered salary telemetry.
 * Synchronized with the 2026 'Executive Logic' depth and transaction standards.
 */

const SALARY_ANALYSIS_COST = 50;

export default function AppSalaryAnalysisSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, user, addServiceUsed, updateTalent, refreshTalent } = useTalent();
  const { canAfford, deductCredits, balance } = useCredits();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvInputMode, setCvInputMode] = useState<"text" | "file" | "existing">("text");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState("");

  const [professionCategories, setProfessionCategories] = useState<any[]>([]);
  const [selectedProfession, setSelectedProfession] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showCreditSheet, setShowCreditSheet] = useState(false);

  const hasExistingCv = !!(talent?.cvUrl || talent?.cvText);

  useEffect(() => {
    if (talent) {
      setEmail((prev) => prev || talent.email || "");
      setFullName((prev) => prev || talent.fullName || "");
      setPhone((prev) => prev || talent.phone?.replace(/^\+880/, "") || "");
      if (talent.professionCategoryId) {
        setSelectedProfession((prev) => prev || talent.professionCategoryId || "");
      }
      if (hasExistingCv && cvInputMode === "text") {
        setCvInputMode("existing");
        if (talent.cvUrl) setCvUrl(talent.cvUrl);
        if (talent.cvText) setCvText(talent.cvText);
      }
    } else if (user?.email) {
      setEmail((prev) => prev || user.email || "");
    }
  }, [talent, user, hasExistingCv]);

  useEffect(() => {
    const loadCategories = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.CATEGORY_LOAD);
      try {
        const { data, error } = await supabase
          .from("profession_categories")
          .select("id, name")
          .eq("is_active", true)
          .order("display_order")
          .abortSignal(controller.signal);
        clearTimeout(timeoutId);
        if (error) throw error;
        if (data) setProfessionCategories(data);
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error("Tracking Failure: Category Load", error);
      }
    };
    loadCategories();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes("pdf") && !file.type.includes("document")) {
      toast({ title: "Unsupported Artifact", description: "Please upload a PDF or DOC.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Capacity Exceeded", description: "Artifact must be under 10MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setCvFile(file);

    try {
      const fileName = `salary-cv/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("portfolio-uploads").upload(fileName, file);
      if (error) throw error;

      const { data: publicUrl } = supabase.storage.from("portfolio-uploads").getPublicUrl(fileName);
      setCvUrl(publicUrl.publicUrl);

      if (talent?.id) {
        await updateTalent({ cvUrl: publicUrl.publicUrl });
        await refreshTalent();
      }
      toast({ title: "Saved" });
    } catch (error: any) {
      toast({ title: "Failed", description: "Revert to text paste logic.", variant: "destructive" });
      setCvInputMode("text");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !jobDescription.trim()) {
      toast({ title: "Incomplete Parameters", description: "Required fields missing.", variant: "destructive" });
      return;
    }
    if (!cvText.trim() && !cvUrl) {
      toast({ title: "Missing Career Node", description: "Provide CV text or file.", variant: "destructive" });
      return;
    }

    if (!canAfford("SALARY_ANALYSIS")) {
      setShowCreditGate(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const paid = await deductCredits("SALARY_ANALYSIS", undefined, "Salary Analysis Tracking");
      if (!paid) throw new Error("Credit handshake failed.");

      const tempAnalysisId = crypto.randomUUID();
      const { error } = await supabase.from("salary_analyses").insert({
        id: tempAnalysisId,
        user_id: user?.id || null,
        talent_id: talent?.id || null,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() ? `+880${phone.trim()}` : null,
        job_title: jobTitle.trim() || null,
        company_name: companyName.trim() || null,
        job_description: jobDescription.trim(),
        cv_text: cvText.trim() || null,
        cv_url: cvUrl || null,
        profession_category_id: selectedProfession || null,
        status: "pending",
      });

      if (error) throw error;
      if (talent?.id) await addServiceUsed("salary_analysis");

      toast({ title: "Diagnostic Initiated" });
      recordToolRun({ toolKey: "salary", costCredits: 50, payload: { analysis_id: tempAnalysisId, job_title: jobTitle } });
      navigate(`/salary-analysis/processing/${tempAnalysisId}`);
    } catch (error) {
      toast({ title: "Failed", description: "Logic sync interrupted.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 min-h-svh space-y-10 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="group rounded-xl px-4 h-11 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5"
          onClick={() => navigate("/app/services")}
        >
          <ArrowLeft className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Revert to Hub
        </Button>
        <Badge
          variant="outline"
          className="rounded-lg border-primary/20 text-primary font-black uppercase tracking-widest text-[9px] px-3 py-1"
        >
          Market Intelligence v2.6
        </Badge>
      </header>

      <ProfileCompletionPrompt variant="banner" className="rounded-[24px] border-2 border-dashed border-primary/20" />

      <div className="text-center space-y-4">
        <div className="h-16 w-16 bg-primary/10 rounded-[28px] flex items-center justify-center mx-auto rotate-3 shadow-xl">
          <Target className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter leading-none italic">Salary Synthesis</h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 italic max-w-lg mx-auto">
          Input your career artifact and target parameters for high-fidelity market value telemetry.
        </p>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="p-10 border-b border-border/10 bg-muted/20">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500" /> Parameter Input
            </CardTitle>
            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest">{SALARY_ANALYSIS_COST} Credits</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 space-y-10">
          {/* Identity Logic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-primary ml-1">Entity Name</Label>
              <Input
                className="h-12 rounded-xl border-2 bg-background/50 font-bold"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest ml-1">Email Node</Label>
              <Input
                className="h-12 rounded-xl border-2 bg-background/50 font-bold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="uplink@domain.com"
              />
            </div>
          </div>

          {/* Role Parameters */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest ml-1">Target Role</Label>
                <Input
                  className="h-12 rounded-xl border-2 bg-background/50 font-bold"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Lead Architect"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest ml-1">Sector Alignment</Label>
                <Select value={selectedProfession} onValueChange={setSelectedProfession}>
                  <SelectTrigger className="h-12 rounded-xl border-2 bg-background/50 font-bold">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="font-bold">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest ml-1 text-primary">
                Job Blueprint Artifact
              </Label>
              <Textarea
                className="min-h-[160px] rounded-2xl bg-muted/10 border-2 border-border/40 p-6 italic font-medium leading-relaxed"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste full job description for calibration..."
              />
            </div>
          </div>

          {/* List Registry (CV) */}
          <div className="space-y-4">
            <Label className="text-[11px] font-black uppercase tracking-widest ml-1">Candidate List Node</Label>
            <Tabs value={cvInputMode} onValueChange={(v) => setCvInputMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3 p-1 h-12 bg-muted/30 rounded-2xl border border-border/40">
                {hasExistingCv && (
                  <TabsTrigger
                    value="existing"
                    className="rounded-xl font-black uppercase text-[9px] tracking-widest gap-2"
                  >
                    <FileCheck className="h-3.5 w-3.5" /> List
                  </TabsTrigger>
                )}
                <TabsTrigger value="text" className="rounded-xl font-black uppercase text-[9px] tracking-widest gap-2">
                  <FileText className="h-3.5 w-3.5" /> Text Synth
                </TabsTrigger>
                <TabsTrigger value="file" className="rounded-xl font-black uppercase text-[9px] tracking-widest gap-2">
                  <Upload className="h-3.5 w-3.5" /> Artifact
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="mt-6 animate-in zoom-in-95">
                <ExistingCVCard
                  talent={talent}
                  onUseExisting={() => {
                    if (talent?.cvUrl) setCvUrl(talent.cvUrl);
                    if (talent?.cvText) setCvText(talent.cvText);
                  }}
                  onUploadNew={() => {}}
                />
              </TabsContent>

              <TabsContent value="text" className="mt-6 animate-in slide-in-from-bottom-2">
                <Textarea
                  placeholder="Paste CV source code/text here..."
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  className="min-h-[240px] rounded-2xl bg-muted/10 border-2 p-6 italic"
                />
              </TabsContent>

              <TabsContent value="file" className="mt-6">
                <div className="border-2 border-dashed border-border/40 rounded-[32px] p-12 text-center hover:bg-primary/[0.02] transition-all group cursor-pointer relative overflow-hidden">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  {isUploading ? (
                    <div className="space-y-4">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">
                        Syncing Node...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-inner">
                        <Upload className="h-7 w-7 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tighter italic">
                          {cvFile ? cvFile.name : "Upload File"}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mt-1">
                          PDF or DOC • 10MB Limit
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Button
            className="w-full h-16 rounded-[24px] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" /> Analyzing Logic...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Zap className="h-5 w-5 fill-current" /> Confirm
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </Button>
        </CardContent>
      </Card>

      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        onConfirm={() => setShowCreditGate(false)}
        onBuyCredits={() => {
          setShowCreditGate(false);
          setShowCreditSheet(true);
        }}
        serviceName="Salary Synthesis"
        cost={SALARY_ANALYSIS_COST}
        currentBalance={balance}
      />
      <CreditPurchaseSheet
        isOpen={showCreditSheet}
        onClose={() => setShowCreditSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
