import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import MultiFileUpload from "@/components/portfolio/MultiFileUpload";
import { SimpleFileUpload } from "@/components/portfolio/SimpleFileUpload";
import ProfileBuilderForm, { ProfileData } from "@/components/portfolio/ProfileBuilderForm";
import {
  User,
  FileText,
  Award,
  Globe,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileUp,
  PenLine,
  RefreshCw,
  Gift,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { AuthGate } from "@/components/AuthGate";
import { useTalent } from "@/hooks/useTalent";
import { ExistingCVCard } from "@/components/cv/ExistingCVCard";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { cn } from "@/lib/utils";

// Step Configuration for 2026 Experience
type Step = "personal" | "cv" | "certificates" | "social" | "review";

const steps: { id: Step; label: string; icon: any }[] = [
  { id: "personal", label: "Identity", icon: User },
  { id: "cv", label: "Artifacts", icon: FileText },
  { id: "certificates", label: "Verification", icon: Award },
  { id: "social", label: "Network", icon: Globe },
  { id: "review", label: "Finalize", icon: CheckCircle },
];

const FREE_PORTFOLIO_LIMIT = 1000;

function PortfolioRequestContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { talent, addServiceUsed, updateTalent, refreshTalent } = useTalent();

  const [currentStep, setCurrentStep] = useState<Step>("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string>("");
  const [professionCategories, setProfessionCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [portfolioCount, setPortfolioCount] = useState<number | null>(null);

  const [formData, setFormData] = useState<any>({
    fullName: "",
    email: "",
    phone: "",
    professionCategoryId: "",
    customProfession: "",
    cvInputMode: "upload",
    cvUrl: "",
    cvExternalUrl: "",
    profileData: { education: [], experience: [], skills: [], projects: [], achievements: [] },
    certificates: [],
    achievements: "",
    socialLinks: {},
    additionalNotes: "",
  });

  useEffect(() => {
    loadData();
    // CTO Note: Restore session backup to prevent data loss on browser crash
    const backup = localStorage.getItem("portfolio_request_draft");
    if (backup) {
      try {
        setFormData((prev: any) => ({ ...prev, ...JSON.parse(backup) }));
      } catch (e) {
        console.error("Backup corruption detected.");
      }
    }
  }, []);

  const loadData = async () => {
    const { data: cats } = await supabase
      .from("profession_categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("display_order");
    const { count } = await supabase.from("portfolio_requests").select("*", { count: "exact", head: true });
    if (cats) setProfessionCategories(cats);
    setPortfolioCount(count || 0);
    setIsLoadingCategories(false);
  };

  // Auto-fill and persist changes
  useEffect(() => {
    if (talent) {
      setFormData((prev: any) => ({
        ...prev,
        fullName: prev.fullName || talent.fullName || "",
        email: prev.email || talent.email || "",
        phone: prev.phone || talent.phone || "",
        professionCategoryId: prev.professionCategoryId || talent.professionCategoryId || "",
        cvUrl: prev.cvUrl || talent.cvUrl || "",
        cvInputMode: talent.cvUrl ? "existing" : prev.cvInputMode,
      }));
    }
  }, [talent]);

  useEffect(() => {
    const backupData = { ...formData };
    delete backupData.certificates; // Too heavy for localStorage
    localStorage.setItem("portfolio_request_draft", JSON.stringify(backupData));
  }, [formData]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const isFreePromotion = portfolioCount !== null && portfolioCount < FREE_PORTFOLIO_LIMIT;

  const handleNext = () => {
    const idx = currentStepIndex + 1;
    if (idx < steps.length) setCurrentStep(steps[idx].id);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const tempId = crypto.randomUUID();
      const { error } = await supabase.from("portfolio_requests").insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        profession_category_id: formData.professionCategoryId,
        cv_url: formData.cvInputMode === "url" ? formData.cvExternalUrl : formData.cvUrl,
        profile_data: formData.profileData,
        certificates: formData.certificates,
        social_links: formData.socialLinks,
        talent_id: talent?.id || null,
      });

      if (error) throw error;
      if (talent?.id) await addServiceUsed("portfolio");

      localStorage.removeItem("portfolio_request_draft");
      setRequestId(tempId);
      setIsSuccess(true);
      toast({ title: "Protocol Verified", description: "Your request is in the engineering queue." });
    } catch (e: any) {
      toast({ title: "Submission Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess)
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-2xl mx-auto px-6 py-20 animate-in fade-in zoom-in-95 duration-700">
          <Card className="rounded-[40px] border-border/40 shadow-2xl overflow-hidden text-center">
            <div className="bg-emerald-500/5 py-12 border-b border-emerald-500/10">
              <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-10 w-10 text-emerald-500" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter">Request Authorized</CardTitle>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/60 mt-2">
                Ticket ID: {requestId.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <CardContent className="p-10 space-y-8">
              <div className="text-left space-y-4 bg-muted/30 p-6 rounded-3xl border border-border/40">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Onboarding Sequence</h4>
                <ol className="space-y-3 text-sm font-medium text-muted-foreground">
                  <li className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                      1
                    </div>{" "}
                    WhatsApp verification from Talent Lead.
                  </li>
                  <li className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                      2
                    </div>{" "}
                    Engineering phase: Site construction (3-5 days).
                  </li>
                  <li className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                      3
                    </div>{" "}
                    Credentials transmission via secure channel.
                  </li>
                </ol>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs"
                  onClick={() => navigate("/portfolio-status")}
                >
                  Monitor Progress
                </Button>
                <Button
                  variant="outline"
                  className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                  onClick={() => navigate("/")}
                >
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <Navbar />
      <main className="flex-1 container max-w-4xl mx-auto px-6 py-12">
        <ProfileCompletionPrompt variant="banner" className="mb-10 rounded-2xl" />

        <div className="max-w-3xl mx-auto space-y-12">
          {/* Header Architecture */}
          <header className="text-center space-y-4">
            <div className="icon-container-lg mx-auto bg-primary/5 border border-primary/10">
              <img src={iconPortfolio} alt="Portfolio" className="w-10 h-10 object-contain" />
            </div>
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="rounded-full px-4 py-1 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em]"
              >
                <Sparkles className="w-3 h-3 mr-2" /> Strategic Identity
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">Digital Portfolio</h1>
              <p className="text-muted-foreground font-medium text-lg max-w-xl mx-auto">
                Translate your career milestones into a high-conversion professional asset.
              </p>
            </div>
          </header>

          {/* Dynamic Promotion Layer */}
          <Card
            className={cn(
              "rounded-[32px] border-2 overflow-hidden transition-all",
              isFreePromotion
                ? "bg-primary/[0.02] border-primary/20 shadow-xl shadow-primary/5"
                : "bg-muted/30 border-border/40",
            )}
          >
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg",
                    isFreePromotion ? "bg-primary text-white shadow-primary/20" : "bg-muted text-muted-foreground",
                  )}
                >
                  {isFreePromotion ? <Gift className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm tracking-tight">
                    {isFreePromotion ? "Founding Member Grant" : "Executive Service"}
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {isFreePromotion ? "Complimentary portfolio setup active" : "Standard 500 Credit Protocol"}
                  </p>
                </div>
              </div>
              {isFreePromotion && (
                <div className="text-center md:text-right">
                  <p className="text-3xl font-black tracking-tighter text-primary leading-none">
                    {FREE_PORTFOLIO_LIMIT - (portfolioCount || 0)}
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Spots Remaining</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stepper HUD */}
          <nav className="grid grid-cols-5 gap-2 px-2">
            {steps.map((s, i) => (
              <div key={s.id} className="space-y-3">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    i <= currentStepIndex ? "bg-primary" : "bg-muted",
                  )}
                />
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-colors",
                      i <= currentStepIndex ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40",
                    )}
                  >
                    <s.icon className="h-3 w-3" />
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest hidden md:block",
                      i <= currentStepIndex ? "text-foreground" : "text-muted-foreground/40",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </nav>

          {/* Main Flow Logic */}
          <Card className="rounded-[40px] border-border/40 shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-border/10 bg-muted/20">
              <CardTitle className="text-2xl font-black tracking-tighter uppercase">
                {steps[currentStepIndex].label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {currentStep === "personal" && (
                <div className="grid md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Full Legal Name</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Contact Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Verified WhatsApp</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 rounded-xl"
                      placeholder="+880..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Core Domain</Label>
                    <Select
                      value={formData.professionCategoryId}
                      onValueChange={(v) => setFormData({ ...formData, professionCategoryId: v })}
                    >
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select Sector" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {professionCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs uppercase font-bold">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === "cv" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-2xl border border-border/40">
                    <Button
                      variant={formData.cvInputMode !== "profile" ? "secondary" : "ghost"}
                      className="rounded-xl font-black uppercase text-[10px]"
                      onClick={() => setFormData({ ...formData, cvInputMode: "upload" })}
                    >
                      <FileUp className="mr-2 h-4 w-4" /> Upload Document
                    </Button>
                    <Button
                      variant={formData.cvInputMode === "profile" ? "secondary" : "ghost"}
                      className="rounded-xl font-black uppercase text-[10px]"
                      onClick={() => setFormData({ ...formData, cvInputMode: "profile" })}
                    >
                      <PenLine className="mr-2 h-4 w-4" /> Manual Entry
                    </Button>
                  </div>
                  {formData.cvInputMode === "existing" ? (
                    <ExistingCVCard
                      talent={talent}
                      onUploadNew={() => setFormData({ ...formData, cvInputMode: "upload" })}
                      showActions={false}
                    />
                  ) : formData.cvInputMode === "profile" ? (
                    <ProfileBuilderForm
                      value={formData.profileData}
                      onChange={(d) => setFormData({ ...formData, profileData: d })}
                    />
                  ) : (
                    <SimpleFileUpload
                      onFileUploaded={async (url) => {
                        setFormData({ ...formData, cvUrl: url });
                        await updateTalent({ cvUrl: url });
                        refreshTalent();
                      }}
                      currentValue={formData.cvUrl}
                    />
                  )}
                </div>
              )}

              {currentStep === "certificates" && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <MultiFileUpload
                    bucket="portfolio-uploads"
                    value={formData.certificates}
                    onChange={(f) => setFormData({ ...formData, certificates: f })}
                    label="Accreditations"
                  />
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Key Achievements</Label>
                    <Textarea
                      value={formData.achievements}
                      onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                      rows={5}
                      className="rounded-2xl resize-none"
                      placeholder="Major projects, awards, or KPI metrics..."
                    />
                  </div>
                </div>
              )}

              {currentStep === "social" && (
                <div className="grid sm:grid-cols-2 gap-6 animate-in zoom-in-95">
                  {["linkedin", "github", "website", "youtube"].map((key) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 capitalize">
                        {key} Profile
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/40" />
                        <Input
                          value={formData.socialLinks[key] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              socialLinks: { ...formData.socialLinks, [key]: e.target.value },
                            })
                          }
                          className="h-12 rounded-xl pl-10"
                          placeholder={`https://${key}.com/...`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentStep === "review" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 flex items-start gap-4">
                    <ShieldCheck className="h-6 w-6 text-primary mt-1" />
                    <div className="space-y-1">
                      <h4 className="font-black uppercase text-xs tracking-tight">Final Logic Review</h4>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        Ensure all identities and artifacts are accurate. Verified data results in a 40% faster
                        engineering cycle.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="flex justify-between p-4 rounded-2xl bg-muted/30">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Identity Verified
                      </span>
                      <span className="text-xs font-bold">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between p-4 rounded-2xl bg-muted/30">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Artifact Type
                      </span>
                      <span className="text-xs font-bold uppercase">{formData.cvInputMode}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Cluster */}
              <div className="flex items-center justify-between pt-8 border-t border-border/10">
                <Button
                  variant="ghost"
                  onClick={() => currentStepIndex > 0 && setCurrentStep(steps[currentStepIndex - 1].id)}
                  disabled={currentStepIndex === 0}
                  className="rounded-xl font-black uppercase text-[10px] tracking-widest"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                {currentStep === "review" ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="h-14 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Authorize Request"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs"
                  >
                    Next Layer <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PortfolioRequest() {
  return (
    <AuthGate message="Secure your professional identity. Requests are archived to your encrypted career profile.">
      <PortfolioRequestContent />
    </AuthGate>
  );
}
