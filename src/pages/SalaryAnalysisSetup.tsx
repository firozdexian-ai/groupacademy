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
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Briefcase,
  User,
} from "lucide-react";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { useProgressiveLoadingMessage } from "@/hooks/useProgressiveLoadingMessage";
import { AuthGate } from "@/components/AuthGate";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { ExistingCVCard } from "@/components/cv/ExistingCVCard";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { cn } from "@/lib/utils";

const SalaryAnalysisSetupContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, user, updateTalent, refreshTalent } = useTalent();
  const { canAfford, getServiceCost, balance } = useCredits();

  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [canProceed, setCanProceed] = useState<boolean | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);

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
      try {
        const { data, error } = await supabase
          .from("profession_categories")
          .select("id, name")
          .eq("is_active", true)
          .order("display_order");
        if (error) throw error;
        if (data) setProfessionCategories(data);
      } catch (e) {
        console.error("Category sync failed:", e);
      }
    };
    loadCategories();
  }, []);

  const { message: loadingMessage } = useProgressiveLoadingMessage(isCheckingEmail);

  const checkEmailCooldown = async () => {
    if (!email.trim()) {
      toast({ title: "Identity required.", description: "Please enter your email.", variant: "destructive" });
      return;
    }

    setIsCheckingEmail(true);
    try {
      const { data, error } = await supabase
        .from("salary_analyses")
        .select("created_at")
        .eq("email", email.trim().toLowerCase())
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setCanProceed(true);
      } else {
        const cooldownEnd = new Date(new Date(data[0].created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();

        if (now >= cooldownEnd) {
          setCanProceed(true);
        } else {
          setDaysRemaining(Math.ceil((cooldownEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
          setCanProceed(false);
          setShowAccessCodeInput(true);
        }
      }
    } catch (err) {
      toast({ title: "Eligibility Sync Error", variant: "destructive" });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const validateAccessCode = async () => {
    if (!accessCode.trim()) return;
    try {
      const { data, error } = await supabase
        .from("salary_analysis_access_codes")
        .select("*")
        .eq("code", accessCode.trim().toUpperCase())
        .eq("email", email.trim().toLowerCase())
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        toast({ title: "Invalid Protocol", description: "Code is expired or unrecognized.", variant: "destructive" });
        return;
      }

      await supabase.from("salary_analysis_access_codes").update({ is_used: true }).eq("id", data.id);
      setCanProceed(true);
      setShowAccessCodeInput(false);
      toast({ title: "Access Authorized." });
    } catch (e) {
      toast({ title: "Validation Error", variant: "destructive" });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) return toast({ title: "Payload too large (Max 10MB)", variant: "destructive" });
    setIsUploading(true);
    setCvFile(file);
    try {
      const fileName = `salary-cv/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("portfolio-uploads").upload(fileName, file);
      if (error) throw error;

      const { data: publicUrl } = supabase.storage.from("portfolio-uploads").getPublicUrl(fileName);
      setCvUrl(publicUrl.publicUrl);

      if (talent?.id) await updateTalent({ cvUrl: publicUrl.publicUrl });
      toast({ title: "Artifact Uploaded Successfully." });
    } catch (e) {
      toast({ title: "Upload Fault", description: "Try pasting CV text.", variant: "destructive" });
      setCvInputMode("text");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !jobDescription.trim()) {
      return toast({
        title: "Incomplete Sequence",
        description: "All required logic nodes must be filled.",
        variant: "destructive",
      });
    }

    if (talent && !canAfford("SALARY_ANALYSIS")) {
      setShowCreditGate(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const isValidUUID = (s: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
      const tempId = crypto.randomUUID();

      const { error } = await supabase.from("salary_analyses").insert({
        id: tempId,
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
        profession_category_id: isValidUUID(selectedProfession) ? selectedProfession : null,
        status: "pending",
      });

      if (error) throw error;
      navigate(`/salary-analysis/processing/${tempId}`);
    } catch (err) {
      toast({ title: "Submission Failure", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <Navbar />
      <main className="container max-w-2xl mx-auto py-12 px-6 space-y-10 animate-in fade-in duration-700">
        <ProfileCompletionPrompt variant="banner" className="rounded-2xl" />

        <header className="text-center space-y-4">
          <Badge
            variant="outline"
            className="rounded-full px-4 py-1 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em]"
          >
            <Sparkles className="h-3 w-3 mr-2" /> Step 01: Calibration
          </Badge>
          <h1 className="text-4xl font-black tracking-tighter uppercase">AI Valuation Setup</h1>
          <p className="text-muted-foreground font-medium">
            Provide your career artifacts for neural market benchmarking.
          </p>
        </header>

        {canProceed === null && (
          <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-xl">
            <CardHeader className="p-10 pb-6 border-b border-border/10 bg-muted/20">
              <CardTitle className="text-2xl font-black tracking-tighter uppercase">Eligibility Check</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Standard Protocol: One Free Analysis Every 7 Days
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Identity Endpoint (Email)
                </Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="h-12 rounded-xl font-bold bg-background/50"
                />
              </div>
              <Button
                onClick={checkEmailCooldown}
                disabled={isCheckingEmail}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
              >
                {isCheckingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {loadingMessage}
                  </>
                ) : (
                  "Verify Eligibility"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {canProceed === false && showAccessCodeInput && (
          <Card className="rounded-[40px] border-amber-500/30 shadow-2xl overflow-hidden bg-amber-500/[0.02]">
            <CardHeader className="p-10 pb-6">
              <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tighter uppercase text-amber-600">
                <AlertCircle className="h-6 w-6" /> Cooldown Active
              </CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest">
                Analysis locked for {daysRemaining} days. Bypass required.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-amber-600 ml-1">
                  Access Bypass Code (50 Credits)
                </Label>
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  className="h-12 rounded-xl font-bold border-amber-500/20"
                />
              </div>
              <Button
                onClick={validateAccessCode}
                className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20"
              >
                Validate Protocol
              </Button>
            </CardContent>
          </Card>
        )}

        {canProceed && (
          <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-xl animate-in slide-in-from-bottom-6 duration-700">
            <CardHeader className="p-10 pb-6 border-b border-border/10 bg-emerald-500/5">
              <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tighter uppercase text-emerald-600">
                <CheckCircle2 className="h-6 w-6" /> Node Eligible
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Full Legal Identity
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 pl-11 rounded-xl font-bold bg-background/50"
                      placeholder="Full Name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Contact String (BD Mobile)
                  </Label>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-border/40 bg-muted/50 text-[10px] font-black">
                      +880
                    </span>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="h-12 rounded-l-none rounded-r-xl font-bold bg-background/50"
                      placeholder="1XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Target Identity (Job Title)
                    </Label>
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="h-12 rounded-xl bg-background/50"
                      placeholder="e.g. Lead Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Company Node
                    </Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-12 rounded-xl bg-background/50"
                      placeholder="e.g. Google"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Vertical Logic (Category)
                  </Label>
                  <Select value={selectedProfession} onValueChange={setSelectedProfession}>
                    <SelectTrigger className="h-12 rounded-xl bg-background/50">
                      <SelectValue placeholder="Select Domain" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {professionCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold uppercase">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Logical Requirement (Job Description)
                </Label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[150px] rounded-2xl bg-background/50 border-border/40 resize-none"
                  placeholder="Paste full JD text..."
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Source Artifact (CV)
                </Label>
                <Tabs value={cvInputMode} onValueChange={(v) => setCvInputMode(v as any)} className="w-full">
                  <TabsList className="grid grid-cols-3 h-12 rounded-xl bg-muted/30 p-1">
                    <TabsTrigger
                      value="existing"
                      disabled={!hasExistingCv}
                      className="rounded-lg font-black uppercase text-[9px] tracking-widest data-[state=active]:shadow-lg"
                    >
                      <FileCheck className="mr-2 h-3 w-3" /> Existing
                    </TabsTrigger>
                    <TabsTrigger
                      value="text"
                      className="rounded-lg font-black uppercase text-[9px] tracking-widest data-[state=active]:shadow-lg"
                    >
                      <FileText className="mr-2 h-3 w-3" /> Text
                    </TabsTrigger>
                    <TabsTrigger
                      value="file"
                      className="rounded-lg font-black uppercase text-[9px] tracking-widest data-[state=active]:shadow-lg"
                    >
                      <Upload className="mr-2 h-3 w-3" /> File
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="existing" className="mt-6">
                    <ExistingCVCard
                      talent={talent}
                      onUseExisting={() => {}}
                      onUploadNew={() => setCvInputMode("file")}
                      showActions={false}
                    />
                  </TabsContent>

                  <TabsContent value="text" className="mt-6">
                    <Textarea
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      placeholder="Paste CV content..."
                      className="min-h-[200px] rounded-2xl bg-background/50 border-border/40 font-mono text-xs"
                    />
                  </TabsContent>

                  <TabsContent value="file" className="mt-6">
                    <div className="relative border-2 border-dashed border-border/40 rounded-3xl p-10 text-center hover:border-primary/40 transition-colors bg-muted/10 group">
                      {cvUrl ? (
                        <div className="space-y-4 animate-in zoom-in-95">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {cvFile?.name || "Artifact Linked"}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCvUrl("");
                              setCvFile(null);
                            }}
                            className="text-rose-500 uppercase text-[9px] font-black tracking-widest"
                          >
                            Remove Logic Node
                          </Button>
                        </div>
                      ) : isUploading ? (
                        <div className="space-y-4">
                          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Uploading Career Node...
                          </p>
                        </div>
                      ) : (
                        <label className="cursor-pointer space-y-4 block">
                          <div className="h-14 w-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Upload className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Upload Artifact (PDF, DOCX)
                          </p>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="sr-only"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="pt-6 border-t border-border/10">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/30 group"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Initialize Neural Valuation{" "}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 mt-6">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Encryption Level: Enterprise Standard
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />

      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        serviceName="Salary Analysis"
        cost={getServiceCost("SALARY_ANALYSIS")}
        currentBalance={balance}
        onConfirm={() => {
          setShowCreditGate(false);
          handleSubmit();
        }}
        onBuyCredits={() => {
          setShowCreditGate(false);
          setShowCreditSheet(true);
        }}
      />

      <CreditPurchaseSheet
        isOpen={showCreditSheet}
        onClose={() => setShowCreditSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
};

const SalaryAnalysisSetup = () => {
  return (
    <AuthGate message="Identity Authorization Required: Secure your professional trajectory by establishing a connection.">
      <SalaryAnalysisSetupContent />
    </AuthGate>
  );
};

export default SalaryAnalysisSetup;
